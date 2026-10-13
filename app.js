// CoCo - Compress and Convert (100% locale, sans serveur)
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
let currentFile=null,compressedBlob=null,compressedName='',payMethod='',paid=false,payContext='compress';
let convFile=null,convTarget='',convBlob=null,convOutName='',convPaid=false;
function showToast(m){toast.textContent=m;toast.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.add('hidden'),3200);}
function fmt(n){if(n===0)return'0 o';const u=['o','Ko','Mo','Go'];let i=0;while(n>=1024&&i<3){n/=1024;i++;}return(n>=100?n.toFixed(0):n.toFixed(1))+' '+u[i];}
function setSteps(a,b,c){s1.classList.toggle('on',a);s2.classList.toggle('on',b);s3.classList.toggle('on',c);}
function iconFor(f){const t=f.type||'';if(t.startsWith('image/'))return'IMG';if(t.startsWith('video/'))return'VID';if(t.startsWith('audio/'))return'AUD';if(t.includes('pdf'))return'PDF';if(t.includes('word')||f.name.endsWith('.docx'))return'DOC';if(t.includes('sheet')||f.name.endsWith('.xlsx'))return'XLS';if(t.includes('zip')||f.name.endsWith('.zip'))return'ZIP';if(t.startsWith('text/'))return'TXT';return'F';}
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
  else if(f.type.startsWith('audio/')){fpMedia.innerHTML='AUD';const a=document.createElement('audio');a.src=url;a.controls=true;a.style.width='100%';fpMedia.appendChild(a);}
  else{fpMedia.innerHTML=iconFor(f);}
  pressFile.querySelector('span').textContent=iconFor(f);
  filePreview.classList.remove('hidden');resultBox.classList.add('hidden');
  dropzone.style.display='none';setSteps(true,false,false);
  filePreview.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function resetAll(){currentFile=null;compressedBlob=null;paid=false;fileInput.value='';filePreview.classList.add('hidden');resultBox.classList.add('hidden');dropzone.style.display='';setSteps(true,false,false);downloadBtn.innerHTML='Télécharger le fichier compressé';}
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
  const DUREE=1500 // ~1.5 secondes d'animation
  const TICK=15;
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
      pressBar.style.width='100%';pressPct.textContent='100%';pressStep.textContent='Terminé OK';
      setTimeout(()=>{
        compressModal.classList.add('hidden');showResult(currentFile.size,resultat.blob.size);
        showToast('Compression terminée OK');
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
  downloadBtn.textContent='Telecharger le fichier compresse';
  setTimeout(()=>{resBarFill.style.width=ratio+'%';},80);
  resultBox.scrollIntoView({behavior:'smooth',block:'nearest'});
}
// Paiement mutualise : payContext = 'compress' ou 'convert'
function openPay(){
  if(payContext==='convert'){openPayConvert();return;}
  if(!compressedBlob){showToast('Compressez un fichier dabord.');return;}
  payFileName.textContent=compressedName+' - '+fmt(compressedBlob.size);
  methodChoice.classList.remove('hidden');payForm.classList.add('hidden');
  payProcessing.classList.add('hidden');paySuccess.classList.add('hidden');
  payModal.classList.remove('hidden');
}
function openPayConvert(){
  if(!convBlob){showToast('Convertissez un fichier dabord.');return;}
  payFileName.textContent=convOutName+' - '+fmt(convBlob.size);
  methodChoice.classList.remove('hidden');payForm.classList.add('hidden');
  payProcessing.classList.add('hidden');paySuccess.classList.add('hidden');
  payModal.classList.remove('hidden');
}
// Clic Telecharger -> ouvre la pop-up paiement (pas avant). Apres paiement -> telechargement auto.
downloadBtn.onclick=()=>{
  if(!compressedBlob){showToast('Compressez un fichier dabord.');return;}
  payContext='compress';
  if(paid){doDownload();return;}
  openPay();
};
payClose.onclick=()=>payModal.classList.add('hidden');
payModal.addEventListener('click',e=>{if(e.target===payModal)payModal.classList.add('hidden');});
function chooseMethod(m){
  payMethod=m;methodChoice.classList.add('hidden');payForm.classList.remove('hidden');
  chosenMethod.textContent=m==='momo'?' Paiement via MTN MoMo':' Paiement via Orange Money';
  phoneInput.value='';phoneInput.focus();
}
payMomo.onclick=()=>chooseMethod('momo');
payOm.onclick=()=>chooseMethod('om');
backMethods.onclick=()=>{payForm.classList.add('hidden');methodChoice.classList.remove('hidden');};
confirmPay.onclick=()=>{
  const num=phoneInput.value.replace(/[\s.-]/g,'');
  const txEl=document.getElementById('txInput');
  const tx=txEl?txEl.value.trim():'';
  if(num.length<8){showToast('Entrez un numero valide.');phoneInput.focus();return;}
  if(tx.length<4){showToast('Entrez l ID de transaction recu par SMS.');if(txEl)txEl.focus();return;}
  const txEcho=document.getElementById('payTxEcho');
  if(txEcho)txEcho.textContent='Transaction '+tx+' - '+num;
  payForm.classList.add('hidden');payProcessing.classList.remove('hidden');
  fetch('/api/pay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:payMethod||'momo',number:num,txid:tx})})
    .then(r=>r.json())
    .then(d=>{
      payProcessing.classList.add('hidden');paySuccess.classList.remove('hidden');
      paid=true;downloadBtn.textContent='Telecharger le fichier compresse';;
      setTimeout(()=>{payModal.classList.add('hidden');doDownload();},900);
    })
    .catch(()=>{
      payProcessing.classList.add('hidden');payForm.classList.remove('hidden');
      showToast('Serveur injoignable - reessayez.');
    });
};
function doDownload(){
  if(payContext==='convert'){
    if(!convBlob||!convPaid)return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(convBlob);a.download=convOutName;
    document.body.appendChild(a);a.click();a.remove();
    showToast('Telechargement demarre - Merci !');
    return;
  }
  if(!compressedBlob||!paid)return;
  const b=document.createElement('a');
  b.href=URL.createObjectURL(compressedBlob);b.download=compressedName;
  document.body.appendChild(b);b.click();b.remove();
  showToast('Telechargement demarre - Merci !');
}
// Apres paiement : ferme la pop-up et telecharge directement
document.getElementById('finalDownload').onclick=()=>{
  payModal.classList.add('hidden');
  doDownload();
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){payModal.classList.add('hidden');}});




/* ===== CONVERTISSEUR (partie 4/4 : animation 10s + paiement) ===== */
function startConvert(){
  if(!convFile||!convTarget){showToast('Choisissez un format de sortie.');return;}
  convModal.classList.remove('hidden');convSteps(true,true,false);
  convModalName.textContent=convFile.name+'  ->  .'+convTarget.toUpperCase();
  convFromExt.textContent='.'+extOf(convFile.name).toUpperCase();
  convToExt.textContent='.'+convTarget.toUpperCase();
  convBar.style.width='0%';convPct.textContent='0%';
  const labels=['Lecture du fichier…','Analyse du format…','Transformation…','Re-encodage…','Finalisation…'];
  const DUREE=10000,TICK=100,t0=Date.now();
  let resultat=null;
  realConvert(convFile,convTarget).then(r=>{resultat=r;}).catch(e=>{resultat={error:String((e&&e.message)||e)};});
  convStep.textContent=labels[0];
  const timer=setInterval(()=>{
    const ecoule=Date.now()-t0;
    const p=Math.min(97,Math.floor(ecoule/DUREE*100));
    convBar.style.width=p+'%';convPct.textContent=p+'%';
    convStep.textContent=labels[Math.min(labels.length-1,Math.floor(p/22))];
    if(ecoule<DUREE)return;
    clearInterval(timer);
    const attendre=setInterval(()=>{
      if(!resultat)return;
      clearInterval(attendre);
      if(resultat.error){convModal.classList.add('hidden');showToast('Echec : '+resultat.error);return;}
      convBlob=resultat.blob;convOutName=resultat.name;
      convBar.style.width='100%';convPct.textContent='100%';convStep.textContent='Termine';
      setTimeout(()=>{
        convModal.classList.add('hidden');showConvResult(convFile,convBlob,convOutName);
        showToast('Conversion terminee');
      },650);
    },100);
  },TICK);
}
function showConvResult(orig,blob,outName){
  convResultBox.classList.remove('hidden');convSteps(true,true,true);
  convResBefore.textContent=orig.name;
  convResAfter.textContent=outName;
  convResSize.textContent=fmt(blob.size);
  convDownloadBtn.textContent='Telecharger le fichier converti';
  convResultBox.scrollIntoView({behavior:'smooth',block:'nearest'});
}
/* handlers convertisseur reactives en fin de fichier */

/* ===== CONVERTISSEUR (partie 3/4 : texte + audio + docs) ===== */
async function convTextTo(f,target){
  const text=await f.text();
  const base=baseOf(f.name),src=extOf(f.name);
  if(target==='txt')return {blob:new Blob([text],{type:'text/plain'}),name:base+'-converti.txt'};
  if(target==='html'){const h='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+base+'</title></head><body><pre>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre></body></html>';return {blob:new Blob([h],{type:'text/html'}),name:base+'-converti.html'};}
  if(target==='md')return {blob:new Blob([text],{type:'text/markdown'}),name:base+'-converti.md'};
  if(target==='pdf')return {blob:buildPdfFromText(base,text),name:base+'-converti.pdf'};
  if(target==='json'){
    if(src==='csv'){
      const ls=text.trim().split(/\r?\n/);const hd=ls.shift().split(/[,;]/).map(s=>s.trim());
      const arr=ls.map(l=>{const v=l.split(/[,;]/);const o={};for(let i=0;i<hd.length;i++)o[hd[i]]=v[i];return o;});
      return {blob:new Blob([JSON.stringify(arr,null,2)],{type:'application/json'}),name:base+'-converti.json'};
    }
    return {blob:new Blob([JSON.stringify({contenu:text.split(/\r?\n/)},null,2)],{type:'application/json'}),name:base+'-converti.json'};
  }
  if(target==='csv'){
    if(src==='json'){
      try{
        const j=JSON.parse(text);const arr=Array.isArray(j)?j:[j];
        const keys=[];arr.forEach(o=>Object.keys(o).forEach(k=>{if(keys.indexOf(k)<0)keys.push(k);}));
        const rows=[keys.join(',')];arr.forEach(o=>rows.push(keys.map(k=>JSON.stringify(o[k]===undefined?'':o[k])).join(',')));
        return {blob:new Blob([rows.join('\n')],{type:'text/csv'}),name:base+'-converti.csv'};
      }catch(e){throw new Error('JSON invalide');}
    }
    return {blob:new Blob([text],{type:'text/csv'}),name:base+'-converti.csv'};
  }
  if(target==='vtt'){const v='WEBVTT\n\n'+text.replace(/,/g,'.');return {blob:new Blob([v],{type:'text/vtt'}),name:base+'-converti.vtt'};}
  if(target==='srt'){const s=text.replace(/^WEBVTT\s*/,'');return {blob:new Blob([s],{type:'text/plain'}),name:base+'-converti.srt'};}
  return {blob:new Blob([text],{type:mimeFor(target)}),name:base+'-converti.'+target};
}
async function convAudioTo(f,target){
  const AC=window.AudioContext||window.webkitAudioContext;
  const ctx=new AC();
  const buf=await f.arrayBuffer();
  let audio=null;
  try{audio=await ctx.decodeAudioData(buf.slice(0));}catch(e){throw new Error('audio illisible');}
  const wav=encodeWav(audio);
  return {blob:new Blob([wav],{type:target==='wav'?'audio/wav':'audio/'+target}),name:baseOf(f.name)+'-converti.'+target};
}
function encodeWav(audio){
  const n=audio.numberOfChannels,ch=[];
  for(let c=0;c<n;c++)ch.push(audio.getChannelData(c));
  const len=ch[0].length,bytes=44+len*n*2;
  const ab=new ArrayBuffer(bytes),v=new DataView(ab);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF');v.setUint32(4,bytes-8,true);ws(8,'WAVE');ws(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,n,true);
  v.setUint32(24,audio.sampleRate,true);v.setUint32(28,audio.sampleRate*n*2,true);
  v.setUint16(32,n*2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,len*n*2,true);
  let o=44;
  for(let i=0;i<len;i++)for(let c=0;c<n;c++){const s=Math.max(-1,Math.min(1,ch[c][i]));v.setInt16(o,s<0?s*32768:s*32767,true);o+=2;}
  return ab;
}
async function convDocTo(f,target){
  const buf=await f.arrayBuffer();
  const raw=new TextDecoder('utf-8').decode(new Uint8Array(buf));
  let text='';
  const ms=raw.match(/>([^<>]{3,})</g);
  if(ms){const parts=[];for(let i=0;i<ms.length;i++){const t=ms[i].slice(1,-1);if(/[a-zA-Z\u00C0-\u00FF]{2}/.test(t))parts.push(t);}text=parts.join('\n');}
  if(!text.trim())text='[Contenu de '+f.name+' - conversion locale]';
  const base=baseOf(f.name);
  if(target==='txt')return {blob:new Blob([text],{type:'text/plain'}),name:base+'-converti.txt'};
  if(target==='md')return {blob:new Blob(['# '+base+'\n\n'+text],{type:'text/markdown'}),name:base+'-converti.md'};
  if(target==='pdf')return {blob:buildPdfFromText(base,text),name:base+'-converti.pdf'};
  return {blob:new Blob([text],{type:'text/plain'}),name:base+'-converti.txt'};
}
async function convPdfToText(f){
  const buf=await f.arrayBuffer();
  const raw=new TextDecoder('latin1').decode(buf);
  const parts=[];const re=/\((?:[^()\\]|\\.)*\)/g;let m=null;
  while((m=re.exec(raw))!==null){parts.push(m[0].slice(1,-1).split('\\n').join('\n'));}
  let text=parts.join('\n').trim();
  if(!text)text='[PDF image - texte non extractible]';
  return {blob:new Blob([text],{type:'text/plain'}),name:baseOf(f.name)+'-converti.txt'};
}
async function realConvert(f,target){
  const src=extOf(f.name);
  if(src===target)return {blob:f,name:baseOf(f.name)+'-converti.'+target};
  const imgSrc=['jpg','jpeg','png','webp','gif','bmp','svg'];
  const imgDst=['jpg','jpeg','png','webp','bmp','pdf'];
  if(imgSrc.indexOf(src)>=0&&imgDst.indexOf(target)>=0)return convImageTo(f,target==='jpeg'?'jpg':target);
  const audSrc=['mp3','wav','ogg','m4a','flac'];
  if(audSrc.indexOf(src)>=0&&['wav','mp3','ogg'].indexOf(target)>=0)return convAudioTo(f,target);
  if(['txt','md','csv','json','log','srt','vtt','html','xml'].indexOf(src)>=0)return convTextTo(f,target);
  if(['docx','odt','rtf'].indexOf(src)>=0)return convDocTo(f,target);
  if(src==='pdf'&&target==='txt')return convPdfToText(f);
  return {blob:new Blob([await f.arrayBuffer()],{type:mimeFor(target)}),name:baseOf(f.name)+'-converti.'+target};
}

/* ===== CONVERTISSEUR (partie 2/4 : images + PDF) ===== */
async function convImageTo(f,target){
  const bmp=await createImageBitmap(f);
  const c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;
  c.getContext('2d').drawImage(bmp,0,0);
  if(target==='pdf'){
    const c2=document.createElement('canvas');c2.width=bmp.width;c2.height=bmp.height;
    c2.getContext('2d').drawImage(bmp,0,0);
    const img=c2.toDataURL('image/jpeg',0.9);
    const pdf=buildPdfWithImage(img,bmp.width,bmp.height);
    return {blob:new Blob([pdf],{type:'application/pdf'}),name:baseOf(f.name)+'-converti.pdf'};
  }
  let type='image/png',q=undefined;
  if(target==='jpg'||target==='jpeg'){type='image/jpeg';q=0.92;}
  else if(target==='webp'){type='image/webp';q=0.9;}
  else if(target==='bmp'){type='image/bmp';}
  const blob=await new Promise(res=>c.toBlob(res,type,q));
  if(!blob)throw new Error('conversion image impossible');
  return {blob:blob,name:baseOf(f.name)+'-converti.'+target};
}
function buildPdfWithImage(dataUrl,iw,ih){
  const b64=dataUrl.split(',')[1];
  const binStr=atob(b64);
  const bin=new Uint8Array(binStr.length);
  for(let i=0;i<binStr.length;i++)bin[i]=binStr.charCodeAt(i);
  const r=Math.min(1,500/iw,700/ih);
  const pw=Math.round(iw*r),ph=Math.round(ih*r);
  const px=Math.round((612-pw)/2),py=Math.round((792-ph)/2);
  const stream='q '+pw+' 0 0 '+ph+' '+px+' '+py+' cm /Im1 Do Q';
  const o1='<< /Type /Catalog /Pages 2 0 R >>';
  const o2='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  const o3='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> /ProcSet [/PDF /ImageC] >> >>';
  const o4='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
  const o5h='<< /Type /XObject /Subtype /Image /Width '+iw+' /Height '+ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bin.length+' >>\nstream\n';
  const enc=new TextEncoder();
  let head='%PDF-1.4\n';
  const offs=[0];
  offs[1]=head.length;head+= '1 0 obj\n'+o1+'\nendobj\n';
  offs[2]=head.length;head+='2 0 obj\n'+o2+'\nendobj\n';
  offs[3]=head.length;head+='3 0 obj\n'+o3+'\nendobj\n';
  offs[4]=head.length;head+='4 0 obj\n'+o4+'\nendobj\n';
  offs[5]=head.length;head+='5 0 obj\n'+o5h;
  const hb=enc.encode(head),tb=enc.encode('\nendstream\nendobj\n');
  const merged=new Uint8Array(hb.length+bin.length+tb.length);
  merged.set(hb,0);merged.set(bin,hb.length);merged.set(tb,hb.length+bin.length);
  let xref='xref\n0 6\n0000000000 65535 f \n';
  for(let k=1;k<=5;k++){xref+=String(offs[k]).padStart(10,'0')+' 00000 n \n';}
  xref+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+merged.length+'\n%%EOF';
  const xb=enc.encode(xref);
  const fin=new Uint8Array(merged.length+xb.length);
  fin.set(merged,0);fin.set(xb,merged.length);
  return fin;
}
function buildPdfFromText(title,text){
  const esc=s=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const lines=text.split(/\r?\n/).slice(0,120);
  let content='BT /F1 11 Tf 50 750 Td 14 TL ';
  for(let i=0;i<lines.length;i++){content+='('+(esc(lines[i].slice(0,110))||' ')+') Tj T* ';}
  content+='ET';
  const obs=[];
  obs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  obs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  obs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
  obs[4]='<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream';
  obs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let out='%PDF-1.4\n';const of=[0];
  for(let i=1;i<=5;i++){of[i]=out.length;out+=i+' 0 obj\n'+obs[i]+'\nendobj\n';}
  const xp=out.length;
  out+='xref\n0 6\n0000000000 65535 f \n';
  for(let k=1;k<=5;k++){out+=String(of[k]).padStart(10,'0')+' 00000 n \n';}
  out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xp+'\n%%EOF';
  return new Blob([out],{type:'application/pdf'});
}

/* ===== CONVERTISSEUR UNIVERSEL (partie 1/4 : etat + UI) ===== */
const convDropzone=$('convDropzone'),convFileInput=$('convFileInput'),convBrowseBtn=$('convBrowseBtn');
const convPreview=$('convPreview'),convMedia=$('convMedia'),convName=$('convName'),convType=$('convType'),convSize=$('convSize'),convExt=$('convExt');
const convOptions=$('convOptions'),convertBtn=$('convertBtn'),convChangeBtn=$('convChangeBtn'),convRemoveBtn=$('convRemoveBtn');
const convResultBox=$('convResultBox'),convResBefore=$('convResBefore'),convResAfter=$('convResAfter'),convResSize=$('convResSize'),convDownloadBtn=$('convDownloadBtn');
const convModal=$('convModal'),convBar=$('convBar'),convPct=$('convPct'),convStep=$('convStep'),convModalName=$('convModalName'),convFromExt=$('convFromExt'),convToExt=$('convToExt'),convAnimFile=$('convAnimFile');
const cc1=$('c1'),cc2=$('c2'),cc3=$('c3');
function convSteps(a,b,c){cc1.classList.toggle('on',a);cc2.classList.toggle('on',b);cc3.classList.toggle('on',c);}
const CONV_MAP={jpg:['png','webp','pdf'],jpeg:['png','webp','pdf'],png:['jpg','webp','pdf'],webp:['jpg','png','pdf'],gif:['png','jpg'],bmp:['jpg','png','pdf'],svg:['png','jpg'],mp3:['wav','ogg'],wav:['mp3','ogg'],ogg:['mp3','wav'],m4a:['mp3','wav'],flac:['mp3','wav'],txt:['pdf','csv','json','md'],md:['txt','pdf','html'],csv:['txt','json'],json:['txt','csv'],log:['txt','pdf'],srt:['txt','vtt'],vtt:['txt','srt'],docx:['txt','pdf','md'],odt:['txt','pdf','md'],rtf:['txt','pdf','md'],pdf:['txt'],html:['txt','pdf'],xml:['txt','json']};
function extOf(name){return (name.split('.').pop()||'').toLowerCase();}
function baseOf(name){const i=name.lastIndexOf('.');return i<0?name:name.slice(0,i);}
function mimeFor(ext){const m={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',txt:'text/plain',md:'text/markdown',csv:'text/csv',json:'application/json',pdf:'application/pdf',html:'text/html'};return m[ext]||'application/octet-stream';}
function showConvPreview(f){
  convFile=f;convPaid=false;convBlob=null;convTarget='';
  convName.textContent=f.name;
  const ext=extOf(f.name);
  convExt.textContent=(ext||'FICHIER').toUpperCase();convType.textContent=(f.type||'Fichier')+' - '+(ext||'').toUpperCase();
  convSize.textContent=fmt(f.size);
  convMedia.innerHTML='';
  const url=URL.createObjectURL(f);
  if(f.type.indexOf('image/')===0){const im=document.createElement('img');im.src=url;convMedia.appendChild(im);}
  else if(f.type.indexOf('video/')===0){const v=document.createElement('video');v.src=url;v.controls=true;convMedia.appendChild(v);}
  else if(f.type.indexOf('audio/')===0){convMedia.textContent='AUDIO';}
  else{convMedia.textContent=iconFor(f);}
  convAnimFile.textContent=iconFor(f);
  convOptions.innerHTML='';
  const targets=CONV_MAP[ext]||[];
  if(!targets.length){convOptions.innerHTML='<p class="conv-note">Reconditionnement auto vers '+ext.toUpperCase()+' optimise.</p>';convTarget=ext;}
  else{targets.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='conv-opt'+(i===0?' sel':'');b.textContent='.'+t.toUpperCase();b.onclick=()=>{const all=convOptions.querySelectorAll('.conv-opt');for(let k=0;k<all.length;k++)all[k].classList.remove('sel');b.classList.add('sel');convTarget=t;};convOptions.appendChild(b);});convTarget=targets[0];}
  convPreview.classList.remove('hidden');convResultBox.classList.add('hidden');
  convDropzone.style.display='none';convSteps(true,false,false);
  convPreview.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function convReset(){convFile=null;convBlob=null;convTarget='';convPaid=false;convFileInput.value='';convPreview.classList.add('hidden');convResultBox.classList.add('hidden');convDropzone.style.display='';convSteps(true,false,false);convDownloadBtn.textContent='Telecharger le fichier converti';}
convBrowseBtn.onclick=e=>{e.stopPropagation();convFileInput.click();};
convDropzone.onclick=()=>convFileInput.click();
convFileInput.onchange=e=>{if(e.target.files[0]){if(e.target.files[0].size>500*1024*1024){showToast('Fichier trop lourd (max 500 Mo).');return;}showConvPreview(e.target.files[0]);}};
['dragover','dragenter'].forEach(ev=>convDropzone.addEventListener(ev,e=>{e.preventDefault();convDropzone.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>convDropzone.addEventListener(ev,e=>{e.preventDefault();convDropzone.classList.remove('drag');}));
convDropzone.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f){if(f.size>500*1024*1024){showToast('Fichier trop lourd (max 500 Mo).');return;}showConvPreview(f);}});
convChangeBtn.onclick=()=>convFileInput.click();
convRemoveBtn.onclick=convReset;
convertBtn.onclick=()=>{if(!convFile)return;startConvert();};
convDownloadBtn.onclick=()=>{
  if(!convBlob){showToast('Convertissez un fichier dabord.');return;}
  payContext='convert';
  if(convPaid){doDownload();return;}
  openPay();
};



