const API='PUT_YOUR_GAS_URL_HERE';
async function loadSummary(){
 const out=document.getElementById('out');
 try{
  const r=await fetch(API+'?action=getSummary');
  out.textContent=await r.text();
 }catch(e){out.textContent='กรุณาใส่ URL GAS ใน js/app.js';}
}