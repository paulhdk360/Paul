const {chromium}=require('/opt/node-tools/node_modules/playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=process.cwd();const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0].split('#')[0]));fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html'});s.end(d)})}).listen(0,async()=>{
 const port=srv.address().port;const views=process.argv.slice(2);const out=process.env.OUT||'out';fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const v of views){const p=await b.newPage({viewport:{width:+(process.env.VW||1920),height:+(process.env.VH||1080)}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto(`http://localhost:${port}/stand3d.html#${v}`);await p.waitForFunction(()=>document.title==='ready',null,{timeout:90000});
  await p.locator('canvas').screenshot({path:`${out}/${v.replace(/[&=]/g,'_')}.png`});console.log('ok',v);await p.close()}
 await b.close();srv.close()});
