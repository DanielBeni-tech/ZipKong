// ZipKong - logique applicative (100% locale, sans serveur)
const $ = (id) => document.getElementById(id);
const dropzone=$('dropzone'),fileInput=$('fileInput'),browseBtn=$('browseBtn');
const filePreview=$('filePreview'),fpMedia=$('fpMedia'),fpName=$('fpName'),fpType=$('fpType'),fpSize=$('fpSize'),fpExt=$('fpExt');
const compressBtn=$('compressBtn'),changeBtn=$('changeBtn'),removeBtn=$('removeBtn');
const resultBox=$('resultBox'),resBefore=$('resBefore'),resAfter=$('resAfter'),resRatio=$('resRatio'),resBarFill=$('resBarFill'),downloadBtn=$('downloadBtn');
const compressModal=$('compressModal'),pressBar=$('pressBar'),pressPct=$('pressPct'),pressStep=$('pressStep'),pressFileName=$('pressFileName'),pressFile=$('pressFile');
const payModal=$('payModal'),payClose=$('payClose'),payFileName=$('payFileName');
const methodChoice=$('methodChoice'),payForm=$('payForm'),payProcessing=$('payProcessing'),paySuccess=$('paySuccess');
const payMomo=$('payMomo'),payOm=$('payOm'),chosenMethod=$('chosenMethod'),phoneInput=$('phoneInput'),confirmPay=$('confirmPay'),backMethods=$('backMethods'),phoneEcho=$('phoneEcho');
const toast=$('toast');
const s1=$('s1'),s2=$('s2'),s3=$('s3');
let currentFile=null,compressedBlob=null,compressedName='',payMethod='',paid=false;
function showToast(m){toast.textContent=m;toast.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.add('hidden'),3200);}
function fmt(n){if(n===0)return'0 o';const u=['o','Ko','Mo','Go'];let i=0;while(n>=1024&&i<3){n/=1024;i++;}return(n>=100?n.toFixed(0):n.toFixed(1))+' '+u[i];}
function setSteps(a,b,c){s1.classList.toggle('on',a);s2.classList.toggle('on',b);s3.classList.toggle('on',c);}
function iconFor(f){const t=f.type||'';if(t.startsWith('image/'))return'🖼️';if(t.startsWith('video/'))return'🎬';if(t.startsWith('audio/'))return'🎵';if(t.includes('pdf'))return'📕';if(t.includes('word')||f.name.endsWith('.docx'))return'📘';if(t.includes('sheet')||f.name.endsWith('.xlsx'))return'📗';if(t.includes('zip')||f.name.endsWith('.zip'))return'📦';if(t.startsWith('text/'))return'📝';return'📄';}
function showPreview(f){
  currentFile=f;paid=false;compressedBlob=null;
  fpName.textContent=f.name;
  const ext=(f.name.split('.').pop()||'').toUpperCase();
  fpExt.textContent=ext||'FICHIER';fpType.textContent=(f.type||'Fichier')+' • '+ext;
  fpSize.textContent=fmt(f.size);
  fpMedia.innerHTML='';
  const url=URL.createObjectURL(f);
  if(f.type.startsWith('image/')){const im=document.createElement('img');im.src=url;fpMedia.appendChild(im);}
  else if(f.type.startsWith('video/')){const v=document.createElement('video');v.src=url;v.controls=true;fpMedia.appendChild(v);}
  else if(f.type.startsWith('audio/')){fpMedia.innerHTML='🎵';const a=document.createElement('audio');a.src=url;a.controls=true;a.style.width='100%';fpMedia.appendChild(a);}
  else{fpMedia.innerHTML=iconFor(f);}
  pressFile.querySelector('span').textContent=iconFor(f);
  filePreview.classList.remove('hidden');resultBox.classList.add('hidden');
  dropzone.style.display='none';setSteps(true,false,false);
  filePreview.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function resetAll(){currentFile=null;compressedBlob=null;paid=false;fileInput.value='';filePreview.classList.add('hidden');resultBox.classList.add('hidden');dropzone.style.display='';setSteps(true,false,false);downloadBtn.innerHTML='⬇ Télécharger le fichier compressé';}
browseBtn.onclick=e=>{e.stopPropagation();fileInput.click();};
dropzone.onclick=()=>fileInput.click();
fileInput.onchange=e=>{if(e.target.files[0]){if(e.target.files[0].size>500*1024*1024){showToast('Fichier trop lourd (max 500 Mo).');return;}showPreview(e.target.files[0]);}};
['dragover','dragenter'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove('drag');}));
dropzone.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f){if(f.size>500*1024*1024){showToast('Fichier trop lourd (max 500 Mo).');return;}showPreview(f);}});
changeBtn.onclick=()=>fileInput.click();
removeBtn.onclick=resetAll;
async function compressImage(f){
  const bmp=await createImageBitmap(f);
  const max=1920;let w=bmp.width,h=bmp.height;
  const r=Math.min(1,max/Math.max(w,h));w=Math.round(w*r);h=Math.round(h*r);
  const c=document.createElement('canvas');c.width=w;c.height=h;
  c.getContext('2d').drawImage(bmp,0,0,w,h);
  const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',0.72));
  const base=f.name.replace(/\.[^.]+$/,'');
  return {blob:blob||f,name:base+'-compresse.jpg'};
}
async function gzipBlob(f){
  if(!('CompressionStream' in window))return null;
  const cs=new CompressionStream('gzip');
  const stream=f.stream().pipeThrough(cs);
  const buf=await new Response(stream).arrayBuffer();
  return {blob:new Blob([buf],{type:'application/gzip'}),name:f.name+'-compresse.gz'};
}
async function realCompress(f){
  // Images : vraie recompression JPEG via canvas (redimension + qualite 0.72)
  if(f.type.startsWith('image/')){try{
    const r=await compressImage(f);
    if(r.blob.size<f.size)return r;
    return {blob:f,name:f.name};
  }catch(e){}}
  // Autres fichiers : vraie compression gzip locale (sans perte, sans corruption)
  try{
    const g=await gzipBlob(f);
    if(g&&g.blob.size<f.size)return g;
  }catch(e){}
  // Si deja optimal (ex : mp4, mp3, zip), on garde l'original intact
  return {blob:f,name:f.name};
}
function startCompression(){
  if(!currentFile)return;
  compressModal.classList.remove('hidden');setSteps(true,true,false);
  pressFileName.textContent=currentFile.name;
  pressBar.style.width='0%';pressPct.textContent='0%';
  const labels=['Analyse du fichier…','Extraction des données…','Écrasement par le presseur…','Optimisation…','Finalisation…'];
  const DUREE=10000; // ~10 secondes d'animation
  const TICK=100;
  const t0=Date.now();
  let resultat=null;
  realCompress(currentFile).then(r=>{resultat=r;});
  pressStep.textContent=labels[0];
  const timer=setInterval(()=>{
    const ecoule=Date.now()-t0;
    const p=Math.min(97,Math.floor(ecoule/DUREE*100));
    pressBar.style.width=p+'%';pressPct.textContent=p+'%';
    pressStep.textContent=labels[Math.min(labels.length-1,Math.floor(p/22))];
    if(ecoule<DUREE)return;
    clearInterval(timer);
    const attendre=setInterval(()=>{
      if(!resultat)return;
      clearInterval(attendre);
      compressedBlob=resultat.blob;compressedName=resultat.name;
      pressBar.style.width='100%';pressPct.textContent='100%';pressStep.textContent='Terminé ✓';
      setTimeout(()=>{
        compressModal.classList.add('hidden');showResult(currentFile.size,resultat.blob.size);
        showToast('Compression terminée ✓');
      },650);
    },100);
  },TICK);
}
// PARCOURS : clic Compresser -> animation presseur -> resultat (nouvelle taille + bouton Telecharger) -> clic Telecharger -> pop-up paiement -> succes -> telechargement auto
compressBtn.onclick=()=>{
  if(!currentFile)return;
  startCompression();
};
function showResult(before,after){
  resultBox.classList.remove('hidden');setSteps(true,true,true);
  resBefore.textContent=fmt(before);resAfter.textContent=fmt(after);
  const ratio=Math.max(0,Math.round((1-after/before)*100));
  resRatio.textContent='-'+ratio+'%';
  resBarFill.style.width='0%';
  downloadBtn.innerHTML='🔒 Télécharger le fichier compressé';
  setTimeout(()=>{resBarFill.style.width=ratio+'%';},80);
  resultBox.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function openPay(){
  if(!compressedBlob){showToast('Compressez un fichier dabord.');return;}
  payFileName.textContent=compressedName+' • '+fmt(compressedBlob.size);
  methodChoice.classList.remove('hidden');payForm.classList.add('hidden');
  payProcessing.classList.add('hidden');paySuccess.classList.add('hidden');
  payModal.classList.remove('hidden');
}
// Clic Telecharger -> ouvre la pop-up paiement (pas avant). Apres paiement -> telechargement auto.
downloadBtn.onclick=()=>{
  if(!compressedBlob){showToast('Compressez un fichier dabord.');return;}
  if(paid){doDownload();return;}
  openPay();
};
payClose.onclick=()=>payModal.classList.add('hidden');
payModal.addEventListener('click',e=>{if(e.target===payModal)payModal.classList.add('hidden');});
function chooseMethod(m){
  payMethod=m;methodChoice.classList.add('hidden');payForm.classList.remove('hidden');
  chosenMethod.textContent=m==='momo'?'🟡 Paiement via MTN MoMo':'🟠 Paiement via Orange Money';
  phoneInput.value='';phoneInput.focus();
}
payMomo.onclick=()=>chooseMethod('momo');
payOm.onclick=()=>chooseMethod('om');
backMethods.onclick=()=>{payForm.classList.add('hidden');methodChoice.classList.remove('hidden');};
confirmPay.onclick=()=>{
  const num=phoneInput.value.replace(/[\s.-]/g,'');
  if(num.length<8){showToast('Entrez un numéro valide.');phoneInput.focus();return;}
  phoneEcho.textContent=num;
  payForm.classList.add('hidden');payProcessing.classList.remove('hidden');
  setTimeout(()=>{
    payProcessing.classList.add('hidden');paySuccess.classList.remove('hidden');
    paid=true;
    downloadBtn.innerHTML='⬇ Télécharger le fichier compressé';
    setTimeout(doDownload,900);
  },3600);
};
function doDownload(){
  if(!compressedBlob||!paid)return;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(compressedBlob);a.download=compressedName;
  document.body.appendChild(a);a.click();a.remove();
  showToast('Téléchargement démarré ✓ Merci !');
}
// Apres paiement : ferme la pop-up et telecharge directement
document.getElementById('finalDownload').onclick=()=>{
  payModal.classList.add('hidden');
  doDownload();
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){payModal.classList.add('hidden');}});


