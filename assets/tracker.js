
/* ════════ PRODUTOS ════════ */
let prods=[];
const DEF_NCM={ii:35,ipi:6.5,pis:2.1,cofins:9.65};
function addProd(d={}){
  prods.push({desc:d.desc||'',sku:d.sku||'',note:d.note||d.nota||'',ncm:d.ncm||'4202.92.00',qty:d.qty||0,fob:d.fob||0,oem:d.oem??d.arte??0,
    cxL:d.cxL||0,cxW:d.cxW||0,cxH:d.cxH||0,unCx:d.unCx||0,pesoCx:d.pesoCx??d.pesoUn??0,
    ii:d.ii??DEF_NCM.ii,ipi:d.ipi??DEF_NCM.ipi,pis:d.pis??DEF_NCM.pis,cofins:d.cofins??DEF_NCM.cofins});
  renderProds();
}
function rmProd(i){prods.splice(i,1);renderProds();recalc();}
function renderProds(){
  document.getElementById('prod-rows').innerHTML=prods.map((p,i)=>`
    <div class="prod-import-block"><div class="prow">
      <input value="${esc(p.desc)}" placeholder="Sacola Ráfia G" oninput="upd(${i},'desc',this.value)">
      <input value="${esc(p.sku)}" class="mono" placeholder="SKU" oninput="upd(${i},'sku',this.value)">
      <input value="${esc(p.ncm)}" class="mono" oninput="upd(${i},'ncm',this.value)">
      <button class="gear" onclick="openNCM(${i})" title="Alíquotas desta NCM" aria-label="Editar alíquotas desta NCM">⚙</button>
      <input value="${p.qty||''}" class="mono" type="number" oninput="upd(${i},'qty',this.value)">
      <input value="${p.fob||''}" class="mono" type="number" step="0.001" oninput="upd(${i},'fob',this.value)">
      <input value="${p.oem||''}" class="mono" type="number" oninput="upd(${i},'oem',this.value)">
      <input value="${p.cxL||''}" class="mono" type="number" oninput="upd(${i},'cxL',this.value)">
      <input value="${p.cxW||''}" class="mono" type="number" oninput="upd(${i},'cxW',this.value)">
      <input value="${p.cxH||''}" class="mono" type="number" oninput="upd(${i},'cxH',this.value)">
      <input value="${p.unCx||''}" class="mono" type="number" oninput="upd(${i},'unCx',this.value)">
      <input value="${p.pesoCx||''}" class="mono" type="number" step="0.001" oninput="upd(${i},'pesoCx',this.value)">
      <button class="rm" onclick="rmProd(${i})" aria-label="Remover produto">✕</button>
    </div><input class="import-prod-note" value="${esc(p.note||'')}" maxlength="240" placeholder="Notas da cotação deste produto (opcional)" oninput="upd(${i},'note',this.value)"></div>`).join('');
}
function upd(i,k,v){prods[i][k]=(['desc','ncm','sku','note'].includes(k))?v:(parseFloat(v)||0);recalc();}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

/* ══════════════════════════════════════
   MULTI-SELECT FILTER (estilo Excel: busca + selecionar todos + checkboxes)
   selected===null representa "todos" (sem filtro ativo)
══════════════════════════════════════ */
const MSF={};
function msfHtml(id,label){
  return`<div class="msf" id="msf-${id}">
    <button type="button" class="msf-btn" id="msf-btn-${id}" onclick="msfToggle('${id}')">${esc(label)}</button>
    <div class="msf-panel" id="msf-panel-${id}" style="display:none">
      <input type="text" class="msf-search" placeholder="🔍 Buscar" oninput="msfRenderOptions('${id}',this.value)">
      <label class="msf-opt msf-selectall"><input type="checkbox" id="msf-selall-${id}" onchange="msfToggleAll('${id}',this.checked)"> (Selecionar Todos)</label>
      <div class="msf-options" id="msf-options-${id}"></div>
    </div>
  </div>`;
}
function msfPopulate(id,options,label,onChange){
  const isNew=!MSF[id];
  if(isNew)MSF[id]={options:[],selected:null,onChange,label};
  const st=MSF[id];
  st.options=options;st.label=label;st.onChange=onChange;
  if(st.selected){
    const filtered=new Set([...st.selected].filter(v=>options.includes(v)));
    st.selected=filtered.size===options.length?null:filtered;
  }
  msfRenderButton(id);
  const panel=document.getElementById('msf-panel-'+id);
  if(panel&&panel.style.display!=='none')msfRenderOptions(id);
}
function msfRenderButton(id){
  const btn=document.getElementById('msf-btn-'+id);if(!btn)return;
  const st=MSF[id];if(!st)return;
  let txt;
  if(st.selected===null)txt=st.label;
  else if(st.selected.size===0)txt='Nenhum selecionado';
  else txt=`${st.selected.size} selecionado${st.selected.size!==1?'s':''}`;
  btn.innerHTML=esc(txt)+' <span style="float:right;opacity:.6">▾</span>';
  btn.classList.toggle('msf-active',st.selected!==null);
}
function msfRenderOptions(id,searchQ){
  const cont=document.getElementById('msf-options-'+id);if(!cont)return;
  const st=MSF[id];if(!st)return;
  const q=norm(searchQ||'');
  const opts=st.options.filter(o=>!q||norm(o).includes(q));
  const selAllCk=document.getElementById('msf-selall-'+id);
  if(selAllCk)selAllCk.checked=st.selected===null;
  cont.innerHTML=opts.length?opts.map(o=>{
    const checked=st.selected===null||st.selected.has(o);
    const safe=esc(o).replace(/'/g,"\\'");
    return`<label class="msf-opt"><input type="checkbox" ${checked?'checked':''} onchange="msfToggleOne('${id}','${safe}',this.checked)">${esc(o)}</label>`;
  }).join(''):'<div style="padding:.5rem;color:var(--ink4);font-size:.7rem;text-align:center">nada encontrado</div>';
}
function msfToggle(id){
  const wasOpen=document.getElementById('msf-panel-'+id).style.display!=='none';
  document.querySelectorAll('.msf-panel').forEach(p=>p.style.display='none');
  if(!wasOpen){
    document.getElementById('msf-panel-'+id).style.display='flex';
    const search=document.querySelector('#msf-panel-'+id+' .msf-search');
    if(search){search.value='';setTimeout(()=>search.focus(),30);}
    msfRenderOptions(id);
  }
}
function msfToggleAll(id,checked){
  MSF[id].selected=checked?null:new Set();
  msfRenderOptions(id);msfRenderButton(id);
  MSF[id].onChange();
}
function msfToggleOne(id,value,checked){
  const st=MSF[id];
  if(st.selected===null)st.selected=new Set(st.options);
  if(checked)st.selected.add(value);else st.selected.delete(value);
  if(st.selected.size===st.options.length)st.selected=null;
  const selAllCk=document.getElementById('msf-selall-'+id);
  if(selAllCk)selAllCk.checked=st.selected===null;
  msfRenderButton(id);
  st.onChange();
}
function msfMatch(id,value){
  const st=MSF[id];
  if(!st||st.selected===null)return true;
  return st.selected.has(value);
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.msf'))document.querySelectorAll('.msf-panel').forEach(p=>p.style.display='none');
});

let _ncmIdx=-1;
function openNCM(i){
  _ncmIdx=i;const p=prods[i];
  document.getElementById('ncm-title').textContent='Alíquotas — '+(p.ncm||'NCM');
  document.getElementById('ncm-ii').value=p.ii;
  document.getElementById('ncm-ipi').value=p.ipi;
  document.getElementById('ncm-pis').value=p.pis;
  document.getElementById('ncm-cofins').value=p.cofins;
  document.getElementById('ovl-ncm').classList.add('open');
}
function saveNCM(){
  if(_ncmIdx<0)return;const p=prods[_ncmIdx];
  p.ii=parseFloat(document.getElementById('ncm-ii').value)||0;
  p.ipi=parseFloat(document.getElementById('ncm-ipi').value)||0;
  p.pis=parseFloat(document.getElementById('ncm-pis').value)||0;
  p.cofins=parseFloat(document.getElementById('ncm-cofins').value)||0;
  closeM('ncm');recalc();
}

/* ════════ DESPESAS DESTINO ════════ */
let fixedExp=[
  {key:'desp',label:'Honorário despachante',val:1772,cur:'BRL'},
  {key:'desconsol',label:'Desconsolidação',val:100,cur:'BRL'},
  {key:'liber',label:'Liberação de BL',val:75,cur:'BRL'},
  {key:'siscomex',label:'Taxa Siscomex',val:154.23,cur:'BRL'},
  {key:'isps',label:'ISPS',val:25,cur:'USD'},
  {key:'iof',label:'IOF',val:28,cur:'BRL'},
  {key:'dropoff',label:'Drop off',val:0,cur:'BRL'},
];
let expCfg={segpct:0.12,afrmmPct:8,thcfcl:1060,arm1:565,arm2:0,levante:490,pesagem:165,picking:0,sobre:0,thcManual:null};
function openExpenses(){renderExpModal();document.getElementById('ovl-exp').classList.add('open');}
function renderExpModal(){
  document.getElementById('fixed-exp').innerHTML=fixedExp.map((e,i)=>`
    <div class="exp-row" style="grid-template-columns:1.4fr .9fr .6fr">
      <label>${esc(e.label)} <span class="formula" id="fx-conv-${i}" style="display:block"></span></label>
      <input class="mono" type="number" value="${e.val}" oninput="fixedExp[${i}].val=parseFloat(this.value)||0;saveExp()">
      <select onchange="fixedExp[${i}].cur=this.value;saveExp()"><option value="BRL"${e.cur==='BRL'?' selected':''}>R$</option><option value="USD"${e.cur==='USD'?' selected':''}>US$</option></select>
    </div>`).join('');
  document.getElementById('e-segpct').value=expCfg.segpct;
  document.getElementById('e-afrmmpct').value=expCfg.afrmmPct;
  document.getElementById('e-thcfcl').value=expCfg.thcfcl;
  document.getElementById('e-arm1').value=expCfg.arm1;
  document.getElementById('e-arm2').value=expCfg.arm2;
  document.getElementById('e-levante').value=expCfg.levante;
  document.getElementById('e-pesagem').value=expCfg.pesagem;
  document.getElementById('e-picking').value=expCfg.picking;
  document.getElementById('e-sobre').value=expCfg.sobre;
  updateExpDisplay();
}
function saveExp(){
  expCfg.segpct=parseFloat(document.getElementById('e-segpct').value)||0;
  expCfg.afrmmPct=parseFloat(document.getElementById('e-afrmmpct').value)||0;
  expCfg.thcfcl=parseFloat(document.getElementById('e-thcfcl').value)||0;
  expCfg.arm1=parseFloat(document.getElementById('e-arm1').value)||0;
  expCfg.arm2=parseFloat(document.getElementById('e-arm2').value)||0;
  expCfg.levante=parseFloat(document.getElementById('e-levante').value)||0;
  expCfg.pesagem=parseFloat(document.getElementById('e-pesagem').value)||0;
  expCfg.picking=parseFloat(document.getElementById('e-picking').value)||0;
  expCfg.sobre=parseFloat(document.getElementById('e-sobre').value)||0;
  updateExpDisplay();recalc();
}
function updateExpDisplay(){
  const d=destBreakdown();
  const fx=val('fx');
  document.getElementById('e-afrmm').value=d.afrmm.toFixed(2);
  document.getElementById('e-difrete').value=d.difrete.toFixed(2);
  document.getElementById('e-seg').value=d.seguro.toFixed(2);
  // THC: só preenche se não houver override manual (deixa o usuário editar)
  const thcEl=document.getElementById('e-thc');
  if(expCfg.thcManual==null) thcEl.value=d.thcCalc.toFixed(2);
  document.getElementById('e-total').textContent=fR(d.total);
  document.getElementById('thc-fcl-row').style.display=selectedShipping().value==='LCL'?'none':'grid';
  // mostra conversão R$ ao lado de cada taxa fixa em US$
  fixedExp.forEach((e,i)=>{
    const span=document.getElementById('fx-conv-'+i);
    if(span) span.textContent=e.cur==='USD'?('= '+fR(e.val*fx)):'';
  });
}
function destBreakdown(){
  const fx=val('fx'),fxF=val('fxFrete'),freteUSD=val('frete');
  const modal=selectedShipping().value;
  const pk=packing();
  const freteBRL=freteUSD*fx; // dólar DI — mesmo câmbio do FOB, igual à planilha real (Encomenda!P = frete × ITJ!E24)
  let fobUSD=0;prods.forEach(p=>fobUSD+=p.qty*p.fob);
  const fobBRL=fobUSD*fx;
  // THC: usa override manual se houver; senão fórmula
  const thcCalc=modal==='LCL'?Math.max(135,pk.cbm*75):expCfg.thcfcl;
  const thc=(expCfg.thcManual!=null&&!isNaN(expCfg.thcManual))?expCfg.thcManual:thcCalc;
  // AFRMM = alíquota × (Frete + Capatazia/THC) — alíquota editável (padrão 8%)
  const afrmm=(freteBRL+thc)*(expCfg.afrmmPct/100);
  // Diferença de frete: o agente cobra o frete no dólar frete (DI + PTAX, normalmente ~3% acima do DI),
  // mas o CIF/impostos usam só o DI. A diferença é despesa operacional à parte, não entra na base tributável.
  const difrete=freteUSD*(fxF-fx);
  const seguro=(fobBRL+freteBRL)*(expCfg.segpct/100);
  // taxas fixas convertidas p/ R$
  let fixed=0;const fixedBRL=fixedExp.map(e=>{const v=e.cur==='USD'?e.val*fx:e.val;fixed+=v;return v;});
  const arm=expCfg.arm1+expCfg.arm2+expCfg.levante+expCfg.pesagem;
  const sobre=expCfg.picking+expCfg.sobre;
  const total=afrmm+difrete+seguro+thc+fixed+arm+sobre;
  return{afrmm,difrete,seguro,thc,thcCalc,fixed,fixedBRL,arm,sobre,total};
}
function thcManual(){
  const v=parseFloat(document.getElementById('e-thc').value);
  expCfg.thcManual=isNaN(v)?null:v;
  recalc();
}

/* ════════ UTILS ════════ */
const val=id=>parseFloat(document.getElementById(id).value)||0;
const pct=id=>(parseFloat(document.getElementById(id).value)||0)/100;
const fR=n=>'R$ '+(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fU=n=>'US$ '+(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const f3=n=>(n||0).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3});
const fPct=n=>(n*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
let _mode='cost';
function setMode(m){_mode=m;}

/* ════════ PACKING ════════ */
function packing(){
  let cbm=0,caixas=0,peso=0,qtyTot=0;
  prods.forEach(p=>{
    const nCx=p.unCx>0?Math.ceil(p.qty/p.unCx):0;
    cbm+=nCx*(p.cxL*p.cxW*p.cxH)/1e6;
    caixas+=nCx;peso+=nCx*p.pesoCx;qtyTot+=p.qty;
  });
  return{cbm,caixas,peso,qtyTot};
}

/* Sugestão operacional definida pela experiência da Ânima Verde.
   O valor do frete nunca é preenchido automaticamente: vem da cotação real. */
function shippingRecommendation(cbm){
  if(!(cbm>0))return{value:'',label:'—',detail:'preencha o empacotamento'};
  if(cbm<=15)return{value:'LCL',label:'LCL',detail:'até 15 m³'};
  if(cbm<=28)return{value:'FCL20',label:"FCL 20'",detail:'acima de 15 até 28 m³'};
  if(cbm<=56)return{value:'FCL40',label:"FCL 40' NOR",detail:'acima de 28 até 56 m³'};
  if(cbm<=69)return{value:'FCL40HC',label:"FCL 40' HC",detail:'acima de 56 até 69 m³'};
  const n=Math.ceil(cbm/69);
  return{value:'MANUAL',label:`${n} contêineres`,detail:'acima de 69 m³ — composição manual'};
}
function selectedShipping(){
  const pk=packing(),choice=document.getElementById('modal').value;
  return choice==='AUTO'?shippingRecommendation(pk.cbm):{value:choice,label:choice,detail:'seleção manual'};
}
function updateShippingSuggestion(){
  const el=document.getElementById('ship-suggestion');if(!el)return;
  const pk=packing(),rec=shippingRecommendation(pk.cbm),select=document.getElementById('modal'),choice=select.value;
  const active=choice==='AUTO'?rec:{value:choice,label:select.selectedOptions[0]?.textContent||choice,detail:'seleção manual'};
  el.innerHTML=`<b>${esc(active.label)}</b><span>${esc(active.detail)}${choice!=='AUTO'&&rec.value&&rec.value!==choice?` · automático sugeriria ${esc(rec.label)}`:''}</span>`;
}

/* ════════ MOTOR DE IMPOSTOS (unificado AV/Trading), item-a-item ════════ */
function importTaxes(){
  const fx=val('fx'),freteUSD=val('frete');
  const pk=packing();
  const oemInFob=document.getElementById('oemInFob').checked;
  let fobUSD=0,oemForaUSD=0;
  prods.forEach(p=>{fobUSD+=p.qty*p.fob+(oemInFob?p.oem:0);if(!oemInFob)oemForaUSD+=p.oem;});
  const fobBRL=fobUSD*fx;
  const oemForaBRL=oemForaUSD*fx; // OEM "por fora": não passa pelo CIF/impostos, mas soma no custo total lá na frente
  const freteBRL=freteUSD*fx; // CIF = FOB + Seguro + Frete, todos no dólar DI (câmbio principal)
  const db=destBreakdown();
  // seguro já vai dentro do CIF (por item, abaixo) e afrmm é somado à parte no custoImport —
  // por isso tiramos os dois do total de "despesas destino" aqui, senão contam em dobro.
  const seguro=db.seguro, afrmm=db.afrmm, dest=db.total-db.afrmm-db.seguro;
  let ii=0,ipi=0,pis=0,cofins=0,cifTot=0;
  prods.forEach(p=>{
    const itemFobBRL=(p.qty*p.fob+(oemInFob?p.oem:0))*fx;
    const share=fobBRL>0?itemFobBRL/fobBRL:0;
    const cif=itemFobBRL+freteBRL*share+seguro*share;
    cifTot+=cif;
    const i_ii=cif*(p.ii/100);
    ii+=i_ii;
    ipi+=(cif+i_ii)*(p.ipi/100);
    pis+=cif*(p.pis/100);
    cofins+=cif*(p.cofins/100);
  });
  return{fobUSD,fobBRL,freteBRL,cif:cifTot,ii,ipi,pis,cofins,afrmm,dest,seguro,oemForaBRL,qtyTot:pk.qtyTot};
}

/* ════════ CÁLCULO BR ════════ */
function calcBR(icmsRate,isTrading){
  const t=importTaxes();

  if(isTrading){
    // ═ Via Trading (benefício SC) — replica EXATAMENTE a aba "Encomenda" da planilha real ═
    // Na planilha não existe uma linha de "ICMS de importação" separada para a Trading:
    // o ICMS é inteiramente apurado DENTRO do gross-up da nota de saída (colunas AE→AF→AG→AL).
    // "Total NF entrada" (col. AE) = CIF + II + IPI + PIS + COFINS + despesas — SEM ICMS.
    const custoImport=t.cif+t.ii+t.ipi+t.pis+t.cofins+t.afrmm+t.dest; // = coluna AE "TOTAL NF ENTRADA"
    const markupR=pct('markup'), icmsS=icmsRate; // "Trading SC %" = mesma alíquota do benefício, usada no próprio gross-up (planilha: uma única coluna AK)
    const pisNom=pct('pisSaida'), cofNom=pct('cofinsSaida');
    // PIS/COFINS efetivos = nominal − (nominal × ICMS saída)
    const pisEf=pisNom-(pisNom*icmsS);
    const cofEf=cofNom-(cofNom*icmsS);
    // Fator AF = 1 − ICMS − markup − PIS_ef − COFINS_ef
    const fator=1-icmsS-markupR-pisEf-cofEf;
    // Crédito nacionalização (col. AD) = −(IPI+PIS+COFINS); ICMS NÃO entra aqui
    const credNac=-(t.ipi+t.pis+t.cofins);
    // Base NF saída (col. AG/AH) = (Total NF entrada + créditos nac.) / fator
    const baseSaida=fator>0?(custoImport+credNac)/fator:0;
    const markup=baseSaida*markupR;
    const icms=baseSaida*icmsS;      // = coluna AL — ICMS calculado sobre a BASE FINAL, não sobre o CIF
    const pisSv=baseSaida*pisEf;
    const cofSv=baseSaida*cofEf;
    // IPI saída = base × alíquota IPI (média ponderada dos itens de entrada)
    const ipiRate=(t.cif+t.ii)>0?t.ipi/(t.cif+t.ii):0;
    const ipiSv=baseSaida*ipiRate;
    // NF saída total = base + IPI saída (base já embute markup/ICMS/PIS/COFINS via fator)
    const nfSaida=baseSaida+ipiSv;
    // Crédito do cliente AV (Lucro Presumido credita só ICMS+IPI da saída)
    const credCliente=icms+ipiSv;
    const repasse=baseSaida*pct('repasse');
    // OEM "por fora": não passa pelo gross-up (sem markup/ICMS/PIS/COFINS em cima), mas é desembolso real
    const custoLiquido=nfSaida-credCliente-repasse+t.oemForaBRL;
    const caixa=nfSaida+t.oemForaBRL;             // o que a AV desembolsa (NF saída + OEM por fora)
    const diferido=credCliente;      // ICMS+IPI da saída = crédito preso da AV
    const impostos=t.ii+t.ipi+t.pis+t.cofins+icms;
    const creditos=t.ipi+icms;       // mantido só para referência; não é o que reduz o custo líquido aqui (ver credCliente)
    const rev={markup,icmsSv:icms,pisSv,cofSv,ipiSv,nfSaida,credCliente,repasse,baseSaida,fator,credNac:-credNac};
    const custoUnit=t.qtyTot>0?custoLiquido/t.qtyTot:0;
    const caixaUnit=t.qtyTot>0?caixa/t.qtyTot:0;
    const difUnit=t.qtyTot>0?diferido/t.qtyTot:0;
    return{...t,icms,impostos,custoImport,creditos,custoLiquido,custoUnit,caixa,diferido,caixaUnit,difUnit,rev,icmsRate};
  }

  // ═ AV Direto — ICMS de importação pago no desembaraço (gross-up simples sobre CIF+impostos+despesas) ═
  const baseICMS=(t.cif+t.ii+t.ipi+t.pis+t.cofins+t.afrmm+t.dest)/(1-icmsRate);
  const icms=baseICMS*icmsRate;
  const impostos=t.ii+t.ipi+t.pis+t.cofins+icms;
  const custoImport=t.cif+impostos+t.afrmm+t.dest;
  const creditos=t.ipi+icms;        // IPI + ICMS de entrada = diferido
  // OEM "por fora": custo real, sem gerar crédito de imposto
  const custoLiquido=custoImport-creditos+t.oemForaBRL;
  const caixa=custoImport+t.oemForaBRL;
  const diferido=creditos;
  const custoUnit=t.qtyTot>0?custoLiquido/t.qtyTot:0;
  const caixaUnit=t.qtyTot>0?caixa/t.qtyTot:0;
  const difUnit=t.qtyTot>0?diferido/t.qtyTot:0;
  return{...t,icms,impostos,custoImport,creditos,custoLiquido,custoUnit,caixa,diferido,caixaUnit,difUnit,rev:null,icmsRate};
}

/* ════════ FY ════════ */
function calcFY(){
  const pk=packing();
  let custoUSD=0;
  prods.forEach(p=>{const oemUn=p.qty>0?p.oem/p.qty:0;custoUSD+=(p.fob+oemUn)*p.qty;});
  return{custoTotalUSD:custoUSD,custoUnit:pk.qtyTot>0?custoUSD/pk.qtyTot:0,qtyTot:pk.qtyTot};
}

/* ════════ PREÇO/MARGEM ════════ */
function priceMargin(custoUnit,salePrice){
  if(_mode==='price'&&salePrice>0)return{preco:salePrice,margem:(salePrice-custoUnit)/salePrice};
  const m=val('margAlvo')/100;
  return{preco:m<1?custoUnit/(1-m):custoUnit,margem:m};
}
function priceMarginFY(c){const m=val('fyMarg')/100;return{preco:m<1?c/(1-m):c,margem:m};}

/* ════════ RECALC ════════ */
function recalc(){
  const pk=packing();
  updateShippingSuggestion();
  document.getElementById('un-tot').textContent=pk.qtyTot.toLocaleString('pt-BR');
  document.getElementById('cbm-tot').textContent=f3(pk.cbm);
  document.getElementById('cx-tot').textContent=pk.caixas.toLocaleString('pt-BR');
  document.getElementById('peso-tot').textContent=Math.round(pk.peso).toLocaleString('pt-BR');
  // três containers lado a lado
  const conts=[{n:"20' DRY",cap:28},{n:"40' NOR",cap:56},{n:"40' HC",cap:69}];
  document.getElementById('cont-occ').innerHTML=conts.map(c=>{
    const fill=c.cap>0?pk.cbm/c.cap*100:0;
    const col=fill>100?'var(--red)':fill>90?'var(--amber)':'var(--green)';
    return `<div style="background:var(--ltgry);border:1px solid var(--bdr);border-radius:8px;padding:.5rem .65rem">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.3rem">
        <span style="font-size:.66rem;font-weight:600;color:var(--ink2)">${c.n}</span>
        <span style="font-size:.62rem;color:var(--ink4);font-family:'IBM Plex Mono'">${c.cap} m³</span>
      </div>
      <div style="display:flex;align-items:center;gap:.4rem">
        <div style="flex:1;height:7px;background:var(--bdr);border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.min(100,fill)}%;background:${col}"></div></div>
        <span style="font-size:.72rem;font-weight:700;font-family:'IBM Plex Mono';color:${col}">${Math.round(fill)}%</span>
      </div>
    </div>`;
  }).join('');

  const fy=calcFY();
  const av=calcBR(pct('icmsAV'),false);
  const tr=calcBR(pct('icmsTR'),true);
  const fx=val('fx');
  const sale=val('precoVenda');
  const avPM=priceMargin(av.custoUnit,_mode==='price'?sale:0);
  const trPM=priceMargin(tr.custoUnit,_mode==='price'?sale:0);
  const fyPM=priceMarginFY(fy.custoUnit);
  renderCmp(fy,av,tr,fyPM,avPM,trPM,fx);
  renderInsight(av,tr,fy,fx);
}

function renderCmp(fy,av,tr,fyPM,avPM,trPM,fx){
  const C=(cls,txt)=>`<div class="${cls}">${txt}</div>`;
  const R=(lbl,fyV,avV,trV,extra='')=>C('lbl '+extra,lbl)+C('v '+extra,fyV)+C('v '+extra,avV)+C('v '+extra,trV);
  const best=tr.custoLiquido<av.custoLiquido?'tr':'av';
  const bestCash=tr.diferido>av.diferido?'tr':'av'; // maior crédito diferido = menos desencaixe de caixa agora
  let h='';
  h+=C('colh corner','');
  h+=C('colh fy','Ásia / FY<span class="csub">FOB+margem · US$</span>');
  h+=C('colh av','AV Direto<span class="csub">RJ · ICMS '+fPct(av.icmsRate)+'</span>'+(best==='av'?'<span class="tag">+barato</span>':'')+(bestCash==='av'?'<span class="tag tag-cash">↓desencaixe</span>':''));
  h+=C('colh tr','Via Trading<span class="csub">SC · ICMS '+fPct(tr.icmsRate)+'</span>'+(best==='tr'?'<span class="tag">+barato</span>':'')+(bestCash==='tr'?'<span class="tag tag-cash">↓desencaixe</span>':''));
  // ── BLOCO-RESUMO: CAIXA × DIFERIDO × LÍQUIDO (a decisão) ──
  h+=C('sec','💰 Decisão de caixa');
  h+=R('<b>💸 Desembolso de caixa</b><br><span style="font-size:.6rem;color:var(--ink4)">o que sai do bolso agora</span>','—',
      `<b style="color:var(--red)">${fR(av.caixa)}</b>`,
      `<b style="color:var(--red)">${fR(tr.caixa)}</b>`,'cash');
  h+=R('<b>⏳ Crédito diferido</b><br><span style="font-size:.6rem;color:var(--ink4)">ICMS+IPI presos, a compensar</span>','—',
      `<span style="color:var(--amber)">${fR(av.diferido)}</span>`,
      `<span style="color:var(--amber)">${fR(tr.diferido)}</span>`,'dif');
  h+=R('<b>= Custo líquido contábil</b><br><span style="font-size:.6rem;color:var(--ink4)">caixa − diferido</span>',
      fU(fy.custoTotalUSD),
      `<b>${fR(av.custoLiquido)}</b>`,
      `<b>${fR(tr.custoLiquido)}</b>`,'liq');
  h+=C('sec','Custo de importação (detalhe)');
  h+=R('FOB',fU(fy.custoTotalUSD),fR(av.fobBRL),fR(tr.fobBRL));
  h+=R('Frete + CIF','—',fR(av.cif),fR(tr.cif));
  h+=R('I.I.+IPI+PIS+COFINS','—',fR(av.ii+av.ipi+av.pis+av.cofins),fR(tr.ii+tr.ipi+tr.pis+tr.cofins));
  h+=R('ICMS importação',"—",fR(av.icms),'—<span style="font-size:.55rem;color:var(--ink4)"> (apurado só na saída ↓)</span>');
  h+=R('AFRMM + despesas destino','—',fR(av.afrmm+av.dest),fR(tr.afrmm+tr.dest));
  h+=R('(−) Créditos entrada','—','−'+fR(av.creditos),'—');
  h+=R('(+) OEM por fora do FOB','—',fR(av.oemForaBRL),fR(tr.oemForaBRL));
  h+=C('sec','Camada revenda Trading → AV');
  h+=R('Base NF saída (gross-up ÷'+(tr.rev?tr.rev.fator.toFixed(4):'—')+')','—','—',fR(tr.rev?tr.rev.baseSaida:0));
  h+=R('↳ ICMS saída (Trading SC %)','—','—',fR(tr.rev?tr.rev.icmsSv:0),'sub');
  h+=R('↳ Markup + PIS/COFINS efet. + IPI saída','—','—',fR(tr.rev?(tr.rev.markup+tr.rev.pisSv+tr.rev.cofSv+tr.rev.ipiSv):0),'sub');
  h+=R('(−) Créditos cliente AV','—','—','−'+fR(tr.rev?tr.rev.credCliente:0));
  h+=R('(−) Repasse comercial','—','—','−'+fR(tr.rev?tr.rev.repasse:0));
  h+=C('sec','Resultado por unidade');
  h+=R('Custo unitário (líquido)',f3(fy.custoUnit)+' US$',f3(av.custoUnit)+' R$',f3(tr.custoUnit)+' R$','hero');
  h+=R('↳ caixa por unidade','—',f3(av.caixaUnit)+' R$',f3(tr.caixaUnit)+' R$','sub');
  h+=R('↳ moeda oposta',f3(fy.custoUnit*fx)+' R$',f3(av.custoUnit/fx)+' US$',f3(tr.custoUnit/fx)+' US$','sub');

  // ── RESULTADO: FOB / Frete-Seguro / CIF / Custo Importação / Custo Trading / Total ──
  // Por construção, Total = FOB+Frete/Seguro+CustoImportação+CustoTrading sempre bate exatamente
  // com o "Custo unitário (líquido)" de cima — é só uma forma diferente de fatiar o mesmo número.
  const qty=fy.qtyTot||1;
  const fobFY=fy.custoTotalUSD;
  const fobAV=av.fobBRL, fsAV=av.cif-av.fobBRL, cifAV=av.cif, ciAV=av.custoLiquido-av.cif, ctAV=0, totAV=av.custoLiquido;
  const fobTR=tr.fobBRL, fsTR=tr.cif-tr.fobBRL, cifTR=tr.cif, ciTR=tr.custoImport-tr.cif, ctTR=tr.custoLiquido-tr.cif-ciTR, totTR=tr.custoLiquido;
  const RB=(lbl,fyV,avV,trV,extra='')=>{
    let hh=R(lbl,fyV===null?'—':fU(fyV),fR(avV),fR(trV),extra);
    hh+=R('<span style="font-size:.55rem">↳ unit. / moeda oposta</span>',
      fyV===null?'—':f3(fyV/qty)+' US$ · '+f3(fyV*fx/qty)+' R$',
      f3(avV/qty)+' R$ · '+f3(avV/fx)+' US$',
      f3(trV/qty)+' R$ · '+f3(trV/fx)+' US$','sub');
    return hh;
  };
  h+=C('sec','💵 Resultado — FOB · Frete/Seguro · CIF · Importação · Trading (total e unitário, $ e R$)');
  h+=RB('FOB',fobFY,fobAV,fobTR);
  h+=RB('Frete/Seguro',null,fsAV,fsTR);
  h+=RB('CIF (=FOB+Frete/Seguro)',null,cifAV,cifTR,'liq');
  h+=RB('Custo Importação',null,ciAV,ciTR);
  h+=RB('Custo Trading',null,ctAV,ctTR);
  h+=RB('<b>Total</b> (=FOB+Frete/Seg.+Importação+Trading)',fobFY,totAV,totTR,'hero');

  h+=C('sec',_mode==='price'?'Margem (a partir do preço informado)':'Preço sugerido (margem-alvo)');
  h+=R('Preço unitário',f3(fyPM.preco)+' US$',f3(avPM.preco)+' R$',f3(trPM.preco)+' R$','hero');
  h+=R('↳ moeda oposta',f3(fyPM.preco*fx)+' R$',f3(avPM.preco/fx)+' US$',f3(trPM.preco/fx)+' US$','sub');
  h+=R('Margem',fPct(fyPM.margem),fPct(avPM.margem),fPct(trPM.margem));
  document.getElementById('cmp').innerHTML=h;
}

function renderInsight(av,tr,fy,fx){
  const el=document.getElementById('insight');
  if(av.qtyTot===0){el.innerHTML='Preencha os produtos para ver a análise comparativa.';return;}
  const difCaixa=av.caixa-tr.caixa;       // quanto a mais a AV exige de caixa
  const difLiq=av.custoLiquido-tr.custoLiquido;
  let txt='';
  if(difCaixa>0){
    txt=`<b>Caixa:</b> a <b>AV Direto</b> exige <b>${fR(difCaixa)}</b> a mais de desembolso agora — dos quais boa parte é ICMS de importação (${fPct(av.icmsRate)}) que vira <b>crédito diferido</b> (${fR(av.diferido)}), preso até haver débitos futuros para compensar. A <b>Via Trading</b> preserva caixa: não paga ICMS separado na entrada — ele é apurado só na nota de saída, à alíquota de ${fPct(tr.icmsRate)}, com diferido bem menor (${fR(tr.diferido)}). `;
  } else {
    txt=`<b>Caixa:</b> a Via Trading exige ${fR(-difCaixa)} a mais de desembolso agora. `;
  }
  if(difLiq>0){
    txt+=`No <b>custo líquido contábil</b>, a Trading ainda fica <b>${fR(difLiq)}</b> mais barata. `;
  } else if(difLiq<0){
    txt+=`Já no <b>custo líquido contábil</b>, a AV Direto fica ${fR(-difLiq)} mais barata — a diferença está no crédito diferido que, se você conseguir compensar no tempo, reduz o custo real. `;
  }
  txt+=`A rota <b>Ásia/FY</b> sai a ${f3(fy.custoUnit*fx)} R$/un (sem nacionalização, p/ revenda fora do Brasil).`;
  el.innerHTML=txt;
}

/* ════════ EXEMPLO ════════ */
function loadExample(){
  prods=[];
  addProd({desc:'Sacola Ráfia',ncm:'4202.92.00',qty:40000,fob:0.29,oem:1500,cxL:42,cxW:23,cxH:37,unCx:100,pesoCx:7});
  document.getElementById('fx').value='5.50';
  document.getElementById('fxFrete').value='5.665';
  document.getElementById('frete').value='3500';
  document.getElementById('margAlvo').value='40';
  document.getElementById('precoVenda').value='';
  _mode='cost';recalc();
}

/* ════════ IMPORTAÇÃO — CALCULADORA COMPLETA (MOTOR INDEPENDENTE) ════════ */
let cfProducts=[],cfLast=null,cfSeq=0;
const CF_NCM={
  '42029200':{name:'Com superfície exterior de plástico ou matéria têxtil',ii:35,ipi:6.5,pis:2.1,cofins:9.65}
};
function impShowPane(id){
  ['compare','landed'].forEach(x=>{
    document.getElementById('impane-'+x)?.classList.toggle('active',x===id);
    document.getElementById('imptab-'+x)?.classList.toggle('active',x===id);
  });
  if(id==='landed')cfCalc();
}
function cfNum(id){const n=parseFloat(document.getElementById(id)?.value);return Number.isFinite(n)?n:0}
function cfMoney(n){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0)}
function cfNcm(v){return String(v||'').replace(/\D/g,'').slice(0,8)}
function cfNcmFmt(v){const n=cfNcm(v);return n.replace(/^(\d{4})(\d{2})(\d{0,2}).*/,(_,a,b,c)=>a+'.'+b+(c?'.'+c:''))}
function cfAddProduct(d={}){
  const seed=CF_NCM[cfNcm(d.ncm)]||{};
  cfProducts.push({id:++cfSeq,name:d.name||'',qty:d.qty??1,price:d.price??0,priceType:d.priceType||'UNIT',currency:d.currency||'USD',volume:d.volume??0,volumeType:d.volumeType||'TOTAL',weight:d.weight??0,weightType:d.weightType||'TOTAL',ncm:cfNcmFmt(d.ncm||''),ii:d.ii??seed.ii??0,ipi:d.ipi??seed.ipi??0,pis:d.pis??seed.pis??2.1,cofins:d.cofins??seed.cofins??9.65});
  cfRenderProducts();cfCalc();
}
function cfRemoveProduct(id){cfProducts=cfProducts.filter(p=>p.id!==id);cfRenderProducts();cfCalc()}
function cfSet(id,key,value){const p=cfProducts.find(x=>x.id===id);if(!p)return;p[key]=value;if(key==='ncm'){p.ncm=cfNcmFmt(value);const n=CF_NCM[cfNcm(value)];if(n){p.ii=n.ii;p.ipi=n.ipi;p.pis=n.pis;p.cofins=n.cofins;cfRenderProducts();}}cfCalc()}
function cfRenderProducts(){
  const root=document.getElementById('cf-products');if(!root)return;
  root.innerHTML=cfProducts.map((p,i)=>`<div class="cf-product">
    <div class="cf-product-head"><span>Produto ${i+1}</span><button class="cf-rm" onclick="cfRemoveProduct(${p.id})">Remover</button></div>
    <div class="cf-product-body">
      <div class="cf-field cf-span2"><label>Nome do produto</label><input value="${esc(p.name)}" oninput="cfSet(${p.id},'name',this.value)"></div>
      <div class="cf-field"><label>Quantidade</label><input type="number" min="0" step="1" value="${p.qty}" oninput="cfSet(${p.id},'qty',+this.value)"></div>
      <div class="cf-field"><label>Moeda</label><select onchange="cfSet(${p.id},'currency',this.value)">${['USD','CNY','BRL'].map(x=>`<option ${p.currency===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="cf-field"><label>Preço</label><input type="number" min="0" step=".0001" value="${p.price}" oninput="cfSet(${p.id},'price',+this.value)"></div>
      <div class="cf-field"><label>Preço informado</label><select onchange="cfSet(${p.id},'priceType',this.value)"><option value="UNIT" ${p.priceType==='UNIT'?'selected':''}>Unitário</option><option value="TOTAL" ${p.priceType==='TOTAL'?'selected':''}>Total</option></select></div>
      <div class="cf-field"><label>Volume (m³)</label><input type="number" min="0" step=".0001" value="${p.volume}" oninput="cfSet(${p.id},'volume',+this.value)"></div>
      <div class="cf-field"><label>Volume informado</label><select onchange="cfSet(${p.id},'volumeType',this.value)"><option value="TOTAL" ${p.volumeType==='TOTAL'?'selected':''}>Total</option><option value="UNIT" ${p.volumeType==='UNIT'?'selected':''}>Unitário</option></select></div>
      <div class="cf-field"><label>Peso (kg)</label><input type="number" min="0" step=".001" value="${p.weight}" oninput="cfSet(${p.id},'weight',+this.value)"></div>
      <div class="cf-field"><label>Peso informado</label><select onchange="cfSet(${p.id},'weightType',this.value)"><option value="TOTAL" ${p.weightType==='TOTAL'?'selected':''}>Total</option><option value="UNIT" ${p.weightType==='UNIT'?'selected':''}>Unitário</option></select></div>
      <div class="cf-field cf-span2"><label>NCM</label><input value="${esc(p.ncm)}" placeholder="0000.00.00" onblur="cfSet(${p.id},'ncm',this.value)"><span class="cf-note">4202.92.00 possui alíquotas confirmadas; demais NCMs são editáveis.</span></div>
      ${[['ii','II %'],['ipi','IPI %'],['pis','PIS %'],['cofins','COFINS %']].map(([k,l])=>`<div class="cf-field"><label>${l}</label><input type="number" step=".01" value="${p[k]}" oninput="cfSet(${p.id},'${k}',+this.value)"></div>`).join('')}
    </div></div>`).join('');
  document.getElementById('cf-count').textContent=cfProducts.length;
}
function cfModal(volume){
  const chosen=document.getElementById('cf-modal')?.value||'AUTO';if(chosen!=='AUTO')return chosen;
  if(!(volume>0))return '—';if(volume<=15)return 'LCL';if(volume<=28)return "FCL 20'";if(volume<=56)return "FCL 40' NOR";if(volume<=69)return "FCL 40' HC";return Math.ceil(volume/69)+' contêineres / manual';
}
function cfCompute(){
  const usd=cfNum('cf-usd'),cny=cfNum('cf-cny'),rate=c=>c==='BRL'?1:c==='CNY'?cny:usd;
  const items=cfProducts.map(p=>{const qty=Math.max(0,+p.qty||0),product=(p.priceType==='TOTAL'?+p.price:(+p.price*qty))*rate(p.currency),volume=(+p.volume||0)*(p.volumeType==='UNIT'?qty:1),weight=(+p.weight||0)*(p.weightType==='UNIT'?qty:1);return{...p,qty,product,volume,weight}});
  const product=items.reduce((s,p)=>s+p.product,0),qty=items.reduce((s,p)=>s+p.qty,0),volume=items.reduce((s,p)=>s+p.volume,0),weight=items.reduce((s,p)=>s+p.weight,0);
  const fc=document.getElementById('cf-freight-cur')?.value||'USD',freight=cfNum('cf-freight')*rate(fc),insurance=(product+freight)*cfNum('cf-ins')/100,cif=product+freight+insurance;
  let ii=0,ipi=0,pis=0,cofins=0;const detail=items.map(p=>{const share=product>0?p.product/product:(items.length?1/items.length:0),pcif=cif*share,pii=pcif*(p.ii/100),pipi=(pcif+pii)*(p.ipi/100),ppis=pcif*(p.pis/100),pcof=pcif*(p.cofins/100);ii+=pii;ipi+=pipi;pis+=ppis;cofins+=pcof;return{...p,share,cif:pcif,ii:pii,ipi:pipi,pis:ppis,cofins:pcof}});
  const icmsRate=cfNum('cf-icms')/100,icmsBase=icmsRate<1?(cif+ii+ipi+pis+cofins)/(1-icmsRate):0,icms=icmsBase*icmsRate,taxes=ii+ipi+pis+cofins+icms;
  const expenses=cfNum('cf-sis')+cfNum('cf-awb')+cfNum('cf-storage')+cfNum('cf-broker')+cfNum('cf-sda')+cfNum('cf-brok')+cfNum('cf-other')+cfNum('cf-national')+cfNum('cf-catalog')*items.length;
  const imported=cif+taxes+expenses,credits=ipi+pis+cofins+icms,post=imported-credits;
  const saleRate=(cfNum('cf-pis-sale')+cfNum('cf-cof-sale')+cfNum('cf-icms-sale')+cfNum('cf-admin'))/100,saleBase=saleRate<1?post/(1-saleRate):0;
  const weightedIpi=(cif+ii)>0?ipi/(cif+ii):0,saleIpi=saleBase*weightedIpi,final=saleBase+saleIpi,unit=qty?final/qty:0;
  return{items,detail,product,qty,volume,weight,freight,insurance,cif,ii,ipi,pis,cofins,icms,taxes,expenses,imported,credits,post,saleRate,saleBase,saleIpi,final,unit,modal:cfModal(volume)};
}
function cfCalc(){
  if(!document.getElementById('cf-result-body'))return;const r=cfCompute();cfLast=r;
  document.getElementById('cf-mode').innerHTML=`<b>${esc(r.modal)}</b><br>${f3(r.volume)} m³ · ${f3(r.weight)} kg`;
  if(!r.items.length){document.getElementById('cf-result-body').innerHTML='<div class="cf-warn">Adicione um produto e informe os dados para calcular.</div>';cfSave();return}
  const row=(a,b,c='')=>`<div class="${c}">${a}</div><div class="cf-v ${c}">${b}</div>`,line=(a,b)=>`<div class="cf-line"><span>${a}</span><b>${cfMoney(b)}</b></div>`;
  document.getElementById('cf-result-body').innerHTML=`
    <div class="cf-summary">${row('Produto(s)',esc(r.items.map(x=>x.name||'Sem nome').join(', ')))}${row('Volume / peso',f3(r.volume)+' m³ · '+f3(r.weight)+' kg')}${row('Preço total fornecedor',cfMoney(r.product))}${row('Frete internacional',cfMoney(r.freight))}${row('Seguro',cfMoney(r.insurance))}${row('Tributos de importação',cfMoney(r.taxes))}${row('Despesas no Brasil',cfMoney(r.expenses))}${row('Custo total final',cfMoney(r.final),'cf-total')}${row('Custo unitário',cfMoney(r.unit),'cf-total')}</div>
    <div class="cf-details">
      <details><summary>Cálculo detalhado — como chegamos ao valor final</summary><div class="cf-detail-body">${line('Produtos',r.product)}${line('+ Frete internacional',r.freight)}${line('+ Seguro',r.insurance)}${line('= CIF (valor aduaneiro)',r.cif)}${line('+ Tributos',r.taxes)}${line('+ Despesas no Brasil',r.expenses)}${line('= Custo importado',r.imported)}${line('− Créditos de importação',-r.credits)}${line('= Base pós-crédito',r.post)}${line('Base com tributos de venda',r.saleBase)}${line('+ IPI na venda',r.saleIpi)}${line('= Custo total final',r.final)}</div></details>
      <details><summary>Detalhes dos tributos</summary><div class="cf-detail-body">${line('II',r.ii)}${line('IPI',r.ipi)}${line('PIS',r.pis)}${line('COFINS',r.cofins)}${line('ICMS por dentro',r.icms)}${line('Total tributos',r.taxes)}</div></details>
      <details><summary>Produtos e rateio do CIF</summary><div class="cf-detail-body">${r.detail.map(p=>`<div class="cf-line"><span>${esc(p.name||'Produto')} · ${esc(p.ncm||'sem NCM')} · ${(p.share*100).toFixed(2)}%</span><b>${cfMoney(p.cif)}</b></div>`).join('')}</div></details>
      <details><summary>Frete e cubagem</summary><div class="cf-detail-body"><div class="cf-line"><span>Modal indicado</span><b>${esc(r.modal)}</b></div><div class="cf-line"><span>Volume total</span><b>${f3(r.volume)} m³</b></div><div class="cf-line"><span>Peso total</span><b>${f3(r.weight)} kg</b></div>${line('Frete informado',r.freight)}</div></details>
    </div>`;cfSave();
}
function cfSnapshot(){const ids=['cf-usd','cf-cny','cf-ins','cf-icms','cf-pis-sale','cf-cof-sale','cf-icms-sale','cf-admin','cf-modal','cf-freight','cf-freight-cur','cf-sis','cf-awb','cf-storage','cf-broker','cf-sda','cf-brok','cf-catalog','cf-other','cf-national','cf-note'],fields={};ids.forEach(id=>{const e=document.getElementById(id);if(e)fields[id]=e.value});return{products:cfProducts,fields}}
function cfSave(){try{localStorage.setItem('fgl_cf_calc_v1',JSON.stringify(cfSnapshot()))}catch(e){}}
function cfLoad(){try{const s=JSON.parse(localStorage.getItem('fgl_cf_calc_v1')||'null');if(!s)return false;cfProducts=(s.products||[]).map(p=>({...p,id:++cfSeq}));Object.entries(s.fields||{}).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v});return true}catch(e){return false}}
function cfReset(){if(!confirm('Limpar esta simulação completa?'))return;localStorage.removeItem('fgl_cf_calc_v1');cfProducts=[];cfAddProduct({ncm:'4202.92.00'});}
function cfPrint(detail){document.querySelectorAll('#cf-result details').forEach(d=>d.open=!!detail);window.print()}
function cfExportXlsx(){
  const r=cfLast||cfCompute();if(!r.items.length)return alert('Adicione ao menos um produto.');
  const rows=[['SIMULAÇÃO DE CUSTO DE IMPORTAÇÃO',''],['Modal',r.modal],['Volume m³',r.volume],['Peso kg',r.weight],[],['RESUMO','BRL'],['Produtos',r.product],['Frete internacional',r.freight],['Seguro',r.insurance],['CIF',r.cif],['II',r.ii],['IPI',r.ipi],['PIS',r.pis],['COFINS',r.cofins],['ICMS',r.icms],['Despesas Brasil',r.expenses],['Custo importado',r.imported],['Créditos',r.credits],['Base pós-crédito',r.post],['Custo total final',r.final],['Custo unitário',r.unit],[],['PRODUTOS','Qtd','NCM','Valor BRL','CIF rateado']];r.detail.forEach(p=>rows.push([p.name,p.qty,p.ncm,p.product,p.cif]));
  if(window.XLSX){const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'Custo Importação');XLSX.writeFile(wb,'simulacao-importacao.xlsx')}else{const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='simulacao-importacao.csv';a.click()}
}

/* ════════ CRIPTOGRAFIA (AES-256-GCM, chave derivada da senha por PBKDF2) ════════
   A senha do cofre NUNCA é gravada em disco nem embutida no código — só existe
   em memória enquanto a aba estiver aberta. O envelope cifrado carrega consigo
   os parâmetros usados (formatVersion/cryptoVersion/kdf/iterations/salt/iv),
   pra permitir mudar esses parâmetros no futuro sem quebrar backups antigos. */
function buf2b64(buf){let bin='';new Uint8Array(buf).forEach(b=>bin+=String.fromCharCode(b));return btoa(bin);}
function b642buf(b64){const bin=atob(b64);const buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);return buf;}
const PBKDF2_ITER=100000;
async function deriveKey(password,salt,iterations){
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptJSON(password,obj){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(password,salt,PBKDF2_ITER);
  const pt=new TextEncoder().encode(JSON.stringify(obj));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt);
  return{formatVersion:1,cryptoVersion:1,kdf:'PBKDF2-SHA256',iterations:PBKDF2_ITER,salt:buf2b64(salt),iv:buf2b64(iv),ciphertext:buf2b64(ct)};
}
async function decryptJSON(password,payload){
  const iterations=payload.iterations||PBKDF2_ITER;
  const salt=b642buf(payload.salt),iv=b642buf(payload.iv),ct=b642buf(payload.ciphertext||payload.data);
  const key=await deriveKey(password,salt,iterations);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct); // lança erro se a senha estiver errada
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ════════ SUPABASE (backend real: Auth + RLS + revisão) ════════ */
const SUPA_URL='https://zytlxglrzjzcybxhhgso.supabase.co';
const SUPA_KEY='sb_publishable_R059JG4GGKZa2aacg3ceHQ_v9vgLSzD';
let _supa=null,_supaOK=false;
try{if(window.supabase){_supa=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true}});_supaOK=true;}}catch(e){console.warn('Supabase init falhou:',e);}
function localTs(key){return localStorage.getItem(key+'_ts')||'';}
function setLocalTs(key){localStorage.setItem(key+'_ts',new Date().toISOString());}

/* ── CONTA (Supabase Auth — e-mail + senha, controla QUEM pode ler/escrever) ── */
const FRED_EMAIL='fred@animaverde.com.br'; // único e-mail com acesso à Importação e ao Tracker
const META_REVIEWER_UID='522a36fb-5716-4292-8b90-a455dfa6341b';
const META_REVIEWER_EMAIL='meta.reviewer@animaverde.com.br';
function isMetaReviewer(){return !!(authUser&&authUser.id===META_REVIEWER_UID);}
function isMetaReviewerEmail(v){return (v||'').trim().toLowerCase()===META_REVIEWER_EMAIL;}
let authUser=null;      // {id,email} quando logado
let _pendingTab=null;   // pra retomar o fluxo (Importação/Revenda) depois do login
function updateAuthUI(){
  const el=document.getElementById('auth-status');
  if(el)el.textContent=authUser?('🟢 '+authUser.email):'👤 Minha conta';
  updateHeaderVisibility();
}
function updateHeaderVisibility(){
  const isFred=!!(authUser&&authUser.email&&authUser.email.toLowerCase()===FRED_EMAIL);
  const reviewer=isMetaReviewer();
  const tabImport=document.getElementById('tab-import');
  const tabTracker=document.getElementById('tab-tracker');
  const btnSecurity=document.getElementById('btn-security');
  if(tabImport)tabImport.style.display=(!reviewer&&isFred)?'':'none';
  if(tabTracker)tabTracker.style.display=(!reviewer&&isFred)?'':'none';
  if(btnSecurity)btnSecurity.style.display=(!reviewer&&isFred)?'':'none';
  applyMetaReviewerMode();
}
function applyMetaReviewerMode(){
  if(!isMetaReviewer())return;
  // Reviewer vê somente CRM > Clientes. RLS continua sendo a barreira de segurança dos dados.
  ['rvtab-calc','rvtab-cotacoes','rvtab-pedidos','rvtab-fin'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  ['rvpane-calc','rvpane-cotacoes','rvpane-pedidos','rvpane-fin'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('active');});
  ['crmtab-semana','crmtab-projetos'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  ['crmpane-semana','crmpane-projetos'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('active');});
  // Controles de vault/arquivo não fazem parte do fluxo de App Review.
  ['rv-sync-status'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  document.querySelectorAll('header .hbtn').forEach(e=>{if(e.id!=='auth-status')e.style.display='none';});
  _rvCurTab='crm';
  const crmPane=document.getElementById('rvpane-crm'),crmTab=document.getElementById('rvtab-crm');
  if(crmPane)crmPane.classList.add('active');
  if(crmTab){crmTab.classList.add('active');crmTab.style.display='';}
  setTimeout(()=>{crmCheckAccess();crmShowSubTab('clientes');},0);
}
function updateAuthModalForEmail(){
  const email=document.getElementById('auth-email');
  const reviewer=isMetaReviewerEmail(email&&email.value);
  const vault=document.getElementById('auth-vault-pw');
  const help=document.getElementById('auth-help');
  const signup=document.getElementById('auth-signup-btn');
  const signupHelp=document.getElementById('auth-signup-help');
  if(vault)vault.style.display=reviewer?'none':'';
  if(help)help.textContent=reviewer?'Acesso de revisão. Entre com e-mail e senha.':'Acesso restrito. A senha do cofre é opcional e serve apenas para liberar os módulos protegidos.';
  if(signup)signup.style.display=reviewer?'none':'';
  if(signupHelp)signupHelp.style.display=reviewer?'none':'';
}
async function initAuth(){
  if(!_supaOK)return;
  const{data:{session}}=await _supa.auth.getSession();
  if(session)authUser={id:session.user.id,email:session.user.email};
  updateAuthUI();
  _supa.auth.onAuthStateChange((_evt,session)=>{
    authUser=session?{id:session.user.id,email:session.user.email}:null;
    updateAuthUI();
  });
}
function openAuthModal(){
  document.getElementById('auth-err').textContent='';
  document.getElementById('ovl-auth').classList.add('open');
  setTimeout(()=>{const el=document.getElementById('auth-email');if(el){el.focus();el.addEventListener('input',updateAuthModalForEmail,{once:false});updateAuthModalForEmail();}},50);
}
function onAuthButtonClick(){authUser?authSignOut():openAuthModal();}

/* Tenta liberar os vaults que a conta tiver permissão, usando a senha do
   cofre digitada junto no login — falha silenciosa em qualquer um deles
   não é erro (a pessoa pode não ter permissão, ou a senha ser diferente
   por vault; nesses casos os cadeados de cada aba continuam funcionando
   normalmente como plano B). */
async function attemptAutoUnlock(vaultPass){
  if(!vaultPass||!authUser)return;
  if(authUser.email&&authUser.email.toLowerCase()===FRED_EMAIL){
    try{
      const localRaw=localStorage.getItem(SAVE_KEY);
      const cloud=await importCloudGet();
      let vaultToUse=null,fromCloud=false;
      if(cloud&&cloud.blob){
        _importRevision=cloud.revision||1;
        if(!localRaw){vaultToUse=cloud.blob;fromCloud=true;}
        else{const cloudTs=cloud.updated_at||'';fromCloud=cloudTs>=localTs(SAVE_KEY);vaultToUse=fromCloud?cloud.blob:localRaw;}
      }else if(localRaw){vaultToUse=localRaw;_importRevision=0;}
      if(vaultToUse){
        const payload=JSON.parse(vaultToUse);
        const state=await decryptJSON(vaultPass,payload);
        importPass=vaultPass;
        applyState(state.current||state);
        importSimulations=Array.isArray(state.simulations)?state.simulations:[];
        renderSimulacoes();
        recalc();
        if(fromCloud){localStorage.setItem(SAVE_KEY,vaultToUse);setLocalTs(SAVE_KEY);}
        else if(_supaOK){await importCloudSave(vaultToUse);}
      }else{
        importPass=vaultPass;_importRevision=0; // 1º uso — essa senha vira a senha do cofre
      }
    }catch(e){/* senha não bate pro cofre de Importação — sem problema, cadeado da aba cobre depois */}
  }
  try{
    const cloud=await rvCloudGet(); // RLS já filtra: só volta algo se for membro
    if(cloud&&cloud.blob){
      const localRaw=localStorage.getItem('rv_sync_vault');
      const localTsV=localTs('rv_sync_vault');
      let vaultToUse=cloud.blob,fromCloud=true;
      if(localRaw&&localTsV>(cloud.updated_at||'')){vaultToUse=localRaw;fromCloud=false;}
      const payload=JSON.parse(vaultToUse);
      const data=await decryptJSON(vaultPass,payload);
      rvSyncPass=vaultPass;_rvRevision=cloud.revision||1;
      rvApplySyncData(data);
      if(fromCloud){localStorage.setItem('rv_sync_vault',vaultToUse);setLocalTs('rv_sync_vault');}
      else{await rvCloudSave(vaultToUse);}
      updateRvSyncStatus();
    }
  }catch(e){/* senha não bate pro cofre compartilhado, ou ainda não é membro — sem problema */}
}
async function authSignIn(){
  const email=document.getElementById('auth-email').value.trim();
  const pw=document.getElementById('auth-pw').value;
  const vaultPw=isMetaReviewerEmail(email)?'':document.getElementById('auth-vault-pw').value;
  if(!email||!pw){document.getElementById('auth-err').textContent='Preencha e-mail e senha.';return;}
  document.getElementById('auth-err').style.color='';
  document.getElementById('auth-err').textContent='Entrando…';
  const{data,error}=await _supa.auth.signInWithPassword({email,password:pw});
  if(error){document.getElementById('auth-err').style.color='var(--red)';document.getElementById('auth-err').textContent='Erro: '+error.message;return;}
  authUser={id:data.user.id,email:data.user.email};
  updateAuthUI();
  document.getElementById('ovl-auth').classList.remove('open');
  toastSave('Conectado ✓');
  if(!isMetaReviewer())await attemptAutoUnlock(vaultPw);
  document.getElementById('auth-vault-pw').value='';
  if(isMetaReviewer())applyMetaReviewerMode();else _resumePending();
}
async function authSignUp(){
  const email=document.getElementById('auth-email').value.trim();
  const pw=document.getElementById('auth-pw').value;
  const vaultPw=document.getElementById('auth-vault-pw').value;
  if(!email||!pw){document.getElementById('auth-err').textContent='Preencha e-mail e senha.';return;}
  if(pw.length<6){document.getElementById('auth-err').textContent='Senha muito curta (mín. 6 caracteres).';return;}
  document.getElementById('auth-err').style.color='';
  document.getElementById('auth-err').textContent='Criando conta…';
  const{data,error}=await _supa.auth.signUp({email,password:pw});
  if(error){document.getElementById('auth-err').style.color='var(--red)';document.getElementById('auth-err').textContent='Erro: '+error.message;return;}
  if(data.session){
    authUser={id:data.user.id,email:data.user.email};
    updateAuthUI();
    document.getElementById('ovl-auth').classList.remove('open');
    toastSave('Conta criada e conectada ✓');
    await attemptAutoUnlock(vaultPw);
    document.getElementById('auth-vault-pw').value='';
    _resumePending();
  }else{
    document.getElementById('auth-err').textContent='Conta criada — confirme o e-mail (verifique a caixa de entrada) e entre de novo.';
  }
}
async function authSignOut(){
  if(!confirm('Sair da conta ('+authUser.email+')?\nA Importação também tranca de novo.'))return;
  await _supa.auth.signOut();
  authUser=null;importPass=null;rvSyncPass=null;
  sessionStorage.removeItem(SESS_IMPORT_PW);sessionStorage.removeItem(SESS_RV_PW);
  updateAuthUI();
  toastSave('Desconectado');
}
function _resumePending(){
  const p=_pendingTab;_pendingTab=null;
  if(p==='import')checkLock();
  else if(p==='revenda-connect')checkRvLock();
}

/* ════════ IMPORTAÇÃO: vault pessoal (Auth + revisão, sem sobrescrita silenciosa) ════════ */
const SAVE_KEY='fgl_unif_import_v1';
const SAVE_IDS=['fx','fxFrete','frete','modal','icmsAV','icmsTR','markup','pisSaida','cofinsSaida','repasse','margAlvo','fyMarg','precoVenda'];
const IMPORT_VAULT_ID='import';
let _importRevision=0;
let _importSyncTimer=null;
let importSimulations=[]; // {id,name,savedAt,state} — vivem dentro do mesmo blob cifrado do cofre da Importação
function collectState(){
  const fields={};
  SAVE_IDS.forEach(id=>{const el=document.getElementById(id);if(el)fields[id]=el.value;});
  const oemInFob=document.getElementById('oemInFob').checked;
  return{prods,fixedExp,expCfg,fields,oemInFob,mode:_mode};
}
function applyState(state){
  if(state.prods&&state.prods.length){prods=state.prods;renderProds();}
  if(state.fixedExp)fixedExp=state.fixedExp;
  if(state.expCfg)Object.assign(expCfg,state.expCfg);
  Object.entries(state.fields||{}).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v;});
  if(typeof state.oemInFob==='boolean')document.getElementById('oemInFob').checked=state.oemInFob;
  _mode=state.mode||'cost';
}
async function importCloudGet(){
  if(!_supaOK||!authUser)return null;
  try{
    const{data,error}=await _supa.from('app_vault').select('blob,revision,updated_at')
      .eq('user_id',authUser.id).eq('id',IMPORT_VAULT_ID).maybeSingle();
    if(error){console.warn('importCloudGet:',error.message);return null;}
    return data;
  }catch(e){console.warn(e);return null;}
}
async function importCloudSave(blobStr){
  if(!_supaOK||!authUser)return{ok:false,reason:'no-auth'};
  try{
    if(_importRevision===0){
      const{error}=await _supa.from('app_vault').insert({user_id:authUser.id,id:IMPORT_VAULT_ID,blob:blobStr,revision:1});
      if(error){if(error.code==='23505')return{ok:false,reason:'conflict'};console.warn(error.message);return{ok:false,reason:'error'};}
      _importRevision=1;return{ok:true};
    }
    const nextRev=_importRevision+1;
    const{data,error}=await _supa.from('app_vault')
      .update({blob:blobStr,revision:nextRev,updated_at:new Date().toISOString()})
      .eq('user_id',authUser.id).eq('id',IMPORT_VAULT_ID).eq('revision',_importRevision).select();
    if(error){console.warn(error.message);return{ok:false,reason:'error'};}
    if(!data||data.length===0)return{ok:false,reason:'conflict'};
    _importRevision=nextRev;return{ok:true};
  }catch(e){console.warn(e);return{ok:false,reason:'error'};}
}
async function saveState(){
  if(!importPass){toastSave('Desbloqueie a Importação primeiro');return;}
  const payload=await encryptJSON(importPass,{current:collectState(),simulations:importSimulations});
  const payloadStr=JSON.stringify(payload);
  localStorage.setItem(SAVE_KEY,payloadStr);
  setLocalTs(SAVE_KEY);
  if(!authUser){toastSave('Salvo local (sem conta conectada)');return;}
  toastSave('☁ Salvando…');
  clearTimeout(_importSyncTimer);
  _importSyncTimer=setTimeout(async()=>{
    const r=await importCloudSave(payloadStr);
    if(r.ok)toastSave('Salvo, cifrado e sincronizado ✓');
    else if(r.reason==='conflict'){
      toastSave('⚠ Conflito de versão');
      alert('Outra máquina (ou aba) salvou uma versão mais nova enquanto você editava.\n\nClique "↑ Carregar" pra trazer a versão mais recente antes de salvar de novo — senão você sobrescreve o que foi salvo lá.');
    }else toastSave('Salvo local — falha ao sincronizar');
  },1200);
}

/* ── SEGURANÇA — trocar senha da conta e dos cofres ── */
function openSecurityModal(){
  rvEl('sec-import-hint').textContent=importPass
    ?'Importação desbloqueada nesta sessão — pode trocar a senha do cofre.'
    :'Precisa estar com a Importação desbloqueada nesta sessão pra poder trocar (clique na aba Importação e digite a senha atual primeiro).';
  rvEl('sec-import-hint').style.color=importPass?'var(--green)':'var(--ink3)';
  rvEl('sec-rv-hint').innerHTML=rvSyncPass
    ?'⚠ Afeta todo mundo com acesso (você e sua gerente). Combine antes de trocar — quem não souber a senha nova fica sem acesso até você avisar.'
    :'⚠ Precisa estar conectado ao cofre compartilhado nesta sessão pra poder trocar (abra a aba Cotações ou Pedidos e conecte primeiro).';
  document.getElementById('ovl-security').classList.add('open');
}
async function secChangeAccountPw(){
  const newPw=rvEl('sec-acc-pw1').value,confirmPw=rvEl('sec-acc-pw2').value;
  if(!authUser){alert('Entre na conta primeiro.');return;}
  if(!newPw||newPw.length<6){alert('Digite uma senha nova com pelo menos 6 caracteres.');return;}
  if(newPw!==confirmPw){alert('As duas senhas novas não coincidem.');return;}
  const{error}=await _supa.auth.updateUser({password:newPw});
  if(error){alert('Erro ao trocar a senha da conta: '+error.message);return;}
  rvEl('sec-acc-pw1').value='';rvEl('sec-acc-pw2').value='';
  toastSave('Senha da conta alterada ✓');
}
async function secChangeImportVaultPw(){
  const newPw=rvEl('sec-import-pw1').value,confirmPw=rvEl('sec-import-pw2').value;
  if(!importPass){alert('Desbloqueie a Importação primeiro (clique na aba Importação e digite a senha atual do cofre).');return;}
  if(!newPw||newPw.length<4){alert('Digite uma senha nova com pelo menos 4 caracteres.');return;}
  if(newPw!==confirmPw){alert('As duas senhas novas não coincidem.');return;}
  if(!confirm('Trocar a senha do cofre da Importação?\n\nVocê vai precisar dessa senha nova da próxima vez que abrir a Importação.'))return;
  try{
    const payload=await encryptJSON(newPw,collectState());
    const payloadStr=JSON.stringify(payload);
    const r=await importCloudSave(payloadStr);
    if(!r.ok){alert('Não deu pra trocar agora — falha ao salvar na nuvem ('+(r.reason||'erro')+'). Tente de novo em instantes.');return;}
    importPass=newPw;
    sessionStorage.setItem(SESS_IMPORT_PW,newPw);
    localStorage.setItem(SAVE_KEY,payloadStr);setLocalTs(SAVE_KEY);
    rvEl('sec-import-pw1').value='';rvEl('sec-import-pw2').value='';
    toastSave('Senha do cofre (Importação) alterada ✓');
  }catch(e){console.warn(e);alert('Erro ao trocar a senha do cofre. Tente de novo.');}
}
async function secChangeRvVaultPw(){
  const newPw=rvEl('sec-rv-pw1').value,confirmPw=rvEl('sec-rv-pw2').value;
  if(!rvSyncPass){alert('Conecte no cofre compartilhado da PROD BR primeiro (abra Cotações ou Pedidos).');return;}
  if(!newPw||newPw.length<4){alert('Digite uma senha nova com pelo menos 4 caracteres.');return;}
  if(newPw!==confirmPw){alert('As duas senhas novas não coincidem.');return;}
  if(!confirm('Trocar a senha do cofre COMPARTILHADO da PROD BR?\n\nTodo mundo com acesso (você e sua gerente) vai precisar da senha NOVA a partir de agora. Combine com ela antes — senão ela fica sem conseguir entrar até você avisar.'))return;
  try{
    const payload=await encryptJSON(newPw,rvCollectSyncData());
    const payloadStr=JSON.stringify(payload);
    const r=await rvCloudSave(payloadStr);
    if(!r.ok){alert('Não deu pra trocar agora — falha ao salvar na nuvem ('+(r.reason||'erro')+'). Tente de novo em instantes.');return;}
    rvSyncPass=newPw;
    sessionStorage.setItem(SESS_RV_PW,newPw);
    localStorage.setItem('rv_sync_vault',payloadStr);setLocalTs('rv_sync_vault');
    rvEl('sec-rv-pw1').value='';rvEl('sec-rv-pw2').value='';
    toastSave('Senha do cofre (PROD BR) alterada ✓ — avise quem mais tem acesso');
  }catch(e){console.warn(e);alert('Erro ao trocar a senha do cofre. Tente de novo.');}
}

async function loadState(silent){
  if(!importPass){if(!silent)toastSave('Desbloqueie a Importação primeiro');return;}
  let raw=localStorage.getItem(SAVE_KEY),fromCloud=false;
  if(authUser){
    const cloud=await importCloudGet();
    if(cloud&&cloud.blob){_importRevision=cloud.revision||1;raw=cloud.blob;fromCloud=true;}
  }
  if(!raw){if(!silent)toastSave('Nada salvo ainda');return;}
  try{
    const payload=JSON.parse(raw);
    const state=await decryptJSON(importPass,payload);
    applyState(state.current||state); // fallback: dado salvo antes desta mudança não tinha o wrapper {current,...}
    importSimulations=Array.isArray(state.simulations)?state.simulations:[];
    renderSimulacoes();
    recalc();
    if(fromCloud){localStorage.setItem(SAVE_KEY,raw);setLocalTs(SAVE_KEY);}
    if(!silent)toastSave(fromCloud?'Carregado da nuvem ✓':'Carregado ✓ (local)');
  }catch(e){
    if(!silent)toastSave('Falha ao decifrar');
    console.warn('Falha ao carregar estado salvo (senha errada ou dado corrompido):',e);
  }
}
function toastSave(msg){
  const status=document.getElementById('save-status');
  if(status)status.textContent=msg;
  let el=document.getElementById('ui-global-toast');
  if(!el){
    el=document.createElement('div');
    el.id='ui-global-toast';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    document.body.appendChild(el);
  }
  el.textContent=msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastSave._timer);
  toastSave._timer=setTimeout(()=>{
    el.classList.remove('show');
    if(status&&status.textContent===msg)status.textContent='';
  },2600);
}

// Feedback tátil/visual para todos os botões do app, inclusive PROD ASIA, PROD BR e CRM.
// Não interfere no onclick original; apenas confirma imediatamente que o clique foi recebido.
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn||btn.disabled)return;
  const label=(btn.textContent||'').trim().toLowerCase();
  const isCommit=/salvar|criar pedido/.test(label);
  const isCancel=/cancelar/.test(label);
  if((isCommit||isCancel)&&btn.dataset.uiClickLock==='1'){
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }
  if(isCommit||isCancel){
    btn.dataset.uiClickLock='1';
    setTimeout(()=>delete btn.dataset.uiClickLock,900);
    toastSave(isCommit?'Comando de salvar recebido…':'Cancelado');
  }
  btn.classList.remove('ui-press-feedback');
  void btn.offsetWidth;
  btn.classList.add('ui-press-feedback');
  setTimeout(()=>btn.classList.remove('ui-press-feedback'),380);
},true);

/* ════════ SIMULAÇÕES SALVAS (Importação) ════════
   Vivem dentro do mesmo blob cifrado do cofre — reaproveita save/load/sync
   já existentes, sem cofre, tabela ou sincronização novos. */
function salvarSimulacao(){
  if(!importPass){toastSave('Desbloqueie a Importação primeiro');return;}
  const nome=prompt('Nome desta simulação (ex.: "Container 40HC Vietnã — Nov/26")');
  if(!nome)return;
  importSimulations.push({
    id:(crypto.randomUUID?crypto.randomUUID():'sim_'+Date.now()+'_'+Math.random().toString(36).slice(2)),
    name:nome.trim(),
    savedAt:new Date().toISOString(),
    state:collectState()
  });
  renderSimulacoes();
  saveState();
  toastSave('Simulação salva ✓');
}
function carregarSimulacao(id){
  const sim=importSimulations.find(s=>s.id===id);
  if(!sim)return;
  if(!confirm(`Carregar "${sim.name}"?\n\nOs valores atuais na tela serão substituídos (a simulação salva não é apagada).`))return;
  applyState(sim.state);
  recalc();
  toastSave('Simulação carregada ✓');
}
function renomearSimulacao(id){
  const sim=importSimulations.find(s=>s.id===id);
  if(!sim)return;
  const novo=prompt('Novo nome:',sim.name);
  if(!novo)return;
  sim.name=novo.trim();
  renderSimulacoes();
  saveState();
}
function excluirSimulacao(id){
  const sim=importSimulations.find(s=>s.id===id);
  if(!sim)return;
  if(!confirm(`Apagar a simulação "${sim.name}"? Não dá pra desfazer.`))return;
  importSimulations=importSimulations.filter(s=>s.id!==id);
  renderSimulacoes();
  saveState();
  toastSave('Simulação apagada');
}
function renderSimulacoes(){
  const el=document.getElementById('sim-list'),hint=document.getElementById('sim-count-hint');
  if(!el)return;
  if(hint)hint.textContent=importSimulations.length?`(${importSimulations.length})`:'';
  if(!importSimulations.length){
    el.innerHTML='<p class="hint" style="padding:.3rem 0">Nenhuma simulação salva ainda — ajuste os valores abaixo e clique em "Salvar Simulação" no topo.</p>';
    return;
  }
  const rows=[...importSimulations].sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''));
  el.innerHTML=rows.map(sim=>{
    const nProd=(sim.state?.prods||[]).length;
    const dt=sim.savedAt?new Date(sim.savedAt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
    return`<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.5rem .2rem;border-bottom:1px solid var(--bdr)">
      <div style="min-width:0">
        <div style="font-weight:700;font-size:.78rem;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sim.name)}</div>
        <div style="font-size:.62rem;color:var(--ink4);margin-top:.1rem">${dt} · ${nProd} ${nProd===1?'produto':'produtos'}</div>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        <button class="btn btn-s" style="font-size:.62rem;padding:.25rem .55rem" onclick="carregarSimulacao('${sim.id}')">Carregar</button>
        <button class="btn btn-s" style="font-size:.62rem;padding:.25rem .5rem" onclick="renomearSimulacao('${sim.id}')" title="Renomear" aria-label="Renomear simulação">✏️</button>
        <button class="btn btn-s" style="font-size:.62rem;padding:.25rem .5rem;color:var(--red)" onclick="excluirSimulacao('${sim.id}')" title="Apagar" aria-label="Apagar simulação">✕</button>
      </div>
    </div>`;
  }).join('');
}

/* HANDLER GLOBAL DE ERRO — sem isso, um erro de JS no meio de um render
   trava a interface em silêncio, sem nenhum aviso. Debounce de 4s pra
   não floodar aviso se algo entrar em loop de erro. */
let _lastErrToastPC=0;
function _globalErrToastPC(){
  if(Date.now()-_lastErrToastPC<4000)return;
  _lastErrToastPC=Date.now();
  toastSave('⚠ Algo deu errado — tente de novo ou recarregue a página');
}
window.addEventListener('error',e=>{console.error('Erro não tratado:',e.error||e.message);_globalErrToastPC();});
window.addEventListener('unhandledrejection',e=>{console.error('Promise rejeitada:',e.reason);_globalErrToastPC();});

/* ════════ ABAS ════════ */
function showTab(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('header .tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  if(id==='import'){checkLock();}else{document.getElementById('ovl-lock').classList.remove('open');}
}

/* ════════ SENHA DO COFRE — ABA IMPORTAÇÃO ════════ */
let importPass=null; // fica null até o usuário digitar certo nesta sessão da aba
const SESS_IMPORT_PW='fgl_sess_import_pw';
function checkLock(){
  if(!authUser){
    document.getElementById('ovl-lock').classList.remove('open');
    _pendingTab='import';
    openAuthModal();
    return;
  }
  if(importPass){document.getElementById('ovl-lock').classList.remove('open');return;}
  const savedPw=sessionStorage.getItem(SESS_IMPORT_PW);
  if(savedPw){tryUnlock(savedPw);return;}
  const hasLocal=!!localStorage.getItem(SAVE_KEY);
  document.getElementById('lock-hint').textContent=hasLocal
    ? 'Conta conectada. Digite a senha do cofre pra decifrar os dados.'
    : 'Conta conectada, primeiro acesso: a senha que você digitar agora vira a senha do cofre.';
  document.getElementById('ovl-lock').classList.add('open');
  setTimeout(()=>{const el=document.getElementById('lock-pass');if(el)el.focus();},50);
}
async function tryUnlock(pwOverride){
  const v=pwOverride||document.getElementById('lock-pass').value;
  if(!v){document.getElementById('lock-err').textContent='Digite uma senha.';return;}
  document.getElementById('lock-err').style.color='';
  document.getElementById('lock-err').textContent='Conectando à nuvem…';
  const localRaw=localStorage.getItem(SAVE_KEY);
  const cloud=await importCloudGet();
  let vaultToUse=null,fromCloud=false;
  if(cloud&&cloud.blob){
    _importRevision=cloud.revision||1;
    if(!localRaw){vaultToUse=cloud.blob;fromCloud=true;}
    else{
      const cloudTs=cloud.updated_at||'';
      fromCloud=cloudTs>=localTs(SAVE_KEY);
      vaultToUse=fromCloud?cloud.blob:localRaw;
    }
  }else if(localRaw){vaultToUse=localRaw;_importRevision=0;}
  document.getElementById('lock-err').textContent='';

  if(vaultToUse){
    try{
      const payload=JSON.parse(vaultToUse);
      const state=await decryptJSON(v,payload); // valida a senha de verdade
      importPass=v;
      sessionStorage.setItem(SESS_IMPORT_PW,v); // sobrevive à troca de página nesta aba
      applyState(state.current||state);
      importSimulations=Array.isArray(state.simulations)?state.simulations:[];
      renderSimulacoes();
      recalc();
      if(fromCloud){localStorage.setItem(SAVE_KEY,vaultToUse);setLocalTs(SAVE_KEY);}
      else if(_supaOK&&authUser){await importCloudSave(vaultToUse);}
      unlockUI();
    }catch(e){
      sessionStorage.removeItem(SESS_IMPORT_PW); // senha salva não bate mais — não insiste sozinha
      if(pwOverride){checkLockForceOpen();return;} // falha silenciosa: abre o cadeado normal pra digitar de novo
      document.getElementById('lock-err').style.color='var(--red)';
      document.getElementById('lock-err').textContent='Senha incorreta.';
      document.getElementById('lock-pass').value='';document.getElementById('lock-pass').focus();
    }
  }else{
    importPass=v;_importRevision=0;
    sessionStorage.setItem(SESS_IMPORT_PW,v);
    unlockUI();
  }
}
function checkLockForceOpen(){
  document.getElementById('lock-hint').textContent='Sua sessão expirou ou a senha mudou. Digite a senha do cofre.';
  document.getElementById('ovl-lock').classList.add('open');
  setTimeout(()=>{const el=document.getElementById('lock-pass');if(el)el.focus();},50);
}
function unlockUI(){
  document.getElementById('ovl-lock').classList.remove('open');
  document.getElementById('lock-err').textContent='';
  document.getElementById('lock-pass').value='';
}

/* ════════ REVENDA: vault compartilhado (Auth + membros + revisão) ════════ */
const SHARED_VAULT_ID='revenda';
let rvSyncPass=null;
let _rvSyncTimer=null;
let _rvRevision=0;

function rvCollectSyncData(){return{cotacoes:rvLoadCotacoes(),pedidos:rvLoadPedidos(),ledgerR:rvLoadLedgerR(),receiptsR:rvLoadReceiptsR(),clientes2:RV_CLIENTES2,fornecedores2:RV_FORNECEDORES2,empresa:RV_EMPRESA,sacacho:RV_SACACHO};}
function rvMergeById(localList,cloudList){
  // Une por id, e quando o mesmo id existe dos dois lados, quem tem
  // updatedAt mais recente vence de verdade (não é mais "local sempre
  // ganha" — isso causava um bug: cópia desatualizada sobrescrevendo
  // uma edição mais nova feita por outra pessoa)
  const map=new Map();
  (cloudList||[]).forEach(x=>map.set(x.id,x));
  (localList||[]).forEach(x=>{
    const k=x.id,existing=map.get(k);
    if(!existing||(x.updatedAt||0)>=(existing.updatedAt||0))map.set(k,x);
  });
  return[...map.values()].sort((a,b)=>b.id-a.id);
}
function rvMergeByKey(localList,cloudList,keyFn){
  const map=new Map();
  (cloudList||[]).forEach(x=>map.set(keyFn(x),x));
  (localList||[]).forEach(x=>{
    const k=keyFn(x),existing=map.get(k);
    if(!existing||(x.updatedAt||0)>=(existing.updatedAt||0))map.set(k,x);
  });
  return[...map.values()];
}
function rvApplySyncData(data){
  if(Array.isArray(data.cotacoes))rvSaveCotacoes(rvMergeById(rvLoadCotacoes(),data.cotacoes));
  if(Array.isArray(data.pedidos))rvSavePedidos(rvMergeById(rvLoadPedidos(),data.pedidos));
  if(Array.isArray(data.ledgerR))rvSaveLedgerR(rvMergeById(rvLoadLedgerR(),data.ledgerR));
  if(Array.isArray(data.receiptsR))rvSaveReceiptsR(rvMergeById(rvLoadReceiptsR(),data.receiptsR));
  if(Array.isArray(data.clientes2))RV_CLIENTES2=rvMergeByKey(RV_CLIENTES2,data.clientes2,c=>(c.nome||'').toLowerCase().trim());
  if(Array.isArray(data.fornecedores2))RV_FORNECEDORES2=rvMergeByKey(RV_FORNECEDORES2,data.fornecedores2,f=>(f.nome||'').toLowerCase().trim());
  if(data.empresa&&typeof data.empresa.fedPct==='number'){
    RV_EMPRESA=data.empresa;
    localStorage.setItem('rv2_empresa',JSON.stringify(RV_EMPRESA));
  }
  if(data.sacacho&&Array.isArray(data.sacacho.grupos)&&(data.sacacho.updatedAt||0)>=(RV_SACACHO.updatedAt||0)){
    RV_SACACHO=data.sacacho;
    rvSacachoSaveLocal();
    if(document.getElementById('rv-sac-table')&&!rvSacachoEditing)rvSacachoRender();
  }
  rv2SaveLocalCad();
  rv2PopulateSelects();
  rvRenderCotacoes();rvRenderPedidos();
  if(document.getElementById('rv-fin-container'))rvRenderFin();
}
function updateRvSyncStatus(msg){
  const el=document.getElementById('rv-sync-status');
  if(!el)return;
  if(msg){el.title='Cotações/Pedidos compartilhados: '+msg;return;}
  if(!authUser){el.title='Cotações/Pedidos compartilhados: entre com sua conta primeiro';el.style.color='';return;}
  if(rvSyncPass){el.title='Cotações/Pedidos compartilhados: conectado ✓ (sincroniza sozinho)';el.style.color='var(--green-dk)';}
  else{el.title='Cotações/Pedidos compartilhados: bloqueados (abra a aba PROD BR pra desbloquear)';el.style.color='';}
}
async function rvCloudGet(){
  if(!_supaOK||!authUser)return null;
  try{
    const{data,error}=await _supa.from('precificacao_shared_vault').select('blob,revision,updated_at').eq('id',SHARED_VAULT_ID).maybeSingle();
    if(error){console.warn('rvCloudGet:',error.message);return null;}
    return data;
  }catch(e){console.warn(e);return null;}
}
// Busca a versão mais recente da nuvem e MESCLA com o que está local (nunca sobrescreve —
// usa a mesma lógica de merge por updatedAt de rvApplySyncData). Chamado toda vez que a
// pessoa entra em Cotações/Pedidos/Financeiro, e também periodicamente enquanto fica nessas
// telas — antes disso, o cofre só era lido da nuvem UMA vez por sessão (no primeiro desbloqueio),
// e nunca mais, então cada pessoa ficava presa numa "foto" do momento em que abriu.
let _rvRefreshing=false;
async function rvRefreshFromCloud(){
  if(!rvSyncPass||_rvRefreshing)return;
  _rvRefreshing=true;
  try{
    const cloud=await rvCloudGet();
    if(cloud&&cloud.blob){
      const data=await decryptJSON(rvSyncPass,JSON.parse(cloud.blob));
      _rvRevision=cloud.revision||_rvRevision;
      rvApplySyncData(data);
    }
  }catch(e){console.warn('rvRefreshFromCloud:',e);}
  _rvRefreshing=false;
}
let _rvAutoRefreshTimer=null;
function rvStartAutoRefresh(){
  if(_rvAutoRefreshTimer)return;
  _rvAutoRefreshTimer=setInterval(()=>{
    if(rvSyncPass&&['cotacoes','pedidos','fin'].includes(_rvCurTab))rvRefreshFromCloud();
  },30000); // a cada 30s, só enquanto estiver numa dessas telas
}
async function rvCloudSave(blobStr){
  if(!_supaOK||!authUser)return{ok:false,reason:'no-auth'};
  try{
    const nextRev=_rvRevision+1;
    const{data,error}=await _supa.from('precificacao_shared_vault')
      .update({blob:blobStr,revision:nextRev,updated_at:new Date().toISOString()})
      .eq('id',SHARED_VAULT_ID).eq('revision',_rvRevision).select();
    if(error){console.warn(error.message);return{ok:false,reason:'error'};}
    if(!data||data.length===0)return{ok:false,reason:'conflict'};
    _rvRevision=nextRev;return{ok:true};
  }catch(e){console.warn(e);return{ok:false,reason:'error'};}
}
const SESS_RV_PW='fgl_sess_revenda_pw';
function checkRvLock(){
  if(!authUser){
    document.getElementById('ovl-rvlock').classList.remove('open');
    _pendingTab='revenda-connect';
    openAuthModal();
    return;
  }
  if(rvSyncPass){document.getElementById('ovl-rvlock').classList.remove('open');return;}
  const savedPw=sessionStorage.getItem(SESS_RV_PW);
  if(savedPw){tryRvUnlock(savedPw);return;}
  document.getElementById('rvlock-hint').textContent='Conta conectada. Digite a senha do cofre compartilhado (a mesma da sua gerente).';
  document.getElementById('ovl-rvlock').classList.add('open');
  setTimeout(()=>{const el=document.getElementById('rvlock-pass');if(el)el.focus();},50);
}
async function tryRvUnlock(pwOverride){
  const pw=pwOverride||document.getElementById('rvlock-pass').value;
  if(!pw){document.getElementById('rvlock-err').textContent='Digite uma senha.';return;}
  document.getElementById('rvlock-err').style.color='';
  document.getElementById('rvlock-err').textContent='Conectando à nuvem…';
  try{
    const cloud=await rvCloudGet();
    if(!cloud){
      // ninguém criou ainda — cria agora e você já vira o 1º membro
      const payload=await encryptJSON(pw,rvCollectSyncData());
      const payloadStr=JSON.stringify(payload);
      const{error}=await _supa.rpc('pv_create_shared',{p_id:SHARED_VAULT_ID,p_blob:payloadStr});
      if(error){
        document.getElementById('rvlock-err').style.color='var(--red)';
        document.getElementById('rvlock-err').textContent='Erro: '+error.message;
        return;
      }
      rvSyncPass=pw;_rvRevision=1;
      sessionStorage.setItem(SESS_RV_PW,pw);
      localStorage.setItem('rv_sync_vault',payloadStr);setLocalTs('rv_sync_vault');
      updateRvSyncStatus();
      rvUnlockUI();
      toastSave('Vault compartilhado criado ✓ — use "＋ Adicionar pessoa" pra convidar');
      return;
    }
    const localRaw=localStorage.getItem('rv_sync_vault');
    const localTsV=localTs('rv_sync_vault');
    let vaultToUse=cloud.blob,fromCloud=true;
    if(localRaw&&localTsV>(cloud.updated_at||'')){vaultToUse=localRaw;fromCloud=false;}
    const payload=JSON.parse(vaultToUse);
    const data=await decryptJSON(pw,payload); // senha errada OU sem permissão (RLS) cai no catch
    rvSyncPass=pw;_rvRevision=cloud.revision||1;
    sessionStorage.setItem(SESS_RV_PW,pw);
    rvApplySyncData(data); // mescla nuvem + local (protege dado local não sincronizado ainda)
    // Sempre reenvia pra nuvem depois de mesclar — se essa pessoa tinha algo só local
    // (criado antes de conectar), isso garante que sobe pra nuvem agora, em vez de
    // ficar preso no navegador dela até a próxima edição por acaso disparar o envio.
    await rvSyncPush(true);
    updateRvSyncStatus();
    rvUnlockUI();
    toastSave('Dados compartilhados conectados ✓');
  }catch(e){
    console.warn(e);
    sessionStorage.removeItem(SESS_RV_PW);
    if(pwOverride){
      document.getElementById('rvlock-hint').textContent='Sua sessão expirou ou a senha mudou. Digite a senha do cofre.';
      document.getElementById('ovl-rvlock').classList.add('open');
      setTimeout(()=>{const el=document.getElementById('rvlock-pass');if(el)el.focus();},50);
      return;
    }
    document.getElementById('rvlock-err').style.color='var(--red)';
    document.getElementById('rvlock-err').textContent='Senha incorreta (ou você ainda não foi adicionado(a) como membro).';
    document.getElementById('rvlock-pass').value='';
    document.getElementById('rvlock-pass').focus();
  }
}
function rvUnlockUI(){
  document.getElementById('ovl-rvlock').classList.remove('open');
  document.getElementById('rvlock-err').textContent='';
  document.getElementById('rvlock-pass').value='';
  rvRenderCotacoes();rvRenderPedidos();rvRenderFin();
}
async function rvSyncPush(immediate){
  if(!rvSyncPass||!authUser)return;
  const payload=await encryptJSON(rvSyncPass,rvCollectSyncData());
  const payloadStr=JSON.stringify(payload);
  localStorage.setItem('rv_sync_vault',payloadStr);
  setLocalTs('rv_sync_vault');
  updateRvSyncStatus('☁ Salvando…');
  clearTimeout(_rvSyncTimer);
  const doSave=async()=>{
    const r=await rvCloudSave(payloadStr);
    if(r.ok){updateRvSyncStatus();return;}
    if(r.reason==='conflict'){
      // alguém salvou por cima entre nossa leitura e nossa escrita — busca o mais atual,
      // MESCLA com o que temos aqui (sem apagar nada de ninguém) e tenta de novo sozinho
      const ok=await rvRecoverAndRetry();
      if(ok){updateRvSyncStatus();toastSave('Sincronizado ✓ (havia uma versão mais nova, mesclado automaticamente)');}
      else{updateRvSyncStatus('⚠ Não sincronizou — dado só local');alert('⚠ Não deu pra sincronizar com a nuvem agora.\n\nSeus dados estão salvos aqui neste navegador, mas ainda não chegaram no cofre compartilhado — quem estiver do outro lado não vai ver essa mudança ainda.\n\nTente de novo em alguns instantes (recarregue a página se persistir).');}
    }else{
      updateRvSyncStatus('⚠ Cotações/Pedidos: só local (falha ao sincronizar)');
      alert('⚠ Não deu pra sincronizar com a nuvem agora.\n\nSeus dados estão salvos aqui neste navegador, mas ainda não chegaram no cofre compartilhado — quem estiver do outro lado não vai ver essa mudança ainda.\n\nTente de novo em alguns instantes (recarregue a página se persistir).');
    }
  };
  if(immediate)await doSave();
  else _rvSyncTimer=setTimeout(doSave,1200);
}
async function rvRecoverAndRetry(){
  try{
    const cloud=await rvCloudGet();
    if(!cloud||!cloud.blob)return false;
    const data=await decryptJSON(rvSyncPass,JSON.parse(cloud.blob));
    // mescla: cotações/pedidos/lançamentos por id (não perde nada de ninguém); cadastros/empresa ficam com a versão local (é a que acabamos de editar)
    rvSaveCotacoes(rvMergeById(rvLoadCotacoes(),data.cotacoes||[]));
    rvSavePedidos(rvMergeById(rvLoadPedidos(),data.pedidos||[]));
    rvSaveLedgerR(rvMergeById(rvLoadLedgerR(),data.ledgerR||[]));
    rvSaveReceiptsR(rvMergeById(rvLoadReceiptsR(),data.receiptsR||[]));
    _rvRevision=cloud.revision||_rvRevision;
    const payload=await encryptJSON(rvSyncPass,rvCollectSyncData());
    const payloadStr=JSON.stringify(payload);
    localStorage.setItem('rv_sync_vault',payloadStr);setLocalTs('rv_sync_vault');
    const r2=await rvCloudSave(payloadStr);
    if(r2.ok){rvRenderCotacoes();rvRenderPedidos();rv2RenderHist();return true;}
    return false;
  }catch(e){console.warn('rvRecoverAndRetry falhou:',e);return false;}
}
async function rvAddMember(){
  if(!authUser){toastSave('Entre com sua conta primeiro');return;}
  if(!rvSyncPass){toastSave('Conecte os dados compartilhados primeiro');return;}
  const email=prompt('E-mail da pessoa a adicionar\n(ela precisa já ter criado conta no app pelo menos uma vez — botão "Minha conta")');
  if(!email)return;
  const{data,error}=await _supa.rpc('pv_add_member',{p_id:SHARED_VAULT_ID,p_email:email.trim()});
  if(error){alert('Erro: '+error.message);return;}
  if(data==='not_found'){alert('Essa pessoa ainda não tem conta — peça pra ela abrir o app, clicar em "👤 Minha conta" e criar login com esse e-mail primeiro. Depois tenta de novo.');return;}
  alert('Adicionado(a) ✓ — agora essa pessoa pode clicar "🔗 Conectar dados compartilhados" e usar a mesma senha do cofre.');
}
/* ════════ UI ════════ */
function toggleCollap(h,id){h.classList.toggle('open');document.getElementById(id).classList.toggle('open');}
function closeM(id){document.getElementById('ovl-'+id).classList.remove('open');}
function toggleDark(){const d=document.body.classList.toggle('dark');document.getElementById('dm').textContent=d?'☀':'🌙';localStorage.setItem('calc_dark',d?'1':'0');}
if(localStorage.getItem('calc_dark')==='1'){document.body.classList.add('dark');document.getElementById('dm').textContent='☀';}

/* ═══════════════════════════════════════════════════════════════
   REVENDA — lógica idêntica à calculadora_SM_2026.html original
   (custo de aquisição · nacional/importado · UF destino · B2B/B2C ·
   ICMS débito/crédito · DIFAL · comissão · frete entrega · comparação
   de até 3 fornecedores · cotações/pedidos salvos)
   ═══════════════════════════════════════════════════════════════ */
const rvEl=id=>document.getElementById(id);
const rvBrl=n=>(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const rvPct=(v,maxDec=2)=>{
  const n=Number(v);
  if(!Number.isFinite(n))return'0';
  return n.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:maxDec});
};

/* ═══════════════════════════════════════════════════════════════
   REVENDA — versão simplificada
   Cadastros (Cliente: nome+estado · Fornecedor: nome+estado+regime)
   + tabelas de ICMS crédito/débito pré-definidas (RJ, Lucro Presumido)
   ═══════════════════════════════════════════════════════════════ */
const ESTADOS=[['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
const REGIAO_MAP={
  RJ:'SE_RJ',
  SP:'SE_S',MG:'SE_S',PR:'SE_S',SC:'SE_S',RS:'SE_S',
  ES:'N_NE_CO',AC:'N_NE_CO',AP:'N_NE_CO',AM:'N_NE_CO',PA:'N_NE_CO',RO:'N_NE_CO',RR:'N_NE_CO',TO:'N_NE_CO',
  AL:'N_NE_CO',BA:'N_NE_CO',CE:'N_NE_CO',MA:'N_NE_CO',PB:'N_NE_CO',PE:'N_NE_CO',PI:'N_NE_CO',RN:'N_NE_CO',SE:'N_NE_CO',
  DF:'N_NE_CO',GO:'N_NE_CO',MT:'N_NE_CO',MS:'N_NE_CO'
};
const REGIAO_LBL={SE_RJ:'SE (RJ)',SE_S:'SE (-ES) + S',N_NE_CO:'N+NE+CO (+ES)'};
// Alíquota de CRÉDITO de ICMS: [Tipo Mercadoria][Regime Fornecedor][Região Fornecedor]
const TAB_CREDITO={
  Importada:{SN:{SE_RJ:4,SE_S:4,N_NE_CO:4},LP:{SE_RJ:20,SE_S:4,N_NE_CO:4}},
  Nacional:{SN:{SE_RJ:4,SE_S:4,N_NE_CO:4},LP:{SE_RJ:20,SE_S:7,N_NE_CO:12}}
};
// Alíquota de DÉBITO de ICMS: [Tipo Mercadoria][Região Cliente]
const TAB_DEBITO={
  Importada:{SE_RJ:20,SE_S:4,N_NE_CO:4},
  Nacional:{SE_RJ:20,SE_S:7,N_NE_CO:12}
};
// PIS/COFINS/IRPJ/CSLL agora vem de RV_EMPRESA.fedPct (cadastro "Minha Empresa"), não é mais fixo
const RV_STATUS_STEPS=[
  {key:'confirmado',label:'Pedido confirmado'},{key:'producao',label:'Em produção'},
  {key:'fat_forn',label:'Faturado fornecedor'},{key:'pago_forn',label:'Pago fornecedor'},
  {key:'entregue',label:'Entregue cliente'},{key:'nf_emitida',label:'NF emitida'},
  {key:'recebido',label:'Recebido cliente'}
];

/* ── ARMAZENAMENTO LOCAL (cotações/pedidos) ──
   rvSaveCotacoes/rvSavePedidos NUNCA deixam a lista encolher sozinhas —
   se algo tentar gravar uma lista menor que a que já existe (sync antigo,
   cache velho, bug futuro, o que for), mescla em vez de sobrescrever.
   Só uma exclusão explícita (forceReplace=true) pode reduzir a lista. */
function rvLoadCotacoes(){try{return JSON.parse(localStorage.getItem('av_cotacoes')||'[]');}catch(e){return[];}}
function rvSaveCotacoes(d,forceReplace){
  if(!forceReplace){
    const cur=rvLoadCotacoes();
    if(Array.isArray(d)&&d.length<cur.length){d=rvMergeById(cur,d);}
  }
  localStorage.setItem('av_cotacoes',JSON.stringify(d));
}
function rvLoadPedidos(){try{return JSON.parse(localStorage.getItem('av_pedidos')||'[]');}catch(e){return[];}}
function rvSavePedidos(d,forceReplace){
  if(!forceReplace){
    const cur=rvLoadPedidos();
    if(Array.isArray(d)&&d.length<cur.length){d=rvMergeById(cur,d);}
  }
  localStorage.setItem('av_pedidos',JSON.stringify(d));
}
// Lançamentos reais de pagamento/recebimento (contra o plano de condições de cada pedido)
function rvLoadLedgerR(){try{return JSON.parse(localStorage.getItem('av_ledger')||'[]');}catch(e){return[];}}
function rvSaveLedgerR(d,forceReplace){
  if(!forceReplace){const cur=rvLoadLedgerR();if(Array.isArray(d)&&d.length<cur.length){d=rvMergeById(cur,d);}}
  localStorage.setItem('av_ledger',JSON.stringify(d));
}
function rvLoadReceiptsR(){try{return JSON.parse(localStorage.getItem('av_receipts')||'[]');}catch(e){return[];}}
function rvSaveReceiptsR(d,forceReplace){
  if(!forceReplace){const cur=rvLoadReceiptsR();if(Array.isArray(d)&&d.length<cur.length){d=rvMergeById(cur,d);}}
  localStorage.setItem('av_receipts',JSON.stringify(d));
}

/* ── SUB-ABAS DA REVENDA ── */
let _rvCurTab='calc';
function rvShowTab(id){
  if(isMetaReviewer()&&id!=='crm')id='crm';
  _rvCurTab=id;
  document.querySelectorAll('.rv-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.rv-tab').forEach(b=>b.classList.remove('active'));
  rvEl('rvpane-'+id).classList.add('active');
  rvEl('rvtab-'+id).classList.add('active');
  if(id==='cotacoes'||id==='pedidos'||id==='fin'){
    checkRvLock();
    if(rvSyncPass){
      rvStartAutoRefresh();
      rvRefreshFromCloud().then(()=>{
        if(id==='cotacoes')rvRenderCotacoes();
        else if(id==='pedidos')rvRenderPedidos();
        else if(id==='fin')rvRenderFin();
      });
      // renderiza já com o que tem local, sem esperar a rede — a atualização acima re-renderiza quando chegar
      if(id==='cotacoes')rvRenderCotacoes();
      else if(id==='pedidos')rvRenderPedidos();
      else if(id==='fin')rvRenderFin();
    }
  }else if(id==='crm'){
    document.getElementById('ovl-rvlock').classList.remove('open');
    crmCheckAccess();
    crmShowSubTab('semana');
  }else{
    document.getElementById('ovl-rvlock').classList.remove('open');
  }
}

let RV_CLIENTES2=[];      // {nome,estado}
let RV_FORNECEDORES2=[];  // {nome,estado,regime:'LP'|'SN'}
let rv2DetalheOpen=false;

function rv2SaveLocalCad(){
  localStorage.setItem('rv2_clientes',JSON.stringify(RV_CLIENTES2));
  localStorage.setItem('rv2_fornecedores',JSON.stringify(RV_FORNECEDORES2));
}
function rv2LoadLocalCad(){
  try{RV_CLIENTES2=JSON.parse(localStorage.getItem('rv2_clientes')||'[]');}catch(e){RV_CLIENTES2=[];}
  try{RV_FORNECEDORES2=JSON.parse(localStorage.getItem('rv2_fornecedores')||'[]');}catch(e){RV_FORNECEDORES2=[];}
}

function rv2PopulateSelects(){
  const selCli=rvEl('rv2-cliente');
  const curCli=selCli.value;
  selCli.innerHTML='<option value="">— selecione —</option>'+RV_CLIENTES2.map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)} (${c.estado})</option>`).join('');
  if(RV_CLIENTES2.some(c=>c.nome===curCli))selCli.value=curCli;
  const estSel=rvEl('rvcad-estado');
  if(estSel)estSel.innerHTML=ESTADOS.map(([uf,nome])=>`<option value="${uf}">${uf} — ${esc(nome)}</option>`).join('');
  // Refresca as opções de fornecedor de cada linha de produto já criada (ex: fornecedor novo cadastrado agora)
  document.querySelectorAll('.rv2-prod-forn').forEach(sel=>{
    const cur=sel.value;
    sel.innerHTML=RV_FORNECEDORES2.map(f=>`<option value="${esc(f.nome)}"${f.nome===cur?' selected':''}>${esc(f.nome)}</option>`).join('');
  });
}
function rv2GetCliente(){return RV_CLIENTES2.find(c=>c.nome===rvEl('rv2-cliente').value);}
function rv2OnClienteChange(){rv2Calc();rv2RenderHist();}

/* ── CÁLCULO ── */
let RV_EMPRESA={regime:'LP',fedPct:5.93};
function rv2OpenEmpresa(){
  rvEl('rvempresa-fedpct').value=RV_EMPRESA.fedPct;
  document.getElementById('ovl-rvempresa').classList.add('open');
}
function rv2SaveEmpresa(){
  RV_EMPRESA.fedPct=parseFloat(rvEl('rvempresa-fedpct').value)||5.93;
  localStorage.setItem('rv2_empresa',JSON.stringify(RV_EMPRESA));
  rvSyncPush();
  rv2Calc();
  toastSave('Empresa atualizada ✓');
}
function rv2LoadEmpresaLocal(){
  try{RV_EMPRESA=JSON.parse(localStorage.getItem('rv2_empresa')||'')||RV_EMPRESA;}catch(e){}
}

/* ══════════════════════════════════════
   TABELA DE REFERÊNCIA — SACACHO (editável, com data de referência)
   Persiste local e sincroniza no cofre compartilhado (mesmo lugar de cotações/pedidos)
   pra ficar igual pros dois usuários.
══════════════════════════════════════ */
let RV_SACACHO={
  refDate:'—',
  grupos:[
    {nome:'Cast 3 cores',itens:[{label:'1k',preco:4.60},{label:'3k a 5k',preco:4.45}]},
    {nome:'Digital Cast',itens:[{label:'300',preco:10.30},{label:'500',preco:9.90},{label:'1000',preco:9.40}]},
    {nome:'Boop Invertido',itens:[{label:'1k',preco:8.95},{label:'2k',preco:6.95},{label:'3k',preco:6.40},{label:'5k',preco:6.10},{label:'10k',preco:5.90},{label:'20k',preco:5.80},{label:'30k',preco:5.60},{label:'50k',preco:5.40}]},
  ]
};
let rvSacachoEditing=false;
/* ══════════════════════════════════════
   CRM — Milestone 1: identidade do cliente (crm_customers, external_refs, tags, people)
   Tabelas Postgres próprias (sem cifra client-side), protegidas por RLS — não usa o
   sistema de vault/senha do resto da Precificação. Membership é controlada só por
   admin via SQL (sem auto-cadastro) — ver crmCheckAccess().
══════════════════════════════════════ */

function rvSacachoLoad(){
  try{const saved=JSON.parse(localStorage.getItem('rv_sacacho')||'');if(saved&&saved.grupos)RV_SACACHO=saved;}catch(e){}
}
function rvSacachoSaveLocal(){
  localStorage.setItem('rv_sacacho',JSON.stringify(RV_SACACHO));
}
function rvSacachoToggleEdit(){
  if(rvSacachoEditing){
    // saindo do modo edição: lê os campos, salva local + nuvem
    RV_SACACHO.refDate=rvEl('rv-sac-refdate-edit').value.trim()||'—';
    RV_SACACHO.grupos.forEach((g,gi)=>{
      g.itens.forEach((it,ii)=>{
        const inp=document.getElementById(`rv-sac-p-${gi}-${ii}`);
        if(inp)it.preco=parseFloat(inp.value)||0;
      });
    });
    RV_SACACHO.updatedAt=Date.now();
    rvSacachoSaveLocal();
    if(typeof rvSyncPush==='function')rvSyncPush(true);
    toastSave('Tabela Sacacho atualizada ✓');
  }
  rvSacachoEditing=!rvSacachoEditing;
  rvSacachoRender();
}
function rvSacachoRender(){
  rvEl('rv-sac-refdate-view').textContent=RV_SACACHO.refDate;
  document.getElementById('rv-sac-editbtn').textContent=rvSacachoEditing?'💾 Salvar':'✏️ Editar';
  const cont=rvEl('rv-sac-table');
  const nCols=RV_SACACHO.grupos.length;
  const metade=arr=>[arr.slice(0,Math.ceil(arr.length/2)),arr.slice(Math.ceil(arr.length/2))];
  if(rvSacachoEditing){
    const editRow=(g,gi,it,ii)=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.25rem">
          <span style="font-size:.8rem;color:var(--ink2)">${esc(it.label)}</span>
          <input type="number" id="rv-sac-p-${gi}-${ii}" value="${it.preco}" step="0.01" min="0" style="width:72px;text-align:right;font-size:.8rem;padding:.15rem .3rem;border:1.5px solid var(--bdr2);border-radius:5px;font-family:'IBM Plex Mono'">
        </div>`;
    cont.innerHTML=`<div class="ff" style="margin-bottom:.6rem"><label style="font-size:.7rem">Preços de referência em</label><input type="text" id="rv-sac-refdate-edit" value="${esc(RV_SACACHO.refDate==='—'?'':RV_SACACHO.refDate)}" placeholder="ex: Ago/26" style="font-size:.8rem;padding:.35rem .5rem"></div>`+
      `<div style="display:grid;grid-template-columns:repeat(${nCols},1fr);gap:.9rem;align-items:start">`+
      RV_SACACHO.grupos.map((g,gi)=>{
        const titulo=`<div style="font-size:.8rem;font-weight:700;color:var(--ink3);margin-bottom:.4rem;white-space:nowrap">${esc(g.nome)}</div>`;
        if(g.itens.length>5){ // grupo grande — divide em 2 sub-colunas internas (ex: Boop 1k-5k / 10k-50k)
          const idx=g.itens.map((it,ii)=>ii);
          const[i1,i2]=metade(idx);
          return`<div>${titulo}<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 .6rem">
            <div>${i1.map(ii=>editRow(g,gi,g.itens[ii],ii)).join('')}</div>
            <div>${i2.map(ii=>editRow(g,gi,g.itens[ii],ii)).join('')}</div>
          </div></div>`;
        }
        return`<div>${titulo}${g.itens.map((it,ii)=>editRow(g,gi,it,ii)).join('')}</div>`;
      }).join('')+`</div>`;
  }else{
    const viewTable=itens=>`<table class="rv-data-table" style="font-size:.8rem"><tbody>${itens.map(it=>`<tr><td>${esc(it.label)}</td><td class="rv-num">${rvBrl(it.preco)}</td></tr>`).join('')}</tbody></table>`;
    cont.innerHTML=`<div style="display:grid;grid-template-columns:repeat(${nCols},1fr);gap:.9rem;align-items:start">`+
      RV_SACACHO.grupos.map(g=>{
        const titulo=`<div style="font-size:.8rem;font-weight:700;color:var(--ink3);margin-bottom:.4rem;white-space:nowrap">${esc(g.nome)}</div>`;
        if(g.itens.length>5){ // grupo grande — divide em 2 sub-colunas internas (ex: Boop 1k-5k / 10k-50k)
          const[i1,i2]=metade(g.itens);
          return`<div>${titulo}<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 .5rem">
            <div>${viewTable(i1)}</div>
            <div>${viewTable(i2)}</div>
          </div></div>`;
        }
        return`<div>${titulo}${viewTable(g.itens)}</div>`;
      }).join('')+`</div>`;
  }
}

function rv2AddProdRow(desc='',qtd='',preco='',pv='',containerId,fornecedorNome,tipoProduto,comLogoProduto,clicheProduto,noteProduto=''){
  containerId=containerId||'rv2-prod-rows';
  const cont=rvEl(containerId);
  const row=document.createElement('div');
  row.className='rv2-prodcard';
  const onCalc=containerId==='rvedit-prod-rows'?'rv2EditPreview()':'rv2Calc()';
  let fornAtual=fornecedorNome;
  let tipoAtual=tipoProduto;
  if(!fornAtual||!tipoAtual){
    const rowsExistentes=cont.querySelectorAll('.rv2-prodcard');
    const ultima=rowsExistentes.length?rowsExistentes[rowsExistentes.length-1]:null;
    if(!fornAtual)fornAtual=ultima?ultima.querySelector('.rv2-prod-forn').value:(RV_FORNECEDORES2[0]?RV_FORNECEDORES2[0].nome:'');
    if(!tipoAtual)tipoAtual=ultima?ultima.querySelector('.rv2-prod-tipo-btn').dataset.v:'Nacional';
  }
  const logoAtual=!!comLogoProduto;
  const opcoesForn=RV_FORNECEDORES2.map(f=>`<option value="${esc(f.nome)}"${f.nome===fornAtual?' selected':''}>${esc(f.nome)}</option>`).join('');
  row.innerHTML=`<div class="rv2-prodcard-l1">
      <div class="rv2-field rv2-prod-fornecedor-field"><span class="rv2-field-label">Fornecedor</span><div class="rv2-forn-control"><select class="rv2-chip-select rv2-prod-forn" onchange="${onCalc}">${opcoesForn}</select><button type="button" class="rv2-chip-addbtn" onclick="rv2OpenCad('fornecedor')" title="Cadastrar / gerenciar fornecedores"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div></div>
      <div class="rv2-field rv2-prod-descricao-field"><span class="rv2-field-label">Produto / descrição</span><input type="text" class="rv2-prod-desc" placeholder="Descrição do produto" value="${esc(desc)}" oninput="${onCalc}"></div>
      <div class="rv2-field rv2-origem-field"><span class="rv2-field-label">Origem</span><button type="button" class="rv2-seg-toggle rv2-prod-tipo-btn" data-v="${tipoAtual}" title="${tipoAtual} — clique para alternar" onclick="rv2ToggleProdTipo(this);${onCalc}"><span data-value="Nacional" class="${tipoAtual==='Nacional'?'active':''}">Nacional</span><span data-value="Importada" class="${tipoAtual==='Importada'?'active':''}">Importado</span></button></div>
      <button type="button" class="rv2-prod-remove" title="Remover produto" onclick="this.closest('.rv2-prodcard').remove();${onCalc}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="rv2-prodcard-l2">
      <div class="rv2-field"><span class="rv2-field-label">Qtd.</span><input type="number" class="mono rv2-prod-qty" placeholder="1000" value="${qtd}" min="0" step="1" oninput="${onCalc}"></div>
      <div class="rv2-field"><span class="rv2-field-label">Custo unit. R$</span><input type="number" class="mono rv2-prod-preco" placeholder="4.25" value="${preco}" min="0" step="0.01" oninput="${onCalc}"></div>
      <div class="rv2-field"><span class="rv2-field-label">PV unit. R$</span><input type="number" class="mono rv2-prod-pv" placeholder="8.65" value="${pv}" min="0" step="0.01" oninput="${onCalc}"></div>
      <div class="rv2-field rv2-cliche-field"><span class="rv2-field-label">Clichê / molde / logo R$ <span title="Vai pro fornecedor por padrão; vai pro beneficiador só se Logo estiver marcado">ⓘ</span></span><input type="number" class="mono rv2-prod-cliche" value="${clicheProduto||0}" min="0" step="0.01" oninput="${onCalc}"></div>
      <div class="rv2-field rv2-prod-logo-field"><span class="rv2-field-label">Logo</span><button type="button" class="rv2-seg-toggle rv2-prod-logo-btn${logoAtual?' active':''}" onclick="rv2ToggleProdLogo(this);${onCalc}" title="Clique para alternar"><span data-value="false" class="${!logoAtual?'active':''}">Sem logo</span><span data-value="true" class="${logoAtual?'active':''}">Com logo</span></button></div>
    </div>
    <div class="rv2-prod-note-wrap"><input type="text" class="rv2-prod-note" maxlength="240" placeholder="Notas da cotação deste produto (opcional)" value="${esc(noteProduto||'')}"></div>`;
  cont.appendChild(row);
  if(containerId==='rvedit-prod-rows')rv2EditPreview();else rv2Calc();
}
function rv2ToggleProdLogo(btn){
  btn.classList.toggle('active');
  const comLogo=btn.classList.contains('active');
  btn.querySelectorAll('span').forEach(s=>s.classList.toggle('active',(s.dataset.value==='true')===comLogo));
}
function rv2ToggleProdTipo(btn){
  const novo=btn.dataset.v==='Nacional'?'Importada':'Nacional';
  btn.dataset.v=novo;
  btn.querySelectorAll('span').forEach(s=>s.classList.toggle('active',s.dataset.value===novo));
  btn.title=novo+' — clique para alternar';
}
function rv2ReadProdRows(containerId){
  containerId=containerId||'rv2-prod-rows';
  return[...document.querySelectorAll('#'+containerId+' .rv2-prodcard')].map(row=>{
    const selForn=row.querySelector('.rv2-prod-forn');
    const tipoBtn=row.querySelector('.rv2-prod-tipo-btn');
    const logoBtn=row.querySelector('.rv2-prod-logo-btn');
    const clicheInp=row.querySelector('.rv2-prod-cliche');
    const comLogo=logoBtn?logoBtn.classList.contains('active'):false;
    return{desc:row.querySelector('.rv2-prod-desc').value.trim(),note:(row.querySelector('.rv2-prod-note')?.value||'').trim(),
      qtd:parseFloat(row.querySelector('.rv2-prod-qty').value)||0,
      preco:parseFloat(row.querySelector('.rv2-prod-preco').value)||0,
      pv:parseFloat(row.querySelector('.rv2-prod-pv').value)||0,
      fornecedor:selForn?selForn.value:'',tipo:tipoBtn?tipoBtn.dataset.v:'Nacional',comLogo,
      cliche:clicheInp?(parseFloat(clicheInp.value)||0):0};
  });
}
function rv2AddProdRowEdit(desc='',qtd='',preco='',pv='',fornecedorNome,tipoProduto,comLogoProduto,clicheProduto,noteProduto=''){rv2AddProdRow(desc,qtd,preco,pv,'rvedit-prod-rows',fornecedorNome,tipoProduto,comLogoProduto,clicheProduto,noteProduto);}
function rvPricingMath(input){
  const produtos=input.produtos||[];
  const qtd=produtos.reduce((a,p)=>a+(Number(p.qtd)||0),0);
  const custoCompra=produtos.reduce((a,p)=>a+(Number(p.qtd)||0)*(Number(p.preco)||0),0);
  const vendaProduto=produtos.reduce((a,p)=>a+(Number(p.qtd)||0)*(Number(p.pv)||0),0);
  const cliche=Number(input.cliche)||0;
  const freteTotal=Number(input.freteTotal)||0;
  const freteIncluso=!!input.freteIncluso;
  const comissaoPct=Number(input.comissaoPct)||0;
  const fedPct=Number(input.fedPct)||0;
  const icmsCredPct=Number(input.icmsCredPct)||0;
  const icmsDebPct=Number(input.icmsDebPct)||0;

  if(qtd<=0||vendaProduto<=0)return null;

  // REGRA CANÔNICA:
  // 1. PV = somente produtos.
  // 2. Frete é despesa SEMPRE.
  // 3. +Frete ativo = o mesmo frete também entra UMA VEZ na receita.
  // 4. Comissão/federais/ICMS débito incidem sobre Receita.
  // 5. ICMS crédito incide sobre custo da mercadoria (sem clichê/frete).
  const receita=vendaProduto+(freteIncluso?freteTotal:0);
  const CMV=custoCompra+cliche;
  const lucroBruto=receita-CMV;
  const comissao=receita*(comissaoPct/100);
  const fed=receita*(fedPct/100);
  const freteDespesa=freteTotal;
  const despesasVenda=comissao+freteDespesa+fed;
  const margemLiquida=lucroBruto-despesasVenda;
  const credICMS=custoCompra*(icmsCredPct/100);
  const debICMS=receita*(icmsDebPct/100);
  const apuracaoICMS=credICMS-debICMS;
  const margemFinal=margemLiquida+apuracaoICMS;

  return{
    qtd,custoCompra,vendaProduto,cliche,freteTotal,freteIncluso,
    receita,CMV,lucroBruto,comissao,fed,freteDespesa,despesasVenda,margemLiquida,
    credICMS,debICMS,apuracaoICMS,margemFinal,
    preco:qtd?custoCompra/qtd:0,pv:qtd?vendaProduto/qtd:0,freteUnit:qtd?freteTotal/qtd:0,
    pctMargemLiquida:receita?margemLiquida/receita:0,
    pctMargemFinal:receita?margemFinal/receita:0,
    custoTotal:CMV+freteTotal,
    vendaTotal:receita,
    lucroTotal:margemLiquida,
    margem:receita?margemLiquida/receita:0,
    custoLiquido:CMV+freteTotal-credICMS,
    saldoICMS:debICMS-credICMS
  };
}


function rvPricingSelfTest(){
  const close=(a,b)=>Math.abs(a-b)<0.005;
  const cases=[
    {name:'sem frete',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:0,freteTotal:0,freteIncluso:false,comissaoPct:0,fedPct:0,icmsCredPct:0,icmsDebPct:0},e:{receita:20000,freteDespesa:0}},
    {name:'frete só despesa',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:0,freteTotal:1000,freteIncluso:false,comissaoPct:0,fedPct:0,icmsCredPct:0,icmsDebPct:0},e:{receita:20000,freteDespesa:1000,margemLiquida:9000}},
    {name:'+frete',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:0,freteTotal:1000,freteIncluso:true,comissaoPct:0,fedPct:0,icmsCredPct:0,icmsDebPct:0},e:{receita:21000,freteDespesa:1000,margemLiquida:10000}},
    {name:'cliche',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:500,freteTotal:0,freteIncluso:false,comissaoPct:0,fedPct:0,icmsCredPct:0,icmsDebPct:0},e:{CMV:10500,margemLiquida:9500}},
    {name:'comissao 1%',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:0,freteTotal:0,freteIncluso:false,comissaoPct:1,fedPct:0,icmsCredPct:0,icmsDebPct:0},e:{comissao:200}},
    {name:'ICMS 4/20',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:0,freteTotal:0,freteIncluso:false,comissaoPct:0,fedPct:0,icmsCredPct:4,icmsDebPct:20},e:{credICMS:400,debICMS:4000,apuracaoICMS:-3600}},
    {name:'Aratu imagem',i:{produtos:[{qtd:1000,preco:4.6,pv:7.9}],cliche:0,freteTotal:400,freteIncluso:true,comissaoPct:1,fedPct:5.93,icmsCredPct:4,icmsDebPct:12},e:{receita:8300,freteDespesa:400}},
    {name:'Jones imagem',i:{produtos:[{qtd:1000,preco:10,pv:20}],cliche:500,freteTotal:1000,freteIncluso:false,comissaoPct:1,fedPct:5.93,icmsCredPct:4,icmsDebPct:20},e:{receita:20000,freteDespesa:1000,CMV:10500}}
  ];
  return cases.map(c=>{
    const r=rvPricingMath(c.i);
    const checks=Object.entries(c.e).map(([k,v])=>[k,r?.[k],v,close(r?.[k]||0,v)]);
    return{name:c.name,ok:checks.every(x=>x[3]),checks};
  });
}

function rv2CalcCore(cliente,fornecedor,tipo,produtos,comissaoPct,freteTotal,cliche,freteIncluso,comLogo){
  if(!cliente||!fornecedor||!produtos||!produtos.length)return null;
  const regFor=REGIAO_MAP[fornecedor.estado]||'SE_S';
  const regCli=REGIAO_MAP[cliente.estado]||'SE_S';
  const icmsCredPct=TAB_CREDITO[tipo][fornecedor.regime][regFor];
  const icmsDebPct=TAB_DEBITO[tipo][regCli];
  const fedPct=RV_EMPRESA.fedPct;

  const m=rvPricingMath({
    produtos,cliche,freteTotal,freteIncluso,comissaoPct,fedPct,icmsCredPct,icmsDebPct
  });
  if(!m)return null;

  return{
    cliente,fornecedor,tipo,produtos,regFor,regCli,icmsCredPct,icmsDebPct,fedPct,
    comissaoPct,comLogo:!!comLogo,
    ...m
  };
}
function rvSafeId(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'_');}
function rvBuildFornecedoresArray(r){
  // Constrói o array fornecedores[] pronto pra salvar no registro, agregando por FORNECEDOR REAL
  // (pagamento é por fornecedor — mesmo que ele tenha produtos em sub-grupos de cálculo diferentes,
  // por causa de tipo/logo variando dentro do mesmo fornecedor)
  if(!r.fornecedores)return[];
  const porFornecedor={};
  r.fornecedores.forEach(f=>{
    const nome=f.fornecedor.nome;
    if(!porFornecedor[nome]){
      const cad=RV_FORNECEDORES2.find(x=>(x.nome||'').toLowerCase().trim()===String(nome||'').toLowerCase().trim());
      porFornecedor[nome]={key:rvSafeId(nome),nome,custoCompra:0,freteTotal:0,cliche:0,produtor:!!cad?.produtor};
    }
    porFornecedor[nome].custoCompra+=f.custoCompra;
    porFornecedor[nome].freteTotal+=f.freteTotal;
    porFornecedor[nome].cliche+=f.cliche;
  });
  return Object.values(porFornecedor);
}
function rv2CalcMultiFornecedor(cliente,produtos,comissaoPct,freteTotal,freteIncluso){
  if(!cliente||!produtos||!produtos.length)return null;
  const gruposMap={};
  produtos.forEach(p=>{
    const fn=(p.fornecedor||'').trim();
    if(!fn)return;
    const tp=p.tipo||'Nacional';
    const logo=!!p.comLogo;
    const key=fn+'||'+tp+'||'+(logo?'1':'0');
    if(!gruposMap[key])gruposMap[key]={fornecedorNome:fn,tipo:tp,comLogo:logo,produtos:[]};
    gruposMap[key].produtos.push(p);
  });

  // Só entram no rateio os grupos que de fato conseguem ser calculados.
  // Assim nenhuma parte do frete desaparece por causa de linha incompleta,
  // fornecedor renomeado ou grupo ignorado.
  const gruposValidos=Object.values(gruposMap).map(g=>{
    const alvo=g.fornecedorNome.toLowerCase().trim();
    const fornecedorObj=RV_FORNECEDORES2.find(f=>(f.nome||'').toLowerCase().trim()===alvo);
    if(!fornecedorObj)return null;
    const custoGrupo=g.produtos.reduce((a,p)=>a+(p.qtd||0)*(p.preco||0),0);
    return{...g,fornecedorObj,custoGrupo};
  }).filter(Boolean);

  if(!gruposValidos.length)return null;
  const custoValidoTotal=gruposValidos.reduce((a,g)=>a+g.custoGrupo,0);
  if(custoValidoTotal<=0)return null;

  const subResultados=[];
  let freteJaRateado=0;
  gruposValidos.forEach((g,idx)=>{
    // último grupo recebe o residual: soma dos subgrupos = frete digitado EXATAMENTE.
    const freteGrupo=idx===gruposValidos.length-1
      ?Math.max(0,freteTotal-freteJaRateado)
      :freteTotal*(g.custoGrupo/custoValidoTotal);
    freteJaRateado+=freteGrupo;
    const clicheGrupo=g.produtos.reduce((a,p)=>a+(p.cliche||0),0);
    const r=rv2CalcCore(cliente,g.fornecedorObj,g.tipo,g.produtos,comissaoPct,freteGrupo,clicheGrupo,freteIncluso,g.comLogo);
    if(r)subResultados.push(r);
  });
  if(!subResultados.length)return null;

  const soma=campo=>subResultados.reduce((a,r)=>a+(r[campo]||0),0);
  const receita=soma('receita'),vendaProdutoTotal=soma('vendaProduto'),custoCompra=soma('custoCompra'),CMV=soma('CMV'),
    lucroBruto=soma('lucroBruto'),comissao=soma('comissao'),fed=soma('fed'),
    despesasVenda=soma('despesasVenda'),margemLiquida=soma('margemLiquida'),
    credICMS=soma('credICMS'),debICMS=soma('debICMS'),apuracaoICMS=soma('apuracaoICMS'),
    margemFinal=soma('margemFinal'),clicheSum=soma('cliche'),qtdSum=soma('qtd');

  // IMPORTANTE: freteTotal consolidado é o valor que o usuário digitou.
  // Nunca reconstruímos o total somando rateios internos.
  const freteTotalSum=freteTotal;

  const pctMargemLiquida=receita>0?margemLiquida/receita:0;
  const pctMargemFinal=receita>0?margemFinal/receita:0;
  const precoMedio=qtdSum>0?custoCompra/qtdSum:0;
  const pvMedio=qtdSum>0?vendaProdutoTotal/qtdSum:0;
  const icmsCredPctEfetivo=custoCompra>0?credICMS/custoCompra*100:0;
  const icmsDebPctEfetivo=receita>0?debICMS/receita*100:0;
  const freteUnit=qtdSum>0?freteTotalSum/qtdSum:0;
  const freteDespesa=freteTotalSum;
  const fornecedorNomes=[...new Set(subResultados.map(r=>r.fornecedor.nome))];
  const fornecedorLegado=fornecedorNomes.join(' + ');
  const tiposUsados=[...new Set(subResultados.map(r=>r.tipo))];
  const tipoLegado=tiposUsados.length===1?tiposUsados[0]:tiposUsados.join(' + ');
  const comLogoAny=subResultados.some(r=>r.comLogo);
  const regCli=subResultados[0].regCli;
  const regFor=subResultados[0].regFor;

  return{
    multiFornecedor:subResultados.length>1,
    fornecedores:subResultados,
    fornecedorNomes,fornecedorLegado,tiposUsados,tipo:tipoLegado,comLogo:comLogoAny,
    cliente,produtos,qtd:qtdSum,preco:precoMedio,pv:pvMedio,
    icmsCredPct:icmsCredPctEfetivo,icmsDebPct:icmsDebPctEfetivo,fedPct:RV_EMPRESA.fedPct,comissaoPct,
    freteUnit,freteDespesa,regFor,regCli,
    receita,custoCompra,CMV,lucroBruto,comissao,fed,despesasVenda,margemLiquida,pctMargemLiquida,
    credICMS,debICMS,apuracaoICMS,margemFinal,pctMargemFinal,
    freteTotal:freteTotalSum,cliche:clicheSum,freteIncluso:!!freteIncluso,
    vendaTotal:receita,vendaProduto:vendaProdutoTotal,custoTotal:CMV+freteTotalSum,
    custoLiquido:CMV+freteTotalSum-credICMS,lucroTotal:margemLiquida,margem:pctMargemLiquida,
    saldoICMS:debICMS-credICMS,
  };
}
function rv2Calc(){
  const cliente=rv2GetCliente();
  const produtos=rv2ReadProdRows();
  const comissaoPct=parseFloat(rvEl('rv2-comissao').value)||0;
  const freteTotal=parseFloat(rvEl('rv2-frete').value)||0;
  const r=rv2CalcMultiFornecedor(cliente,produtos,comissaoPct,freteTotal,rv2FreteIncluso);
  if(!r){
    rvEl('rv2-resumo').innerHTML='<p class="hint">Selecione cliente e fornecedor, adicione ao menos 1 produto com qtd e preços preenchidos.</p>';
    rvEl('rv2-detalhe').innerHTML='';
    return null;
  }
  rv2Render(r);
  return r;
}
let rv2FreteIncluso=false;
function rv2ToggleFreteIncluso(){
  rv2FreteIncluso=!rv2FreteIncluso;
  rvEl('rv2-frete-incluso-btn').classList.toggle('active',rv2FreteIncluso);
  rv2Calc();
}

function rv2Render(r){
  rvEl('rv2-resumo').innerHTML=`
    <div style="display:flex;gap:.5rem;margin-bottom:.7rem">
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Custo total</div>
        <div style="font-size:.92rem;font-weight:700;color:var(--red);font-family:'IBM Plex Mono'">${rvBrl(r.custoTotal)}</div>
      </div>
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Venda</div>
        <div style="font-size:.92rem;font-weight:700;color:var(--blue);font-family:'IBM Plex Mono'">${rvBrl(r.receita)}</div>
      </div>
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Margem</div>
        <div style="font-size:.92rem;font-weight:700;color:${r.margemFinal>=0?'var(--green)':'var(--red)'};font-family:'IBM Plex Mono'">${rvBrl(r.margemFinal)} <span style="font-size:.68rem">(${(r.pctMargemFinal*100).toFixed(1).replace('.',',')}%)</span></div>
      </div>
    </div>
    <div style="font-size:.66rem;color:var(--ink4)">${r.qtd.toLocaleString('pt-BR')} un · PV ${rvBrl(r.pv)}/un${r.freteTotal>0?` · frete ${rvBrl(r.freteTotal)}${r.freteIncluso?' cobrado à parte':' como despesa'}`:''}</div>
    <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--ink3);margin-top:.6rem;padding-top:.5rem;border-top:1px solid var(--bdr)">
      <span>ICMS crédito: <b style="color:var(--ink)">${rvPct(r.icmsCredPct)}%</b> (${REGIAO_LBL[r.regFor]})</span>
      <span>ICMS débito: <b style="color:var(--ink)">${rvPct(r.icmsDebPct)}%</b> (${REGIAO_LBL[r.regCli]})</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:.72rem;color:var(--ink3);margin-top:.4rem;padding-top:.4rem;border-top:1px dashed var(--bdr)">
      <span>Margem Líquida <span style="color:var(--ink4)">(antes da apuração de ICMS)</span></span>
      <b style="font-family:'IBM Plex Mono';color:${r.margemLiquida>=0?'var(--green)':'var(--red)'}">${rvBrl(r.margemLiquida)} (${(r.pctMargemLiquida*100).toFixed(1).replace('.',',')}%)</b>
    </div>
    ${r.multiFornecedor?`<div style="margin-top:.6rem;padding-top:.5rem;border-top:1px solid var(--bdr)">
      <div style="font-size:.6rem;color:var(--ink4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem">Margem por fornecedor</div>
      ${r.fornecedores.map(f=>`<div style="display:flex;justify-content:space-between;font-size:.68rem;padding:.15rem 0">
        <span>${esc(f.fornecedor.nome)} <span style="color:var(--ink4)">(${rvBrl(f.custoCompra)})</span></span>
        <b style="font-family:'IBM Plex Mono';color:${f.margemFinal>=0?'var(--green)':'var(--red)'}">${rvBrl(f.margemFinal)} (${(f.pctMargemFinal*100).toFixed(1).replace('.',',')}%)</b>
      </div>`).join('')}
    </div>`:''}`;
  if(rv2DetalheOpen)rv2RenderDetalhe(r);
}
function rv2RenderDetalhe(r,targetId){
  const cmvClicheLinha=r.cliche>0?`<tr><td>(+) Clichê / molde / logo</td><td class="num">${rvBrl(r.cliche)}</td></tr>`:'';
  const freteLinha=r.freteDespesa>0?`<tr><td>Frete entrega <span style="color:var(--ink4)">(${rvBrl(r.freteUnit)}/un)</span></td><td class="num">${rvBrl(r.freteDespesa)}</td></tr>`:'';
  const comissaoLinha=r.comissaoPct>0?`<tr><td>Comissão (${r.comissaoPct}% s/ receita)</td><td class="num">${rvBrl(r.comissao)}</td></tr>`:'';
  const vendaProdutoBruta=r.vendaProduto!=null?r.vendaProduto:(r.pv*r.qtd);
  const freteReceitaLinha=r.freteIncluso&&r.freteTotal>0?`
        <tr style="background:var(--ltgrn)"><td>Frete entrega cobrado à parte <span style="color:var(--ink4)">(${rvBrl(r.freteUnit)}/un)</span></td><td class="num">${rvBrl(r.freteTotal)}</td></tr>
        <tr class="rv-sub"><td>= Receita total</td><td class="num">${rvBrl(r.receita)}</td></tr>`:'';
  rvEl(targetId||'rv2-detalhe').innerHTML=`
    <table class="res-table">
      <tbody>
        <tr class="rv-sec"><td colspan="2">Receita de Venda</td></tr>
        <tr><td>Venda produto (${r.qtd.toLocaleString('pt-BR')} × ${rvBrl(r.pv)})</td><td class="num">${rvBrl(vendaProdutoBruta)}</td></tr>
        ${freteReceitaLinha}

        <tr class="rv-sec"><td colspan="2">(−) CMV</td></tr>
        <tr><td>Compra (${r.qtd.toLocaleString('pt-BR')} × ${rvBrl(r.preco)})</td><td class="num">${rvBrl(r.custoCompra)}</td></tr>
        ${cmvClicheLinha}
        <tr class="rv-sub"><td>= Lucro Bruto</td><td class="num">${rvBrl(r.lucroBruto)}</td></tr>

        <tr class="rv-sec"><td colspan="2">(−) Despesas de Venda</td></tr>
        ${comissaoLinha}
        ${freteLinha}
        <tr><td>PIS/COFINS/IRPJ/CSLL (${r.fedPct}% s/ receita)</td><td class="num">${rvBrl(r.fed)}</td></tr>
        <tr class="rv-tot"><td>= MARGEM LÍQUIDA</td><td class="num">${rvBrl(r.margemLiquida)} (${(r.pctMargemLiquida*100).toFixed(1).replace('.',',')}%)</td></tr>

        <tr class="rv-sec"><td colspan="2">Apuração de ICMS <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ink4)">(acerto de imposto, não é despesa)</span></td></tr>
        <tr><td>(+) Crédito da compra (${rvPct(r.icmsCredPct)}%)</td><td class="num">${rvBrl(r.credICMS)}</td></tr>
        <tr><td>(−) Débito da venda (${rvPct(r.icmsDebPct)}%)</td><td class="num negv">−${rvBrl(r.debICMS)}</td></tr>
        <tr class="rv-sub"><td>= Saldo ICMS (${r.apuracaoICMS>=0?'a recuperar':'a recolher'})</td><td class="num">${rvBrl(r.apuracaoICMS)}</td></tr>

        <tr class="rv-tot"><td>= MARGEM FINAL</td><td class="num">${rvBrl(r.margemFinal)} (${(r.pctMargemFinal*100).toFixed(1).replace('.',',')}%)</td></tr>
      </tbody>
    </table>`;
}
function rv2ToggleDetalhe(){
  rv2DetalheOpen=!rv2DetalheOpen;
  rvEl('rv2-detalhe-btn').textContent=rv2DetalheOpen?'Ocultar detalhado':'Ver detalhado';
  rvEl('rv2-detalhe').style.display=rv2DetalheOpen?'block':'none';
  const r=rv2Calc();
}

/* ── CADASTRO RÁPIDO + GERENCIAR (editar/apagar) — Cliente / Fornecedor, tudo na mesma janela ── */
let rv2CadTipo='cliente',rv2CadRegime='LP';
function rv2OpenCad(tipo){
  rv2CadTipo=tipo;rv2CadRegime='LP';
  rvEl('rvcad-title').textContent=tipo==='cliente'?'Novo cliente':'Novo fornecedor';
  rvEl('rvcad-list-title').textContent=tipo==='cliente'?'Clientes cadastrados':'Fornecedores cadastrados';
  rvEl('rvcad-nome').value='';
  rvEl('rvcad-estado').value='RJ';
  rvEl('rvcad-regime-wrap').style.display=tipo==='fornecedor'?'block':'none';
  document.querySelectorAll('#rvcad-regime-toggle button').forEach(b=>b.classList.toggle('active',b.textContent.includes('Presumido')));
  rvEl('rvcad-produtor').checked=false;
  rv2RenderCadList();
  document.getElementById('ovl-rvcad').classList.add('open');
  setTimeout(()=>rvEl('rvcad-nome').focus(),50);
}
function rv2SetCadRegime(r){
  rv2CadRegime=r;
  document.querySelectorAll('#rvcad-regime-toggle button').forEach(b=>b.classList.toggle('active',(r==='LP')===b.textContent.includes('Presumido')));
}
function rv2SaveCad(){
  const nome=rvEl('rvcad-nome').value.trim();
  const estado=rvEl('rvcad-estado').value;
  if(!nome){toastSave('Digite um nome');return;}
  if(rv2CadTipo==='cliente'){
    if(RV_CLIENTES2.some(c=>c.nome.toLowerCase()===nome.toLowerCase())){toastSave('Cliente já cadastrado');return;}
    RV_CLIENTES2.push({nome,estado,updatedAt:Date.now()});
    rv2PopulateSelects();rvEl('rv2-cliente').value=nome;rv2OnClienteChange();
  }else{
    if(RV_FORNECEDORES2.some(f=>f.nome.toLowerCase()===nome.toLowerCase())){toastSave('Fornecedor já cadastrado');return;}
    RV_FORNECEDORES2.push({nome,estado,regime:rv2CadRegime,produtor:rvEl('rvcad-produtor').checked,updatedAt:Date.now()});
    rv2PopulateSelects();
    const rowsForn=document.querySelectorAll('#rv2-prod-rows .rv2-prod-forn');
    if(rowsForn.length)rowsForn[rowsForn.length-1].value=nome;
    rv2Calc();
  }
  rv2SaveLocalCad();
  rvSyncPush();
  rvEl('rvcad-nome').value='';
  rv2RenderCadList(); // mantém a janela aberta, já mostra o novo item na lista
  toastSave('Cadastrado ✓');
}
function rv2RenderCadList(){
  const lista=rv2CadTipo==='cliente'?RV_CLIENTES2:RV_FORNECEDORES2;
  const body=rvEl('rvcad-list-body');
  if(!lista.length){body.innerHTML='<p class="hint">Nenhum cadastro ainda.</p>';return;}
  body.innerHTML=`<table class="rv-data-table"><thead><tr>
    <th>Nome</th><th>UF</th>${rv2CadTipo==='fornecedor'?'<th>Regime</th><th>Produtor</th>':''}<th></th>
  </tr></thead><tbody>`+lista.map((item,i)=>`<tr>
    <td><input type="text" value="${esc(item.nome)}" style="width:100%;border:1px solid var(--bdr2);border-radius:5px;padding:.25rem .4rem;font-size:.75rem;background:var(--card);color:var(--ink)" onchange="rv2UpdateCadField(${i},'nome',this.value)"></td>
    <td><select style="border:1px solid var(--bdr2);border-radius:5px;padding:.25rem .3rem;font-size:.75rem;background:var(--card);color:var(--ink)" onchange="rv2UpdateCadField(${i},'estado',this.value)">${ESTADOS.map(([uf])=>`<option value="${uf}"${uf===item.estado?' selected':''}>${uf}</option>`).join('')}</select></td>
    ${rv2CadTipo==='fornecedor'?`<td><select style="border:1px solid var(--bdr2);border-radius:5px;padding:.25rem .3rem;font-size:.75rem;background:var(--card);color:var(--ink)" onchange="rv2UpdateCadField(${i},'regime',this.value)"><option value="LP"${item.regime==='LP'?' selected':''}>LP</option><option value="SN"${item.regime==='SN'?' selected':''}>SN</option></select></td>
    <td style="text-align:center"><input type="checkbox" ${item.produtor?'checked':''} onchange="rv2UpdateCadField(${i},'produtor',this.checked)"></td>`:''}
    <td><button class="btn-rvdel" onclick="rv2DeleteCad(${i})" title="Apagar" aria-label="Apagar">🗑</button></td>
  </tr>`).join('')+'</tbody></table>';
}
function rv2UpdateCadField(idx,field,value){
  const lista=rv2CadTipo==='cliente'?RV_CLIENTES2:RV_FORNECEDORES2;
  const item=lista[idx];if(!item)return;
  if(field==='nome'){
    const novoNome=value.trim();
    if(!novoNome){toastSave('Nome não pode ficar vazio');rv2RenderCadList();return;}
    if(lista.some((x,j)=>j!==idx&&x.nome.toLowerCase()===novoNome.toLowerCase())){toastSave('Já existe um cadastro com esse nome');rv2RenderCadList();return;}
    item.nome=novoNome;
  }else{item[field]=value;}
  item.updatedAt=Date.now();
  rv2SaveLocalCad();rv2PopulateSelects();rvSyncPush(true);
  toastSave('Atualizado ✓');
}
function rv2DeleteCad(idx){
  const lista=rv2CadTipo==='cliente'?RV_CLIENTES2:RV_FORNECEDORES2;
  const item=lista[idx];if(!item)return;
  if(!confirm(`Apagar "${item.nome}"? Cotações/pedidos já salvos não são afetados (guardam o nome como texto).`))return;
  lista.splice(idx,1);
  rv2SaveLocalCad();rv2PopulateSelects();rvSyncPush();
  rv2RenderCadList();
  toastSave('Apagado ✓');
}

/* ── HISTÓRICO DE COMPRAS DO CLIENTE ── */
function rv2RenderHist(){
  const cliente=rv2GetCliente();
  rvEl('rv2-hist-cliente').textContent=cliente?cliente.nome:'selecione um cliente';
  const cont=rvEl('rv2-hist-table');
  if(!cliente){cont.innerHTML='';return;}
  const registros=[
    ...rvLoadCotacoesActive().filter(c=>c.cliente===cliente.nome).map(c=>({...c,origem:'Cotação'})),
    ...rvLoadPedidosActive().filter(p=>p.cliente===cliente.nome).map(p=>({...p,origem:'Pedido'}))
  ].sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  if(!registros.length){cont.innerHTML='<p class="hint">Nenhuma compra registrada ainda pra esse cliente.</p>';return;}
  let html='<table class="rv-data-table"><thead><tr><th>Data</th><th>Origem</th><th class="rv-num">Qtd</th><th class="rv-num">Preço venda</th><th class="rv-num">Lucro %</th><th class="rv-num">Lucro</th></tr></thead><tbody>';
  registros.forEach(r=>{
    html+=`<tr onclick="rv2OpenEdit('${r.origem==='Cotação'?'cotacao':'pedido'}',${r.id})" style="cursor:pointer" title="Clique pra editar">
      <td>${esc(r.data||'—')}</td>
      <td>${r.origem}</td>
      <td class="rv-num">${(r.qtd||0).toLocaleString('pt-BR')}</td>
      <td class="rv-num">${rvBrl(r.pv)}</td>
      <td class="rv-num rv-pos">${((r.margem||0)*100).toFixed(1).replace('.',',')}%</td>
      <td class="rv-num rv-pos">${rvBrl(r.lucroTotal)}</td>
    </tr>`;
  });
  html+='</tbody></table>';
  cont.innerHTML=html;
}

/* ── SALVAR COTAÇÃO / CRIAR PEDIDO ── */
function rv2SalvarCotacao(){
  const r=rv2Calc();
  if(!r){toastSave('Preencha os dados antes de salvar');return;}
  const cotacao={id:Date.now(),data:new Date().toLocaleDateString('pt-BR'),updatedAt:Date.now(),
    cliente:r.cliente.nome,fornecedor:r.fornecedorLegado,fornecedores:rvBuildFornecedoresArray(r),produtores:rvProdutoresDoResultado(r),tipo:r.tipo,produtos:r.produtos,qtd:r.qtd,preco:r.preco,pv:r.pv,
    icmsCredPct:r.icmsCredPct,icmsDebPct:r.icmsDebPct,fedPct:r.fedPct,comissaoPct:r.comissaoPct,
    freteTotal:r.freteTotal,freteIncluso:r.freteIncluso,comLogo:r.comLogo,cliche:r.cliche,custoTotal:r.custoTotal,vendaTotal:r.vendaTotal,
    lucroTotal:r.lucroTotal,margem:r.margem,calcVersion:'pricing_v1_canonical'};
  const lista=rvLoadCotacoes();lista.unshift(cotacao);rvSaveCotacoes(lista);
  rvSyncPush();
  rv2RenderHist();
  toastSave('Cotação salva ✓');
}
function rvProdutoresDoResultado(r){
  const nomes=new Set();
  (r?.produtos||[]).forEach(pr=>{if(pr?.fornecedor&&rvIsProdutor(pr.fornecedor))nomes.add(pr.fornecedor);});
  (rvBuildFornecedoresArray(r)||[]).forEach(f=>{if(f?.produtor||rvIsProdutor(f?.nome))nomes.add(f.nome);});
  return[...nomes];
}
function rv2CriarPedido(){
  const r=rv2Calc();
  if(!r){toastSave('Preencha os dados antes de criar o pedido');return;}
  const status={};RV_STATUS_STEPS.forEach(s=>status[s.key]=false);status.confirmado=true;
  const fornecedoresSnap=rvBuildFornecedoresArray(r);
  const produtores=rvProdutoresDoResultado(r);
  const pedido={id:Date.now(),data:new Date().toLocaleDateString('pt-BR'),updatedAt:Date.now(),
    cliente:r.cliente.nome,fornecedor:r.fornecedorLegado,fornecedores:fornecedoresSnap,produtores,
    ciDates:RV_CI_LABELS.map(()=>rvMkD(null,true)),
    tipo:r.tipo,produtos:r.produtos,qtd:r.qtd,preco:r.preco,pv:r.pv,
    icmsCredPct:r.icmsCredPct,icmsDebPct:r.icmsDebPct,fedPct:r.fedPct,comissaoPct:r.comissaoPct,
    freteTotal:r.freteTotal,freteIncluso:r.freteIncluso,comLogo:r.comLogo,cliche:r.cliche,custoTotal:r.custoTotal,vendaTotal:r.vendaTotal,
    lucroTotal:r.lucroTotal,margem:r.margem,calcVersion:'pricing_v1_canonical',status,obs:''};
  const lista=rvLoadPedidos();lista.unshift(pedido);rvSavePedidos(lista);
  rvSyncPush();
  rv2RenderHist();
  toastSave('Pedido criado ✓');
  rvShowTab('pedidos');
  rvOpenCondPagto(pedido.id);
}

/* ── EDITAR COTAÇÃO/PEDIDO JÁ SALVOS ── */
let rvEditCtx=null; // {kind:'cotacao'|'pedido', id}
let rvEditFreteIncluso=false;
function rvEditToggleFreteIncluso(){
  rvEditFreteIncluso=!rvEditFreteIncluso;
  rvEl('rvedit-frete-incluso-btn').classList.toggle('active',rvEditFreteIncluso);
  rv2EditPreview();
}
function rv2OpenEdit(kind,id){
  const lista=kind==='cotacao'?rvLoadCotacoes():rvLoadPedidos();
  const rec=lista.find(x=>x.id===id);
  if(!rec){toastSave('Registro não encontrado');return;}
  rvEditCtx={kind,id};
  rvEl('rvedit-title').textContent=(kind==='cotacao'?'Editar Cotação — ':'Editar Pedido — ')+rec.data;
  const detH=document.getElementById('rvedit-detalhe-body')?.previousElementSibling;
  if(detH)detH.classList.remove('open');
  document.getElementById('rvedit-detalhe-body')?.classList.remove('open');
  const selCli=rvEl('rvedit-cliente');
  selCli.innerHTML=RV_CLIENTES2.map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)} (${c.estado})</option>`).join('');
  selCli.value=rec.cliente;
  rvEl('rvedit-prod-rows').innerHTML='';
  if(rec.produtos&&rec.produtos.length){
    const temClicheProprio=rec.produtos.some(p=>(p.cliche||0)>0);
    const clicheDistribuido=new Array(rec.produtos.length).fill(0);
    if(!temClicheProprio&&(rec.cliche||0)>0){
      const idxComLogo=rec.produtos.map((p,i)=>i).filter(i=>rec.produtos[i].comLogo!==undefined?rec.produtos[i].comLogo:!!rec.comLogo);
      const idxBase=idxComLogo.length?idxComLogo:rec.produtos.map((p,i)=>i);
      const custoBase=idxBase.reduce((a,i)=>a+(rec.produtos[i].qtd||0)*(rec.produtos[i].preco||0),0);
      if(custoBase>0)idxBase.forEach(i=>{clicheDistribuido[i]=rec.cliche*((rec.produtos[i].qtd*rec.produtos[i].preco)/custoBase);});
    }
    rec.produtos.forEach((p,i)=>rv2AddProdRowEdit(p.desc,p.qtd,p.preco,p.pv,p.fornecedor||rec.fornecedor,p.tipo||rec.tipo||'Nacional',p.comLogo!==undefined?p.comLogo:!!rec.comLogo,p.cliche!==undefined?p.cliche:clicheDistribuido[i],p.note||p.nota||''));
  }else{
    rv2AddProdRowEdit('',rec.qtd,rec.preco,rec.pv,rec.fornecedor,rec.tipo||'Nacional',!!rec.comLogo,rec.cliche||0); // registro salvo antes de existir múltiplos produtos
  }
  rvEl('rvedit-comissao').value=rec.comissaoPct||0;
  rvEl('rvedit-frete').value=rec.freteTotal||0;
  rvEditFreteIncluso=!!rec.freteIncluso;
  rvEl('rvedit-frete-incluso-btn').classList.toggle('active',rvEditFreteIncluso);
  const cpSection=document.getElementById('rvedit-cp-section');
  if(kind==='pedido'){
    cpSection.style.display='block';
    const cpH=document.getElementById('rvedit-cp-body')?.previousElementSibling;
    if(cpH)cpH.classList.remove('open');
    document.getElementById('rvedit-cp-body')?.classList.remove('open');
    rvOpenCondPagto(id,'rvedit-cp');
  }else{
    cpSection.style.display='none';
  }
  document.getElementById('ovl-rvedit').classList.add('open');
  // Todos os campos do pedido já estão carregados neste ponto.
  // O preview deve nascer SEMPRE destes valores — nunca do estado do pedido anterior.
  rv2EditPreview();
}
function rv2EditPreview(){
  const cliente=RV_CLIENTES2.find(c=>c.nome===rvEl('rvedit-cliente').value);
  const produtos=rv2ReadProdRows('rvedit-prod-rows');
  const comissaoPct=parseFloat(rvEl('rvedit-comissao').value)||0;
  const freteTotal=parseFloat(rvEl('rvedit-frete').value)||0;
  const r=rv2CalcMultiFornecedor(cliente,produtos,comissaoPct,freteTotal,rvEditFreteIncluso);
  const prev=rvEl('rvedit-preview');
  if(!r){prev.innerHTML='<p class="hint">Selecione cliente e fornecedor, e adicione ao menos 1 produto com qtd e preços.</p>';rvEl('rvedit-detalhe').innerHTML='';return null;}
  prev.innerHTML=`<div class="card" style="padding:.75rem .8rem">
    <div class="sh" style="margin-bottom:.6rem">Resultado</div>
    <div style="display:flex;gap:.5rem;margin-bottom:.7rem">
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Custo total</div>
        <div style="font-size:.92rem;font-weight:700;color:var(--red);font-family:'IBM Plex Mono'">${rvBrl(r.custoTotal)}</div>
      </div>
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Venda</div>
        <div style="font-size:.92rem;font-weight:700;color:var(--blue);font-family:'IBM Plex Mono'">${rvBrl(r.receita)}</div>
      </div>
      <div style="flex:1;background:var(--bg);border-radius:8px;padding:.55rem .65rem">
        <div style="font-size:.56rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.04em">Margem</div>
        <div style="font-size:.92rem;font-weight:700;color:${r.margemFinal>=0?'var(--green)':'var(--red)'};font-family:'IBM Plex Mono'">${rvBrl(r.margemFinal)} <span style="font-size:.68rem">(${(r.pctMargemFinal*100).toFixed(1).replace('.',',')}%)</span></div>
      </div>
    </div>
    <div style="font-size:.66rem;color:var(--ink4)">${r.qtd.toLocaleString('pt-BR')} un · PV ${rvBrl(r.pv)}/un${r.freteTotal>0?` · frete ${rvBrl(r.freteTotal)}${r.freteIncluso?' cobrado à parte':' como despesa'}`:''}</div>
    <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--ink3);margin-top:.6rem;padding-top:.5rem;border-top:1px solid var(--bdr)">
      <span>ICMS crédito: <b style="color:var(--ink)">${rvPct(r.icmsCredPct)}%</b> (${REGIAO_LBL[r.regFor]})</span>
      <span>ICMS débito: <b style="color:var(--ink)">${rvPct(r.icmsDebPct)}%</b> (${REGIAO_LBL[r.regCli]})</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:.72rem;color:var(--ink3);margin-top:.4rem;padding-top:.4rem;border-top:1px dashed var(--bdr)">
      <span>Margem Líquida <span style="color:var(--ink4)">(antes da apuração de ICMS)</span></span>
      <b style="font-family:'IBM Plex Mono';color:${r.margemLiquida>=0?'var(--green)':'var(--red)'}">${rvBrl(r.margemLiquida)} (${(r.pctMargemLiquida*100).toFixed(1).replace('.',',')}%)</b>
    </div>
    ${r.multiFornecedor?`<div style="margin-top:.6rem;padding-top:.5rem;border-top:1px solid var(--bdr)">
      <div style="font-size:.6rem;color:var(--ink4);font-weight:700;text-transform:uppercase;margin-bottom:.3rem">Margem por fornecedor</div>
      ${r.fornecedores.map(f=>`<div style="display:flex;justify-content:space-between;font-size:.68rem;padding:.15rem 0">
        <span>${esc(f.fornecedor.nome)} <span style="color:var(--ink4)">(${rvBrl(f.custoCompra)})</span></span>
        <b style="font-family:'IBM Plex Mono';color:${f.margemFinal>=0?'var(--green)':'var(--red)'}">${rvBrl(f.margemFinal)} (${(f.pctMargemFinal*100).toFixed(1).replace('.',',')}%)</b>
      </div>`).join('')}
    </div>`:''}
  </div>`;
  rv2RenderDetalhe(r,'rvedit-detalhe');
  return r;
}
function rv2SaveEdit(){
  const r=rv2EditPreview();
  if(!r){toastSave('Preencha os dados corretamente antes de salvar');return;}
  const{kind,id}=rvEditCtx;
  // Se for pedido, valida as condições de pagamento também antes de salvar qualquer coisa
  let fornKeysEdit=[];
  if(kind==='pedido'){
    const pCheck=rvLoadPedidos().find(x=>x.id===id);
    fornKeysEdit=rvCPFornKeys(pCheck||{fornecedor:r.fornecedorLegado});
    const partes=[...fornKeysEdit.map(fk=>fk.key),'cliente'];
    if(pCheck&&pCheck.comLogo)partes.push('beneficiador');
    for(const tipo of partes){
      const soma=(rvCPParcelas[tipo]||[]).reduce((a,x)=>a+(x.pct||0),0);
      if(Math.abs(soma-100)>=0.05){
        const fk=fornKeysEdit.find(x=>x.key===tipo);
        const label=fk?fk.nome:tipo;
        toastSave(`As parcelas de ${label} (pagamento/recebimento) precisam somar 100% (está em ${soma.toFixed(1)}%)`);
        return;
      }
    }
  }
  const lista=kind==='cotacao'?rvLoadCotacoes():rvLoadPedidos();
  const rec=lista.find(x=>x.id===id);
  if(!rec){toastSave('Registro não encontrado');return;}
  Object.assign(rec,{
    cliente:r.cliente.nome,fornecedor:r.fornecedorLegado,fornecedores:rvBuildFornecedoresArray(r),produtores:rvProdutoresDoResultado(r),tipo:r.tipo,produtos:r.produtos,qtd:r.qtd,preco:r.preco,pv:r.pv,
    icmsCredPct:r.icmsCredPct,icmsDebPct:r.icmsDebPct,fedPct:r.fedPct,comissaoPct:r.comissaoPct,
    freteTotal:r.freteTotal,freteIncluso:r.freteIncluso,comLogo:r.comLogo,cliche:r.cliche,
    custoTotal:r.custoTotal,vendaTotal:r.vendaTotal,lucroTotal:r.lucroTotal,margem:r.margem,calcVersion:'pricing_v1_canonical',updatedAt:Date.now()
  });
  if(kind==='pedido'){
    if(!Array.isArray(rec.ciDates))rec.ciDates=RV_CI_LABELS.map(()=>rvMkD(null,true));
    // Recalcula fornKeys já com o fornecedores[] recém-atualizado no rec (pode ter mudado nesta edição)
    const fornKeysFinal=rvCPFornKeys(rec);
    const fornecedoresPlano={};
    fornKeysFinal.forEach(fk=>{fornecedoresPlano[fk.key]=rvCPParcelas[fk.key]||[{dias:0,pct:100,ref:'SINAL'}];});
    rec.planoPagamento={
      fornecedores:fornecedoresPlano,
      fornecedor:fornKeysFinal.length===1?rvCPParcelas[fornKeysFinal[0].key]:undefined,
      beneficiador:rec.comLogo?rvCPParcelas.beneficiador:[],
      beneficiadorNome:rec.comLogo?(rvEl(rvCPIds('beneficiador').select)?.value||''):'',
      cliente:rvCPParcelas.cliente
    };
  }
  if(kind==='cotacao'){rvSaveCotacoes(lista);rvRenderCotacoes();}
  else{rvSavePedidos(lista);rvRenderPedidos();rvRenderFin();}
  rvSyncPush();
  rv2RenderHist();
  toastSave('Alterações salvas ✓');
}
['rvedit-comissao','rvedit-frete','rvedit-cliente'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener(el.tagName==='SELECT'?'change':'input',rv2EditPreview);
});

/* ── COTAÇÕES / PEDIDOS (listas) ── */
// Ordenação é apenas de apresentação: não modifica a sequência salva no banco/localStorage.
const rvListSort={cotacoes:{key:null,dir:'asc'},pedidos:{key:null,dir:'asc'}};
function rvSortHeader(lista,key,label,extraClass=''){
  const st=rvListSort[lista];
  const ativo=st.key===key;
  const aria=ativo?(st.dir==='asc'?'ascending':'descending'):'none';
  const seta=ativo?(st.dir==='asc'?'▲':'▼'):'↕';
  return `<th class="rv-sortable${extraClass?' '+extraClass:''}" tabindex="0" role="button" aria-sort="${aria}" title="Ordenar por ${esc(label)}" onclick="rvToggleListSort('${lista}','${key}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();rvToggleListSort('${lista}','${key}')}">${esc(label)}<span class="rv-sort-ind" aria-hidden="true">${seta}</span></th>`;
}
function rvToggleListSort(lista,key){
  const st=rvListSort[lista];
  if(st.key===key)st.dir=st.dir==='asc'?'desc':'asc';
  else{st.key=key;st.dir='asc';}
  if(lista==='cotacoes')rvRenderCotacoes();else rvRenderPedidos();
}
function rvSortDateValue(v){
  const s=String(v||'').trim();
  let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if(m){let y=Number(m[3]);if(y<100)y+=2000;return Date.UTC(y,Number(m[2])-1,Number(m[1]));}
  const t=Date.parse(s);return Number.isNaN(t)?0:t;
}
function rvSortedList(lista,tipo,getters){
  const st=rvListSort[tipo];
  if(!st.key||!getters[st.key])return lista;
  const cfg=getters[st.key];
  const getter=typeof cfg==='function'?cfg:cfg.get;
  const mode=typeof cfg==='function'?'text':(cfg.mode||'text');
  const dir=st.dir==='asc'?1:-1;
  return lista.map((item,index)=>({item,index})).sort((a,b)=>{
    let av=getter(a.item),bv=getter(b.item),cmp=0;
    if(mode==='number'||mode==='date'){
      av=mode==='date'?rvSortDateValue(av):(Number(av)||0);
      bv=mode==='date'?rvSortDateValue(bv):(Number(bv)||0);
      cmp=av-bv;
    }else cmp=String(av??'').localeCompare(String(bv??''),'pt-BR',{sensitivity:'base',numeric:true});
    return cmp?cmp*dir:a.index-b.index;
  }).map(x=>x.item);
}
// Reconcilia cotações já convertidas ANTES dessa marcação existir — casa pelo vínculo
// cotId (que o pedido sempre teve desde a conversão) e preenche pedidoId retroativamente.
function rvReconciliarConversoes(){
  const cotacoes=rvLoadCotacoes();
  const pedidos=rvLoadPedidosActive();
  let mudou=false;
  cotacoes.forEach(c=>{
    if(c.pedidoId||c.deleted)return;
    const ped=pedidos.find(p=>p.cotId===c.id);
    if(ped){c.pedidoId=ped.id;c.updatedAt=Date.now();mudou=true;}
  });
  if(mudou){rvSaveCotacoes(cotacoes,true);if(typeof rvSyncPush==='function')rvSyncPush();}
  return mudou;
}
function rvRenderCotacoes(){
  rvReconciliarConversoes();
  const todas=rvLoadCotacoesActive();
  const cont=rvEl('rv-cotacoes-container');
  const wrapCl=document.getElementById('msf-cot-cl-wrap');
  if(wrapCl&&!wrapCl.innerHTML)wrapCl.innerHTML=msfHtml('cot-cl','Todos Clientes');
  msfPopulate('cot-cl',[...new Set(todas.map(c=>c.cliente))].sort(),'Todos Clientes',rvRenderCotacoes);
  const wrapForn=document.getElementById('msf-cot-forn-wrap');
  if(wrapForn&&!wrapForn.innerHTML)wrapForn.innerHTML=msfHtml('cot-forn','Todos Fornecedores');
  msfPopulate('cot-forn',[...new Set(todas.map(c=>c.fornecedor))].sort(),'Todos Fornecedores',rvRenderCotacoes);
  const wrapTipo=document.getElementById('msf-cot-tipo-wrap');
  if(wrapTipo&&!wrapTipo.innerHTML)wrapTipo.innerHTML=msfHtml('cot-tipo','Todos Tipos');
  msfPopulate('cot-tipo',[...new Set(todas.map(c=>c.tipo))].sort(),'Todos Tipos',rvRenderCotacoes);
  const q=norm(document.getElementById('cot-q')?.value);
  let lista=todas.filter(c=>{
    const t=norm(`${c.cliente} ${c.fornecedor}`);
    return(!q||t.includes(q))&&msfMatch('cot-cl',c.cliente)&&msfMatch('cot-forn',c.fornecedor)&&msfMatch('cot-tipo',c.tipo);
  });
  if(!todas.length){cont.innerHTML='<div class="rv-empty">Nenhuma cotação salva ainda.<br>Calcule e clique em "Salvar Cotação".</div>';return;}
  if(!lista.length){cont.innerHTML='<div class="rv-empty">Nenhuma cotação encontrada com esses filtros.</div>';return;}
  lista=rvSortedList(lista,'cotacoes',{
    data:{get:c=>c.data,mode:'date'},cliente:c=>c.cliente,fornecedor:c=>c.fornecedor,tipo:c=>c.tipo,
    qtd:{get:c=>c.qtd,mode:'number'},pv:{get:c=>c.pv,mode:'number'},margem:{get:c=>c.margem,mode:'number'},lucro:{get:c=>c.lucroTotal,mode:'number'}
  });
  let html=`<table class="rv-data-table"><thead><tr class="rv-th-center">
    ${rvSortHeader('cotacoes','data','Data')}${rvSortHeader('cotacoes','cliente','Cliente')}${rvSortHeader('cotacoes','fornecedor','Fornecedor')}${rvSortHeader('cotacoes','tipo','Tipo')}${rvSortHeader('cotacoes','qtd','Qtd','rv-num')}${rvSortHeader('cotacoes','pv','Preço venda','rv-num')}${rvSortHeader('cotacoes','margem','Margem Final','rv-num')}${rvSortHeader('cotacoes','lucro','Lucro','rv-num')}<th>Ações</th>
  </tr></thead><tbody>`;
  lista.forEach(c=>{
    const jaConvertida=!!c.pedidoId;
    html+=`<tr onclick="rv2OpenEdit('cotacao',${c.id})" style="cursor:pointer" title="Clique pra editar">
      <td style="white-space:nowrap">${esc(c.data)}</td>
      <td><strong>${esc(c.cliente)}</strong>${jaConvertida?' <span style="font-size:.58rem;font-weight:700;color:var(--green);background:var(--ltgrn);padding:.1rem .4rem;border-radius:4px;white-space:nowrap">✓ virou pedido</span>':''}</td>
      <td>${esc(c.fornecedor)}</td>
      <td>${esc(c.tipo)}</td>
      <td class="rv-num">${(c.qtd||0).toLocaleString('pt-BR')}</td>
      <td class="rv-num">${rvBrl(c.pv)}${c.produtos&&c.produtos.length>1?`<div style="font-size:.55rem;color:var(--ink4);font-weight:400">média · ${c.produtos.length} produtos</div>`:''}</td>
      <td class="rv-num rv-pos">${((c.margem||0)*100).toFixed(1).replace('.',',')}%</td>
      <td class="rv-num rv-pos">${rvBrl(c.lucroTotal)}</td>
      <td style="white-space:nowrap">
        ${jaConvertida?'':`<button class="btn-rvsm btn-conv" onclick="event.stopPropagation();rvConverterEmPedido(${c.id})">→ Pedido</button>`}
        <button class="btn-rvdel" onclick="event.stopPropagation();rvExcluirCotacao(${c.id})" title="Excluir" aria-label="Excluir cotação">🗑</button>
      </td>
    </tr>`;
  });
  html+='</tbody></table>';
  cont.innerHTML=html;
}
// Retornam só os registros ativos (não apagados) — usar em toda tela/lista/filtro.
// rvLoadCotacoes()/rvLoadPedidos() "crus" continuam existindo pra edição/lookup por id.
function rvLoadCotacoesActive(){return rvLoadCotacoes().filter(c=>!c.deleted);}
function rvRecalcStoredPedido(p){
  if(!p||p.deleted)return p;
  const cliente=RV_CLIENTES2.find(c=>c.nome===p.cliente);
  if(!cliente)return p;
  let produtos=Array.isArray(p.produtos)?p.produtos.map(x=>({...x})):[];
  if(!produtos.length&&p.qtd){
    produtos=[{
      desc:'',qtd:p.qtd||0,preco:p.preco||0,pv:p.pv||0,
      fornecedor:p.fornecedor||'',tipo:p.tipo||'Nacional',
      comLogo:!!p.comLogo,cliche:p.cliche||0
    }];
  }
  if(!produtos.length)return p;
  // Compatibilidade com registros antigos: completa campos por produto com os campos legados do pedido.
  produtos=produtos.map(x=>({
    ...x,
    fornecedor:x.fornecedor||p.fornecedor||'',
    tipo:x.tipo||p.tipo||'Nacional',
    comLogo:x.comLogo!==undefined?x.comLogo:!!p.comLogo,
    cliche:x.cliche!==undefined?x.cliche:0
  }));
  const r=rv2CalcMultiFornecedor(
    cliente,produtos,p.comissaoPct||0,p.freteTotal||0,!!p.freteIncluso
  );
  if(!r)return p;
  return{
    ...p,
    produtos,
    fornecedor:r.fornecedorLegado||p.fornecedor,
    fornecedores:rvBuildFornecedoresArray(r),
    qtd:r.qtd,preco:r.preco,pv:r.pv,
    icmsCredPct:r.icmsCredPct,icmsDebPct:r.icmsDebPct,fedPct:r.fedPct,
    freteTotal:p.freteTotal||0,freteIncluso:!!p.freteIncluso,
    cliche:r.cliche,custoTotal:r.custoTotal,vendaTotal:r.vendaTotal,
    lucroTotal:r.lucroTotal,margem:r.margem,
    calcVersion:'pricing_v1_canonical'
  };
}
function rvLoadPedidosActive(){
  return rvLoadPedidos().filter(p=>!p.deleted).map(rvRecalcStoredPedido);
}
function rvExcluirCotacao(id){
  if(!confirm('Excluir esta cotação?'))return;
  const lista=rvLoadCotacoes();
  const rec=lista.find(c=>c.id===id);
  if(rec){rec.deleted=true;rec.updatedAt=Date.now();}
  rvSaveCotacoes(lista,true);
  rvRenderCotacoes();
  rvSyncPush();
}
function rvLimparTodasCotacoes(){
  if(!confirm('Excluir TODAS as cotações?'))return;
  const lista=rvLoadCotacoes();
  const agora=Date.now();
  lista.forEach(c=>{c.deleted=true;c.updatedAt=agora;});
  rvSaveCotacoes(lista,true);rvRenderCotacoes();
  rvSyncPush();
}
function rvConverterEmPedido(cotId){
  const cotacoes=rvLoadCotacoes();
  const cot=cotacoes.find(c=>c.id===cotId);
  if(!cot)return;
  const status={};RV_STATUS_STEPS.forEach(s=>status[s.key]=false);status.confirmado=true;
  const pedido={...cot,id:Date.now(),updatedAt:Date.now(),cotId,status,obs:''};
  const lista=rvLoadPedidos();lista.unshift(pedido);rvSavePedidos(lista);
  cot.pedidoId=pedido.id;cot.updatedAt=Date.now(); // marca a cotação de origem como já convertida
  rvSaveCotacoes(cotacoes,true);
  rvSyncPush();
  rvShowTab('pedidos');
  rvOpenCondPagto(pedido.id);
}

/* ══════════════════════════════════════
   CONDIÇÕES DE PAGAMENTO E RECEBIMENTO
   (definidas na criação do pedido — parcelas em dias + % até somar o total)
══════════════════════════════════════ */
const RV_FIN_REF_TAGS=['SINAL','SALDO','AMOSTRAS'];
let rvCPPedidoId=null;
let rvCPParcelas={};
function rvCPFornKeys(p){
  if(p.fornecedores&&p.fornecedores.length)return p.fornecedores.map(f=>({key:'forn_'+(f.key||rvSafeId(f.nome)),nome:f.nome}));
  return[{key:'fornecedor',nome:p.fornecedor||'Fornecedor'}]; // pedido antigo — chave idêntica à usada historicamente no ledger
}
function rvCPTotais(p){
  const map={};
  const fornKeys=rvCPFornKeys(p);
  const temProdutos=!!(p.produtos&&p.produtos.length);
  if(p.fornecedores&&p.fornecedores.length){
    p.fornecedores.forEach((f,i)=>{
      let total=f.custoCompra||0;
      if(temProdutos){
        // Clichê/molde/logo vai pro fornecedor por padrão — só não, se o produto tiver Logo marcado
        // (aí vai pro beneficiador, ver abaixo). Nunca altera o DRE/ICMS, só o total a pagar aqui.
        total+=p.produtos.filter(pr=>pr.fornecedor===f.nome&&!pr.comLogo).reduce((a,pr)=>a+(pr.cliche||0),0);
      }
      map[fornKeys[i].key]=total;
    });
  }else{
    map.fornecedor=(p.custoTotal||0)-(p.cliche||0)-(p.freteTotal||0);
  }
  map.beneficiador=temProdutos
    ?p.produtos.filter(pr=>pr.comLogo).reduce((a,pr)=>a+(pr.cliche||0),0)
    :(p.cliche||0); // retrocompat: registro antigo sem produtos detalhados — mantém o comportamento anterior
  map.cliente=p.vendaTotal||0;
  return map;
}
let rvCPPrefix='cp'; // 'cp' = modal separado (Financeiro) | 'rvedit-cp' = seção dentro da edição do pedido
function rvCPIds(tipo){
  if(tipo==='beneficiador')return{nome:`${rvCPPrefix}-benef-nome`,total:`${rvCPPrefix}-benef-total`,rows:`${rvCPPrefix}-benef-rows`,sum:`${rvCPPrefix}-benef-sum`,wrap:`${rvCPPrefix}-benef-wrap`,select:`${rvCPPrefix}-benef-select`};
  if(tipo==='cliente')return{nome:`${rvCPPrefix}-cli-nome`,total:`${rvCPPrefix}-cli-total`,rows:`${rvCPPrefix}-cli-rows`,sum:`${rvCPPrefix}-cli-sum`};
  // qualquer outra chave é fornecedor — legado ('fornecedor') ou novo ('forn_X'), sempre bloco dinâmico
  return{nome:`${rvCPPrefix}-${tipo}-nome`,total:`${rvCPPrefix}-${tipo}-total`,rows:`${rvCPPrefix}-${tipo}-rows`,sum:`${rvCPPrefix}-${tipo}-sum`};
}
function rvOpenCondPagto(pedidoId,prefix){
  rvCPPrefix=prefix||'cp';
  const p=rvLoadPedidos().find(x=>x.id===pedidoId);
  if(!p){toastSave('Pedido não encontrado');return;}
  rvCPPedidoId=pedidoId;
  const tot=rvCPTotais(p);
  const fornKeys=rvCPFornKeys(p);

  const fornContainer=rvEl(`${rvCPPrefix}-forn-container`);
  if(fornContainer){
    fornContainer.innerHTML=fornKeys.map(fk=>{
      const ids=rvCPIds(fk.key);
      return`<div style="margin-top:.8rem">
        <div class="fsep" style="font-size:.62rem">🏭 Pagar a <span id="${ids.nome}">${esc(fk.nome)}</span> — Total <b id="${ids.total}"></b></div>
        <div id="${ids.rows}"></div>
        <button class="btn btn-s" style="font-size:.62rem;margin-top:.3rem" onclick="rvCPAddParcela('${fk.key}')">＋ parcela</button>
        <div style="font-size:.62rem;margin-top:.2rem" id="${ids.sum}"></div>
      </div>`;
    }).join('');
  }
  fornKeys.forEach(fk=>{rvEl(rvCPIds(fk.key).total).textContent=rvBrl(tot[fk.key]);});

  rvEl(rvCPIds('cliente').nome).textContent=p.cliente;
  rvEl(rvCPIds('cliente').total).textContent=rvBrl(tot.cliente);
  const showBenef=!!p.comLogo;
  rvEl(rvCPIds('beneficiador').wrap).style.display=showBenef?'block':'none';
  if(showBenef){
    rvEl(rvCPIds('beneficiador').total).textContent=rvBrl(tot.beneficiador);
    const sel=rvEl(rvCPIds('beneficiador').select);
    sel.innerHTML=RV_FORNECEDORES2.map(f=>`<option value="${esc(f.nome)}">${esc(f.nome)}</option>`).join('');
    if(p.planoPagamento&&p.planoPagamento.beneficiadorNome)sel.value=p.planoPagamento.beneficiadorNome;
  }

  // Carrega plano existente por chave, com retrocompat pro formato antigo (plano.fornecedor singular),
  // ou começa com 1 parcela de 100% em dia 0 pra cada parte
  const existing=p.planoPagamento||{};
  rvCPParcelas={};
  fornKeys.forEach(fk=>{
    const salvoNovo=existing.fornecedores&&existing.fornecedores[fk.key];
    const salvoLegado=fk.key==='fornecedor'?existing.fornecedor:null;
    const salvo=(salvoNovo&&salvoNovo.length)?salvoNovo:(salvoLegado&&salvoLegado.length?salvoLegado:null);
    rvCPParcelas[fk.key]=salvo?JSON.parse(JSON.stringify(salvo)):[{dias:0,pct:100,ref:'SINAL'}];
  });
  rvCPParcelas.beneficiador=(existing.beneficiador&&existing.beneficiador.length)?JSON.parse(JSON.stringify(existing.beneficiador)):[{dias:0,pct:100,ref:'SINAL'}];
  rvCPParcelas.cliente=(existing.cliente&&existing.cliente.length)?JSON.parse(JSON.stringify(existing.cliente)):[{dias:0,pct:100,ref:'SINAL'}];

  [...fornKeys.map(fk=>fk.key),'beneficiador','cliente'].forEach(rvCPRenderRows);
  if(rvCPPrefix==='cp')document.getElementById('ovl-condpagto').classList.add('open');
}
function rvCPAddParcela(tipo){
  rvCPParcelas[tipo].push({dias:0,pct:0,ref:'SALDO'});
  rvCPRenderRows(tipo);
}
function rvCPRemoveParcela(tipo,idx){
  rvCPParcelas[tipo].splice(idx,1);
  rvCPRenderRows(tipo);
}
function rvCPUpdateParcela(tipo,idx,field,value){
  const p=rvLoadPedidos().find(x=>x.id===rvCPPedidoId);
  const tot=p?rvCPTotais(p)[tipo]:0;
  if(field==='ref'){rvCPParcelas[tipo][idx].ref=value;}
  else if(field==='dias'){rvCPParcelas[tipo][idx].dias=parseFloat(value)||0;}
  else if(field==='pct'){
    rvCPParcelas[tipo][idx].pct=parseFloat(value)||0;
  }else if(field==='valor'){
    const valor=parseFloat(value)||0;
    rvCPParcelas[tipo][idx].pct=tot>0?(valor/tot*100):0;
  }
  rvCPRenderRows(tipo); // re-renderiza pra atualizar o campo espelhado (% ↔ valor)
}
function rvCPRenderRows(tipo){
  const p=rvLoadPedidos().find(x=>x.id===rvCPPedidoId);
  const tot=p?rvCPTotais(p)[tipo]:0;
  const rows=rvCPParcelas[tipo];
  const cont=rvEl(rvCPIds(tipo).rows);
  if(!cont)return; // seção pode não estar montada nessa tela (ex: cotação, sem plano de pagamento)
  cont.innerHTML=rows.map((r,i)=>`<div style="display:grid;grid-template-columns:.9fr .7fr 1.2fr 1.1fr auto;gap:.5rem;align-items:end;margin-bottom:.5rem">
    <div><input type="number" value="${r.dias}" min="0" style="width:100%;text-align:center;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.72rem" onchange="rvCPUpdateParcela('${tipo}',${i},'dias',this.value)"><div style="font-size:.5rem;color:var(--ink4);text-align:center;margin-top:.15rem">dias após</div></div>
    <div><input type="number" value="${r.pct.toFixed(2).replace(/\.?0+$/,'')}" min="0" max="100" step="0.1" style="width:100%;text-align:center;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.72rem" onchange="rvCPUpdateParcela('${tipo}',${i},'pct',this.value)"><div style="font-size:.5rem;color:var(--ink4);text-align:center;margin-top:.15rem">%</div></div>
    <div><input type="number" value="${(tot*r.pct/100).toFixed(2)}" min="0" step="0.01" style="width:100%;text-align:center;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.72rem;font-family:'IBM Plex Mono'" onchange="rvCPUpdateParcela('${tipo}',${i},'valor',this.value)"><div style="font-size:.5rem;color:var(--ink4);text-align:center;margin-top:.15rem">R$</div></div>
    <div><select style="width:100%;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem .2rem;font-size:.68rem" onchange="rvCPUpdateParcela('${tipo}',${i},'ref',this.value)">
      ${RV_FIN_REF_TAGS.map(t=>`<option value="${t}"${r.ref===t?' selected':''}>${t}</option>`).join('')}
    </select><div style="font-size:.5rem;color:var(--ink4);text-align:center;margin-top:.15rem">ref.</div></div>
    <button onclick="rvCPRemoveParcela('${tipo}',${i})" aria-label="Remover parcela" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.8rem;padding-bottom:.55rem">✕</button>
  </div>`).join('');
  rvCPRenderSum(tipo);
}
function rvCPRenderSum(tipo){
  const rows=rvCPParcelas[tipo];
  const sumEl=rvEl(rvCPIds(tipo).sum);
  if(!sumEl)return;
  const soma=rows.reduce((a,r)=>a+(r.pct||0),0);
  const ok=Math.abs(soma-100)<0.05;
  if(ok){
    sumEl.innerHTML=`Soma: <b style="color:var(--green)">${soma.toFixed(1)}%</b> ✓`;
    return;
  }
  const p=rvLoadPedidos().find(x=>x.id===rvCPPedidoId);
  const tot=p?rvCPTotais(p)[tipo]:0;
  const faltaPct=100-soma;
  const faltaValor=tot*faltaPct/100;
  const sobrou=faltaPct<0;
  sumEl.innerHTML=`Soma: <b style="color:var(--red)">${soma.toFixed(1)}%</b>
    <span style="display:inline-block;margin-left:.4rem;background:var(--ltred);color:var(--red);font-weight:700;padding:.15rem .5rem;border-radius:5px">
      ${sobrou?'excedeu em':'falta'} ${Math.abs(faltaPct).toFixed(1)}% (${rvBrl(Math.abs(faltaValor))})
    </span>`;
}
function rvCPSave(){
  const p=rvLoadPedidos().find(x=>x.id===rvCPPedidoId);
  if(!p){toastSave('Pedido não encontrado');return;}
  const fornKeys=rvCPFornKeys(p);
  const partes=[...fornKeys.map(fk=>fk.key),'cliente'];
  if(p.comLogo)partes.push('beneficiador');
  for(const tipo of partes){
    const soma=(rvCPParcelas[tipo]||[]).reduce((a,r)=>a+(r.pct||0),0);
    if(Math.abs(soma-100)>=0.05){
      const fk=fornKeys.find(x=>x.key===tipo);
      const label=fk?fk.nome:tipo;
      toastSave(`As parcelas de ${label} precisam somar 100% (está em ${soma.toFixed(1)}%)`);
      return;
    }
  }
  const lista=rvLoadPedidos();
  const rec=lista.find(x=>x.id===rvCPPedidoId);
  if(!rec){toastSave('Pedido não encontrado');return;}
  const fornecedoresPlano={};
  fornKeys.forEach(fk=>{fornecedoresPlano[fk.key]=rvCPParcelas[fk.key];});
  rec.planoPagamento={
    fornecedores:fornecedoresPlano, // novo formato — sempre presente, 1 ou mais fornecedores
    fornecedor:fornKeys.length===1?rvCPParcelas[fornKeys[0].key]:undefined, // retrocompat de leitura pra código antigo
    beneficiador:rec.comLogo?rvCPParcelas.beneficiador:[],
    beneficiadorNome:rec.comLogo?rvEl(rvCPIds('beneficiador').select).value:'',
    cliente:rvCPParcelas.cliente
  };
  rec.updatedAt=Date.now();
  rvSavePedidos(lista);
  rvSyncPush();
  if(rvCPPrefix==='cp'){
    closeM('condpagto');
    if(rvFinCurPedidoId===rvCPPedidoId)rvOpenFinPopupR(rvCPPedidoId);
  }
  rvRenderFin();
  toastSave('Condições salvas ✓');
}

function rvRenderPedidos(){
  const todos=rvLoadPedidosActive();
  const cont=rvEl('rv-pedidos-container');
  function statusLabel(p){
    if(true){
      const dates=p.ciDates;
      if(dates){
        for(let i=dates.length-1;i>=0;i--){
          if(dates[i]&&dates[i].v&&!dates[i].est)return RV_CI_LABELS[i];
        }
      }
      return 'Confirmado';
    }
    const st=p.status;
    if(st.recebido)return 'Recebido';
    if(st.entregue)return 'Entregue';
    if(st.producao)return 'Produção';
    return 'Confirmado';
  }
  const wrapCl=document.getElementById('msf-ped-cl-wrap');
  if(wrapCl&&!wrapCl.innerHTML)wrapCl.innerHTML=msfHtml('ped-cl','Todos Clientes');
  msfPopulate('ped-cl',[...new Set(todos.map(p=>p.cliente))].sort(),'Todos Clientes',rvRenderPedidos);
  const wrapForn=document.getElementById('msf-ped-forn-wrap');
  if(wrapForn&&!wrapForn.innerHTML)wrapForn.innerHTML=msfHtml('ped-forn','Todos Fornecedores');
  msfPopulate('ped-forn',[...new Set(todos.map(p=>p.fornecedor))].sort(),'Todos Fornecedores',rvRenderPedidos);
  const wrapSt=document.getElementById('msf-ped-st-wrap');
  if(wrapSt&&!wrapSt.innerHTML)wrapSt.innerHTML=msfHtml('ped-st','Todos Marcos');
  msfPopulate('ped-st',[...new Set(todos.map(statusLabel))].sort(),'Todos Marcos',rvRenderPedidos);
  const q=norm(document.getElementById('ped-q')?.value);
  let lista=todos.filter(p=>{
    const t=norm(`${p.cliente} ${p.fornecedor}`);
    return(!q||t.includes(q))&&msfMatch('ped-cl',p.cliente)&&msfMatch('ped-forn',p.fornecedor)&&msfMatch('ped-st',statusLabel(p));
  });
  if(!todos.length){cont.innerHTML='<div class="rv-empty">Nenhum pedido ainda.<br>Converta uma cotação ou clique "Criar Pedido".</div>';return;}
  if(!lista.length){cont.innerHTML='<div class="rv-empty">Nenhum pedido encontrado com esses filtros.</div>';return;}
  lista=rvSortedList(lista,'pedidos',{
    data:{get:p=>p.data,mode:'date'},cliente:p=>p.cliente,fornecedor:p=>p.fornecedor,
    qtd:{get:p=>p.qtd,mode:'number'},venda:{get:p=>p.vendaTotal,mode:'number'},margem:{get:p=>p.margem,mode:'number'},lucro:{get:p=>p.lucroTotal,mode:'number'},
    marcos:p=>statusLabel(p),obs:p=>p.obs||''
  });
  let html=`<table class="rv-data-table"><thead><tr class="rv-th-center">
    ${rvSortHeader('pedidos','data','Data')}${rvSortHeader('pedidos','cliente','Cliente')}${rvSortHeader('pedidos','fornecedor','Fornecedor')}${rvSortHeader('pedidos','qtd','Qtd','rv-num')}
    ${rvSortHeader('pedidos','venda','Venda total','rv-num')}${rvSortHeader('pedidos','margem','Margem Final','rv-num')}${rvSortHeader('pedidos','lucro','Lucro','rv-num')}${rvSortHeader('pedidos','marcos','Marcos de Produção')}${rvSortHeader('pedidos','obs','Obs')}<th></th>
  </tr></thead><tbody>`;
  lista.forEach(p=>{
    html+=`<tr onclick="rv2OpenEdit('pedido',${p.id})" style="cursor:pointer" title="Clique pra editar">
      <td style="white-space:nowrap">${esc(p.data)}</td>
      <td><strong>${esc(p.cliente)}</strong></td>
      <td>${esc(p.fornecedor)}</td>
      <td class="rv-num">${(p.qtd||0).toLocaleString('pt-BR')}</td>
      <td class="rv-num">${rvBrl(p.vendaTotal)}</td>
      <td class="rv-num rv-pos">${((p.margem||0)*100).toFixed(1).replace('.',',')}%</td>
      <td class="rv-num rv-pos">${rvBrl(p.lucroTotal)}</td>
      <td class="rv-milestones-cell">${rvMilestoneDotsHTML(p)}</td>
      <td onclick="event.stopPropagation()"><input type="text" value="${esc(p.obs||'')}" placeholder="obs…" style="width:110px;border:1px solid var(--bdr2);border-radius:5px;padding:.2rem .35rem;font-size:.68rem;background:var(--card);color:var(--ink)" onchange="rvUpdateObs(${p.id},this.value)"></td>
      <td onclick="event.stopPropagation()"><button class="btn-rvdel" onclick="rvExcluirPedido(${p.id})" title="Excluir" aria-label="Excluir pedido">🗑</button></td>
    </tr>`;
  });
  const totVenda=lista.reduce((a,p)=>a+(p.vendaTotal||0),0);
  const totLucro=lista.reduce((a,p)=>a+(p.lucroTotal||0),0);
  const totMargem=totVenda>0?totLucro/totVenda:0;
  html+=`<tr style="background:var(--green);color:#fff;font-weight:700">
    <td colspan="4" style="padding:.5rem .6rem">TOTAIS (${lista.length} pedidos)</td>
    <td class="rv-num">${rvBrl(totVenda)}</td>
    <td class="rv-num">${(totMargem*100).toFixed(1).replace('.',',')}%</td>
    <td class="rv-num">${rvBrl(totLucro)}</td>
    <td colspan="3"></td>
  </tr>`;
  html+='</tbody></table>';
  cont.innerHTML=html;
}
/* ══════════════════════════════════════
   CONTROLE INTERNO — produção (pedidos cujo fornecedor é "produtor")
══════════════════════════════════════ */
const RV_CI_LABELS=['Arte aprovada','Sinal recebido','Amostras aprovadas','Fim produção','Entrega efetuada'];
const RV_CI_SHORT=['Arte','Sinal','Amostras','Fim Prod.','Entrega'];
function rvNormDate(s){
  if(!s)return null;
  const m=String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if(!m)return null;
  let[,d,mo,y]=m;d=d.padStart(2,'0');mo=mo.padStart(2,'0');if(y.length===4)y=y.slice(2);
  return`${d}/${mo}/${y}`;
}
function rvDispToISO(s){
  if(!s)return'';
  const m=String(s).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if(!m)return'';
  const[,d,mo,y]=m;return`20${y}-${mo}-${d}`;
}
function rvMkD(v,est){return{v:v?rvNormDate(v):null,est:!!est};}
function rvIsProdutor(nomeFornecedor){
  const alvo=(nomeFornecedor||'').toLowerCase().trim();
  const f=RV_FORNECEDORES2.find(x=>(x.nome||'').toLowerCase().trim()===alvo);
  return!!(f&&f.produtor);
}
function rvPedidoProdutores(p){
  if(!p)return[];
  const nomes=new Set();
  // Snapshot explícito salvo na criação/edição do pedido.
  (p.produtores||[]).forEach(n=>{if(n)nomes.add(n);});
  // Novo formato: fornecedores[] também pode carregar snapshot do flag produtor.
  (p.fornecedores||[]).forEach(f=>{
    if(f?.produtor||rvIsProdutor(f?.nome))nomes.add(f.nome);
  });
  // Defesa para registros antigos/incompletos.
  (p.produtos||[]).forEach(pr=>{
    if(pr?.fornecedor&&rvIsProdutor(pr.fornecedor))nomes.add(pr.fornecedor);
  });
  if(!nomes.size&&p.fornecedor&&rvIsProdutor(p.fornecedor))nomes.add(p.fornecedor);
  // Se o pedido já tem ciDates, ele pertence ao fluxo de produção.
  if(!nomes.size&&Array.isArray(p.ciDates))nomes.add(p.fornecedor||'Produção');
  return[...nomes];
}
function rvPedidoTemProducao(p){
  // Marcos são acompanhamento do PEDIDO, não característica cadastral do fornecedor.
  // Portanto todo pedido ativo/confirmado pode usar Arte/Sinal/Amostras/Fim Produção/Entrega.
  return!!p;
}
function rvGetCIPedidos(){return rvLoadPedidosActive().filter(rvPedidoTemProducao);}
function rvCIIsLate(d){
  if(!d||!d.v||!d.est)return false;
  const iso=rvDispToISO(d.v);if(!iso)return false;
  const today=new Date();today.setHours(0,0,0,0);
  return new Date(iso+'T00:00')<today;
}
// Monta os pontinhos de marcos de produção pra um pedido — usado dentro da própria tabela de Pedidos
function rvMilestoneDotsHTML(p){
  if(!p.ciDates)p.ciDates=RV_CI_LABELS.map(()=>rvMkD(null,true));
  const dots=p.ciDates.map((d,i)=>{
    const cls=d.v&&!d.est?'done':d.v&&d.est?(rvCIIsLate(d)?'late':'est'):'pending';
    const icon=cls==='done'?'✓':(cls==='est'||cls==='late')?'●':'';
    const connector=i>0?`<div class="ml2" style="width:12px"></div>`:'';
    const dateColor=cls==='late'?'var(--red)':cls==='done'?'var(--green)':cls==='est'?'var(--amber)':'var(--ink4)';
    return`${connector}<div class="mst"><div class="mc ${cls}" style="width:20px;height:20px;font-size:.6rem" onclick="event.stopPropagation();rvCIOpenMarco(${p.id},${i})" title="${RV_CI_LABELS[i]}${d.v?' — '+esc(d.v):''}${cls==='late'?' (ATRASADO)':''}">${icon}</div><span class="mlbl" style="font-size:.48rem">${RV_CI_SHORT[i]}</span><span class="mlbl" style="color:${dateColor};font-weight:700;font-size:.48rem">${d.v?esc(d.v):'—'}</span></div>`;
  }).join('');
  const produtores=rvPedidoProdutores(p);
  return `<div class="ms-row" style="justify-content:center" onclick="event.stopPropagation()" title="${esc(produtores.length?('Produção: '+produtores.join(' + ')):'Marcos de produção')}">${dots}</div>`;
}
let rvCICtx=null; // {pedidoId, idx}
function rvCIOpenMarco(pedidoId,idx){
  const lista=rvLoadPedidos();
  const p=lista.find(x=>x.id===pedidoId);
  if(!p)return;
  if(!p.ciDates||!Array.isArray(p.ciDates))p.ciDates=[];
  while(p.ciDates.length<RV_CI_LABELS.length)p.ciDates.push(rvMkD(null,true)); // auto-repara array curto/corrompido
  rvCICtx={pedidoId,idx};
  const d=p.ciDates[idx];
  rvEl('ciedit-title').textContent=RV_CI_LABELS[idx]+' — '+esc(p.cliente);
  rvEl('ciedit-data').value=d.v||'';
  rvEl('ciedit-confirmado').checked=d.v?!d.est:false;
  document.getElementById('ovl-ciedit').classList.add('open');
  setTimeout(()=>rvEl('ciedit-data').focus(),50);
}
function rvCISaveMarco(){
  const{pedidoId,idx}=rvCICtx;
  const lista=rvLoadPedidos();
  const p=lista.find(x=>x.id===pedidoId);
  if(!p)return;
  if(!p.ciDates||!Array.isArray(p.ciDates))p.ciDates=[];
  while(p.ciDates.length<RV_CI_LABELS.length)p.ciDates.push(rvMkD(null,true));
  const raw=rvEl('ciedit-data').value.trim();
  const norm=rvNormDate(raw);
  if(raw&&!norm){toastSave('Data inválida — use DD/MM/AA');return;}
  const confirmado=rvEl('ciedit-confirmado').checked;
  p.ciDates[idx]={v:norm,est:!confirmado};
  p.updatedAt=Date.now();
  rvSavePedidos(lista);
  rvSyncPush();
  rvRenderPedidos();
  closeM('ciedit');
  toastSave('Marco atualizado ✓');
}
function rvCIClearMarco(){
  const{pedidoId,idx}=rvCICtx;
  const lista=rvLoadPedidos();
  const p=lista.find(x=>x.id===pedidoId);
  if(!p)return;
  if(!p.ciDates)p.ciDates=RV_CI_LABELS.map(()=>rvMkD(null,true));
  p.ciDates[idx]={v:null,est:true};
  p.updatedAt=Date.now();
  rvSavePedidos(lista);
  rvSyncPush();
  rvRenderPedidos();
  closeM('ciedit');
  toastSave('Data removida');
}
/* ══════════════════════════════════════
   FINANCEIRO REVENDA — cards + lançamentos reais contra o plano de condições
══════════════════════════════════════ */
function rvDateIsFuture(dispDate){
  const parts=(dispDate||'').split('/');
  if(parts.length!==3)return false;
  const[d,m,y]=parts;
  const iso=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  const today=new Date();today.setHours(0,0,0,0);
  const dt=new Date(iso+'T00:00');
  return dt.getTime()>today.getTime();
}
function rvPartyPago(pedidoId,party){return rvLoadLedgerR().filter(l=>l.pedidoId===pedidoId&&l.party===party&&!rvDateIsFuture(l.date)).reduce((a,l)=>a+l.amount,0);}
function rvPartyRecebido(pedidoId){return rvLoadReceiptsR().filter(r=>r.pedidoId===pedidoId&&!rvDateIsFuture(r.date)).reduce((a,r)=>a+r.amount,0);}

/* ══════════════════════════════════════
   NOTIFICAÇÃO DE VENCIMENTO — compara o cronograma de parcelas (dias após o pedido)
   com o que já foi de fato pago/recebido, pra avisar quando uma parcela está
   atrasada ou vence em breve. Não rastreia parcela individual (só existe o total
   pago/recebido acumulado), então o aviso é sobre "quanto deveria ter sido pago
   até hoje, considerando o cronograma" vs "quanto foi pago de verdade".
══════════════════════════════════════ */
function rvParseDataBR(dataStr){ // "DD/MM/AAAA" -> Date
  const p=(dataStr||'').split('/');
  if(p.length!==3)return null;
  return new Date(parseInt(p[2],10),parseInt(p[1],10)-1,parseInt(p[0],10));
}
function rvPlanoDoTipo(p,tipo){
  if(tipo==='cliente'||tipo==='beneficiador')return(p.planoPagamento&&p.planoPagamento[tipo])||[];
  const novo=p.planoPagamento&&p.planoPagamento.fornecedores&&p.planoPagamento.fornecedores[tipo];
  if(novo&&novo.length)return novo;
  if(tipo==='fornecedor'&&p.planoPagamento&&p.planoPagamento.fornecedor&&p.planoPagamento.fornecedor.length)return p.planoPagamento.fornecedor;
  return[];
}
function rvParcelaStatus(p,tipo){ // tipo: 'fornecedor'|'forn_X'|'beneficiador'|'cliente' -> {status,valor,dias}|null
  const plano=rvPlanoDoTipo(p,tipo);
  if(!plano||!plano.length)return null;
  const tot=rvCPTotais(p)[tipo];
  if(tot<=0)return null;
  const pago=tipo==='cliente'?rvPartyRecebido(p.id):rvPartyPago(p.id,tipo);
  const dataPedido=rvParseDataBR(p.data);
  if(!dataPedido)return null;
  const hoje=new Date();hoje.setHours(0,0,0,0);
  let pctVencidoAteHoje=0,proxima=null,maisAntigaVencida=null;
  plano.forEach(parc=>{
    const venc=new Date(dataPedido);venc.setDate(venc.getDate()+(parc.dias||0));
    if(venc<=hoje){
      pctVencidoAteHoje+=(parc.pct||0);
      if(!maisAntigaVencida||venc<maisAntigaVencida)maisAntigaVencida=venc;
    }
    else if(!proxima||venc<proxima.venc)proxima={venc,pct:parc.pct};
  });
  const deveriaTerPago=tot*pctVencidoAteHoje/100;
  const faltante=deveriaTerPago-pago;
  if(faltante>0.5){
    const diasAtraso=maisAntigaVencida?Math.floor((hoje-maisAntigaVencida)/86400000):0;
    return{status:'atrasado',valor:faltante,dias:diasAtraso};
  }
  if(proxima){
    const dias=Math.ceil((proxima.venc-hoje)/86400000);
    if(dias<=5)return{status:'em_breve',valor:tot*proxima.pct/100,dias};
  }
  return null;
}
// Retorna a notificação mais urgente entre fornecedor/beneficiador/cliente de um pedido, ou null
function rvParcelaStatusPedido(p){
  const tipos=[...rvCPFornKeys(p).map(fk=>fk.key),'cliente'];
  if(p.comLogo)tipos.push('beneficiador');
  let pior=null;
  tipos.forEach(tipo=>{
    const st=rvParcelaStatus(p,tipo);
    if(!st)return;
    st.tipo=tipo;
    if(!pior||(st.status==='atrasado'&&pior.status!=='atrasado')||(st.status===pior.status&&(st.dias||0)<(pior.dias||99)))pior=st;
  });
  return pior;
}
function rvParcelaStatusBadge(p){
  const st=rvParcelaStatusPedido(p);
  if(!st)return'';
  const fk=rvCPFornKeys(p).find(x=>x.key===st.tipo);
  const lbl=fk?`Pagar ${fk.nome}`:(st.tipo==='beneficiador'?'Pagar beneficiador':'Receber cliente');
  const col=st.status==='atrasado'?'var(--red)':'var(--amber)';
  const txt=st.status==='atrasado'?`${lbl} atrasado há ${st.dias}d — falta ${rvBrl(st.valor)}`:`${lbl} vence em ${st.dias}d — ${rvBrl(st.valor)}`;
  return`<div style="font-size:.62rem;font-weight:700;color:#fff;background:${col};border-radius:5px;padding:.22rem .5rem;margin-bottom:.4rem">⏰ ${esc(txt)}</div>`;
}
function rvCountVencimentos(){
  return rvLoadPedidosActive().filter(p=>p.planoPagamento&&rvParcelaStatusPedido(p)).length;
}

function rvRenderFin(){
  const cont=rvEl('rv-fin-container');
  const lista=rvLoadPedidosActive().filter(p=>p.planoPagamento);
  // ── resumo geral ──
  let totCompra=0,totVenda=0,totPagar=0,totReceber=0,totPago=0,totRecebido=0;
  lista.forEach(p=>{
    const tot=rvCPTotais(p);
    const fornKeys=rvCPFornKeys(p);
    const totForn=fornKeys.reduce((a,fk)=>a+(tot[fk.key]||0),0);
    const pagoForn=fornKeys.reduce((a,fk)=>a+rvPartyPago(p.id,fk.key),0),pagoBenef=p.comLogo?rvPartyPago(p.id,'beneficiador'):0,recCli=rvPartyRecebido(p.id);
    totCompra+=totForn+(p.comLogo?tot.beneficiador:0);
    totVenda+=tot.cliente;
    totPagar+=Math.max(0,totForn-pagoForn)+(p.comLogo?Math.max(0,tot.beneficiador-pagoBenef):0);
    totReceber+=Math.max(0,tot.cliente-recCli);
    totPago+=pagoForn+pagoBenef;
    totRecebido+=recCli;
  });
  const margem=totVenda-totCompra;
  const saldo=totReceber-totPagar;
  const big=(lbl,val,col)=>`<div style="flex:1;min-width:140px"><div style="font-size:.72rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.15rem">${lbl}</div><div style="font-size:1.62rem;font-weight:700;color:${col};font-family:'IBM Plex Mono';line-height:1.1">${val}</div></div>`;
  const small=(lbl,val,col)=>`<div style="display:flex;justify-content:space-between;gap:.6rem;padding:.36rem 0;border-bottom:1px solid var(--bdr)"><span style="font-size:.74rem;color:var(--ink3)">${lbl}</span><span style="font-size:.80rem;font-weight:600;color:${col};font-family:'IBM Plex Mono'">${val}</span></div>`;
  rvEl('rv-fin-summary').innerHTML=`
    <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:stretch">
      <div style="flex:2;min-width:300px;display:flex;gap:1.2rem;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:1.2rem 1.2rem">
        ${big('A Pagar',rvBrl(totPagar),'var(--red)')}
        ${big('A Receber',rvBrl(totReceber),'var(--green)')}
        ${big('Saldo Líquido',rvBrl(saldo),saldo>=0?'var(--green)':'var(--red)')}
      </div>
      <div style="flex:1;min-width:220px;background:var(--card);border:1px solid var(--bdr);border-radius:10px;padding:.95rem 1rem">
        ${small('Total Compra',rvBrl(totCompra),'var(--ink2)')}
        ${small('Total Venda',rvBrl(totVenda),'var(--teal)')}
        ${small('Margem Bruta',rvBrl(margem)+(totVenda>0?' ('+Math.round(margem/totVenda*100)+'%)':''),margem>=0?'var(--green)':'var(--red)')}
        ${small('Pago / Recebido',rvBrl(totPago)+' / '+rvBrl(totRecebido),'var(--ink2)')}
      </div>
    </div>`;
  if(!lista.length){cont.innerHTML='<p class="hint">Nenhum pedido com condições de pagamento definidas ainda. As condições são pedidas automaticamente ao criar um pedido.</p>';return;}
  const wrapCl=document.getElementById('msf-finr-cl-wrap');
  if(wrapCl&&!wrapCl.innerHTML)wrapCl.innerHTML=msfHtml('finr-cl','Todos Clientes');
  msfPopulate('finr-cl',[...new Set(lista.map(p=>p.cliente))].sort(),'Todos Clientes',rvRenderFin);
  const wrapForn=document.getElementById('msf-finr-forn-wrap');
  if(wrapForn&&!wrapForn.innerHTML)wrapForn.innerHTML=msfHtml('finr-forn','Todos Fornecedores');
  msfPopulate('finr-forn',[...new Set(lista.map(p=>p.fornecedor))].sort(),'Todos Fornecedores',rvRenderFin);
  const q=norm(document.getElementById('finr-q')?.value);
  const listaFiltrada=lista.filter(p=>{
    const t=norm(`${p.cliente} ${p.fornecedor}`);
    return(!q||t.includes(q))&&msfMatch('finr-cl',p.cliente)&&msfMatch('finr-forn',p.fornecedor);
  });
  if(!listaFiltrada.length){cont.innerHTML='<p class="hint">Nenhum pedido encontrado com esses filtros.</p>';rvUpdateFinBadge();return;}
  cont.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.8rem">`+listaFiltrada.map(p=>{
    const tot=rvCPTotais(p);
    const fornKeys=rvCPFornKeys(p);
    const totForn=fornKeys.reduce((a,fk)=>a+(tot[fk.key]||0),0);
    const pagoForn=fornKeys.reduce((a,fk)=>a+rvPartyPago(p.id,fk.key),0),pagoBenef=p.comLogo?rvPartyPago(p.id,'beneficiador'):0,recCli=rvPartyRecebido(p.id);
    const bar=(label,pago,total,color)=>{
      const pct=total>0?Math.min(100,Math.round(pago/total*100)):0;
      return `<div style="margin-bottom:.48rem">
        <div style="display:flex;justify-content:space-between;font-size:.70rem;color:var(--ink3)"><span>${label} ${pct}%</span><span>${rvBrl(pago)} / ${rvBrl(total)}</span></div>
        <div style="height:5px;background:var(--ltgry);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color}"></div></div>
      </div>`;
    };
    return `<div class="card" style="padding:1rem .9rem;cursor:pointer" onclick="rvOpenFinPopupR(${p.id})">
      <div style="font-weight:700;font-size:.92rem;margin-bottom:.14rem">${esc(p.cliente)}</div>
      <div style="font-size:.72rem;color:var(--ink4);margin-bottom:.65rem">${esc(p.fornecedor)}${p.comLogo?' + '+esc(p.planoPagamento.beneficiadorNome||'beneficiador'):''} · ${esc(p.data)}</div>
      ${rvParcelaStatusBadge(p)}
      ${bar('Pagar Fornecedor',pagoForn,totForn,'var(--red)')}
      ${p.comLogo?bar('Pagar Beneficiador',pagoBenef,tot.beneficiador,'var(--amber)'):''}
      ${bar('Receber Cliente',recCli,tot.cliente,'var(--green)')}
    </div>`;
  }).join('')+`</div>`;
  rvUpdateFinBadge();
}
function rvUpdateFinBadge(){
  const tab=document.getElementById('rvtab-fin');
  if(!tab)return;
  const n=rvCountVencimentos();
  tab.innerHTML=n>0?`Financeiro <span style="background:var(--red);color:#fff;border-radius:999px;font-size:.58rem;padding:.1rem .42rem;margin-left:.3rem;font-weight:700">${n}</span>`:'Financeiro';
}
/* ── CALENDÁRIO — pagamentos/recebimentos agendados e feitos ── */
const RV_MO=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let _rvCalMonth=new Date().getMonth(),_rvCalYear=new Date().getFullYear();
function rvOpenCalPopup(){
  _rvCalMonth=new Date().getMonth();_rvCalYear=new Date().getFullYear();
  rvRenderCalendar();
  document.getElementById('ovl-rvcal').classList.add('open');
}
function rvCalNav(delta){
  _rvCalMonth+=delta;
  if(_rvCalMonth<0){_rvCalMonth=11;_rvCalYear--;}
  if(_rvCalMonth>11){_rvCalMonth=0;_rvCalYear++;}
  rvRenderCalendar();
}
function rvCalDateParts(dispDate){ // DD/MM/AAAA -> {d,m,y}
  const p=(dispDate||'').split('/');
  if(p.length!==3)return null;
  return{d:parseInt(p[0],10),m:parseInt(p[1],10)-1,y:parseInt(p[2],10)};
}
function rvRenderCalendar(){
  document.getElementById('rvcal-title').textContent=RV_MO[_rvCalMonth]+' '+_rvCalYear;
  const firstDay=new Date(_rvCalYear,_rvCalMonth,1).getDay();
  const daysInMonth=new Date(_rvCalYear,_rvCalMonth+1,0).getDate();
  const isDark=document.body.classList.contains('dark');
  const bgCell=isDark?'var(--card)':'#fff';const bgOther=isDark?'var(--bg)':'var(--ltblue)';
  const dayNames=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const pedidosAtivos=rvLoadPedidosActive();
  const pedidoById={};pedidosAtivos.forEach(p=>pedidoById[p.id]=p);
  const events={};
  const addEv=(dispDate,tipo,p,valor,ref)=>{
    const parts=rvCalDateParts(dispDate);if(!parts)return;
    if(parts.m!==_rvCalMonth||parts.y!==_rvCalYear)return;
    if(!events[parts.d])events[parts.d]=[];
    events[parts.d].push({tipo,cliente:p?p.cliente:'',fornecedor:p?p.fornecedor:'',valor,ref,futuro:rvDateIsFuture(dispDate),pedidoId:p?p.id:null});
  };
  rvLoadLedgerR().forEach(l=>{const p=pedidoById[l.pedidoId];if(!p)return;addEv(l.date,'pagar',p,l.amount,l.ref);});
  rvLoadReceiptsR().forEach(r=>{const p=pedidoById[r.pedidoId];if(!p)return;addEv(r.date,'receber',p,r.amount,r.ref);});
  let h='';
  dayNames.forEach(d=>{h+=`<div style="background:${isDark?'var(--head-bg)':'var(--bg)'};padding:5px 3px;text-align:center;font-size:.62rem;font-weight:600;color:var(--ink3)">${d}</div>`;});
  const startOff=(firstDay===0?6:firstDay-1);
  for(let i=0;i<startOff;i++)h+=`<div style="background:${bgOther};min-width:0;height:82px"></div>`;
  const today=new Date();
  for(let d=1;d<=daysInMonth;d++){
    const isToday=d===today.getDate()&&_rvCalMonth===today.getMonth()&&_rvCalYear===today.getFullYear();
    const evts=events[d]||[];
    h+=`<div style="background:${bgCell};min-width:0;height:82px;padding:3px 4px;display:flex;flex-direction:column;overflow:hidden;${isToday?'outline:2px solid var(--blue);outline-offset:-2px;':''}">`;
    h+=`<div style="font-size:.7rem;font-weight:${isToday?'700':'500'};color:${isToday?'var(--blue)':'var(--ink)'};margin-bottom:2px;flex-shrink:0">${d}</div>`;
    h+=`<div style="overflow-y:auto;min-height:0">`;
    evts.forEach(e=>{
      const col=e.tipo==='pagar'?'var(--red)':'var(--green)';
      const nome=e.tipo==='pagar'?e.fornecedor:e.cliente;
      h+=`<div onclick="closeM('rvcal');${e.pedidoId?`rvOpenFinPopupR(${e.pedidoId})`:''}" style="font-size:.62rem;padding:2px 4px;margin-bottom:2px;border-radius:3px;background:${col}${e.futuro?'':'18'};color:${e.futuro?'#fff':col};cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-left:2px solid ${col}" title="${e.futuro?'Agendado':'Feito'} — ${esc(nome)} — ${rvBrl(e.valor)}${e.ref?' — '+esc(e.ref):''}"><b>${rvBrl(e.valor)}</b> ${esc(nome)}</div>`;
    });
    h+='</div></div>';
  }
  const totalCells=startOff+daysInMonth;
  const rem=totalCells%7===0?0:7-totalCells%7;
  for(let i=0;i<rem;i++)h+=`<div style="background:${bgOther};min-width:0;height:82px"></div>`;
  document.getElementById('rvcal-grid').innerHTML=h;
}

function rvFinPartyRows(pedidoId,party,total,isReceipt){
  const list=isReceipt?rvLoadReceiptsR().filter(r=>r.pedidoId===pedidoId):rvLoadLedgerR().filter(l=>l.pedidoId===pedidoId&&l.party===party);
  if(!list.length)return '<p class="hint" style="margin:.3rem 0">Nenhum lançamento ainda.</p>';
  return `<table class="rv-data-table" style="margin-top:.3rem"><thead><tr><th>Data</th><th class="rv-num">Valor</th><th>Ref</th><th>Notas</th><th></th></tr></thead><tbody>`+
    list.map(l=>{
      const futuro=rvDateIsFuture(l.date);
      return`<tr>
      <td>${esc(l.date)}${futuro?' <span style="font-size:.55rem;font-weight:700;color:var(--amber);background:var(--ltamb);padding:.05rem .35rem;border-radius:4px" title="Data ainda não chegou — não entra no total pago/recebido até lá">agendado</span>':''}</td>
      <td class="rv-num">${rvBrl(l.amount)}</td><td>${esc(l.ref||'—')}</td><td style="font-size:.65rem;color:var(--ink3)">${esc(l.notes||'')}</td>
      <td><button onclick="${isReceipt?'rvDelReceiptR':'rvDelLedgerR'}(${l.id},${pedidoId})" aria-label="Remover lançamento" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.75rem">✕</button></td></tr>`;
    }).join('')
    +'</tbody></table>';
}
let rvFinCurPedidoId=null;
function rvOpenFinPopupR(pedidoId){
  const p=rvLoadPedidos().find(x=>x.id===pedidoId);
  if(!p){toastSave('Pedido não encontrado');return;}
  rvFinCurPedidoId=pedidoId;
  const tot=rvCPTotais(p);
  const fornKeys=rvCPFornKeys(p);
  rvEl('finr-title').textContent=`Financeiro — ${p.cliente} (${p.data})`;

  const custoFornSum=fornKeys.reduce((a,fk)=>a+(tot[fk.key]||0),0);
  const custoTotal=custoFornSum+(p.comLogo?tot.beneficiador:0);
  const vendaTotal=tot.cliente;
  const margem=vendaTotal-custoTotal;
  const margemPct=vendaTotal?Math.round(margem/vendaTotal*100):0;
  const pagoFornSum=fornKeys.reduce((a,fk)=>a+rvPartyPago(pedidoId,fk.key),0)+(p.comLogo?rvPartyPago(pedidoId,'beneficiador'):0);
  const recebidoSum=rvPartyRecebido(pedidoId);

  const partyBlock=(party,total,isReceipt,showHeader,label,icon)=>{
    const paid=isReceipt?rvPartyRecebido(pedidoId):rvPartyPago(pedidoId,party);
    const planParcelas=isReceipt?rvPlanoDoTipo(p,'cliente'):rvPlanoDoTipo(p,party);
    const planTxt=planParcelas.map(pc=>`${pc.dias}d: ${pc.pct}% (${rvBrl(total*pc.pct/100)}) · ${pc.ref}`).join(' · ');
    return`<div style="margin-top:.5rem">
      ${showHeader?`<div style="font-size:.66rem;font-weight:700;color:var(--ink2);margin-bottom:.15rem">${icon} ${esc(label)} — ${rvBrl(paid)} / ${rvBrl(total)}</div>`:''}
      <div style="font-size:.58rem;color:var(--ink4);margin-bottom:.3rem">Plano: ${esc(planTxt)}</div>
      ${rvFinPartyRows(pedidoId,party,total,isReceipt)}
      <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem">
        <input type="date" id="finr-${party}-date" style="border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.68rem">
        <input type="number" id="finr-${party}-valor" placeholder="Valor" style="width:80px;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.68rem">
        <select id="finr-${party}-ref" style="border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.68rem">${RV_FIN_REF_TAGS.map(t=>`<option value="${t}">${t}</option>`).join('')}</select>
        <input type="text" id="finr-${party}-notas" placeholder="notas…" style="flex:1;min-width:70px;border:1.5px solid var(--bdr2);border-radius:5px;padding:.3rem;font-size:.68rem">
      </div>
      <button style="width:100%;margin-top:.35rem;font-size:.68rem;padding:.45rem;background:${isReceipt?'var(--green)':'var(--red)'};color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700" onclick="${isReceipt?`rvAddReceiptR(${pedidoId})`:`rvAddLedgerR(${pedidoId},'${party}')`}">＋ Lançar ${isReceipt?'recebimento':'pagamento'}</button>
    </div>`;
  };

  const kpiBox=(label,val,cor,extra)=>`<div style="flex:1;background:var(--bg);border-radius:8px;padding:.6rem .8rem">
    <div style="font-size:.58rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.05em">${label}</div>
    <div style="font-size:1rem;font-weight:700;color:${cor};font-family:'IBM Plex Mono'">${val}${extra?` <span style="font-size:.7rem;font-weight:600">${extra}</span>`:''}</div>
  </div>`;

  const barra=(pago,total,cor)=>{
    const pct=total?Math.min(100,Math.round(pago/total*100)):0;
    return`<div style="height:5px;background:var(--bdr);border-radius:3px;overflow:hidden;margin-top:.3rem"><div style="height:100%;width:${pct}%;background:${cor}"></div></div>`;
  };

  const fornecedoresHtml=fornKeys.map(fk=>partyBlock(fk.key,tot[fk.key],false,fornKeys.length>1,fk.nome,'🏭')).join('');

  let html=`<div style="display:flex;gap:.7rem;margin-bottom:1rem">
    ${kpiBox('Custo Total (Forn.)',rvBrl(custoTotal),'var(--red)')}
    ${kpiBox('Venda (Cli.)',rvBrl(vendaTotal),'var(--green)')}
    ${kpiBox('Margem',rvBrl(margem),'var(--green)',`(${margemPct}%)`)}
  </div>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:1.3rem">
    <div>
      <div style="font-size:.7rem;font-weight:700;color:var(--red);border-bottom:2px solid var(--red);padding-bottom:.3rem">🏭 Pago ao Fornecedor</div>
      ${fornecedoresHtml}
      ${p.comLogo?partyBlock('beneficiador',tot.beneficiador,false,true,'Beneficiador (logo)','🎨'):''}
      <div style="font-size:.66rem;margin-top:.6rem">Total pago: <b style="color:var(--red)">${rvBrl(pagoFornSum)}</b> de ${rvBrl(custoTotal)} · falta ${rvBrl(Math.max(0,custoTotal-pagoFornSum))}</div>
      ${barra(pagoFornSum,custoTotal,'var(--red)')}
    </div>
    <div>
      <div style="font-size:.7rem;font-weight:700;color:var(--green);border-bottom:2px solid var(--green);padding-bottom:.3rem">👤 Recebido do Cliente</div>
      ${partyBlock('cliente',tot.cliente,true,false)}
      <div style="font-size:.66rem;margin-top:.6rem">Total recebido: <b style="color:var(--green)">${rvBrl(recebidoSum)}</b> de ${rvBrl(vendaTotal)} · falta ${rvBrl(Math.max(0,vendaTotal-recebidoSum))}</div>
      ${barra(recebidoSum,vendaTotal,'var(--green)')}
    </div>
  </div>
  <div style="border-top:1px solid var(--bdr);margin-top:1rem;padding-top:.7rem;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:.72rem;font-weight:700">Saldo líquido (a receber − a pagar)</span>
    <span style="font-size:.9rem;font-weight:700;font-family:'IBM Plex Mono';color:${(recebidoSum-pagoFornSum)>=0?'var(--green)':'var(--red)'}">${rvBrl(recebidoSum-pagoFornSum)}</span>
  </div>`;
  rvEl('finr-body').innerHTML=html;
  document.getElementById('ovl-finr').classList.add('open');
}
function rvAddLedgerR(pedidoId,party){
  const date=rvEl(`finr-${party}-date`).value;
  const valor=parseFloat(rvEl(`finr-${party}-valor`).value);
  const ref=rvEl(`finr-${party}-ref`).value;
  const notas=rvEl(`finr-${party}-notas`).value.trim();
  if(!date||!valor){toastSave('Preencha data e valor');return;}
  const [y,m,d]=date.split('-');
  const lista=rvLoadLedgerR();
  lista.unshift({id:Date.now(),updatedAt:Date.now(),pedidoId,party,amount:valor,date:`${d}/${m}/${y}`,ref,notes:notas});
  rvSaveLedgerR(lista);
  rvSyncPush();
  rvOpenFinPopupR(pedidoId);
  rvRenderFin();
  toastSave('Lançado ✓');
}
function rvAddReceiptR(pedidoId){
  const date=rvEl(`finr-cliente-date`).value;
  const valor=parseFloat(rvEl(`finr-cliente-valor`).value);
  const ref=rvEl(`finr-cliente-ref`).value;
  const notas=rvEl(`finr-cliente-notas`).value.trim();
  if(!date||!valor){toastSave('Preencha data e valor');return;}
  const [y,m,d]=date.split('-');
  const lista=rvLoadReceiptsR();
  lista.unshift({id:Date.now(),updatedAt:Date.now(),pedidoId,amount:valor,date:`${d}/${m}/${y}`,ref,notes:notas});
  rvSaveReceiptsR(lista);
  rvSyncPush();
  rvOpenFinPopupR(pedidoId);
  rvRenderFin();
  toastSave('Lançado ✓');
}
function rvDelLedgerR(id,pedidoId){
  if(!confirm('Apagar este lançamento?'))return;
  rvSaveLedgerR(rvLoadLedgerR().filter(l=>l.id!==id),true);
  rvSyncPush();
  rvOpenFinPopupR(pedidoId);
  rvRenderFin();
}
function rvDelReceiptR(id,pedidoId){
  if(!confirm('Apagar este lançamento?'))return;
  rvSaveReceiptsR(rvLoadReceiptsR().filter(r=>r.id!==id),true);
  rvSyncPush();
  rvOpenFinPopupR(pedidoId);
  rvRenderFin();
}

function rvToggleStatus(id,key,val){
  const lista=rvLoadPedidos();
  const p=lista.find(x=>x.id===id);
  if(!p)return;
  p.status[key]=val;
  p.updatedAt=Date.now();
  rvSavePedidos(lista);
  rvRenderPedidos();
  rvSyncPush();
}
function rvUpdateObs(id,val){
  const lista=rvLoadPedidos();
  const p=lista.find(x=>x.id===id);
  if(!p)return;
  p.obs=val;
  p.updatedAt=Date.now();
  rvSavePedidos(lista);
  rvSyncPush();
}
function rvExcluirPedido(id){
  if(!confirm('Excluir este pedido?'))return;
  const lista=rvLoadPedidos();
  const rec=lista.find(p=>p.id===id);
  if(rec){rec.deleted=true;rec.updatedAt=Date.now();}
  rvSavePedidos(lista,true);
  rvRenderPedidos();
  rvSyncPush();
}
function rvLimparTodosPedidos(){
  if(!confirm('Excluir TODOS os pedidos?'))return;
  const lista=rvLoadPedidos();
  const agora=Date.now();
  lista.forEach(p=>{p.deleted=true;p.updatedAt=agora;});
  rvSavePedidos(lista,true);rvRenderPedidos();
  rvSyncPush();
}

function rvInit(){
  rv2LoadLocalCad();
  rv2LoadEmpresaLocal();
  rv2PopulateSelects();
  updateRvSyncStatus();
  rv2AddProdRow('',1000,4.25,8.65);
  rvSacachoLoad();
  rvSacachoRender();
}

addProd({ncm:'4202.92.00'});
recalc();
if(!cfLoad())cfAddProduct({ncm:'4202.92.00'});else{cfRenderProducts();cfCalc();}
rvInit();
initAuth().then(()=>{
  updateRvSyncStatus();
  if(!authUser)openAuthModal(); // gate obrigatório logo na abertura da página
});
// obs: os dados da Importação ficam cifrados no localStorage; só são carregados
// quando o usuário desbloqueia a aba com a senha certa (dentro de tryUnlock)

