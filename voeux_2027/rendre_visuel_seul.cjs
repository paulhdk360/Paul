// Visuel seul (sans titre, sans texte, sans logo, sans ombre de logo) : PDF avec fond perdu 3 mm
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const pg=await b.newPage();await pg.goto('file://'+process.cwd()+'/carte_F_jour_FR.html');await pg.waitForTimeout(1200);
await pg.addStyleTag({content:'.eyebrow,h1,h2,.sign,.logo,.base{display:none!important}'});
await pg.pdf({path:'visuel_seul_fond_perdu.pdf',width:'154mm',height:'111mm',printBackground:true,preferCSSPageSize:true});await b.close()})();
