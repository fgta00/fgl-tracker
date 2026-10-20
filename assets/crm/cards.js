/* V50 — MIX automático e editor de eventos isolado, sem substituir app/views. */
(()=>{'use strict';if(NC.cardsV50)return;NC.cardsV50=true;
const copy=x=>JSON.parse(JSON.stringify(x??{})),num=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
const fmt=x=>num(x).toLocaleString('pt-BR',{maximumFractionDigits:2});
const volume=(row,value)=>num(value.units_per_cbm)>0&&row.quantity!==undefined&&row.quantity!==''?num(row.quantity)/num(value.units_per_cbm):num(row.cbm);
const previousMini=NC.mini;
NC.mini=(key,title,big,sub,extra='')=>{
 if(key!=='mix')return previousMini(key,title,big,sub,extra);
 const v=NC.api.setting('mix'),rows=Array.isArray(v.rows)?v.rows:[],used=rows.reduce((a,r)=>a+volume(r,v),0),confirmed=rows.filter(r=>r.status==='confirmed').reduce((a,r)=>a+volume(r,v),0),capacity=num(v.capacity),percent=capacity?used/capacity*100:0;
 const label=capacity?(used>capacity?fmt(used-capacity)+' CBM acima da capacidade':fmt(capacity-used)+' CBM livres'):'Definir capacidade';
 return previousMini(key,title,label,sub,`<div class="nc-bar" role="progressbar" aria-label="Utilização prevista do MIX" aria-valuenow="${Math.round(percent)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100,percent)}%;${used>capacity?'background:#b14d3c':''}"></i></div><small>Utilização prevista · ${fmt(used)} / ${fmt(capacity)} CBM (${fmt(percent)}%)</small><small>${fmt(confirmed)} CBM confirmados${num(v.units_per_cbm)>0?' · ≈ '+Math.floor(Math.max(0,capacity-used)*num(v.units_per_cbm)).toLocaleString('pt-BR')+' sacolas livres':''}</small>`);
};
const css=document.createElement('style');css.textContent=`.ncrm dialog#nc-dialog.nc-cards-v50{width:min(1120px,95vw)!important;max-height:88vh}.nc-cards-v50 .v50-head{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:12px}.nc-cards-v50 label{font-size:11px;color:#63717c}.nc-cards-v50 input,.nc-cards-v50 select{font:inherit!important;font-size:12px!important;min-width:0;width:100%;padding:7px!important}.nc-cards-v50 input[readonly]{background:#f4f6f8;color:#64717c}.nc-cards-v50 .v50-scroll{overflow:auto;max-height:53vh;margin:14px 0}.nc-cards-v50 table{min-width:800px}.nc-cards-v50 th,.nc-cards-v50 td{padding:7px!important}.nc-cards-v50 table.events th:first-child{width:27%}.nc-cards-v50 table.mix th:first-child{width:40%}.nc-cards-v50 .v50-status{font-size:11px;color:#667582;margin:5px 0}.nc-cards-v50 .v50-utilization{padding:12px;background:#f4f6f8;border-radius:7px;margin-top:12px;font-size:12px}.nc-cards-v50 .v50-remove{border:0;background:transparent;color:#9d5548;padding:5px!important}.nc-cards-v50 .v50-required{color:#9d5548}`;document.head.append(css);
NC.inlineCardDialog=key=>{
 if(!['mix','events'].includes(key))return;
 const mix=key==='mix',value=copy(NC.api.setting(key));let rows=Array.isArray(value.rows)?value.rows.map(copy):[];
 const owner=NS.userId,session=typeof NC.session==='function'?NC.session():null;
 const live=()=>owner===NS.userId&&(!session||!NC.live||NC.live(session));
 const input=(field,label,type='text')=>`<label>${label}<input data-v50-head="${field}" type="${type}" value="${NC.e(value[field]??'')}" ${type==='number'?'min="0" step="any"':''}></label>`;
 NC.dialog(mix?'Contêiner MIX':'Feiras e Eventos',`<div class="v50-editor">${mix?`<div class="v50-head">${input('title','Título')}${input('arrival_month','Chegada','month')}${input('cutoff','Cut-off','date')}${input('capacity','Capacidade CBM','number')}${input('units_per_cbm','Sacolas / CBM','number')}</div><div class="v50-utilization"></div>`:''}<div class="v50-scroll"><table class="${mix?'mix':'events'}"><thead><tr>${(mix?['Cliente','Quantidade','CBM automático','Situação','']:['Evento','Início','Fim','Local','Notas','']).map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody class="v50-rows"></tbody></table></div><button type="button" class="v50-add">+ Linha</button><p class="v50-status" role="status">Edição direta · salvamento automático.</p></div>`);
 const dlg=document.getElementById('nc-dialog'),editor=dlg.querySelector('.v50-editor');dlg.classList.add('nc-cards-v50');dlg.querySelector('footer')?.remove();
 const tbody=editor.querySelector('.v50-rows'),status=editor.querySelector('.v50-status');let timer,queue=Promise.resolve(),version=0,closed=false;
 const field=(r,k,placeholder,type='text',extra='')=>`<input data-v50-row="${k}" aria-label="${placeholder}" placeholder="${placeholder}" type="${type}" value="${NC.e(r[k]??'')}" ${extra}>`;
 const renderRows=()=>{tbody.innerHTML=rows.map((r,i)=>`<tr data-v50-index="${i}">${mix?`<td><select data-v50-row="customer_id" aria-label="Cliente">${NC.options(NS.customers.map(c=>[c.id,NC.name(c.id)]),r.customer_id,'Cliente')}</select></td><td>${field(r,'quantity','Quantidade','number','min="0" step="1"')}</td><td><input data-v50-cbm aria-label="CBM calculado" value="${fmt(volume(r,value))}" readonly></td><td><select data-v50-row="status" aria-label="Situação">${NC.options([['interested','Interessado'],['quoted','Cotado'],['confirmed','Confirmado']],r.status||'interested')}</select></td>`:`<td>${field(r,'name','Evento')}</td><td>${field(r,'date','Início','date')}</td><td>${field(r,'end_date','Fim','date')}</td><td>${field(r,'place','Local')}</td><td>${field(r,'notes','Notas')}</td>`}<td><button type="button" class="v50-remove" aria-label="Remover linha ${i+1}">×</button></td></tr>`).join('');};
 const refresh=()=>{if(!mix)return;let used=0;rows.forEach((r,i)=>{const amount=volume(r,value);used+=amount;const el=tbody.querySelector(`[data-v50-index="${i}"] [data-v50-cbm]`);if(el)el.value=fmt(amount);});editor.querySelector('.v50-utilization').textContent=num(value.units_per_cbm)>0?`Utilização prevista: ${fmt(used)} / ${fmt(value.capacity)} CBM · ${fmt(num(value.capacity)?used/num(value.capacity)*100:0)}%${used>num(value.capacity)?' · Capacidade excedida':''}`:'Preencha a referência Sacolas / CBM para calcular o volume automaticamente.';};
 const persist=()=>{
  clearTimeout(timer);timer=null;if(!live())return;
  const invalid=[...editor.querySelectorAll('input')].find(el=>el.validity&&!el.validity.valid);if(invalid){status.textContent='Confira os valores antes de salvar.';return;}
  if(mix&&num(value.units_per_cbm)<=0&&rows.some(r=>num(r.quantity)>0)){status.textContent='Preencha Sacolas / CBM para calcular e salvar.';return;}
  const snapshot=copy(value);snapshot.rows=rows.map(r=>({...r,...(mix?{quantity:num(r.quantity),cbm:Number(volume(r,value).toFixed(6))}:{} )}));
  const current=++version;status.textContent='Salvando…';
  queue=queue.catch(()=>{}).then(async()=>{if(!live())return;try{await NC.api.saveSetting(key,{...NC.api.setting(key),...snapshot});if(!live())return;if(current===version)status.textContent='Salvo automaticamente';NC.render();}catch(e){if(live())status.textContent='Não salvo: '+e.message;}});
 };
 editor.addEventListener('input',e=>{const el=e.target,k=el.dataset.v50Head||el.dataset.v50Row;if(!k)return;const row=el.closest('tr');if(row){const r=rows[Number(row.dataset.v50Index)];r[k]=el.type==='number'?num(el.value):el.value;}else value[k]=el.type==='number'?num(el.value):el.value;refresh();clearTimeout(timer);timer=setTimeout(persist,650);});
 editor.addEventListener('change',e=>{const el=e.target,k=el.dataset.v50Head||el.dataset.v50Row;if(!k)return;const row=el.closest('tr');if(row)rows[Number(row.dataset.v50Index)][k]=el.type==='number'?num(el.value):el.value;else value[k]=el.type==='number'?num(el.value):el.value;refresh();persist();});
 editor.querySelector('.v50-add').onclick=()=>{rows.push(mix?{customer_id:'',quantity:0,cbm:0,status:'interested'}:{name:'',date:'',end_date:'',place:'',notes:''});renderRows();refresh();tbody.lastElementChild.querySelector('input,select').focus();};
 editor.addEventListener('click',e=>{if(!e.target.closest('.v50-remove'))return;const row=e.target.closest('tr');rows.splice(Number(row.dataset.v50Index),1);renderRows();refresh();persist();});
 dlg.addEventListener('close',()=>{if(closed)return;closed=true;if(timer)persist();dlg.classList.remove('nc-cards-v50');},{once:true});
 renderRows();refresh();
};
NC.mixDialog=()=>NC.inlineCardDialog('mix');NC.eventsDialog=()=>NC.inlineCardDialog('events');
})();
