const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage({viewport:{width:1300,height:2100}});
await p.goto('file://'+process.cwd()+'/fx.html');await p.waitForTimeout(800);
await (await p.$('#wall')).screenshot({path:'tex/fx_wall.png'});await (await p.$('#front')).screenshot({path:'tex/fx_front.png'});await b.close()})();
