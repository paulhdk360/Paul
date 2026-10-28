const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.goto('file:///home/user/Paul/strategie_2027/Strategie_marketing_communication_2027.html');await pg.waitForTimeout(1500);
await pg.pdf({path:'/home/user/Paul/strategie_2027/Strategie_marketing_communication_2027.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});await b.close()})();
