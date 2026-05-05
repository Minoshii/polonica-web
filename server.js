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
  limits: { fileSize: 50*1024*1024 }
});

async function claudeAsk(prompt, maxTokens=1024) {
  const msg = await client.messages.create({ model:'claude-haiku-4-5-20251001', max_tokens:maxTokens, messages:[{role:'user',content:prompt}] });
  return msg.content[0].text;
}

app.use(express.json({ limit:'50mb' }));
app.use(express.static(path.join(__dirname,'public')));

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
      const modeNote=mode==='lyrics'?'Polish song lyrics / street speech.':'Polish academic/educational material.';
      const prompt=['You are an expert Polish linguist. Analyze EVERY word. Output exactly '+chunk.length+' JSON objects in order. NEVER skip.',
        modeNote,'RULES:',
        '1."original":word as given  2."pl":LEMMA(infinitive/nominative)  3."inflection_note":grammar tag else ""',
        '4."tr":Turkish 2-6w verbs -mak/-mek  5."en":English 1-4w  6."category":"verb"|"noun"|"adj"|"other"',
        '7."type":czasownik/rzeczownik/przymiotnik etc.',
        '8."example_pl":natural Polish sentence 8-14w using LEMMA  9."example_tr":Turkish  10."example_en":English',
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
    const {word}=req.body;
    const raw=await claudeAsk('Polish-Turkish-English dictionary. Look up: "'+word+'"\nReturn JSON: {"pl":"","original":"","inflection_note":"","tr":"","en":"","category":"","type":"","example_pl":"","example_tr":"","example_en":""}',512);
    const match=raw.match(/\{[\s\S]*\}/);
    if(!match) throw new Error('Parse hatasi.');
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

app.listen(PORT,'0.0.0.0',()=>{
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     POLONICA SUNUCUSU BAŞLADI        ║');
  console.log('║  http://localhost:'+PORT+'                 ║');
  console.log('╚══════════════════════════════════════╝\n');
  if(!process.env.ANTHROPIC_API_KEY) console.warn('⚠  ANTHROPIC_API_KEY eksik!');
});