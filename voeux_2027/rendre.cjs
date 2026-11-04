// Usage : node rendre.cjs  -> génère les PDF (avec fond perdu 3 mm) ; les PNG se font avec pdftoppm (voir LISEZ-MOI.md)
const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
for(const n of ['carte_A_nuit','carte_B_equipe','carte_C_bon_de_livraison','carte_D_plan_technique']){const pg=await b.newPage();await pg.goto('file://'+process.cwd()+'/'+n+'.html');await pg.waitForTimeout(1200);
await pg.pdf({path:n+'_fond_perdu.pdf',width:'154mm',height:'111mm',printBackground:true,preferCSSPageSize:true});await pg.close()}
await b.close()})();
