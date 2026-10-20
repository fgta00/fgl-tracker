/* V52 — cliente pesquisável no MIX e eventos no calendário. */
(()=>{'use strict';if(NC.cardsV52)return;NC.cardsV52=true;
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
 const labels=new Map(),counts=new Map();NS.customers.forEach(c=>{const name=NC.name(c.id);counts.set(name,(counts.get(name)||0)+1);});NS.customers.forEach(c=>{const name=NC.name(c.id);labels.set(c.id,counts.get(name)>1?name+' · '+c.id.slice(0,8):name);});
 const owner=NS.userId,session=typeof NC.session==='function'?NC.session():null;
 const live=()=>owner===NS.userId&&(!session||!NC.live||NC.live(session));
 const input=(field,label,type='text')=>`<label>${label}<input data-v50-head="${field}" type="${type}" value="${NC.e(value[field]??'')}" ${type==='number'?'min="0" step="any"':''}></label>`;
 NC.dialog(mix?'Contêiner MIX':'Feiras e Eventos',`<div class="v50-editor">${mix?`<div class="v50-head">${input('title','Título')}${input('arrival_month','Chegada','month')}${input('cutoff','Cut-off','date')}${input('capacity','Capacidade CBM','number')}${input('units_per_cbm','Sacolas / CBM','number')}</div><div class="v50-utilization"></div>`:''}${mix?`<datalist id="v52-mix-customers">${[...labels].map(([id,label])=>`<option value="${NC.e(label)}"></option>`).join('')}</datalist>`:''}<div class="v50-scroll"><table class="${mix?'mix':'events'}"><thead><tr>${(mix?['Cliente','Quantidade','CBM automático','Situação','']:['Evento','Início','Fim','Local','Notas','']).map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody class="v50-rows"></tbody></table></div><button type="button" class="v50-add">+ Linha</button><p class="v50-status" role="status">Edição direta · salvamento automático.</p></div>`);
 const dlg=document.getElementById('nc-dialog'),editor=dlg.querySelector('.v50-editor');dlg.classList.add('nc-cards-v50');dlg.querySelector('footer')?.remove();
 const tbody=editor.querySelector('.v50-rows'),status=editor.querySelector('.v50-status');let timer,queue=Promise.resolve(),version=0,closed=false;
 const field=(r,k,placeholder,type='text',extra='')=>`<input data-v50-row="${k}" aria-label="${placeholder}" placeholder="${placeholder}" type="${type}" value="${NC.e(r[k]??'')}" ${extra}>`;
 const renderRows=()=>{tbody.innerHTML=rows.map((r,i)=>`<tr data-v50-index="${i}">${mix?`<td><input data-v52-customer aria-label="Buscar cliente" list="v52-mix-customers" placeholder="Digite o nome do cliente…" autocomplete="off" value="${NC.e(labels.get(r.customer_id)|| (r.customer_id?NC.name(r.customer_id):''))}"></td><td>${field(r,'quantity','Quantidade','number','min="0" step="1"')}</td><td><input data-v50-cbm aria-label="CBM calculado" value="${fmt(volume(r,value))}" readonly></td><td><select data-v50-row="status" aria-label="Situação">${NC.options([['interested','Interessado'],['quoted','Cotado'],['confirmed','Confirmado']],r.status||'interested')}</select></td>`:`<td>${field(r,'name','Evento')}</td><td>${field(r,'date','Início','date')}</td><td>${field(r,'end_date','Fim','date')}</td><td>${field(r,'place','Local')}</td><td>${field(r,'notes','Notas')}</td>`}<td><button type="button" class="v50-remove" aria-label="Remover linha ${i+1}">×</button></td></tr>`).join('');};
 const refresh=()=>{if(!mix)return;let used=0;rows.forEach((r,i)=>{const amount=volume(r,value);used+=amount;const el=tbody.querySelector(`[data-v50-index="${i}"] [data-v50-cbm]`);if(el)el.value=fmt(amount);});editor.querySelector('.v50-utilization').textContent=num(value.units_per_cbm)>0?`Utilização prevista: ${fmt(used)} / ${fmt(value.capacity)} CBM · ${fmt(num(value.capacity)?used/num(value.capacity)*100:0)}%${used>num(value.capacity)?' · Capacidade excedida':''}`:'Preencha a referência Sacolas / CBM para calcular o volume automaticamente.';};
 const persist=()=>{
  clearTimeout(timer);timer=null;if(!live())return;
  const unresolved=[...editor.querySelectorAll('[data-v52-customer]')].find(el=>{const row=rows[Number(el.closest('tr').dataset.v50Index)];return el.value.trim()&&el.value!==labels.get(row.customer_id);});
  if(unresolved){status.textContent='Escolha um cliente das sugestões para salvar.';return;}
  const invalid=[...editor.querySelectorAll('input')].find(el=>el.validity&&!el.validity.valid);if(invalid){status.textContent='Confira os valores antes de salvar.';return;}
  if(mix&&num(value.units_per_cbm)<=0&&rows.some(r=>num(r.quantity)>0)){status.textContent='Preencha Sacolas / CBM para calcular e salvar.';return;}
  const snapshot=copy(value);snapshot.rows=rows.map(r=>({...r,...(mix?{quantity:num(r.quantity),cbm:Number(volume(r,value).toFixed(6))}:{} )}));
  const current=++version;status.textContent='Salvando…';
  queue=queue.catch(()=>{}).then(async()=>{if(!live())return;try{await NC.api.saveSetting(key,{...NC.api.setting(key),...snapshot});if(!live())return;if(current===version)status.textContent='Salvo automaticamente';NC.render();}catch(e){if(live())status.textContent='Não salvo: '+e.message;}});
 };
 const customerInput=(el,commit)=>{if(!el.matches('[data-v52-customer]'))return false;const row=rows[Number(el.closest('tr').dataset.v50Index)],text=el.value.trim();const matches=[...labels].filter(([id,label])=>label===text);if(matches.length===1){row.customer_id=matches[0][0];el.value=matches[0][1];el.setCustomValidity?.('');}else if(!text){row.customer_id='';el.setCustomValidity?.('');}else {el.setCustomValidity?.('Escolha um cliente das sugestões.');status.textContent='Digite e escolha um cliente das sugestões.';}clearTimeout(timer);if(commit)persist();else timer=setTimeout(persist,650);return true;};
 editor.addEventListener('input',e=>{if(customerInput(e.target,false))return;const el=e.target,k=el.dataset.v50Head||el.dataset.v50Row;if(!k)return;const row=el.closest('tr');if(row){const r=rows[Number(row.dataset.v50Index)];r[k]=el.type==='number'?num(el.value):el.value;}else value[k]=el.type==='number'?num(el.value):el.value;refresh();clearTimeout(timer);timer=setTimeout(persist,650);});
 editor.addEventListener('change',e=>{if(customerInput(e.target,true))return;const el=e.target,k=el.dataset.v50Head||el.dataset.v50Row;if(!k)return;const row=el.closest('tr');if(row)rows[Number(row.dataset.v50Index)][k]=el.type==='number'?num(el.value):el.value;else value[k]=el.type==='number'?num(el.value):el.value;refresh();persist();});
 editor.querySelector('.v50-add').onclick=()=>{rows.push(mix?{customer_id:'',quantity:0,cbm:0,status:'interested'}:{name:'',date:'',end_date:'',place:'',notes:''});renderRows();refresh();tbody.lastElementChild.querySelector('input,select').focus();};
 editor.addEventListener('click',e=>{if(!e.target.closest('.v50-remove'))return;const row=e.target.closest('tr');rows.splice(Number(row.dataset.v50Index),1);renderRows();refresh();persist();});
 dlg.addEventListener('close',()=>{if(closed)return;closed=true;if(timer)persist();dlg.classList.remove('nc-cards-v50');},{once:true});
 renderRows();refresh();
};
NC.mixDialog=()=>NC.inlineCardDialog('mix');NC.eventsDialog=()=>NC.inlineCardDialog('events');

// Calendar decoration only: fairs are never counted as overdue customer tasks.
const previousCalendar=NC.calendar;
const fairRows=()=>{const v=NC.api.setting('events');return Array.isArray(v.rows)?v.rows:[];};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(new Date(value+'T12:00:00').getTime());
const range=row=>{const start=row.date,end=validDate(row.end_date)&&row.end_date>=start?row.end_date:start;return validDate(start)?{start,end}:null;};
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
NC.calendar=history=>{
 const html=previousCalendar(history);if(history)return html;
 const tpl=document.createElement('template');tpl.innerHTML=html;
 const entries=fairRows().map((row,index)=>({row,index,range:range(row)})).filter(x=>x.range&&x.row.name?.trim());
 const base=new Date(),offset=Number(NS.offset)||0;
 if(NS.calendar==='year'){
  const year=base.getFullYear()+offset;
  tpl.content.querySelectorAll('.nc-year [data-month]').forEach(button=>{const month=Number(button.dataset.month),start=iso(new Date(year,month,1)),end=iso(new Date(year,month+1,0));const count=entries.filter(x=>x.range.start<=end&&x.range.end>=start).length;if(count){const mark=document.createElement('small');mark.className='nc-fair-year';mark.textContent=count+(count===1?' feira/evento':' feiras/eventos');button.append(mark);}});
 }else{
  let dates=[];
  if(NS.calendar==='month'){base.setDate(1);base.setMonth(base.getMonth()+offset);dates=Array.from({length:new Date(base.getFullYear(),base.getMonth()+1,0).getDate()},(_,i)=>iso(new Date(base.getFullYear(),base.getMonth(),i+1)));}
  else{base.setDate(base.getDate()-(base.getDay()+6)%7+offset*7);dates=Array.from({length:7},(_,i)=>iso(new Date(base.getFullYear(),base.getMonth(),base.getDate()+i)));}
  tpl.content.querySelectorAll('.nc-day').forEach((day,i)=>{const date=dates[i];if(!date)return;entries.filter(x=>date>=x.range.start&&date<=x.range.end).forEach(x=>{const b=document.createElement('button');b.type='button';b.className='nc-fair-event';b.dataset.nc='fair-event';b.dataset.index=String(x.index);b.textContent=x.row.name;b.title=[x.row.name,x.range.start+(x.range.end!==x.range.start?' a '+x.range.end:''),x.row.place,x.row.notes].filter(Boolean).join(' · ');day.append(b);});});
 }
 const week=tpl.content.querySelector(".nc-week");if(week)week.style.gridTemplateColumns=[...week.children].map((day,i)=>i>=5&&!day.querySelector(".nc-event,.nc-fair-event")?"minmax(30px,.38fr)":"minmax(0,1fr)").join(" ");
 const result=document.createElement("div");result.append(tpl.content.cloneNode(true));return result.innerHTML;
};
const previousHandle=NC.handle;
NC.handle=async button=>{if(button.dataset.nc==='fair-event'){NC.eventsDialog();const row=document.querySelector('.v50-rows [data-v50-index="'+Number(button.dataset.index)+'"]');row?.scrollIntoView?.({block:'nearest'});row?.querySelector('input')?.focus();return;}return previousHandle(button);};
const fairCss=document.createElement('style');fairCss.textContent=`.ncrm .nc-fair-event{display:block;width:100%;border:0!important;border-left:3px solid #8d79ad!important;background:#f5f1fa!important;color:#65507e!important;border-radius:2px!important;text-align:left;font-size:10px!important;font-weight:400!important;line-height:1.3;padding:3px 5px!important;margin:3px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.ncrm .nc-fair-year{display:block;color:#796491;font-size:10px;font-weight:400;border-top:1px solid #ded4e9;margin-top:4px;padding-top:3px}`;document.head.append(fairCss);
})();
