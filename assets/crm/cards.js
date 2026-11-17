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

/* Prod BR — hoje na agenda e próximo compromisso no SM Foco. */
(()=>{
'use strict';
const calendar=NC.calendar, mini=NC.mini;
const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
NC.calendar=history=>{
 const html=calendar(history);
 if(history)return html;
 const now=new Date(),base=new Date(now),offset=Number(NS.offset)||0;
 const tpl=document.createElement('template');tpl.innerHTML=html;
 let current=null;
 if(NS.calendar==='year'){
  const year=now.getFullYear()+offset;
  if(year===now.getFullYear())current=tpl.content.querySelector('.nc-year [data-month="'+now.getMonth()+'"]');
 }else{
  if(NS.calendar==='month'){base.setDate(1);base.setMonth(base.getMonth()+offset);}
  else base.setDate(base.getDate()-(base.getDay()+6)%7+offset*7);
  const today=localISO(now);
  current=[...tpl.content.querySelectorAll('.nc-day')].find((_,i)=>localISO(new Date(base.getFullYear(),base.getMonth(),base.getDate()+i))===today);
 }
 if(!current)return html;
 current.classList.add('nc-calendar-today');current.setAttribute('aria-current','date');
 if(NS.calendar==='year'){
  const tag=document.createElement('span');tag.className='nc-today-label';
  tag.textContent='Hoje · '+now.getDate();current.append(tag);
 }
 const out=document.createElement('div');out.append(tpl.content);return out.innerHTML;
};
const upcomingFor=ids=>{
 const today=localISO(new Date());
 return NC.events(false).filter(e=>e.type==='schedule'&&ids.has(e.customer)&&/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')&&e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
};
const nextText=(e,includeName)=>'📅 Próximo: '+NC.date(e.date)+(includeName?' · '+NC.name(e.customer):e.label?' · '+e.label:'');
NC.mini=(key,title,big,sub,extra='')=>{
 if(key!=='asia')return mini(key,title,big,sub,extra);
 const ids=new Set((NC.api.setting('asia').rows||[]).map(r=>r.customer_id).filter(Boolean));
 const e=upcomingFor(ids)[0];
 if(e)extra+='<small class="nc-focus-next" title="'+NC.e(NC.name(e.customer)+' · '+(e.label||''))+'">'+NC.e(nextText(e,true))+'</small>';
 return mini(key,title,big,sub,extra);
};
const focusDialog=NC.focusDialog;
if(typeof focusDialog==='function')NC.focusDialog=(...args)=>{
 const result=focusDialog(...args);
 const table=document.querySelector('#nc-dialog .nc-focus-table');
 if(!table)return result;
 const picker=document.createElement('form');picker.className='nc-focus-add';
 picker.innerHTML='<select aria-label="Cliente para adicionar" required></select><button type="submit" title="Adicionar ao SM Foco" aria-label="Adicionar ao SM Foco" disabled>☆</button><button type="button" title="Cadastrar novo cliente" aria-label="Cadastrar novo cliente">+</button><small role="status"></small>';
 const title=table.closest('dialog')?.querySelector('h2');
 if(title){const header=document.createElement('div');header.className='nc-focus-heading';title.before(header);header.append(title,picker);}
 else table.before(picker);
 const [select,submit,newClient,status]=picker.children;
 const candidates=NS.customers.filter(c=>!c.deleted&&!NC.focused(c.id)).map(c=>({id:String(c.id),name:NC.name(c.id)})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=candidates.length?'Cliente…':'Sem clientes disponíveis';select.append(placeholder);
 for(const c of candidates){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;select.append(option);}
 newClient.addEventListener('click',async ()=>{
  try{await NC.focusSaveQueue;if(picker.isConnected)NC.editCustomer(undefined,{fromFocus:true});}
  catch{status.textContent='Confira a alteração anterior antes de cadastrar.';}
 });
 select.addEventListener('change',()=>{submit.disabled=!select.value;});
 picker.addEventListener('submit',async event=>{
  event.preventDefault();
  const id=select.value;if(!id||submit.disabled)return;
  newClient.disabled=select.disabled=submit.disabled=true;status.textContent='Adicionando…';
  try{
   await NC.focusSaveQueue;
   if(!NC.focused(id))await NC.toggleFocus(id);
   if(!NC.focused(id))throw new Error('Não foi possível adicionar. Tente novamente.');
   if(picker.isConnected&&picker.closest('dialog')?.open)NC.focusDialog(...args);
  }catch(error){status.textContent=error?.message||'Não foi possível adicionar.';}
  finally{newClient.disabled=select.disabled=false;submit.disabled=!select.value;}
 });
 const links=[...table.querySelectorAll('.nc-focus-link[data-id]')];
 const firstByCustomer=new Map();
 for(const e of upcomingFor(new Set(links.map(link=>link.dataset.id))))if(!firstByCustomer.has(e.customer))firstByCustomer.set(e.customer,e);
 for(const link of links){
  const e=firstByCustomer.get(link.dataset.id);
  if(!e)continue;
  const note=document.createElement('small');note.className='nc-focus-dialog-next';note.textContent=nextText(e,false);
  link.closest('td').append(note);
 }
 return result;
};
const css=document.createElement('style');
css.textContent=`
.nc-calendar-today .nc-dayhead b{color:#215d8b;background:#eaf3fa;border-radius:8px;padding:0 .25em}
.nc-year .nc-today-label{display:block;margin-top:2px;font-size:9px;color:#215d8b}
.ncrm .nc-focus-next{display:block;color:#205785;font-size:10px;line-height:1.3;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nc-focus-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}.nc-focus-heading h2{margin:0!important}.nc-focus-add{display:flex;align-items:center;gap:5px;margin:0 0 0 auto;position:relative}.nc-focus-add select{width:clamp(105px,18vw,220px);height:30px;font-size:12px}.nc-focus-add button{width:28px;height:28px;display:grid;place-items:center;padding:0!important;font-size:16px;color:#205785}.nc-focus-add [role=status]:empty{display:none}.nc-focus-add [role=status]{position:absolute;right:0;top:100%;font-size:11px;background:#fff;z-index:1}.nc-new-focus-star{display:flex;align-items:center;gap:6px;margin-top:12px;color:#205785}.nc-focus-dialog-next{display:block;color:#205785;font-size:.8em;line-height:1.35;margin-top:4px;overflow-wrap:anywhere}
`;
document.head.append(css);
})();
