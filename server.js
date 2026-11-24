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
  if (!store.profiles[key]) store.profiles[key] = { units:[], special:[], progressLog:[], pdfs:[], xp:0, badges:[], createdAt:new Date().toISOString() };
  const p = store.profiles[key];
  if (!p.units)       p.units = [];
  if (!p.special)     p.special = [];
  if (!p.progressLog) p.progressLog = [];
  if (!p.pdfs)        p.pdfs = [];
  if (p.xp === undefined || p.xp === null) p.xp = 0;
  if (!p.badges)      p.badges = [];
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
app.use(express.static(path.join(__dirname,'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

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
    const {word, mode, lang} = req.body;
    const outputLang = lang === 'zh' ? 'Traditional Chinese (繁體中文)' : lang === 'en' ? 'English' : 'Turkish';
    const isNonTurkish = lang === 'zh' || lang === 'en';
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
      '- "tr": natural ' + outputLang + ' meaning/translation (2-8 words)',
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

// Genel ilerleme kaydı — Test modu (Burak Special dahil), oyunlar vb. buradan geçer.
// Kelime p.units ya da p.special icinde bulunursa progress/srs guncellenir; bulunmasa bile
// haftalik aktivite grafigi icin progressLog'a her zaman yazilir.
app.post('/api/progress/log', (req,res) => {
  const p = ensureProfile(req.headers['x-profile']);
  const { wordPl, correct } = req.body;
  if (!wordPl) return res.json({ ok:false });
  let word = null;
  for (const u of p.units) { word = u.words.find(w => w.pl === wordPl); if (word) break; }
  if (!word) word = (p.special||[]).find(w => w.pl === wordPl);
  if (word) {
    if (!word.progress) word.progress = { correct:0, wrong:0 };
    if (correct) word.progress.correct++; else word.progress.wrong++;
    if (!word.srs) word.srs = { interval:1, easeFactor:2.5 };
    if (correct) { word.srs.interval = Math.round(word.srs.interval*word.srs.easeFactor); word.srs.easeFactor = Math.min(3.0, word.srs.easeFactor+0.1); }
    else { word.srs.interval = 1; word.srs.easeFactor = Math.max(1.3, word.srs.easeFactor-0.2); }
    const next = new Date(); next.setDate(next.getDate()+word.srs.interval); word.srs.nextReview = next.toISOString();
  }
  p.progressLog.push({ wordPl, unitId:null, correct: !!correct, date: new Date().toISOString() });
  if (p.progressLog.length > 10000) p.progressLog = p.progressLog.slice(-10000);
  saveStore();
  res.json({ ok:true, matched: !!word });
});

// ── XP & ROZET SİSTEMİ ───────────────────────────────────────
app.get('/api/progress/xp', (req,res) => {
  const p = ensureProfile(req.headers['x-profile']);
  res.json({ xp: p.xp||0, badges: p.badges||[] });
});
app.post('/api/progress/xp', (req,res) => {
  const p = ensureProfile(req.headers['x-profile']);
  const amount = Number(req.body.amount) || 0;
  p.xp = Math.max(0, (p.xp||0) + amount);
  saveStore();
  res.json({ xp: p.xp, badges: p.badges||[] });
});
app.post('/api/progress/badge', (req,res) => {
  const p = ensureProfile(req.headers['x-profile']);
  const id = req.body.id;
  if (!id) return res.status(400).json({ error: 'Rozet id gerekli.' });
  if (!p.badges) p.badges = [];
  const already = p.badges.some(b => b.id === id);
  if (!already) { p.badges.push({ id, unlockedAt: new Date().toISOString() }); saveStore(); }
  res.json({ xp: p.xp||0, badges: p.badges, isNew: !already });
});

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
  const unitWords=p.units.flatMap(u=>u.words.map(w=>({...w,mode:u.mode})));
  const specialWords=(p.special||[]).map(w=>({...w}));
  const allWords=[...unitWords,...specialWords];
  const total=allWords.length;
  const learned=allWords.filter(w=>w.progress&&w.progress.correct>=2).length;
  const weak=allWords.filter(w=>w.progress&&w.progress.wrong>=2&&(w.progress.correct||0)<2).length;
  const byCategory={verb:0,noun:0,adj:0,other:0};allWords.forEach(w=>{const cat=(w.category&&byCategory.hasOwnProperty(w.category))?w.category:'other';byCategory[cat]++;});
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
// ── KURWA MODU: durum bazlı küfür karşılığı ────────────────
app.post('/api/kurwa-lookup', async (req, res) => {
  try {
    const { situation } = req.body;
    if (!situation) return res.status(400).json({ error: 'Durum gerekli.' });
    const prompt = [
      'You are a Polish language expert specializing in real, authentic profanity and swearing as actually used by native speakers.',
      'A Turkish learner names a curse word, swear, or frustrated exclamation (it may be in Turkish, English, or already Polish) and wants to know the natural Polish equivalents used to express that exact sentiment.',
      '',
      'Input: "' + situation + '"',
      '',
      'Give 3-5 authentic Polish curse words or vulgar phrases a native speaker would actually use for this, ordered from mildest to most vulgar.',
      'Return ONLY valid JSON:',
      '{',
      '  "phrases": [',
      '    {',
      '      "pl": "the Polish curse word or phrase",',
      '      "tr": "Turkish meaning",',
      '      "literal": "literal word-for-word translation",',
      '      "level": 1,',
      '      "note": "usage note in Turkish - when/how it is used, tone, how vulgar it is",',
      '      "example_pl": "example Polish sentence using it",',
      '      "example_tr": "Turkish translation of the example sentence"',
      '    }',
      '  ]',
      '}',
      '',
      'Rules:',
      '- This is for language education (understanding real spoken/street Polish) — be direct and authentic, do not sanitize, soften, or refuse mild-to-strong vulgarity',
      '- Use real Polish profanity/swear words when they genuinely fit the input, not euphemisms',
      '- "level" is an integer 1-5 (1=mild like "cholera", 5=very vulgar like "kurwa"/"chuj"-based phrases), and results must be sorted ascending by level',
      '- notes and example_tr must be in Turkish',
      '- Return ONLY valid JSON, no markdown'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1400);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── OKUMA PRATİĞİ: metin üretimi ──────────────────────────
// ── OYUN: Hafıza eşleştirme — konuya göre taze kelime çiftleri ────
app.post('/api/games/memory', async (req, res) => {
  try {
    const { topic, level } = req.body;
    if (!topic) return res.status(400).json({ error: 'Konu gerekli.' });
    const prompt = [
      'You are generating vocabulary for a memory-matching game for a Turkish student learning Polish.',
      'Topic: ' + topic,
      'Level: ' + (level || 'A1-A2'),
      '',
      'Generate exactly 8 common, real Polish words related to this topic, each with its Turkish meaning.',
      'Return ONLY valid JSON, no markdown:',
      '{ "pairs": [ {"pl": "polish word", "tr": "turkish meaning"} ] }',
      '',
      'Rules:',
      '- Exactly 8 pairs, all different words, no duplicates',
      '- Words must genuinely relate to the given topic and fit the requested level',
      '- Single words or very short common phrases only (max 2-3 words)',
      '- Return ONLY valid JSON'
    ].join('\n');
    const raw = await claudeAsk(prompt, 900);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── OYUN: Cümle kurma — rastgele üretilmiş cümleyi kelime kelime dizme ──
const SENTENCE_TOPICS = [
  'zamawianie jedzenia w restauracji','planowanie wakacji','codzienna rutyna poranna',
  'zakupy spożywcze','wizyta u lekarza','praca w biurze','hobby i zainteresowania',
  'pytanie o drogę w mieście','rozmowa telefoniczna z przyjacielem','opisywanie własnego mieszkania',
  'plany na weekend','uczucia po trudnym dniu','sport i aktywność fizyczna','pogoda dzisiaj',
  'szkoła i nauka','zwierzęta domowe','koncert lub kino','zakupy ubrań','gotowanie obiadu',
  'spotkanie z rodziną','podróż pociągiem','praca w ogrodzie','czytanie książki','pierwszy dzień w nowej pracy',
  'spacer po parku','naprawa czegoś w domu','rozmowa w sklepie','planowanie urodzin','nauka języka obcego',
  'poranna kawa','wieczór z przyjaciółmi','problem z komputerem','wizyta u fryzjera','jazda samochodem',
];
const SENTENCE_TYPES = ['zwykłe zdanie oznajmujące','pytanie','zdanie w czasie przeszłym','zdanie w czasie przyszłym','zdanie z przeczeniem (nie)','zdanie rozkazujące (polecenie/prośba)'];

app.post('/api/games/sentence', async (req, res) => {
  try {
    const { level } = req.body;
    const topic = SENTENCE_TOPICS[Math.floor(Math.random() * SENTENCE_TOPICS.length)];
    const sentType = SENTENCE_TYPES[Math.floor(Math.random() * SENTENCE_TYPES.length)];
    const prompt = [
      'You are generating a sentence-building exercise for a Turkish student learning Polish.',
      'Level: ' + (level || 'A1-A2'),
      'Topic (mandatory, build the sentence around this specific situation): ' + topic,
      'Sentence type (mandatory): ' + sentType,
      '',
      'Generate ONE natural, original Polish sentence at this level (5-9 words) about the given topic, in the given sentence type, plus its Turkish translation.',
      'Return ONLY valid JSON, no markdown:',
      '{ "sentence": "the full Polish sentence with correct punctuation", "translation": "Turkish translation", "words": ["Word1","word2","word3", "..."] }',
      '',
      'Rules:',
      '- "words" must be the sentence split into individual words IN THE CORRECT ORDER, each array element is exactly one word (keep trailing punctuation like a comma attached to its word, but put the final sentence-ending punctuation as part of the LAST word)',
      '- The sentence must be a complete, natural, grammatically correct Polish sentence a real person would say in that exact situation',
      '- Do NOT default to generic polite-request templates like "Czy mógłbyś/mogłabyś pomóc mi..." — use varied, concrete vocabulary specific to the topic instead',
      '- Use varied subjects across calls (ja, ty, on, ona, my, oni) — do not always use "ja" or "ty"',
      '- Return ONLY valid JSON'
    ].join('\n');
    const raw = await claudeAsk(prompt, 700);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reading/generate', async (req, res) => {
  try {
    const { grade, wc, topic } = req.body;
    if (!grade || !topic) return res.status(400).json({ error: 'Seviye ve konu gerekli.' });
    const prompt = [
      'You are creating reading practice material for a Turkish student learning Polish.',
      'Write an original Polish text.',
      'Level: ' + grade,
      'Topic: ' + topic,
      'Word count: approximately ' + (wc || '100') + ' words',
      '',
      'Return ONLY valid JSON, no markdown, no code fences, no extra text before or after:',
      '{',
      '  "title": "a short Polish title for the text",',
      '  "text": "the Polish reading text itself, plain text only, no markdown formatting",',
      '  "vocab": [ {"pl": "polish word", "tr": "turkish meaning"} ],',
      '  "category": "a short Turkish topic label"',
      '}',
      '',
      'Rules:',
      '- "text" must be natural, original Polish prose at the requested level and approximate length, with NO markdown formatting inside it (no **, no ##, no code fences)',
      '- "vocab" should list exactly 5 useful or challenging words actually used in the text, each with its Turkish meaning',
      '- Return ONLY valid JSON, nothing else'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1400);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── OKUMA PRATİĞİ: anlama quiz'i ──────────────────────────
app.post('/api/reading/quiz', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Metin gerekli.' });
    const prompt = [
      'You are creating a reading comprehension quiz for a Turkish student learning Polish.',
      'Polish text: "' + text.slice(0, 800) + '"',
      '',
      'Create exactly 3 multiple-choice comprehension questions about this text, in Turkish, each with exactly 4 options and one correct answer.',
      'Return ONLY valid JSON, no markdown, no asterisks, no bold formatting anywhere inside any string value:',
      '{',
      '  "questions": [',
      '    { "q": "question text in Turkish", "options": ["option A", "option B", "option C", "option D"], "correct": 0 }',
      '  ]',
      '}',
      '',
      'Rules:',
      '- "correct" is the 0-based index (0,1,2,3) of the right option',
      '- Questions should test understanding of the text (meaning, vocabulary, grammar points actually used in it), asked in Turkish',
      '- NEVER use markdown formatting (no **, no ##, no backticks) inside any string value — plain text only',
      '- Exactly 3 questions, exactly 4 options each',
      '- Return ONLY valid JSON, nothing else'
    ].join('\n');
    const raw = await claudeAsk(prompt, 1200);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

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

// ── SINAV HUB'I ───────────────────────────────────────────
// Dersler ve derslere yüklenen HTML/PDF dosyaları profil bazlı tutulur.
// Dosyalar volume'de (DATA_DIR/sinav-files) durur; içerik koda gömülmez.
const SINAV_DIR = path.join(DATA_DIR, 'sinav-files');
if (!fs.existsSync(SINAV_DIR)) fs.mkdirSync(SINAV_DIR, { recursive: true });

const SINAV_DEFAULT_COURSES = [
  ['Polonya Tarihi', '🏰', 'Hacer hoca'], ['Polonya Edebiyatı', '📜', 'Seyyal hoca'], ['Rusça 1', '🇷🇺', 'Mariana hoca'],
  ['Lehçe Gramer', '📐', ''], ['Laiklik', '⚖️', 'Cezmi hoca'], ['Lehçe Kompozisyon', '✍️', 'Artur hoca'], ['Lehçe Konuşma', '🗣', 'Artur hoca'],
];
function sinavId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function sinavToken() { return require('crypto').randomBytes(12).toString('hex'); }
function sinavData(p) {
  if (!p.sinav) {
    const term = '2026–27 Güz';
    p.sinav = { courses: SINAV_DEFAULT_COURSES.map(([title, emoji, teacher], i) => ({ id: sinavId() + i, title, emoji, teacher, term, examDate: '', createdAt: new Date().toISOString() })), files: [] };
    saveStore();
  }
  return p.sinav;
}
function sinavPublicFile(f) { const { filePath, ...rest } = f; return rest; }
function sinavCleanCourse(b) {
  const out = {};
  ['title', 'emoji', 'teacher', 'term', 'examDate', 'note'].forEach(k => { if (b[k] !== undefined) out[k] = String(b[k]).slice(0, 200); });
  return out;
}

const sinavUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SINAV_DIR),
    filename: (req, file, cb) => cb(null, sinavId() + (/\.pdf$/i.test(file.originalname) ? '.pdf' : '.html'))
  }),
  fileFilter: (req, file, cb) => cb(null, /\.(html?|pdf)$/i.test(file.originalname)),
  limits: { fileSize: 150 * 1024 * 1024, files: 30 }
});

app.get('/api/sinav', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  res.json({ courses: d.courses, files: d.files.map(sinavPublicFile) });
});
app.post('/api/sinav/courses', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  const c = { id: sinavId(), emoji: '📘', term: '', teacher: '', examDate: '', ...sinavCleanCourse(req.body || {}), createdAt: new Date().toISOString() };
  if (!c.title || !c.title.trim()) return res.status(400).json({ error: 'Ders adı gerekli.' });
  d.courses.push(c); saveStore(); res.json(c);
});
app.put('/api/sinav/courses/:id', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  const c = d.courses.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Ders yok.' });
  Object.assign(c, sinavCleanCourse(req.body || {})); saveStore(); res.json(c);
});
app.delete('/api/sinav/courses/:id', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  d.files.filter(f => f.courseId === req.params.id).forEach(f => { try { fs.unlinkSync(f.filePath); } catch (e) {} });
  d.files = d.files.filter(f => f.courseId !== req.params.id);
  d.courses = d.courses.filter(c => c.id !== req.params.id);
  saveStore(); res.json({ ok: true });
});
app.post('/api/sinav/courses/:id/files', sinavUpload.array('files', 30), (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  const c = d.courses.find(x => x.id === req.params.id);
  if (!c) { (req.files || []).forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} }); return res.status(404).json({ error: 'Ders yok.' }); }
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'Sadece .html ve .pdf yüklenebilir.' });
  const kind = String((req.body && req.body.kind) || '');
  const added = req.files.map(f => {
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    const isPdf = /\.pdf$/i.test(name);
    const meta = {
      id: sinavId(), courseId: c.id, token: sinavToken(),
      title: name.replace(/\.(html?|pdf)$/i, '').replace(/[_-]+/g, ' ').trim(),
      type: isPdf ? 'pdf' : 'html', kind: kind || (isPdf ? 'kaynak' : 'konu'),
      size: f.size, filePath: f.path, addedAt: new Date().toISOString()
    };
    d.files.push(meta); return sinavPublicFile(meta);
  });
  saveStore(); res.json(added);
});
app.put('/api/sinav/files/:id', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  const f = d.files.find(x => x.id === req.params.id);
  if (!f) return res.status(404).json({ error: 'Dosya yok.' });
  const b = req.body || {};
  if (b.title) f.title = String(b.title).slice(0, 200);
  if (b.kind) f.kind = String(b.kind).slice(0, 30);
  if (b.courseId && d.courses.some(c => c.id === b.courseId)) f.courseId = b.courseId;
  saveStore(); res.json(sinavPublicFile(f));
});
app.delete('/api/sinav/files/:id', (req, res) => {
  const d = sinavData(ensureProfile(req.headers['x-profile']));
  const f = d.files.find(x => x.id === req.params.id);
  if (f) { try { fs.unlinkSync(f.filePath); } catch (e) {} d.files = d.files.filter(x => x.id !== f.id); saveStore(); }
  res.json({ ok: true });
});

// Dosyayı açma/paylaşma: rastgele token'lı link (giriş gerektirmez, link bilen açar).
app.get('/sinav-dosya/:token', (req, res) => {
  for (const key of Object.keys(store.profiles)) {
    const f = (store.profiles[key].sinav?.files || []).find(x => x.token === req.params.token);
    if (f) {
      if (!fs.existsSync(f.filePath)) break;
      const safe = encodeURIComponent(f.title + (f.type === 'pdf' ? '.pdf' : '.html'));
      res.setHeader('Content-Type', f.type === 'pdf' ? 'application/pdf' : 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', (req.query.indir ? 'attachment' : 'inline') + "; filename*=UTF-8''" + safe);
      res.setHeader('Cache-Control', 'no-cache');
      return fs.createReadStream(f.filePath).pipe(res);
    }
  }
  res.status(404).send('Dosya bulunamadı.');
});

// ── WIADOMOŚCI: Polonya'nın büyük haber sitelerinden baş haberler ─────────
// RSS beslemeleri sunucuda okunur (tarayıcıdan CORS yüzünden okunamaz), 10 dk önbelleklenir.
const WIAD_SOURCES = [
  { id: 'tvn24',  name: 'TVN24',          url: 'https://tvn24.pl/najnowsze.xml' },
  { id: 'polsat', name: 'Polsat News',    url: 'https://www.polsatnews.pl/rss/polska.xml' },
  { id: 'rmf24',  name: 'RMF24',          url: 'https://www.rmf24.pl/feed' },
  { id: 'wp',     name: 'Wirtualna Polska', url: 'https://wiadomosci.wp.pl/rss.xml' },
  { id: 'onet',   name: 'Onet',           url: 'https://wiadomosci.onet.pl/.feed' },
];
const WIAD_TTL = 10 * 60 * 1000;
let wiadCache = { at: 0, data: null };
const wiadOzetCache = new Map();

function wiadDecode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}
function wiadText(html) { return wiadDecode(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function wiadTag(block, tag) {
  const m = block.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'i'));
  return m ? m[1] : '';
}
function wiadParse(xml, src) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks.slice(0, 80)) {
    const title = wiadText(wiadTag(b, 'title'));
    let link = wiadDecode(wiadTag(b, 'link')).trim();
    if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); if (m) link = wiadDecode(m[1]); }
    if (!title || !/^https?:\/\//i.test(link)) continue;
    const rawDesc = wiadTag(b, 'description') || wiadTag(b, 'summary') || wiadTag(b, 'content');
    const dateStr = wiadText(wiadTag(b, 'pubDate') || wiadTag(b, 'published') || wiadTag(b, 'updated') || wiadTag(b, 'dc:date'));
    const date = dateStr ? new Date(dateStr) : null;
    let img = '';
    const enc = b.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) || b.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/i)
      || b.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i) || wiadDecode(rawDesc).match(/<img[^>]*src="([^"]+)"/i);
    if (enc && /^https?:\/\//i.test(wiadDecode(enc[1]))) img = wiadDecode(enc[1]);
    let desc = wiadText(rawDesc);
    if (desc.length > 260) desc = desc.slice(0, 257).replace(/\s+\S*$/, '') + '…';
    items.push({ id: src.id + ':' + link, source: src.id, title, link, desc, img,
      date: date && !isNaN(date) ? date.toISOString() : null });
  }
  return items;
}
async function wiadFetchOne(src) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(src.url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Polonica; +https://github.com/Minoshii/polonica-web)', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const head = buf.slice(0, 200).toString('latin1');
    const cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || head.match(/encoding="([\w-]+)"/i) || [, 'utf-8'])[1];
    let xml;
    try { xml = new TextDecoder(cs.toLowerCase()).decode(buf); } catch (e) { xml = buf.toString('utf8'); }
    return { ok: true, items: wiadParse(xml, src) };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'zaman aşımı' : e.message, items: [] };
  } finally { clearTimeout(t); }
}
function wiadNorm(t) { return t.toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 48); }

// Haftalık arşiv: beslemeler sadece son 1-2 günü verdiği için sunucu haberleri kendisi biriktirir.
const WIAD_ARCHIVE_FILE = path.join(DATA_DIR, 'wiadomosci-arsiv.json');
const WIAD_KEEP_MS = 14 * 24 * 3600 * 1000;
let wiadArchive = [];
try { if (fs.existsSync(WIAD_ARCHIVE_FILE)) wiadArchive = JSON.parse(fs.readFileSync(WIAD_ARCHIVE_FILE, 'utf8')) || []; } catch (e) { wiadArchive = []; }
function wiadArchiveAdd(items) {
  const byLink = new Set(wiadArchive.map(i => i.link));
  const byTitle = new Set(wiadArchive.map(i => wiadNorm(i.title)));
  const nowIso = new Date().toISOString();
  let added = 0;
  for (const it of items) {
    const k = wiadNorm(it.title);
    if (byLink.has(it.link) || byTitle.has(k)) continue;
    byLink.add(it.link); byTitle.add(k);
    wiadArchive.push({ source: it.source, title: it.title, link: it.link, desc: (it.desc || '').slice(0, 220), date: it.date || nowIso, seenAt: nowIso });
    added++;
  }
  const cutoff = Date.now() - WIAD_KEEP_MS;
  wiadArchive = wiadArchive.filter(i => new Date(i.date || i.seenAt).getTime() >= cutoff);
  if (added) { try { fs.writeFileSync(WIAD_ARCHIVE_FILE, JSON.stringify(wiadArchive)); } catch (e) { console.error('Haber arşivi yazılamadı:', e.message); } }
  return added;
}

async function wiadRefresh() {
  const results = await Promise.all(WIAD_SOURCES.map(wiadFetchOne));
  const seen = new Set(); const items = [];
  results.forEach(r => r.items.forEach(it => { const k = wiadNorm(it.title); if (!seen.has(k)) { seen.add(k); items.push(it); } }));
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const data = {
    fetchedAt: new Date().toISOString(),
    sources: WIAD_SOURCES.map((s, i) => ({ id: s.id, name: s.name, ok: results[i].ok, count: results[i].items.length, error: results[i].error || null })),
    items: items.slice(0, 150)
  };
  wiadCache = { at: Date.now(), data };
  wiadArchiveAdd(items);
  return data;
}
// Arka planda her 30 dakikada bir topla (panel açılmasa da hafta dolsun)
setTimeout(() => wiadRefresh().catch(() => {}), 20 * 1000);
setInterval(() => wiadRefresh().catch(() => {}), 30 * 60 * 1000);

app.get('/api/wiadomosci', async (req, res) => {
  try {
    if (!req.query.yenile && wiadCache.data && Date.now() - wiadCache.at < WIAD_TTL) return res.json(wiadCache.data);
    res.json(await wiadRefresh());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Haftanın öne çıkanları: son 7 günün arşivinden en önemli gelişmeler (3 saat önbellek)
let wiadHaftaCache = { at: 0, data: null };
app.get('/api/wiadomosci/hafta', async (req, res) => {
  try {
    if (!req.query.yenile && wiadHaftaCache.data && Date.now() - wiadHaftaCache.at < 3 * 3600 * 1000) return res.json(wiadHaftaCache.data);
    if (!wiadArchive.length) await wiadRefresh().catch(() => {});
    const from = Date.now() - 7 * 24 * 3600 * 1000;
    const week = wiadArchive.filter(i => new Date(i.date || i.seenAt).getTime() >= from)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!week.length) return res.json({ from: new Date(from).toISOString(), to: new Date().toISOString(), count: 0, days: 0, items: [] });
    const oldest = new Date(week[week.length - 1].date || week[week.length - 1].seenAt);
    const days = Math.max(1, Math.round((Date.now() - oldest) / (24 * 3600 * 1000)));
    const list = week.slice(0, 320);
    const fmt = d => { const x = new Date(d); return String(x.getUTCDate()).padStart(2, '0') + '.' + String(x.getUTCMonth() + 1).padStart(2, '0'); };
    const lines = list.map((it, i) => i + '. [' + fmt(it.date || it.seenAt) + '][' + it.source + '] ' + it.title.slice(0, 160));
    const prompt = [
      'You help a Turkish university student of Polish philology. Every Wednesday the history teacher asks: "What important happened in Poland this past week?"',
      'Below are headlines collected from major Polish news sites over the last ' + days + ' day(s) (format: index. [dd.mm][source] title).',
      'Identify the 8 MOST IMPORTANT developments concerning Poland (politics, government, economy, society, security, Poland\'s foreign relations).',
      'Several headlines may describe the same story — merge them into one development; stories covered by several sources or over several days are usually more important.',
      'Skip crime trivia, celebrities, sport results, weather and lifestyle unless truly nationally significant.',
      '', 'HEADLINES:', lines.join('\n'), '',
      'Return ONLY valid JSON, no markdown:',
      '{"items":[{"refs":[<indices of the headlines about this development>],"gun":"dd.mm of the key day","baslik_tr":"short Turkish title",',
      '"ozet_tr":"2-3 sentence neutral Turkish explanation","neden_onemli":"1 Turkish sentence","derste_pl":"1-2 simple natural Polish sentences (B1) to say in class",',
      '"derste_tr":"Turkish translation","kelimeler":[{"pl":"key word","tr":"Turkish"}]}]}',
      'Order by importance (most important first). 3-4 kelimeler each. Stay strictly factual to the headlines; do not invent details.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 3800);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Haftalık özet üretilemedi.');
    const parsed = JSON.parse(m[0]);
    const items = (parsed.items || []).map(x => ({
      gun: x.gun, baslik_tr: x.baslik_tr, ozet_tr: x.ozet_tr, neden_onemli: x.neden_onemli,
      derste_pl: x.derste_pl, derste_tr: x.derste_tr, kelimeler: x.kelimeler || [],
      kaynaklar: (x.refs || []).filter(n => list[n]).slice(0, 6).map(n => ({ source: list[n].source, title: list[n].title, link: list[n].link }))
    }));
    const data = { from: oldest.toISOString(), to: new Date().toISOString(), count: week.length, days, items };
    wiadHaftaCache = { at: Date.now(), data };
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hocanın "Polonya'da bu hafta ne oldu?" sorusu için Türkçe özet + derste söylenecek Lehçe cümleler
app.post('/api/wiadomosci/ozet', async (req, res) => {
  try {
    const list = (Array.isArray(req.body.items) ? req.body.items : []).slice(0, 40)
      .map((it, i) => (i + 1) + '. [' + String(it.source || '') + '] ' + String(it.title || '').slice(0, 200) + (it.desc ? ' — ' + String(it.desc).slice(0, 220) : ''));
    if (!list.length) return res.status(400).json({ error: 'Haber yok.' });
    const key = list.join('|').slice(0, 2000);
    if (wiadOzetCache.has(key)) return res.json(wiadOzetCache.get(key));
    const prompt = [
      'You help a Turkish university student of Polish philology. In class, the teacher regularly asks: "What important happened in Poland recently?"',
      'Below are the latest headlines from major Polish news sites (Polish). Pick the 5 MOST IMPORTANT stories about Poland itself',
      '(politics, government, economy, society, security, foreign relations of Poland). Skip crime trivia, celebrity, sport results and weather unless truly major.',
      '',
      'HEADLINES:', list.join('\n'), '',
      'Return ONLY valid JSON, no markdown:',
      '{"items":[{"n": <headline number>, "baslik_tr": "short Turkish title", "ozet_tr": "2 sentence neutral Turkish explanation with context",',
      '"neden_onemli": "1 short Turkish sentence: why it matters", "derste_pl": "1-2 simple, natural Polish sentences (B1) the student can say in class about this",',
      '"derste_tr": "Turkish translation of derste_pl", "kelimeler": [{"pl":"key Polish word/phrase from the story","tr":"Turkish meaning"}]}]}',
      'Rules: exactly 5 items unless fewer relevant; kelimeler 3-4 per item; stay strictly factual to the headlines, do not invent details; neutral tone.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 2400);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Özet üretilemedi.');
    const data = JSON.parse(m[0]);
    wiadOzetCache.set(key, data);
    if (wiadOzetCache.size > 30) wiadOzetCache.delete(wiadOzetCache.keys().next().value);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/wiadomosci/cevir', async (req, res) => {
  try {
    const text = String(req.body.text || '').slice(0, 600);
    if (!text) return res.status(400).json({ error: 'Metin yok.' });
    const raw = await claudeAsk('Translate this Polish news headline/lead into natural Turkish. Reply with the Turkish translation only.\n\n' + text, 400);
    res.json({ tr: raw.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DZIENNIK: Lehçe günlük + yapay zekâ kontrolü ──────────────────────────
function dzData(p) { if (!p.dziennik) p.dziennik = { entries: {} }; if (!p.dziennik.entries) p.dziennik.entries = {}; return p.dziennik; }
function dzValidDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')); }

app.get('/api/dziennik', (req, res) => {
  res.json(dzData(ensureProfile(req.headers['x-profile'])));
});
app.put('/api/dziennik/:date', (req, res) => {
  const date = req.params.date;
  if (!dzValidDate(date)) return res.status(400).json({ error: 'Geçersiz tarih.' });
  const d = dzData(ensureProfile(req.headers['x-profile']));
  const e = d.entries[date] || {};
  ['done', 'plan'].forEach(k => { if (typeof req.body[k] === 'string') e[k] = req.body[k].slice(0, 4000); });
  e.updatedAt = new Date().toISOString();
  if (!(e.done || '').trim() && !(e.plan || '').trim() && !e.check) delete d.entries[date]; else d.entries[date] = e;
  saveStore(); res.json({ ok: true, entry: d.entries[date] || null });
});
app.post('/api/dziennik/:date/sprawdz', async (req, res) => {
  try {
    const date = req.params.date;
    if (!dzValidDate(date)) return res.status(400).json({ error: 'Geçersiz tarih.' });
    const d = dzData(ensureProfile(req.headers['x-profile']));
    const e = d.entries[date];
    const done = (e && e.done || '').trim(), plan = (e && e.plan || '').trim();
    if (!done && !plan) return res.status(400).json({ error: 'Önce bir şeyler yaz.' });
    const text = (done ? 'DZIŚ:\n' + done : '') + (done && plan ? '\n\n' : '') + (plan ? 'JUTRO / PLANY:\n' + plan : '');
    const prompt = [
      'You are a warm but precise Polish teacher for a Turkish university student of Polish philology (around B1-B2). He writes a daily diary in Polish to improve',
      'speaking, writing, vocabulary, and especially verbs (aspect, conjugation) and adjectives (agreement). Some words may be in Turkish if he did not know them: give the Polish.',
      '', 'DIARY ENTRY:', text, '',
      'Return ONLY valid JSON, no markdown:',
      '{',
      ' "parcalar": [{"t": "exact original text segment", "hata": false} or {"t": "exact original wrong segment", "hata": true, "dogru": "corrected segment", "tur": "przypadek|aspekt|odmiana|rodzaj|pisownia|szyk|słownictwo|inne", "aciklama": "short Turkish explanation of the rule"}],',
      ' "duzeltilmis": "the whole entry corrected (keep his meaning and the DZIŚ / JUTRO structure)",',
      ' "dogal": "a more natural, slightly richer B2 version of the whole entry",',
      ' "puan": <0-100 integer overall accuracy>, "seviye": "A2|B1|B2|C1",',
      ' "guclu": "one Turkish sentence about what he did well",',
      ' "odak": "one Turkish sentence: the single most important thing to work on",',
      ' "kelimeler": [{"pl": "useful verb or adjective (verbs as aspect pair: niedokonany / dokonany)", "tr": "Turkish", "tur": "czasownik|przymiotnik|rzeczownik|wyrażenie", "ornek": "short Polish example related to his day"}],',
      ' "yarin": [{"pl": "word to use in tomorrow\'s entry", "tr": "Turkish"}]',
      '}',
      'Rules: "parcalar" must cover the ENTIRE original text in order, so that joining every "t" reproduces it exactly (including newlines and the DZIŚ:/JUTRO headers).',
      'Mark only real errors (grammar, spelling incl. Polish diacritics, wrong word); do not mark stylistic choices. Split so that each error is a short segment.',
      '"tur" must be EXACTLY ONE word from this list: przypadek, aspekt, odmiana, rodzaj, pisownia, szyk, przyimek, liczebnik, słownictwo, interpunkcja, inne. Nothing else in "tur".',
      '"aciklama" MUST be written in TURKISH (not Polish), max 25 words, explaining the rule simply. Keep each wrong segment short (max ~6 words); split long sentences into several errors.',
      'kelimeler: 5-6 items, mostly verbs and adjectives that fit his life/topics. yarin: exactly 3 items (at least one verb and one adjective), not already used by him.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 3500);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Kontrol üretilemedi.');
    const check = JSON.parse(m[0]);
    // Model bazen "tur" alanına uzun metin, açıklamaya Lehçe yazabiliyor: normalize et
    const TURLER = ['przypadek', 'aspekt', 'odmiana', 'rodzaj', 'pisownia', 'szyk', 'przyimek', 'liczebnik', 'słownictwo', 'interpunkcja', 'inne'];
    (check.parcalar || []).forEach(pc => {
      if (!pc || !pc.hata) return;
      const raw = String(pc.tur || '').toLowerCase();
      const found = TURLER.filter(t => raw.includes(t.slice(0, 6)));
      if (raw.includes('przecin')) found.push('interpunkcja');
      pc.tur = [...new Set(found)].slice(0, 2).join(' + ') || 'inne';
      if (raw.length > 20 && !pc.aciklama) pc.aciklama = raw;  // tür alanına yazılmış açıklamayı kaybetme
      pc.aciklama = String(pc.aciklama || '').slice(0, 400);
    });
    check.at = new Date().toISOString();
    check.kaynak = text;
    e.check = check;
    saveStore();
    res.json({ ok: true, entry: e });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── FİİL: rekcja (hangi hal / hangi edat) ─────────────────────────────────
// Sonuçlar DATA_DIR/fiil-cache.json'da saklanır: aynı fiil ikinci kez API'ye gitmez.
const FIIL_CACHE_FILE = path.join(DATA_DIR, 'fiil-cache.json');
let fiilCache = {};
try { if (fs.existsSync(FIIL_CACHE_FILE)) fiilCache = JSON.parse(fs.readFileSync(FIIL_CACHE_FILE, 'utf8')) || {}; } catch (e) { fiilCache = {}; }
const FIIL_PRZYPADKI = ['mianownik', 'dopełniacz', 'celownik', 'biernik', 'narzędnik', 'miejscownik', 'wołacz'];

app.post('/api/fiil', async (req, res) => {
  try {
    const input = String(req.body.verb || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
    if (!input) return res.status(400).json({ error: 'Fiil yaz.' });
    if (!req.body.yenile && fiilCache[input]) return res.json({ ...fiilCache[input], cached: true });
    const prompt = [
      'You are an expert in Polish verb government (rekcja czasownika) teaching a Turkish university student of Polish philology (B1-B2).',
      'The student typed: "' + input + '" (it may be misspelled, missing Polish diacritics, or a conjugated form). Identify the intended Polish verb (infinitive, keep "się" if it is a reflexive verb).',
      '',
      'Return ONLY valid JSON, no markdown:',
      '{',
      ' "fiil": "infinitive",',
      ' "duzeltme": true if you changed/corrected the input, else false,',
      ' "aspekt": "niedokonany" | "dokonany" | "dwuaspektowy",',
      ' "cift": {"fiil": "aspect partner infinitive or empty string", "aspekt": "niedokonany|dokonany"},',
      ' "tr": "main Turkish meaning(s), short",',
      ' "kaliplar": [',
      '   {"kalip": "the government pattern written with kogo/co/komu/czemu/kim/czym/kimś/czymś etc., e.g. przyglądać się komuś / czemuś",',
      '    "edat": "preposition if the pattern uses one (e.g. na, do, o, z, w, od, za, przed, nad, po, przez, dla), else null",',
      '    "przypadek": "one of: mianownik, dopełniacz, celownik, biernik, narzędnik, miejscownik, bezokolicznik, zdanie (że…)",',
      '    "soru": "case question words, e.g. komu? czemu?",',
      '    "tr": "Turkish meaning of THIS pattern (with the Turkish case ending, e.g. birine/bir şeye)",',
      '    "ornek_pl": "natural Polish example sentence", "ornek_tr": "Turkish translation",',
      '    "siklik": "çok yaygın" | "yaygın" | "seyrek"}',
      ' ],',
      ' "olumsuz": "Turkish note on what happens to the object case under negation (e.g. biernik → dopełniacz: nie widzę tego), or empty string",',
      ' "dikkat": "one Turkish sentence: the typical mistake Turkish speakers make with this verb, or empty string",',
      ' "benzer": [{"kalip": "related/synonym verb with its government", "tr": "Turkish"}]',
      '}',
      'Rules: list ALL standard government patterns of this verb, first the ones WITHOUT a preposition, then the ones WITH prepositions (each preposition separately).',
      'Be strictly accurate about cases (this is used for exam study). 2-6 patterns. benzer: 2-3 items. All explanations in Turkish.'
    ].join('\n');
    const msg = await client.messages.create({ model: process.env.FIIL_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 1800, messages: [{ role: 'user', content: prompt }] });
    const raw = msg.content[0].text;
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Fiil bilgisi üretilemedi.');
    const data = JSON.parse(m[0]);
    data.kaliplar = (data.kaliplar || []).map(k => {
      const p = String(k.przypadek || '').toLowerCase();
      k.przypadek = FIIL_PRZYPADKI.find(c => p.includes(c.slice(0, 5))) || (p.includes('bezok') ? 'bezokolicznik' : p.includes('zdan') || p.includes('że') ? 'zdanie' : p || 'inne');
      if (k.edat === 'null' || k.edat === '') k.edat = null;
      return k;
    });
    data.girdi = input;
    data.at = new Date().toISOString();
    fiilCache[input] = data;
    if (data.fiil && data.fiil.toLowerCase() !== input) fiilCache[data.fiil.toLowerCase()] = data;
    try { fs.writeFileSync(FIIL_CACHE_FILE, JSON.stringify(fiilCache)); } catch (e) {}
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
    const { category, lang } = req.body;
    const outputLang = lang === 'zh' ? 'Traditional Chinese (繁體中文)' : lang === 'en' ? 'English' : 'Turkish';
    const isNonTurkish = lang === 'zh' || lang === 'en';
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
    const prompt = [
      'You are an expert on Polish culture and history. Give ONE fascinating, detailed cultural fact about Poland.',
      'Focus on: ' + focus,
      'The user is learning Polish. Write ALL text fields (fact, why_matters, etc.) in ' + outputLang + '.',
      '',
      'Return ONLY valid JSON:',
      '{',
      '  "category": "category in Turkish (e.g. Edebiyat, Tarih, Müzik, Sinema, Sanat, Halk Kültürü, Bilim)",',
      '  "title": "name of person/work/event in Polish/original",',
      '  "title_tr": "Turkish translation or explanation of the title",',
      '  "period": "time period (e.g. 1884, 19. yüzyıl, Orta Çağ)",',
      '  "fact": "3-5 sentence fascinating fact in ' + outputLang + '. Be specific, include context. Write as if telling a friend something amazing.",',
      '  "why_matters": "1-2 sentences in ' + outputLang + ': why every Polish learner should know this",',
      '  "polish_connection": "a Polish word or phrase related to this fact with Turkish meaning",',
      '  "emoji": "2-3 relevant emojis"',
      '}',
      '',
      'Be surprising and specific. Avoid generic facts. Each response must be DIFFERENT and UNIQUE.',
      'Return ONLY valid JSON, no markdown.'
    ].join('\n');
    const raw = await claudeAsk(prompt, 800);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse hatasi.');
    res.json(JSON.parse(match[0]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// ── KELIME ÇEVİRİ ENDPOİNT ──────────────────────────
app.post('/api/translate-words', async (req, res) => {
  try {
    const { meanings, lang } = req.body;
    if (!meanings || !meanings.length) return res.json({ translations: [] });
    const langName = lang === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English';
    
    // Her kelimeyi tek tek çevir - basit format
    const translations = [];
    for (const meaning of meanings) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        system: 'Translate Turkish to ' + langName + '. Reply with translation only. No other text.',
        messages: [{ role: 'user', content: meaning }]
      });
      const t = response.content[0].text.trim();
      translations.push(t);
    }
    res.json({ translations });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT,'0.0.0.0',()=>{
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     POLONICA SUNUCUSU BAŞLADI        ║');
  console.log('║  http://localhost:'+PORT+'                 ║');
  console.log('╚══════════════════════════════════════╝\n');
  if(!process.env.ANTHROPIC_API_KEY) console.warn('⚠  ANTHROPIC_API_KEY eksik!');
});