const API='https://script.google.com/macros/s/AKfycbwBSLceXacaX3xb-mrvbj_Yfv3ERZk9tgRMxD900mSiXtDjpp0AF3NItpEu6c6StWGfng/exec';
async function loadSummary(){
 const out=document.getElementById('out');
 try{
  const r=await fetch(API+'?action=getSummary');
  out.textContent=await r.text();
 }catch(e){out.textContent='กรุณาใส่ URL GAS ใน js/app.js';}
}