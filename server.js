const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@libsql/client');
const remote = !!process.env.TURSO_DATABASE_URL;
const db = createClient(remote ? {url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN} : {url:'file:'+ (process.env.DB_PATH || path.join(__dirname,'gather.db'))});
const id=()=>crypto.randomBytes(9).toString('base64url');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const trim=(v,n=120)=>String(v??'').trim().slice(0,n);
const run=(sql,args=[])=>db.execute({sql,args});
async function init(){for(const sql of [
`CREATE TABLE IF NOT EXISTS outings(id TEXT PRIMARY KEY, admin_hash TEXT NOT NULL, title TEXT NOT NULL, date TEXT, time TEXT, city TEXT, budget TEXT, description TEXT, voting_open INTEGER NOT NULL DEFAULT 1, results_visible INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS ideas(id TEXT PRIMARY KEY, outing_id TEXT NOT NULL, name TEXT NOT NULL, note TEXT, created_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS guests(outing_id TEXT NOT NULL, name TEXT NOT NULL, rsvp TEXT NOT NULL DEFAULT 'going', PRIMARY KEY(outing_id,name))`,
`CREATE TABLE IF NOT EXISTS votes(outing_id TEXT NOT NULL, voter_hash TEXT NOT NULL, idea_id TEXT NOT NULL, PRIMARY KEY(outing_id,voter_hash))`
])await run(sql);
try{await run("ALTER TABLE guests ADD COLUMN rsvp TEXT NOT NULL DEFAULT 'going'")}catch(e){if(!/duplicate column|already exists/i.test(String(e)))throw e;}
console.log('Gather database connected ('+(remote?'hosted':'local')+')');}
async function first(sql,args=[]){return (await run(sql,args)).rows[0]||null}
async function get(outingId){
const o=await first('SELECT id,title,date,time,city,budget,description,voting_open AS votingOpen,results_visible AS resultsVisible FROM outings WHERE id=?',[outingId]);if(!o)return null;
o.votingOpen=!!o.votingOpen;o.resultsVisible=!!o.resultsVisible;
o.options=(await run('SELECT id,name,note FROM ideas WHERE outing_id=? ORDER BY created_at,id',[outingId])).rows;
o.guests=(await run('SELECT name,rsvp FROM guests WHERE outing_id=? ORDER BY name',[outingId])).rows;
o.voteCount=Number((await first('SELECT count(*) n FROM votes WHERE outing_id=?',[outingId])).n);
if(o.resultsVisible){const rows=(await run('SELECT idea_id,count(*) n FROM votes WHERE outing_id=? GROUP BY idea_id',[outingId])).rows;o.tallies=Object.fromEntries(rows.map(r=>[r.idea_id,Number(r.n)]));}return o;}
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const fail=(res,status,message)=>send(res,status,{error:message});
const adminOK=(o,b)=>o&&typeof b.adminKey==='string'&&b.adminKey.length>0&&hash(b.adminKey)===o.admin_hash;
const readBody=async req=>{let s='';for await(const chunk of req){s+=chunk;if(s.length>16384)throw Error('Request is too large')}try{return JSON.parse(s||'{}')}catch{throw Error('Invalid JSON')}};
async function api(req,res,u){
let b={};if(['POST','PATCH'].includes(req.method))b=await readBody(req);
if(req.method==='POST'&&u.pathname==='/api/outings'){
 if(!trim(b.title))return fail(res,400,'An outing name is required');
 const outingId=id(),adminKey=crypto.randomBytes(24).toString('base64url');
 await run('INSERT INTO outings (id,admin_hash,title,date,time,city,budget,description,created_at) VALUES (?,?,?,?,?,?,?,?,?)',[outingId,hash(adminKey),trim(b.title,80),trim(b.date,10),trim(b.time,5),trim(b.city),trim(b.budget,80),trim(b.description,700),Date.now()]);
 return send(res,201,{outing:await get(outingId),adminKey});
}
const m=u.pathname.match(/^\/api\/outings\/([a-zA-Z0-9_-]+)(?:\/(ideas|guests|vote|settings|my-vote|edit))?$/);if(!m)return fail(res,404,'Not found');
const outingId=m[1],endpoint=m[2],o=await first('SELECT * FROM outings WHERE id=?',[outingId]);if(!o)return fail(res,404,'Outing not found');
if(req.method==='GET'&&!endpoint)return send(res,200,{outing:await get(outingId)});
if(req.method==='GET'&&endpoint==='my-vote'){
 const voter=trim(u.searchParams.get('voter'),128);if(!voter)return send(res,200,{ideaId:null});
 const vote=await first('SELECT idea_id FROM votes WHERE outing_id=? AND voter_hash=?',[outingId,hash(outingId+':'+voter)]);return send(res,200,{ideaId:vote?.idea_id||null});}
if(req.method==='POST'&&endpoint==='ideas'){
 if(!trim(b.name))return fail(res,400,'Please enter a place');
 if(Number((await first('SELECT count(*) n FROM ideas WHERE outing_id=?',[outingId])).n)>=40)return fail(res,400,'Maximum 40 suggestions');
 await run('INSERT INTO ideas(id,outing_id,name,note,created_at) VALUES(?,?,?,?,?)',[id(),outingId,trim(b.name,90),trim(b.note,200),Date.now()]);return send(res,200,{outing:await get(outingId)});}
if(req.method==='POST'&&endpoint==='guests'){
 const name=trim(b.name,50),rsvp=trim(b.rsvp,10).toLowerCase();if(!name)return fail(res,400,'Enter a name');if(!['going','maybe','no'].includes(rsvp))return fail(res,400,'Choose an RSVP status');
 if(Number((await first('SELECT count(*) n FROM guests WHERE outing_id=?',[outingId])).n)>=100 && !(await first('SELECT name FROM guests WHERE outing_id=? AND name=?',[outingId,name])))return fail(res,400,'Guest list is full');
 await run('INSERT INTO guests(outing_id,name,rsvp) VALUES(?,?,?) ON CONFLICT(outing_id,name) DO UPDATE SET rsvp=excluded.rsvp',[outingId,name,rsvp]);return send(res,200,{outing:await get(outingId)});}
if(req.method==='POST'&&endpoint==='vote'){
 if(!o.voting_open)return fail(res,400,'Voting is closed');const voter=trim(b.voter,128),ideaId=trim(b.ideaId,128);
 if(voter.length<24)return fail(res,400,'Missing device voter token');if(!(await first('SELECT id FROM ideas WHERE outing_id=? AND id=?',[outingId,ideaId])))return fail(res,400,'Choose a valid place');
 await run('INSERT INTO votes(outing_id,voter_hash,idea_id) VALUES(?,?,?) ON CONFLICT(outing_id,voter_hash) DO UPDATE SET idea_id=excluded.idea_id',[outingId,hash(outingId+':'+voter),ideaId]);return send(res,200,{outing:await get(outingId)});}
if(req.method==='POST'&&endpoint==='settings'){
 if(!adminOK(o,b))return fail(res,403,'Only the organizer can change voting settings');if(typeof b.votingOpen==='boolean')await run('UPDATE outings SET voting_open=? WHERE id=?',[Number(b.votingOpen),outingId]);
 if(typeof b.resultsVisible==='boolean')await run('UPDATE outings SET results_visible=? WHERE id=?',[Number(b.resultsVisible),outingId]);return send(res,200,{outing:await get(outingId)});}
if(req.method==='POST'&&endpoint==='edit'){
 if(!adminOK(o,b))return fail(res,403,'Only the organizer can edit the outing');if(!trim(b.title))return fail(res,400,'An outing name is required');
 await run('UPDATE outings SET title=?,date=?,time=?,city=?,budget=?,description=? WHERE id=?',[trim(b.title,80),trim(b.date,10),trim(b.time,5),trim(b.city),trim(b.budget,80),trim(b.description,700),outingId]);return send(res,200,{outing:await get(outingId)});}
fail(res,405,'Unsupported operation');}
const port=Number(process.env.PORT||3000);
init().then(()=>http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(u.pathname.startsWith('/api/'))return await api(req,res,u);if(req.method!=='GET')return fail(res,405,'Unsupported operation');if(u.pathname==='/'||u.pathname==='/index.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);}fail(res,404,'Not found')}catch(e){console.error(e);fail(res,e.message==='Request is too large'?413:500,'Something went wrong')}}).listen(port,'0.0.0.0',()=>console.log(`Gather running on http://localhost:${port}`))).catch(e=>{console.error('Database startup failed:',e);process.exit(1)});
