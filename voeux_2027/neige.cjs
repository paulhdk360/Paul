const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
for(const n of ['recto','verso']){const pg=await b.newPage({viewport:{width:583,height:420},deviceScaleFactor:3.125});await pg.goto('file://'+process.cwd()+'/neige_'+n+'.html');await pg.waitForTimeout(500);
await pg.screenshot({path:'photos/neige_'+n+'.png',omitBackground:true,clip:{x:0,y:0,width:582.05,height:419.5}});await pg.close()}await b.close()})();