// CoCo - page Conversion (uniquement conversion, jamais compression)
const $ = (id) => document.getElementById(id);
const convDropzone=$('convDropzone'),convFileInput=$('convFileInput'),convBrowseBtn=$('convBrowseBtn');
const convPreview=$('convPreview'),convMedia=$('convMedia'),convName=$('convName'),convType=$('convType'),convSize=$('convSize'),convExt=$('convExt');
const convOptions=$('convOptions'),convertBtn=$('convertBtn'),convChangeBtn=$('convChangeBtn'),convRemoveBtn=$('convRemoveBtn');
const convResultBox=$('convResultBox'),convResBefore=$('convResBefore'),convResAfter=$('convResAfter'),convResSize=$('convResSize'),convDownloadBtn=$('convDownloadBtn');
const convModal=$('convModal'),convBar=$('convBar'),convPct=$('convPct'),convStep=$('convStep'),convModalName=$('convModalName'),convFromExt=$('convFromExt'),convToExt=$('convToExt'),convAnimFile=$('convAnimFile'),winNote=$('winNote');
const payModal=$('payModal'),payClose=$('payClose'),payFileName=$('payFileName');
const methodChoice=$('methodChoice'),payForm=$('payForm'),payProcessing=$('payProcessing'),paySuccess=$('paySuccess');
const payMomo=$('payMomo'),payOm=$('payOm'),chosenMethod=$('chosenMethod'),phoneInput=$('phoneInput'),confirmPay=$('confirmPay'),backMethods=$('backMethods'),phoneEcho=$('phoneEcho');
const toast=$('toast');
const cc1=$('c1'),cc2=$('c2'),cc3=$('c3');
let convFile=null,convTarget='',convBlob=null,convOutName='',convPaid=false,payMethod='';
function showToast(m){toast.textContent=m;toast.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.add('hidden'),3200);}
function fmt(n){if(n===0)return'0 o';const u=['o','Ko','Mo','Go'];let i=0;while(n>=1024&&i<3){n/=1024;i++;}return(n>=100?n.toFixed(0):n.toFixed(1))+' '+u[i];}
function convSteps(a,b,c){cc1.classList.toggle('on',a);cc2.classList.toggle('on',b);cc3.classList.toggle('on',c);}
function iconFor(name,type){const t=type||'';if(t.indexOf('image/')===0)return'IMG';if(t.indexOf('audio/')===0)return'AUD';if(t.indexOf('pdf')>=0)return'PDF';return'F';}
const CONV_MAP={jpg:['png','webp','pdf'],jpeg:['png','webp','pdf'],png:['jpg','webp','pdf'],webp:['jpg','png','pdf'],gif:['png','jpg'],bmp:['jpg','png','pdf'],svg:['png','jpg'],mp3:['wav','ogg'],wav:['mp3','ogg'],ogg:['mp3','wav'],m4a:['mp3','wav'],flac:['mp3','wav'],txt:['pdf','csv','json','md'],md:['txt','pdf','html'],csv:['txt','json'],json:['txt','csv'],log:['txt','pdf'],srt:['txt','vtt'],vtt:['txt','srt'],docx:['txt','pdf','md'],odt:['txt','pdf','md'],rtf:['txt','pdf','md'],pdf:['txt','iso'],html:['txt','pdf'],xml:['txt','json']};
function extOf(name){return (name.split('.').pop()||'').toLowerCase();}
function baseOf(name){const i=name.lastIndexOf('.');return i<0?name:name.slice(0,i);}
function mimeFor(ext){const m={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',bmp:'image/bmp',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',txt:'text/plain',md:'text/markdown',csv:'text/csv',json:'application/json',pdf:'application/pdf',html:'text/html',iso:'application/octet-stream'};return m[ext]||'application/octet-stream';}
function showConvPreview(f){
  convFile=f;convPaid=false;convBlob=null;convTarget='';
  convName.textContent=f.name;
  const ext=extOf(f.name);
  convExt.textContent=(ext||'FICHIER').toUpperCase();convType.textContent=(f.type||'Fichier')+' - '+(ext||'').toUpperCase();
  convSize.textContent=fmt(f.size);
  convMedia.innerHTML='';
  const url=URL.createObjectURL(f);
  if(f.type.indexOf('image/')===0){const im=document.createElement('img');im.src=url;convMedia.appendChild(im);}
  else if(f.type.indexOf('audio/')===0){convMedia.textContent='AUD';}
  else{convMedia.textContent=iconFor(f.name,f.type);}
  convAnimFile.textContent=iconFor(f.name,f.type);
  convOptions.innerHTML='';
  const targets=CONV_MAP[ext]||[];
  if(!targets.length){convOptions.innerHTML='<p class="conv-note">Reconditionnement auto vers '+ext.toUpperCase()+' optimise.</p>';convTarget=ext;}
  else{targets.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='conv-opt'+(i===0?' sel':'')+(t==='iso'?' iso':'');b.textContent='.'+t.toUpperCase();b.title=t==='iso'?'Convertir en systeme Windows (.ISO)':('Convertir en .'+t.toUpperCase());b.onclick=()=>{const all=convOptions.querySelectorAll('.conv-opt');for(let k=0;k<all.length;k++)all[k].classList.remove('sel');b.classList.add('sel');convTarget=t;};convOptions.appendChild(b);});convTarget=targets[0];}
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
async function convImageTo(f,target){
  const bmp=await createImageBitmap(f);
  const c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;
  c.getContext('2d').drawImage(bmp,0,0);
  if(target==='pdf'){
    const img=c.toDataURL('image/jpeg',0.9);
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
  const enc=new TextEncoder();
  let head='%PDF-1.4\n';
  const offs=[0];
  offs[1]=head.length;head+='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  offs[2]=head.length;head+='2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  offs[3]=head.length;head+='3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> /ProcSet [/PDF /ImageC] >> >>\nendobj\n';
  offs[4]=head.length;head+='4 0 obj\n<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream\nendobj\n';
  offs[5]=head.length;head+='5 0 obj\n<< /Type /XObject /Subtype /Image /Width '+iw+' /Height '+ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bin.length+' >>\nstream\n';
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
  let out='%PDF-1.4\n';const of=[0];
  of[1]=out.length;out+='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  of[2]=out.length;out+='2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  of[3]=out.length;out+='3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  of[4]=out.length;out+='4 0 obj\n<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream\nendobj\n';
  of[5]=out.length;out+='5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const xp=out.length;
  out+='xref\n0 6\n0000000000 65535 f \n';
  for(let k=1;k<=5;k++){out+=String(of[k]).padStart(10,'0')+' 00000 n \n';}
  out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xp+'\n%%EOF';
  return new Blob([out],{type:'application/pdf'});
}
async function convTextTo(f,target){
  if(target==='iso')return buildWindowsIso(f);
  const text=await f.text();
  const base=baseOf(f.name),src=extOf(f.name);
  if(target==='txt')return {blob:new Blob([text],{type:'text/plain'}),name:base+'-converti.txt'};
  if(target==='html'){const h='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+base+'</title></head><body><pre>'+text.replace(/&/g,'&amp;')+'</pre></body></html>';return {blob:new Blob([h],{type:'text/html'}),name:base+'-converti.html'};}
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
  if(target==='csv')return {blob:new Blob([text],{type:'text/csv'}),name:base+'-converti.csv'};
  if(target==='vtt'){const v='WEBVTT\n\n'+text;return {blob:new Blob([v],{type:'text/vtt'}),name:base+'-converti.vtt'};}
  if(target==='srt'){const s=text.replace(/^WEBVTT\s*/,'');return {blob:new Blob([s],{type:'text/plain'}),name:base+'-converti.srt'};}
  return {blob:new Blob([text],{type:mimeFor(target)}),name:base+'-converti.'+target};
}
// PDF vers Windows (.ISO) : fabrique un ISO local avec le contenu extrait
async function buildWindowsIso(f){
  const buf=await f.arrayBuffer();
  const raw=new TextDecoder('latin1').decode(new Uint8Array(buf).slice(0,200000));
  const parts=[];const re=/\((?:[^()\\]|\\.)*\)/g;let m=null;
  while((m=re.exec(raw))!==null){parts.push(m[0].slice(1,-1));}
  let text=parts.join('\n').trim();
  if(!text)text='Document '+f.name;
  const base=baseOf(f.name);
  const readme='WINDOWS 12 - IMAGE ISO CoCo\nSource : '+f.name+'\nTaille : '+f.size+' octets\n\nCONTENU :\n'+text.slice(0,8000)+'\n';
  const enc=new TextEncoder();
  const rb=enc.encode(readme);
  const pad=32768;
  const iso=new Uint8Array(pad+rb.length+pad);
  iso.set(enc.encode('CD001'),32769);
  iso.set(enc.encode('CoCo-Windows12'),32876);
  iso.set(rb,pad);
  return {blob:new Blob([iso],{type:'application/octet-stream'}),name:base+'-windows12.iso'};
}
async function convAudioTo(f,target){
  const AC=window.AudioContext||window.webkitAudioContext;
  const ctx=new AC();
  const buf=await f.arrayBuffer();
  let audio=null;
  try{audio=await ctx.decodeAudioData(buf.slice(0));}catch(e){throw new Error('audio illisible');}
  const wav=encodeWav(audio);
  return {blob:new Blob([wav],{type:'audio/'+target}),name:baseOf(f.name)+'-converti.'+target};
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
  if(target==='iso')return buildWindowsIso(f);
  const buf=await f.arrayBuffer();
  const raw=new TextDecoder('utf-8').decode(new Uint8Array(buf));
  let text='';
  const ms=raw.match(/>([^<>]{3,})</g);
  if(ms){const parts=[];for(let i=0;i<ms.length;i++){parts.push(ms[i].slice(1,-1));}text=parts.join('\n');}
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
  while((m=re.exec(raw))!==null){parts.push(m[0].slice(1,-1));}
  let text=parts.join('\n').trim();
  if(!text)text='[PDF image - texte non extractible]';
  return {blob:new Blob([text],{type:'text/plain'}),name:baseOf(f.name)+'-converti.txt'};
}
async function realConvert(f,target){
  const src=extOf(f.name);
  if(src===target)return {blob:f,name:baseOf(f.name)+'-converti.'+target};
  if(target==='iso')return buildWindowsIso(f);
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
function startConvert(){
  if(!convFile||!convTarget){showToast('Choisissez un format de sortie.');return;}
  const isWin=convTarget==='iso';
  convModal.classList.remove('hidden');convSteps(true,true,false);
  convModalName.textContent=convFile.name+'  ->  .'+convTarget.toUpperCase();
  convFromExt.textContent='.'+extOf(convFile.name).toUpperCase();
  convToExt.textContent='.'+convTarget.toUpperCase();
  if(isWin){winNote.classList.remove('hidden');}
  else{winNote.classList.add('hidden');}
  convBar.style.width='0%';convPct.textContent='0%';
  const winStep='Conversion en systeme Windows 12 - vous telechargerez le .ISO dans quelques secondes';
  const labels=isWin?[winStep,winStep,winStep,winStep,winStep]:['Lecture du fichier','Analyse du format','Transformation','Re-encodage','Finalisation'];
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
      convBar.style.width='100%';convPct.textContent='100%';convStep.textContent=isWin?winStep:'Termine';
      setTimeout(()=>{
        convModal.classList.add('hidden');showConvResult(convFile,convBlob,convOutName);
        showToast('Conversion terminee');
      },650);
    },100);
  },TICK);
}
convertBtn.onclick=()=>{if(!convFile)return;startConvert();};
function showConvResult(orig,blob,outName){
  convResultBox.classList.remove('hidden');convSteps(true,true,true);
  convResBefore.textContent=orig.name;
  convResAfter.textContent=outName;
  convResSize.textContent=fmt(blob.size);
  convDownloadBtn.textContent='Telecharger le fichier converti';
  convResultBox.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function openPay(){
  if(!convBlob){showToast('Convertissez un fichier dabord.');return;}
  payFileName.textContent=convOutName+' - '+fmt(convBlob.size);
  methodChoice.classList.remove('hidden');payForm.classList.add('hidden');
  payProcessing.classList.add('hidden');paySuccess.classList.add('hidden');
  payModal.classList.remove('hidden');
}
convDownloadBtn.onclick=()=>{
  if(!convBlob){showToast('Convertissez un fichier dabord.');return;}
  if(convPaid){doDownload();return;}
  openPay();
};
payClose.onclick=()=>payModal.classList.add('hidden');
payModal.addEventListener('click',e=>{if(e.target===payModal)payModal.classList.add('hidden');});
function chooseMethod(m){
  payMethod=m;methodChoice.classList.add('hidden');payForm.classList.remove('hidden');
  chosenMethod.textContent=m==='momo'?'Paiement via MTN MoMo':'Paiement via Orange Money';
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
      convPaid=true;convDownloadBtn.textContent='Telecharger le fichier converti';;
      setTimeout(()=>{payModal.classList.add('hidden');doDownload();},900);
    })
    .catch(()=>{
      payProcessing.classList.add('hidden');payForm.classList.remove('hidden');
      showToast('Serveur injoignable - reessayez.');
    });
};
function doDownload(){
  if(!convBlob||!convPaid)return;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(convBlob);a.download=convOutName;
  document.body.appendChild(a);a.click();a.remove();
  showToast('Telechargement demarre - Merci !');
}
document.getElementById('finalDownload').onclick=()=>{payModal.classList.add('hidden');doDownload();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){payModal.classList.add('hidden');}});




