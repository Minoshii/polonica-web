const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(os.homedir(), '.polonica');
const DATA_FILE = path.join(DATA_DIR, 'polonica-data.json');
const PDF_DIR   = path.join(DATA_DIR, 'pdfs');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PDF_DIR))  fs.mkdirSync(PDF_DIR,  { recursive: true });

let store = { profiles: {}, settings: {}, profileMeta: {} };

function loadStore() {
  try { if (fs.existsSync(DATA_FILE)) store = { ...store, ...JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) }; }
  catch(e) { console.error('Store yukleme hatasi:', e.message); }
  if (!store.profiles)    store.profiles = {};
  if (!store.settings)    store.settings = {};
  if (!store.profileMeta) store.profileMeta = {};
}

function saveStore() { fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8'); }

function ensureProfile(key) {
  if (!key) key = 'default';
  if (!store.profiles[key]) store.profiles[key] = { units:[], special:[], progressLog:[], pdfs:[], createdAt:new Date().toISOString() };
  const p = store.profiles[key];
  if (!p.units)       p.units = [];
  if (!p.special)     p.special = [];
  if (!p.progressLog) p.progressLog = [];
  if (!p.pdfs)        p.pdfs = [];
  return p;
}

loadStore();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req,file,cb) => cb(null, PDF_DIR),
    filename: (req,file,cb) => cb(null, Date.now()+Math.floor(Math.random()*1000)+'.pdf')
  }),
  fileFilter: (req,file,cb) => cb(null, file.mimetype==='application/pdf'),
  limits: { fileSize: 200*1024*1024 }
});

async function claudeAsk(prompt, maxTokens=1024) {
  const msg = await client.messages.create({ model:'claude-haiku-4-5-20251001', max_tokens:maxTokens, messages:[{role:'user',content:prompt}] });
  return msg.content[0].text;
}

app.use(express.json({ limit:'200mb' }));
app.use(express.static(__dirname));

// Auth
app.use((req,res,next) => {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return next();
  if (req.path.startsWith('/api/login')||req.path.startsWith('/api/profiles')) return next();
  const token = req.headers['x-auth-token'];
  if (token===pass) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({error:'Yetkisiz.'});
  next();
});

app.post('/api/login', (req,res) => {
  const pass = process.env.APP_PASSWORD;
  if (!pass||req.body.password===pass) res.json({ok:true,token:pass||'open'});
  else res.status(401).json({ok:false});
});

// ── PROFİLLER ─────────────────────────────────────────────
app.get('/api/profiles', (req,res) => {
  const list = Object.keys(store.profileMeta).map(key => ({
    key, ...store.profileMeta[key],
    wordCount: (store.profiles[key]?.units||[]).reduce((a,u)=>a+u.words.length,0),
    specialCount: (store.profiles[key]?.special||[]).length,
  }));
  res.json(list);
});

app.post('/api/profiles', (req,res) => {
  const { name, color, emoji } = req.body;
  if (!name||name.trim().length<2) return res.status(400).json({error:'En az 2 karakter.'});
  const key = name.trim().toLowerCase().replace(/[\s]+/g,'_').replace(/[^a-z0-9_]/g,'');
  if (store.profileMeta[key]) return res.status(400).json({error:'Bu isimde profil var.'});
  store.profileMeta[key] = { name:name.trim(), color:color||'#c8b89a', emoji:emoji||'📚', createdAt:new Date().toISOString() };
  ensureProfile(key);
  saveStore();
  res.json({ key, ...store.profileMeta[key] });
});

app.delete('/api/profiles/:key', (req,res) => {
  delete store.profileMeta[req.params.key];
  delete store.profiles[req.params.key];
  saveStore(); res.json({ok:true});
});

// ── STORE ─────────────────────────────────────────────────
app.get('/api/store', (req,res) => {
  const p = ensureProfile(req.headers['x-profile']);
  res.json({ units:p.units, pdfs:p.pdfs, settings:store.settings, progressLog:p.progressLog, special:p.special });
});

app.post('/api/settings', (req,res) => { store.settings={...store.settings,...req.body}; saveStore(); res.json(store.settings); });
app.get('/api/check-ollama', (req,res) => res.json({ok:true,models:['claude-haiku'],provider:'claude'}));

// ── ANALİZ ────────────────────────────────────────────────
app.post('/api/analyze', async (req,res) => {
  try {
    const {text,count,mode} = req.body;
    const rawTokens = text.match(/[A-Za-z\xc0-\xf6\xf8-\xff\u0100-\u017e'-]+/g)||[];
    const seen=new Set(); const tokens=[];
    for(const t of rawTokens){const l=t.toLowerCase();if(!seen.has(l)){seen.add(l);tokens.push(t);}if(tokens.length>=parseInt(count))break;}
    const CHUNK=40; const chunks=[];
    for(let i=0;i<tokens.length;i+=CHUNK) chunks.push(tokens.slice(i,i+CHUNK));
    const allWords=[];
    for(let ci=0;ci<chunks.length;ci++){
      const chunk=chunks[ci];
      const tokenList=chunk.map((t,i)=>(i+1)+'. '+t).join('\n');
      const isLyrics = mode === 'lyrics';
      const modeNote = isLyrics
        ? 'This text is from Polish song lyrics, rap, or street speech. It may contain slang, colloquialisms, vulgarisms, and non-standard spelling.'
        : 'This text is from Polish academic/educational material.';
      const slangRule = isLyrics
        ? '11."slang": true if the word is slang/colloquial/vulgar/non-standard Polish, false otherwise'
        : '11."slang": false';
      const prompt=['You are an expert Polish linguist specializing in both standard and colloquial Polish. Analyze EVERY word. Output exactly '+chunk.length+' JSON objects in order. NEVER skip.',
        modeNote,'RULES:',
        '1."original":word exactly as given',
        '2."pl":LEMMA - for slang/colloquial give the slang lemma form, NOT a standard equivalent',
        '3."inflection_note":grammar tag if inflected else ""',
        '4."tr":Turkish meaning 2-6w. For slang use natural Turkish slang equivalent.',
        '5."en":English 1-4w',
        '6."category":"verb"|"noun"|"adj"|"other"',
        '7."type":czasownik/rzeczownik/przymiotnik etc.',
        '8."example_pl":natural Polish sentence 8-14w using the word as-is',
        '9."example_tr":Turkish translation',
        '10."example_en":English translation',
        slangRule,
        'Return ONLY: {"words":[...]}','','WORDS:',tokenList].join('\n');
      const raw=await claudeAsk(prompt,chunk.length*120+512);
      const match=raw.match(/\{[\s\S]*\}/);
      if(!match) throw new Error('Parca '+(ci+1)+' icin JSON yok.');
      const parsed=JSON.parse(match[0]);
      if(parsed.words) allWords.push(...parsed.words);
    }
    res.json({words:allWords});
  } catch(e){console.error(e);res.status(500).json({error:e.message});}
});

// ── ÇEKİM ─────────────────────────────────────────────────
app.post('/api/conjugation', async (req,res) => {
  try {
    const {word}=req.body;
    const prompt='Conjugate Polish verb "'+word+'". Return ONLY JSON:\n{"verb":"'+word+'","present":{"ja":"","ty":"","on_ona_ono":"","my":"","wy":"","oni_one":""},"past_m":{"ja":"","ty":"","on":"","my":"","wy":"","oni":""},"past_f":{"ja":"","ty":"","ona":"","my":"","wy":"","one":""},"future":{"ja":"","ty":"","on_ona_ono":"","my":"","wy":"","oni_one":""},"imperative":{"ty":"","my":"","wy":""}}';
    const raw=await claudeAsk(prompt,800);
    const match=raw.match(/\{[\s\S]*\}/);
    if(!match) throw new Error('JSON yok.');
    res.json(JSON.parse(match[0]));
  } catch(e){res.status(500).json({error:e.message});}
});

// ── DISTRACTOR ────────────────────────────────────────────
app.post('/api/distractors', async (req,res) => {
  try {
    const {word,tr,category,count}=req.body;
    const raw=await claudeAsk('Generate '+count+' WRONG plausible Turkish translations for Polish '+category+' "'+word+'". Correct="'+tr+'" do NOT use. Capital letters. Under 5 words. JSON only: {"distractors":[...]}',200);
    const match=raw.match(/\{[\s\S]*\}/);
    res.json(match?{distractors:(JSON.parse(match[0]).distractors||[]).slice(0,count)}:{distractors:[]});
  } catch(e){res.json({distractors:[]});}
});

// ── BURAK SPECIAL ─────────────────────────────────────────
app.post('/api/special/lookup', async (req,res) => {
  try {
    const {word, mode} = req.body;
    const isSlangMode = mode === 'lyrics';

    // Deyim/kalip tespiti - birden fazla kelimeyse veya bilinen kalip ise
    const wordCount = word.trim().split(/\s+/).length;
    const isLikelyIdiom = wordCount >= 2;

    const contextNote = isSlangMode
      ? 'This may be Polish slang, colloquial speech, or rap language.'
      : 'This is standard Polish.';

    const idiomFields = isLikelyIdiom ? [
      '- "is_idiom": true if this is a fixed expression/idiom/collocation/phrase, false if just words',
      '- "idiom_type": "deyim" (idiom with non-literal meaning) | "kalip" (fixed phrase/collocation) | "soyleys" (common saying/expression) | "" if not idiom',
      '- "register": "resmi" (formal) | "gundelik" (everyday) | "sokak" (street/slang) | "yazi" (written) - language register in Turkish',
      '- "usage_note": in Turkish, when and how to use this expression (1-2 sentences)',
      '- "related_phrases": array of 3-5 related Polish phrases/idioms with Turkish meanings, e.g. [{"pl":"po co","tr":"ne icin/neden"}]',
    ] : [
      '- "is_idiom": false',
      '- "idiom_type": ""',
      '- "register": "gundelik"',
      '- "usage_note": ""',
      '- "related_phrases": []',
    ];

    const prompt = [
      'You are a Polish-Turkish-English dictionary and phraseology expert.',
      'Look up: "' + word + '"',
      contextNote,
      '',
      '- "pl": the canonical form of this word/phrase',
      '- "original": exactly as given',
      '- "inflection_note": grammar note if single word is inflected, else ""',
      '- "tr": natural Turkish meaning/translation (2-8 words)',
      '- "en": English meaning (1-5 words)',
      '- "category": "verb"|"noun"|"adj"|"other"|"phrase"',
      '- "type": czasownik/rzeczownik/przymiotnik/wyrazenie/idiom/kolokacja',
      '- "slang": true if slang/vulgar/non-standard, false otherwise',
      '- "slang_note": slang register note in Turkish if slang=true, else ""',
      '- "example_pl": natural Polish sentence or context using this word/phrase',
      '- "example_tr": Turkish translation of example',
      '- "example_en": English translation of example',
    ].concat(idiomFields).concat([
      '',
      'Return ONLY valid JSON, no markdown.'
    ]).join('\n');

    const raw = await claudeAsk(prompt, 900);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/special',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);res.json(p.special);});
app.post('/api/special',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']); const entry=req.body;
  const exists=p.special.find(e=>e.pl&&entry.pl&&e.pl.toLowerCase()===entry.pl.toLowerCase());
  if(exists) Object.assign(exists,entry,{updatedAt:new Date().toISOString()});
  else p.special.push({...entry,id:Date.now().toString(),savedAt:new Date().toISOString()});
  saveStore(); res.json(p.special);
});
app.delete('/api/special/:id',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);p.special=p.special.filter(e=>e.id!==req.params.id);saveStore();res.json(p.special);});
app.put('/api/special/:id/note',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);const e=p.special.find(x=>x.id===req.params.id);if(e){e.note=req.body.note;e.updatedAt=new Date().toISOString();saveStore();}res.json({ok:true});});

// ── ÜNİTELER ──────────────────────────────────────────────
app.post('/api/units',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);const{name,words,mode}=req.body;const unit={id:Date.now().toString()+Math.floor(Math.random()*1000),name,words,mode:mode||'lesson',notes:'',createdAt:new Date().toISOString()};p.units.push(unit);saveStore();res.json(unit);});
app.delete('/api/units/:id',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);p.units=p.units.filter(u=>u.id!==req.params.id);saveStore();res.json({ok:true});});
app.put('/api/units/:id/notes',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);const u=p.units.find(u=>u.id===req.params.id);if(u){u.notes=req.body.notes;saveStore();}res.json({ok:true});});

// ── İLERLEME ──────────────────────────────────────────────
app.post('/api/progress',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']);const{unitId,wordPl,correct}=req.body;
  const unit=p.units.find(u=>u.id===unitId);if(!unit)return res.json({});
  const word=unit.words.find(w=>w.pl===wordPl);if(!word)return res.json({});
  if(!word.progress)word.progress={correct:0,wrong:0};
  if(correct)word.progress.correct++;else word.progress.wrong++;
  if(!word.srs)word.srs={interval:1,easeFactor:2.5};
  if(correct){word.srs.interval=Math.round(word.srs.interval*word.srs.easeFactor);word.srs.easeFactor=Math.min(3.0,word.srs.easeFactor+0.1);}
  else{word.srs.interval=1;word.srs.easeFactor=Math.max(1.3,word.srs.easeFactor-0.2);}
  const next=new Date();next.setDate(next.getDate()+word.srs.interval);word.srs.nextReview=next.toISOString();
  p.progressLog.push({wordPl,unitId,correct,date:new Date().toISOString()});
  if(p.progressLog.length>10000)p.progressLog=p.progressLog.slice(-10000);
  saveStore();res.json(word.progress);
});
app.post('/api/progress/reset/:id',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);const u=p.units.find(u=>u.id===req.params.id);if(u){u.words.forEach(w=>{w.progress={correct:0,wrong:0};delete w.srs;});saveStore();}res.json({ok:true});});

// ── PDF ────────────────────────────────────────────────────
app.get('/api/pdfs',(req,res)=>{const p=ensureProfile(req.headers['x-profile']);res.json(p.pdfs);});
app.post('/api/pdfs',upload.single('pdf'),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'PDF yuklenemedi.'});
  const p=ensureProfile(req.headers['x-profile']);
  const id=req.file.filename.replace('.pdf','');
  const meta={id,name:req.file.originalname,filePath:req.file.path,addedAt:new Date().toISOString()};
  p.pdfs.push(meta);saveStore();res.json(meta);
});
app.get('/api/pdfs/:id',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']);
  const pdf=p.pdfs.find(x=>x.id===req.params.id);
  if(!pdf||!fs.existsSync(pdf.filePath))return res.status(404).json({error:'PDF bulunamadi.'});
  try{res.json({base64:fs.readFileSync(pdf.filePath).toString('base64'),name:pdf.name});}catch(e){res.status(500).json({error:e.message});}
});
app.delete('/api/pdfs/:id',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']);
  const pdf=p.pdfs.find(x=>x.id===req.params.id);
  if(pdf){try{fs.unlinkSync(pdf.filePath);}catch(e){}p.pdfs=p.pdfs.filter(x=>x.id!==req.params.id);saveStore();}
  res.json({ok:true});
});

// ── İSTATİSTİK ────────────────────────────────────────────
app.get('/api/stats',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']);
  const allWords=p.units.flatMap(u=>u.words.map(w=>({...w,mode:u.mode})));
  const total=allWords.length;
  const learned=allWords.filter(w=>w.progress&&w.progress.correct>=2).length;
  const weak=allWords.filter(w=>w.progress&&w.progress.wrong>=2&&(w.progress.correct||0)<2).length;
  const byCategory={verb:0,noun:0,adj:0,other:0};allWords.forEach(w=>{byCategory[w.category||'other']++;});
  const now=new Date();const weekLog=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);const entries=(p.progressLog||[]).filter(e=>e.date&&e.date.startsWith(ds));weekLog.push({date:ds,label:['Paz','Pts','Sal','Çar','Per','Cum','Cmt'][d.getDay()],correct:entries.filter(e=>e.correct).length,wrong:entries.filter(e=>!e.correct).length});}
  const wordStats={};(p.progressLog||[]).forEach(e=>{if(!wordStats[e.wordPl])wordStats[e.wordPl]={wrong:0,correct:0};if(e.correct)wordStats[e.wordPl].correct++;else wordStats[e.wordPl].wrong++;});
  const mostMissed=Object.entries(wordStats).filter(([,s])=>s.wrong>0).sort((a,b)=>b[1].wrong-a[1].wrong).slice(0,10).map(([pl,s])=>({pl,...s}));
  const todayStr=now.toISOString().slice(0,10);
  const dueSRS=allWords.filter(w=>w.srs&&w.srs.nextReview&&w.srs.nextReview.slice(0,10)<=todayStr).length;
  res.json({total,learned,weak,byCategory,weekLog,mostMissed,dueSRS});
});

// ── EXPORT / IMPORT ───────────────────────────────────────
app.get('/api/export/json',(req,res)=>{
  const pk=req.headers['x-profile'];const p=ensureProfile(pk);
  res.setHeader('Content-Disposition','attachment; filename="polonica-'+pk+'-'+new Date().toISOString().slice(0,10)+'.json"');
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify({profile:pk,...p},null,2));
});
app.post('/api/import/json',(req,res)=>{
  try{
    const data=req.body;const pk=req.headers['x-profile'];const p=ensureProfile(pk);
    if(data.units)p.units=data.units;if(data.special)p.special=data.special;
    if(data.progressLog)p.progressLog=data.progressLog;if(data.pdfs)p.pdfs=data.pdfs;
    saveStore();res.json({ok:true});
  }catch(e){res.status(400).json({ok:false,error:e.message});}
});
app.get('/api/export/csv',(req,res)=>{
  const p=ensureProfile(req.headers['x-profile']);const{unitId}=req.query;
  const words=unitId==='all'?p.units.flatMap(u=>u.words.map(w=>({...w,unitName:u.name}))):(() => {const u=p.units.find(u=>u.id===unitId);return u?u.words.map(w=>({...w,unitName:u.name})):[];})();
  const lines=['Lehce;Turkce;Ingilizce;Kategori;Ornek PL;Ornek TR;Unite'];
  words.forEach(w=>lines.push([w.pl,w.tr,w.en,w.category,w.example_pl||'',w.example_tr||'',w.unitName||''].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')));
  res.setHeader('Content-Disposition','attachment; filename="polonica-'+new Date().toISOString().slice(0,10)+'.csv"');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.send('\uFEFF'+lines.join('\n'));
});

// ── PDF VISION OCR ────────────────────────────────────────
app.post('/api/pdf-vision', async (req, res) => {
  try {
    const { base64, mediaType } = req.body;
    if (!base64) return res.status(400).json({ error: 'Görüntü verisi eksik.' });

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/png', data: base64 }
          },
          {
            type: 'text',
            text: 'This is a page from a Polish language textbook. Extract ALL text you see in this image, exactly as written. Preserve Polish characters (ą, ę, ó, ś, ź, ż, ć, ń, ł). Output ONLY the extracted text, nothing else. No explanations, no formatting notes.'
          }
        ]
      }]
    });

    const text = msg.content[0].text.trim();
    res.json({ text, ok: true });
  } catch(e) {
    console.error('Vision OCR hatası:', e);
    res.status(500).json({ error: e.message });
  }
});

// PDF KELIME TANIMA
app.post('/api/pdf-vision-word', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: 'Goruntu eksik.' });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
          { type: 'text', text: 'This is a cropped region from a Polish text. What Polish word or short phrase do you see? Output ONLY the word/phrase, nothing else. Preserve Polish characters exactly (a with ogonek, e with ogonek, o with acute, etc). If multiple words, output only the most prominent one.' }
        ]
      }]
    });
    const word = msg.content[0].text.trim().replace(/^["']+|["']+$/g, '');
    res.json({ word, ok: true });
  } catch(e) {
    console.error('Vision word error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GRAMMAR API ───────────────────────────────────────────

// Hizli grammar sorgu - fiil aspect, kural aciklamasi vs.
app.post('/api/grammar/query', async (req, res) => {
  try {
    const { query } = req.body;
    const prompt = [
      'You are a Polish grammar expert teaching Turkish university students.',
      'Answer this Polish grammar question clearly and concisely:',
      '"' + query + '"',
      '',
      'Rules for your response:',
      '- Respond in TURKISH (the student language)',
      '- Use Polish examples with Turkish translations',
      '- For verbs: always show both dokonany (dk.) and niedokonany (ndk.) forms with meanings',
      '- For cases: show the endings in a clear table format',
      '- Keep it practical and memorable',
      '- Max 400 words',
      '- Format with clear sections using simple markdown (## for headers, **bold** for Polish words)',
      '',
      'Return JSON: {"answer": "your markdown response here", "type": "verb|case|rule|other"}'
    ].join('\n');

    const raw = await claudeAsk(prompt, 1024);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ answer: raw, type: 'other' });
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Fiil aspect analizi
app.post('/api/grammar/aspect', async (req, res) => {
  try {
    const { verb } = req.body;
    const prompt = [
      'Analyze the Polish verb "' + verb + '" and provide its aspect pair.',
      'Return ONLY valid JSON:',
      '{',
      '  "base_verb": "the verb as given",',
      '  "ndk": {"form": "niedokonany form", "meaning_tr": "Turkish meaning", "meaning_en": "English meaning", "usage_tr": "when to use in Turkish"},',
      '  "dk": {"form": "dokonany form", "meaning_tr": "Turkish meaning", "meaning_en": "English meaning", "usage_tr": "when to use in Turkish"},',
      '  "difference_tr": "key difference explained in Turkish (2-3 sentences)",',
      '  "example_ndk_pl": "example sentence with ndk form",',
      '  "example_ndk_tr": "Turkish translation",',
      '  "example_dk_pl": "example sentence with dk form",',
      '  "example_dk_tr": "Turkish translation"',
      '}'
    ].join('\n');
    const raw = await claudeAsk(prompt, 800);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON bulunamadi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GENIUS API ────────────────────────────────────────────
const https = require('https');

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: headers || { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0' }
    };
    const req = https.request(opts, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      let d = ''; res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout.')); });
    req.end();
  });
}

function geniusGet(path) {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  const headers = token
    ? { 'Authorization': 'Bearer ' + token, 'User-Agent': 'Polonica/1.0' }
    : { 'User-Agent': 'Mozilla/5.0' };
  return httpsGet('https://api.genius.com' + path, headers).then(d => JSON.parse(d));
}

function geniusFetch(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    };
    const req = https.request(opts, res => {
      // Redirect takip et
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return geniusFetch(res.headers.location).then(resolve).catch(reject);
      }
      let d = ''; res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout.')); });
    req.end();
  });
}

// Genius token kontrol
app.get('/api/genius/test', (req, res) => {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  res.json({ hasToken: !!token, tokenLength: token ? token.length : 0, tokenStart: token ? token.slice(0,8)+'...' : null });
});

// Şarkı arama
app.get('/api/genius/search', async (req, res) => {
  try {
    const q = encodeURIComponent(req.query.q || '');
    if (!q) return res.status(400).json({ error: 'Arama terimi gerekli.' });
    const data = await geniusGet('/search?q=' + q + '&per_page=10&text_format=plain');
    console.log('Genius meta:', data.meta && data.meta.status);
    if (data.meta && data.meta.status !== 200) {
      return res.status(400).json({ error: 'Genius: ' + (data.meta.message||data.meta.status) });
    }
    const hitsArr = (data.response && data.response.hits) || [];
    const hits = hitsArr.filter(h => h.type === 'song').map(h => ({
      id: h.result.id,
      title: h.result.title,
      artist: h.result.primary_artist.name,
      thumbnail: h.result.song_art_image_thumbnail_url,
      url: h.result.url,
      language: h.result.language || ''
    }));
    res.json({ hits });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// lrclib.net - açık lyrics API (cors yok, token gerekmez)
app.get('/api/lyrics/search', async (req, res) => {
  try {
    const { artist, title } = req.query;
    const url = 'https://lrclib.net/api/search?artist_name=' + encodeURIComponent(artist||'') + '&track_name=' + encodeURIComponent(title||'');
    const data = await httpsGet(url, { 'User-Agent': 'Polonica/1.0 (github.com/Minoshii/polonica-web)' });
    const results = JSON.parse(data);
    if (!results || !results.length) return res.json({ lyrics: null });
    // En iyi sonucu al
    const best = results[0];
    const lyrics = best.plainLyrics || best.syncedLyrics?.replace(/\[\d+:\d+\.\d+\]/g, '') || '';
    res.json({ lyrics: lyrics.trim(), title: best.trackName, artist: best.artistName });
  } catch(e) {
    res.json({ lyrics: null, error: e.message });
  }
});

// Şarkı sözü çek
app.get('/api/genius/lyrics/:id', async (req, res) => {
  try {
    const data = await geniusGet('/songs/' + req.params.id + '?text_format=plain');
    const song = data.response.song;

    // Yöntem 1: API'den direkt plain text lyrics
    if (song.lyrics && song.lyrics.plain) {
      return res.json({
        lyrics: song.lyrics.plain,
        title: song.title,
        artist: song.primary_artist.name,
        thumbnail: song.song_art_image_thumbnail_url
      });
    }

    // Yöntem 2: Genius sayfasını scrape et
    const pageUrl = song.url;
    const html = await httpsGet(pageUrl);
    console.log('HTML length:', html.length, 'URL:', pageUrl);

    let lyrics = '';

    // data-lyrics-container attribute'u
    const re = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>(?=\s*<div|\s*<\/div|\s*$)/g;
    let match;
    const parts = [];
    while ((match = re.exec(html)) !== null) {
      parts.push(match[1]);
    }
    if (parts.length) {
      lyrics = parts.map(p =>
        p.replace(/<br\s*\/?>/gi, '\n')
         .replace(/<a[^>]*>/gi, '').replace(/<\/a>/gi, '')
         .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
         .replace(/<[^>]+>/g, '')
         .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
         .trim()
      ).join('\n\n');
    }

    // Yöntem 3: __NEXT_DATA__ JSON içinden
    if (!lyrics) {
      const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextData) {
        try {
          const json = JSON.parse(nextData[1]);
          const lyricsData = json?.props?.pageProps?.songPage?.lyricsData?.body?.plain || '';
          if (lyricsData) lyrics = lyricsData;
        } catch(e) {}
      }
    }

    if (!lyrics) {
      return res.json({ lyrics: '', title: song.title, artist: song.primary_artist.name, note: 'Sözler bu şarkı için scrape edilemedi.' });
    }

    res.json({
      lyrics: lyrics.trim(),
      title: song.title,
      artist: song.primary_artist.name,
      thumbnail: song.song_art_image_thumbnail_url
    });
  } catch(e) {
    console.error('Lyrics error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── EJ MAŁA API ───────────────────────────────────────────
app.post('/api/ejmala', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) return res.status(400).json({ error: 'Kelime gerekli.' });

    const prompt = [
      'You are a Polish language expert. The user typed: "' + word.trim() + '"',
      '',
      'Provide a comprehensive breakdown in JSON format:',
      '{',
      '  "base": "canonical Polish form",',
      '  "base_tr": "Turkish meaning 2-5 words",',
      '  "base_en": "English meaning 1-3 words",',
      '  "formal": [',
      '    {"pl": "formal Polish sentence/usage", "tr": "Turkish translation", "note": ""}',
      '  ],',
      '  "everyday": [',
      '    {"pl": "everyday usage or colloquial variant", "tr": "Turkish translation", "note": "register note in Turkish"}',
      '  ],',
      '  "slang": [',
      '    {"pl": "slang/street equivalent or related slang", "tr": "Turkish translation", "note": "context in Turkish"}',
      '  ],',
      '  "patterns": [',
      '    {"pl": "key pattern/collocation with this word", "tr": "Turkish translation"}',
      '  ],',
      '  "alternatives": [',
      '    {"pl": "synonym or alternative expression", "tr": "Turkish translation", "register": "resmi/gundelik/sokak"}',
      '  ]',
      '}',
      '',
      'Rules:',
      '- formal: 2-3 entries, standard written Polish',
      '- everyday: 2-4 entries, spoken conversational Polish',
      '- slang: 2-4 entries, street/youth/rap slang equivalents (real Polish slang)',
      '- patterns: 3-5 most useful collocations/fixed phrases',
      '- alternatives: 3-5 synonyms or near-synonyms across registers',
      '- All Polish must be natural and authentic',
      '- Turkish translations must be natural Turkish, not word-for-word',
      '- Return ONLY valid JSON, no markdown'
    ].join('\n');

    const raw = await claudeAsk(prompt, 1500);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) {
    console.error('Ej Mala error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── CÜMLE KURUCU ──────────────────────────────────────────
app.post('/api/sentences', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: 'Kelime gerekli.' });
    const prompt = [
      'You are a Polish language teacher. Generate exactly 5 varied, natural Polish sentences using the word/phrase: "' + word + '"',
      'Each sentence should demonstrate a DIFFERENT context or usage:',
      '1. Simple everyday situation',
      '2. Question form',
      '3. Negative form',
      '4. Formal/written context',
      '5. Colloquial/spoken context',
      '',
      'Return ONLY valid JSON:',
      '{"word":"' + word + '","sentences":[',
      '  {"pl":"sentence","tr":"Turkish translation","en":"English translation","context":"Gündelik"},',
      '  {"pl":"sentence","tr":"Turkish translation","en":"English translation","context":"Soru"},',
      '  {"pl":"sentence","tr":"Turkish translation","en":"English translation","context":"Olumsuz"},',
      '  {"pl":"sentence","tr":"Turkish translation","en":"English translation","context":"Resmi"},',
      '  {"pl":"sentence","tr":"Turkish translation","en":"English translation","context":"Sokak"}',
      ']}',
      '',
      'Rules: sentences 8-15 words, natural Polish, Turkish translations must be natural'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1200);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── İSİM/SIFAT ÇEKİM TABLOSU ────────────────────────────
app.post('/api/declension', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: 'Kelime gerekli.' });
    const prompt = [
      'You are a Polish grammar expert. Decline the Polish noun or adjective: "' + word + '"',
      'Return ONLY valid JSON with all 7 cases in singular and plural:',
      '{',
      '  "word": "' + word + '",',
      '  "type": "noun" or "adjective",',
      '  "gender": "masculine" or "feminine" or "neuter",',
      '  "meaning_tr": "Turkish meaning",',
      '  "singular": {',
      '    "mianownik": "", "dopelniacz": "", "celownik": "", "biernik": "", "narzednik": "", "miejscownik": "", "wolacz": ""',
      '  },',
      '  "plural": {',
      '    "mianownik": "", "dopelniacz": "", "celownik": "", "biernik": "", "narzednik": "", "miejscownik": "", "wolacz": ""',
      '  },',
      '  "notes": "any important notes about irregularities in Turkish"',
      '}'
    ].join('\n');
    const raw = await claudeAsk(prompt, 800);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── JAK SIĘ MÓWI ──────────────────────────────────────────
app.post('/api/jaksiemowi', async (req, res) => {
  try {
    const { situation } = req.body;
    if (!situation) return res.status(400).json({ error: 'Durum gerekli.' });
    const prompt = [
      'You are a Polish language expert. A Turkish learner describes a situation and wants to know what to say in Polish.',
      'Situation: "' + situation + '"',
      '',
      'Give 4-5 different ways to express this in Polish across different registers.',
      'Return ONLY valid JSON:',
      '{',
      '  "situation_pl": "brief Polish description of the situation",',
      '  "phrases": [',
      '    {',
      '      "register": "Resmi",',
      '      "pl": "the Polish phrase",',
      '      "tr": "Turkish translation",',
      '      "note": "when/how to use this in Turkish",',
      '      "example_context": "brief context in Turkish"',
      '    },',
      '    {',
      '      "register": "Gündelik",',
      '      "pl": "...", "tr": "...", "note": "...", "example_context": "..."',
      '    },',
      '    {',
      '      "register": "Kanka",',
      '      "pl": "...", "tr": "...", "note": "...", "example_context": "..."',
      '    },',
      '    {',
      '      "register": "Slang",',
      '      "pl": "...", "tr": "...", "note": "...", "example_context": "..."',
      '    },',
      '    {',
      '      "register": "Yazılı",',
      '      "pl": "...", "tr": "...", "note": "...", "example_context": "..."',
      '    }',
      '  ]',
      '}',
      '',
      'Rules:',
      '- Each phrase must be authentic natural Polish',
      '- Registers: Resmi (formal/academic), Gündelik (everyday spoken), Kanka (between close friends, warmer), Slang (street/youth language), Yazılı (written/email)',
      '- Turkish translations must be natural, not literal',
      '- notes and example_context in Turkish',
      '- Return ONLY valid JSON, no markdown'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1400);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CEVAP VER ─────────────────────────────────────────────
app.post('/api/cevapver', async (req, res) => {
  try {
    const { phrase } = req.body;
    if (!phrase) return res.status(400).json({ error: 'Ifade gerekli.' });
    const prompt = [
      'Someone said this Polish phrase to a Turkish learner: "' + phrase + '"',
      '',
      'Provide natural Polish responses across 5 registers.',
      'Return ONLY valid JSON:',
      '{',
      '  "phrase": "' + phrase + '",',
      '  "phrase_tr": "Turkish meaning of the phrase",',
      '  "responses": [',
      '    {"register":"Resmi","pl":"formal response","tr":"Turkish translation","note":"context in Turkish"},',
      '    {"register":"Gündelik","pl":"everyday response","tr":"Turkish translation","note":"context in Turkish"},',
      '    {"register":"Kanka","pl":"close friends response","tr":"Turkish translation","note":"context in Turkish"},',
      '    {"register":"Slang","pl":"street/youth slang response","tr":"Turkish translation","note":"context in Turkish"},',
      '    {"register":"Kısa","pl":"shortest natural response","tr":"Turkish translation","note":"when to use in Turkish"}',
      '  ]',
      '}',
      '',
      'Rules: all responses must be authentic natural Polish, Turkish translations natural not literal.',
      'Return ONLY valid JSON, no markdown.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1200);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── NOTLAR ────────────────────────────────────────────────
app.get('/api/notes', (req, res) => {
  const p = ensureProfile(req.headers['x-profile']);
  if(!p.notes) p.notes = [];
  res.json(p.notes);
});

app.post('/api/notes', (req, res) => {
  const { text, context } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Not bos olamaz.' });
  const p = ensureProfile(req.headers['x-profile']);
  if (!p.notes) p.notes = [];
  const note = {
    id: Date.now().toString(),
    text: text.trim(),
    context: context || '',
    createdAt: new Date().toISOString()
  };
  p.notes.unshift(note);
  saveStore();
  res.json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const p = ensureProfile(req.headers['x-profile']);
  if (!p.notes) return res.json({ ok: true });
  p.notes = p.notes.filter(n => n.id !== req.params.id);
  saveStore();
  res.json({ ok: true });
});

// ── SPOTIFY ───────────────────────────────────────────────
const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT      = process.env.RAILWAY_PUBLIC_DOMAIN
  ? 'https://'+process.env.RAILWAY_PUBLIC_DOMAIN+'/spotify/callback'
  : 'https://polonica-web-production.up.railway.app/spotify/callback';

// Token'ları profil bazlı sakla
// Spotify tokenları store'dan yükle
function getSpotifyTokens() { return store.spotifyTokens || (store.spotifyTokens = {}); }

// 1. Login başlat
app.get('/spotify/login', (req, res) => {
  const profile = req.query.profile || 'default';
  const scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: SPOTIFY_REDIRECT,
    state: profile
  });
  res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
});

// 2. Callback
app.get('/spotify/callback', async (req, res) => {
  const { code, state: profile } = req.query;
  if (!code) return res.send('Hata: kod yok');
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT,
      client_id: SPOTIFY_CLIENT_ID,
      client_secret: SPOTIFY_CLIENT_SECRET
    });
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const data = await r.json();
    if (data.access_token) {
      getSpotifyTokens()[profile] = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
      };
      res.send('<script>window.close();window.opener&&window.opener.postMessage("spotify_connected","*")</script><p>Bağlandı! Bu pencereyi kapatabilirsin.</p>');
    } else {
      res.send('Hata: ' + JSON.stringify(data));
    }
  } catch(e) { res.send('Hata: ' + e.message); }
});

// 3. Token yenile
async function refreshSpotifyToken(profile) {
  const t = getSpotifyTokens()[profile];
  if (!t || !t.refresh_token) return null;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: t.refresh_token,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET
  });
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const data = await r.json();
  if (data.access_token) {
    t.access_token = data.access_token;
    t.expires_at = Date.now() + (data.expires_in * 1000);
    saveStore();
  }
  return t.access_token;
}

// 4. Şu an çalan şarkı
app.get('/api/spotify/now-playing', async (req, res) => {
  const profile = req.headers['x-profile'] || 'default';
  let t = getSpotifyTokens()[profile];
  if (!t) return res.json({ connected: false });
  // Token süresi dolmuşsa yenile
  if (Date.now() > t.expires_at - 60000) {
    await refreshSpotifyToken(profile);
    t = getSpotifyTokens()[profile];
  }
  try {
    const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + t.access_token }
    });
    if (r.status === 204 || r.status === 404) return res.json({ connected: true, playing: false });
    const data = await r.json();
    if (!data.item) return res.json({ connected: true, playing: false });
    res.json({
      connected: true,
      playing: data.is_playing,
      track: data.item.name,
      artist: data.item.artists.map(a => a.name).join(', '),
      album: data.item.album.name,
      cover: data.item.album.images[1]?.url || data.item.album.images[0]?.url || '',
      progress_ms: data.progress_ms,
      duration_ms: data.item.duration_ms
    });
  } catch(e) { res.json({ connected: false, error: e.message }); }
});

// 5. Bağlantı durumu
app.get('/api/spotify/status', (req, res) => {
  const profile = req.headers['x-profile'] || 'default';
  res.json({ connected: !!getSpotifyTokens()[profile] });
});

// ── SPOTIFY PLAYER KONTROL ────────────────────────────────
async function spotifyPlayerAction(profile, method, endpoint, body) {
  let t = getSpotifyTokens()[profile];
  if (!t) return { error: 'Bağlı değil' };
  if (Date.now() > t.expires_at - 60000) await refreshSpotifyToken(profile);
  t = getSpotifyTokens()[profile];
  const opts = {
    method,
    headers: { 'Authorization': 'Bearer ' + t.access_token, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('https://api.spotify.com/v1/me/player' + endpoint, opts);
  return { ok: r.status < 300 };
}

app.post('/api/spotify/play-pause', async (req, res) => {
  const profile = req.headers['x-profile'] || 'default';
  const { is_playing } = req.body;
  const endpoint = is_playing ? '/pause' : '/play';
  const result = await spotifyPlayerAction(profile, 'PUT', endpoint, null);
  res.json(result);
});

app.post('/api/spotify/next', async (req, res) => {
  const profile = req.headers['x-profile'] || 'default';
  const result = await spotifyPlayerAction(profile, 'POST', '/next', null);
  res.json(result);
});

app.post('/api/spotify/previous', async (req, res) => {
  const profile = req.headers['x-profile'] || 'default';
  const result = await spotifyPlayerAction(profile, 'POST', '/previous', null);
  res.json(result);
});

// ── POLONYA KÜLTÜR ────────────────────────────────────────
app.post('/api/kultur', async (req, res) => {
  try {
    const { category } = req.body;
    const cats = {
      'edebiyat': 'Polish literature, poets, novelists, their famous works and why they matter',
      'tarih': 'Polish history, key events, heroes, turning points',
      'muzik': 'Polish classical music, composers, folk music traditions',
      'sinema': 'Polish cinema, directors, famous films, film school',
      'sanat': 'Polish art, painters, sculptors, movements',
      'mitoloji': 'Polish mythology, legends, folk tales, creatures',
      'halk': 'Polish folk culture, traditions, customs, celebrations',
      'turkpolonya': 'relations between Turkey and Poland — both historical AND modern/current: Ottoman-Polish alliances, WW2 era connections, BUT ALSO modern trade, tourism, Polish people in Turkey today, Turkish people in Poland, current diplomatic relations, Polish-Turkish cultural similarities, modern pop culture crossovers, EU-Turkey-Poland dynamics, modern business ties, universities, sports connections, anything surprising and current between the two countries in 2020s',
      'bilim': 'Polish scientists, inventors, discoveries',
    };
    const focus = cats[category] || 'any aspect of Polish culture, history, art, literature or science';
    // Her istekte farklı bir rastgele tohum oluştur - tekrarı önler
    const seed = Math.floor(Math.random() * 10000);
    const randomizers = [
      'Focus on a person almost nobody knows.',
      'Focus on a shocking or dark historical event.',
      'Focus on something funny or ironic.',
      'Focus on a connection to another country.',
      'Focus on a record-breaking or first-in-the-world achievement.',
      'Focus on something from everyday life or street culture.',
      'Focus on a woman or minority who changed history.',
      'Focus on something from the last 50 years.',
      'Focus on a very specific object, place or building.',
      'Focus on food, drink or festival tradition.',
      'Focus on something related to language or words.',
      'Focus on a rivalry, conflict or surprising friendship.',
    ];
    const randomHint = randomizers[seed % randomizers.length];

    const prompt = [
      'You are an expert on Polish culture and history. Give ONE fascinating, detailed cultural fact about Poland.',
      'Focus on: ' + focus,
      'IMPORTANT DIVERSITY INSTRUCTION: ' + randomHint,
      'Random seed for variety: ' + seed,
      'The user is a Turkish student learning Polish — make it relevant and memorable.',
      'CRITICAL: Do NOT mention Chopin, Copernicus, Marie Curie, Adam Mickiewicz, or Wisława Szymborska unless absolutely necessary — these are overused. Find something less known but equally fascinating.',
      '',
      'Return ONLY valid JSON:',
      '{',
      '  "category": "category in Turkish (e.g. Edebiyat, Tarih, Müzik, Sinema, Sanat, Halk Kültürü, Bilim)",',
      '  "title": "name of person/work/event in Polish/original",',
      '  "title_tr": "Turkish translation or explanation of the title",',
      '  "period": "time period (e.g. 1884, 19. yüzyıl, Orta Çağ)",',
      '  "fact": "3-5 sentence fascinating fact in Turkish. Be specific, vivid, surprising. Write as if telling a friend something amazing you just discovered.",',
      '  "why_matters": "1-2 sentences: why every Polish learner should know this",',
      '  "polish_connection": "a Polish word or phrase related to this fact with Turkish meaning",',
      '  "emoji": "2-3 relevant emojis"',
      '}',
      '',
      'Be surprising and specific. Avoid the most famous clichés. Make it genuinely interesting.',
      'Return ONLY valid JSON, no markdown.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 800);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// server.js dosyasının en altındaki o kısmı bununla değiştir:
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  
  // Eğer istenen şey gerçekten varsa ve bir dosyaysa (easteregg.js gibi)
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Yoksa ana sayfayı gönder
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT,'0.0.0.0',()=>{
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     POLONICA SUNUCUSU BAŞLADI        ║');
  console.log('║  http://localhost:'+PORT+'                 ║');
  console.log('╚══════════════════════════════════════╝\n');
  if(!process.env.ANTHROPIC_API_KEY) console.warn('⚠  ANTHROPIC_API_KEY eksik!');
});
