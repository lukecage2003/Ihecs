const { chromium } = require('playwright');
const U='http://localhost:8765/';
const R=[]; const ok=(n,c,d='')=>R.push(`${c?'PASS':'FAIL'} | ${n}${d?' | '+d:''}`);
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1280,height:900}}); const p=await ctx.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('revisions-ihecs-v1')||'{}'));
 const routes=['accueil','matieres','m-socio','m-anglais','c-socio-c1-resume','c-socio-c1-essentiel','c-socio-c1-fiches','c-socio-c1-quiz','blanc-droit','revision','examens','planning','parametres','inexistant'];
 for(const r of routes){ await p.goto(U+'#'+r); await p.waitForTimeout(250); const h=await p.$eval('#view',e=>e.innerText.length); ok('render #'+r, h>50, h+' chars'); }
 // mark read persists
 await p.goto(U+'#c-socio-c1-resume'); await p.click('#mark-read'); await p.reload(); await p.waitForTimeout(200);
 ok('mark chapter read persists after reload', !!(await S()).lu['socio|c1']);
 // flashcard rating
 await p.goto(U+'#c-eco-c1-fiches'); await p.waitForTimeout(200); await p.keyboard.press('Space'); await p.waitForTimeout(100); await p.keyboard.press('4');
 let st=await S(); const k=Object.keys(st.cartes)[0]; ok('flashcard rating stored', k && st.cartes[k].box===2, JSON.stringify(st.cartes[k]));
 const due=st.cartes[k].due; const exp=new Date(); exp.setDate(exp.getDate()+2); const pad=n=>String(n).padStart(2,'0');
 ok('Facile from box0 schedules +2 days', due===`${exp.getFullYear()}-${pad(exp.getMonth()+1)}-${pad(exp.getDate())}`, due);
 // rating without flip ignored
 await p.goto(U+'#c-eco-c1-fiches'); await p.waitForTimeout(200); const before=JSON.stringify((await S()).cartes); await p.keyboard.press('3'); ok('rating before flip ignored', before===JSON.stringify((await S()).cartes));
 // quiz full run
 await p.goto(U+'#c-semio-c1-quiz'); await p.waitForTimeout(200);
 for(let i=0;i<5;i++){ await p.keyboard.press('a'); await p.waitForTimeout(80); await p.click('#q-next'); await p.waitForTimeout(80);}
 st=await S(); ok('quiz result stored', st.quiz['semio|c1'] && st.quiz['semio|c1'].tries===1, JSON.stringify(st.quiz['semio|c1']));
 // planning checkbox
 await p.goto(U+'#planning'); await p.waitForTimeout(200); await p.click('[data-task]'); ok('planning task check persists', Object.values((await S()).plan).some(Boolean));
 // export/import roundtrip via code
 await p.goto(U+'#parametres'); const snap=await S();
 const code=await p.evaluate(()=>btoa(unescape(encodeURIComponent(localStorage.getItem('revisions-ihecs-v1')))));
 await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForTimeout(200);
 await p.fill('#imp-text',code); await p.click('#imp-go'); await p.waitForTimeout(200);
 ok('export/import roundtrip restores state', JSON.stringify((await S()).quiz)===JSON.stringify(snap.quiz));
 // invalid import rejected
 await p.fill('#imp-text','nimportequoi'); await p.click('#imp-go'); await p.waitForTimeout(200); ok('invalid import rejected, state kept', !!(await S()).quiz['semio|c1']);
 // reset needs confirm
 await p.click('#reset'); ok('reset asks in-page confirmation', !!(await p.$('#reset-yes')));
 await p.click('#reset-no');
 // search
 await p.keyboard.press('Control+k'); await p.keyboard.type('handyside'); await p.waitForTimeout(150); const n=await p.$$eval('.spot-item',e=>e.length); ok('search finds "handyside"', n>0, n+' results'); await p.keyboard.press('Escape');
 // storage blocked
 const p2=await (await b.newContext()).newPage(); await p2.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})}); const e2=[]; p2.on('pageerror',e=>e2.push(e.message)); await p2.goto(U); await p2.waitForTimeout(300); ok('works with storage blocked', e2.length===0 && (await p2.$eval('#view',e=>e.innerText.length))>50, e2.join(';'));
 // mobile overflow
 const m=await (await b.newContext({viewport:{width:375,height:800}})).newPage(); let ov=[]; for(const r of routes.slice(0,13)){await m.goto(U+'#'+r); await m.waitForTimeout(150); if(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) ov.push(r);} ok('no horizontal overflow at 375px', !ov.length, ov.join(','));
 ok('no uncaught JS errors', errs.length===0, errs.join(';'));
 console.log(R.join('\n')); await b.close();
})();
