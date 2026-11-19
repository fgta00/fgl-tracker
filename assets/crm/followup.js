/* Acompanhamento do cliente e apresentação unificada das agendas. */
(()=>{
'use strict';
if(NC.followupV64)return;NC.followupV64=true;
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=()=>iso(new Date());
const shortDate=v=>v?new Date(String(v).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'short'}):'—';
const customer=NC.customer;
NC.customer=(...args)=>{
 const t=document.createElement('template');t.innerHTML=customer(...args);
 const old=t.content.querySelector('.nc-upper > .nc-card');if(!old)return t.innerHTML;
 const c=NS.customers.find(c=>c.id===NS.customer);if(!c)return t.innerHTML;
 const actions=NS.actions.filter(a=>a.customer_id===c.id);
 const planned=actions.filter(a=>a.status==='planned').sort((a,b)=>String(a.due_date||'9999').localeCompare(String(b.due_date||'9999')));
 const notes=actions.filter(a=>a.status==='done').sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||'')));
 const button=(action,id,text,label)=>`<button type="button" data-nc="${action}" data-id="${NC.e(id)}" title="${label}" aria-label="${label}">${text}</button>`;
 const panel=document.createElement('section');panel.className='nc-card nc-followup';
 panel.innerHTML=`<div class="nc-head"><b>Acompanhamento</b>${c.notes?'<button type="button" data-nc="followup-profile">Notas do cadastro ›</button>':''}</div><div class="nc-followup-body"><form id="nc-noteform" class="nc-followup-form"><textarea name="summary" maxlength="160" rows="2" placeholder="Registrar nota ou próximo contato…" aria-label="Nota ou próximo contato" required></textarea><div class="nc-followup-compose"><input type="hidden" name="kind" value="note"><div class="nc-followup-switch">${button('followup-kind','note','Anotar','Anotar')}${button('followup-kind','agenda','Agendar','Agendar')}</div><input type="date" name="date" value="${today()}" aria-label="Data do registro ou agendamento" required><button class="nc-primary" type="submit" title="Salvar" aria-label="Salvar">+</button></div></form><div class="nc-followup-scroll"><h3>Próximo contato</h3>${planned.length?planned.map(a=>`<div class="nc-followup-next ${a.due_date<today()?'is-overdue':''}"><button class="nc-followup-copy" type="button" data-nc="event" data-kind="action" data-id="${NC.e(a.id)}"><b>${a.due_date===today()?'Hoje · ':a.due_date<today()?'Atrasado · ':''}${shortDate(a.due_date)}</b><span>${NC.e(a.summary)}</span></button><div class="nc-followup-tools">${button('complete',a.id,'✓','Concluir contato')}${button('reschedule',a.id,'▦','Reagendar contato')}</div></div>`).join(''):'<p class="nc-followup-empty">Nenhum contato agendado.</p>'}<h3 class="nc-followup-history-title">Histórico</h3>${notes.length?notes.map(a=>`<div class="nc-followup-log"><small>${shortDate(a.occurred_at||a.created_at)} · ${a.due_date?'Concluído':'Nota'}</small><button type="button" data-nc="followup-edit" data-id="${NC.e(a.id)}" title="Abrir ou editar registro">${NC.e(a.summary)}</button>${a.due_date?'<span class="nc-followup-check">✓</span>':''}</div>`).join(''):'<p class="nc-followup-empty">Nenhum registro.</p>'}</div></div>`;
 panel.querySelector('.nc-head b').textContent='Acompanhamento';
 panel.querySelector('[data-id=note]').setAttribute('aria-pressed','true');
 panel.querySelector('[data-id=agenda]').setAttribute('aria-pressed','false');
 old.replaceWith(panel);
 const upper=t.content.querySelector('.nc-upper');
 if(upper){let anchor=upper;for(const prefix of ['Negócios','Histórico de ações']){const block=[...t.content.querySelectorAll('details.nc-card')].find(el=>el.querySelector(':scope > summary')?.textContent.trim().startsWith(prefix));if(block){anchor.after(block);anchor=block;}}}
 return t.innerHTML;
};
const calendar=NC.calendar;
NC.calendar=history=>{
 const t=document.createElement('template');t.innerHTML=calendar(history);
 const section=t.content.querySelector('.nc-history-calendar,.nc-dashboard-calendar');if(!section)return t.innerHTML;
 section.classList.add('nc-agenda-unified');const head=section.querySelector('.nc-head'),title=head?.querySelector('b');
 if(title){const period=title.textContent.replace(/^[^·]*·\s*/,'');title.innerHTML='<span>Agenda</span><small>'+NC.e(period)+'</small>';}
 const next=head?.querySelector('[data-nc=cal-next]');if(next){const b=document.createElement('button');b.type='button';b.dataset.nc='cal-today';b.textContent='Hoje';next.after(b);}
 section.querySelector('.nc-cal > .nc-muted')?.remove();
 const base=new Date();if(NS.calendar==='month'){base.setDate(1);base.setMonth(base.getMonth()+NS.offset);}else base.setDate(base.getDate()-(base.getDay()+6)%7+NS.offset*7);
 section.querySelectorAll('.nc-day').forEach((day,i)=>{const d=NS.calendar==='month'?new Date(base.getFullYear(),base.getMonth(),i+1):new Date(base.getFullYear(),base.getMonth(),base.getDate()+i);day.classList.toggle('nc-calendar-today',iso(d)===today());if(iso(d)===today())day.setAttribute('aria-current','date');else day.removeAttribute('aria-current');});
 return t.innerHTML;
};

// Janela de trabalho: pendências do cliente e registros do período visível.
const workPeriod=()=>{
 const base=new Date(),offset=Number(NS.offset)||0;
 let start,end;
 if(NS.calendar==='year'){start=new Date(base.getFullYear()+offset,0,1);end=new Date(base.getFullYear()+offset,11,31);}
 else if(NS.calendar==='month'){start=new Date(base.getFullYear(),base.getMonth()+offset,1);end=new Date(start.getFullYear(),start.getMonth()+1,0);}
 else{start=new Date(base.getFullYear(),base.getMonth(),base.getDate()-(base.getDay()+6)%7+offset*7);end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+6);}
 return {start:iso(start),end:iso(end)};
};
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(new Date(v+'T12:00:00').getTime())&&iso(new Date(v+'T12:00:00'))===v;
let workContext=null;
const originalDialog=NC.dialog;
NC.dialog=(...args)=>{document.getElementById('nc-dialog')?.classList.remove('nc-work-modal');workContext=null;return originalDialog(...args);};
const workDraft=()=>{const form=document.querySelector('#nc-dialog .nc-work-new');return {summary:form?.elements.summary.value||'',date:form?.elements.date.value||''};};
NC.workList=(customerId,selectedId,context=null,draft=null)=>{
 const period=context?.period||workPeriod(),client=NS.customers.find(c=>c.id===customerId);
 if(!client)return;
 const all=NS.actions.filter(a=>a.customer_id===customerId&&!a.deleted);
 const planned=all.filter(a=>a.status==='planned').sort((a,b)=>String(a.due_date||'9999').localeCompare(String(b.due_date||'9999')));
 const notes=all.filter(a=>a.status==='done'&&a.type==='other'&&String(a.occurred_at||a.created_at||'').slice(0,10)>=period.start&&String(a.occurred_at||a.created_at||'').slice(0,10)<=period.end).sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||'')));
 const row=a=>`<div class="nc-work-row ${a.id===selectedId?'is-selected':''}" data-action-id="${NC.e(a.id)}"><div class="nc-work-text"><small>${a.status==='planned'?'Agendado · '+(a.due_date?NC.date(a.due_date):'sem data'):(a.due_date?'Concluído · ':'Nota · ')+NC.date(a.occurred_at||a.created_at)}</small><span>${NC.e(a.summary)}</span>${a.details?'<small class="nc-work-details">'+NC.e(a.details)+'</small>':''}</div><input type="checkbox" class="nc-work-check" data-work-complete="${NC.e(a.id)}" ${a.status==='done'?'checked disabled':''} title="${a.status==='done'?'Registro concluído':'Concluir agendamento'}" aria-label="${a.status==='done'?'Registro concluído':'Concluir agendamento'}"><input type="date" class="nc-work-date" data-work-date="${NC.e(a.id)}" value="${a.status==='planned'?NC.e(a.due_date||''):''}" title="${a.status==='planned'?'Reagendar':'Agendar a partir desta nota'}" aria-label="${a.status==='planned'?'Reagendar':'Agendar a partir desta nota'}"></div>`;
 const html=`<p class="nc-work-customer">${NC.e(NC.name(customerId))}</p><div class="nc-work-head"><span>Registro</span><span>Feito</span><span>Data</span></div><div class="nc-work-rows"><h3>Agendamentos em aberto</h3>${planned.length?planned.map(row).join(''):'<p class="nc-work-empty">Nenhum agendamento em aberto.</p>'}<h3>Notas e concluídos · ${NC.date(period.start)} – ${NC.date(period.end)}</h3>${notes.length?notes.map(row).join(''):'<p class="nc-work-empty">Nenhum registro neste período.</p>'}</div><form class="nc-work-new"><textarea name="summary" rows="1" maxlength="160" aria-label="Novo registro" placeholder="Novo registro…" required>${NC.e(draft?.summary||'')}</textarea><input type="date" name="date" aria-label="Data opcional: preenchida agenda; vazia registra nota" title="Com data: agendamento · Sem data: nota" value="${NC.e(draft?.date||'')}"><button type="submit" class="nc-primary" aria-label="Adicionar registro" title="Adicionar registro">+</button></form><small class="nc-work-hint">Com data: agendamento · Sem data: nota</small><small class="nc-work-status" role="status"></small>`;
 NC.dialog('Acompanhamento',html);
 const dlg=document.getElementById('nc-dialog');if(!dlg)return;
 workContext={customerId,period,selectedId};dlg.classList.add('nc-work-modal');dlg.querySelector('footer')?.remove();
 const first=dlg.querySelector('[data-action-id="'+CSS.escape(selectedId||'')+'"]');if(first)first.scrollIntoView({block:'nearest'});
};
NC.task=id=>{const a=NS.actions.find(a=>a.id===id);if(a)NC.workList(a.customer_id,id);};
const workError=error=>{if(NC.isStale?.(error))return;const status=document.querySelector('#nc-dialog .nc-work-status');if(status)status.textContent=error.message||'Não foi possível salvar.';else NC.toast(error.message||'Não foi possível salvar.');};
const saveWorkRow=async(el,patch)=>{
 const context=workContext,dlg=document.getElementById('nc-dialog');if(!context||!dlg?.open||dlg.dataset.workBusy==='true')return;
 const id=el.dataset.workComplete||el.dataset.workDate,a=NS.actions.find(x=>x.id===id&&x.customer_id===context.customerId);if(!a)return;
 const draft=workDraft();dlg.dataset.workBusy='true';const controls=[...dlg.querySelectorAll('input,textarea,button')];controls.forEach(x=>x.disabled=true);
 try{
  const result=await NC.api.guard(_supa.from('crm_actions').update(patch).eq('id',a.id).eq('status',a.status).eq('updated_at',a.updated_at).select().single());
  if(result.error)throw new Error('O registro pode ter sido alterado. Atualize antes de tentar novamente.');
  NS.actions=NS.actions.map(x=>x.id===a.id?result.data:x);NC.render();
  if(dlg.open&&workContext===context)NC.workList(context.customerId,id,context,draft);
 }catch(error){if(el.type==='checkbox')el.checked=false;else el.value=a.status==='planned'?a.due_date||'':'';workError(error);}
 finally{delete dlg.dataset.workBusy;controls.forEach(x=>{if(x.isConnected)x.disabled=x.matches('[data-work-complete]')&&NS.actions.find(a=>a.id===x.dataset.workComplete)?.status==='done';});}
};
document.addEventListener('change',async e=>{
 const el=e.target;if(!el.closest('#nc-dialog.nc-work-modal'))return;
 if(el.dataset.workComplete){e.stopImmediatePropagation();if(el.checked)await saveWorkRow(el,{status:'done',occurred_at:new Date().toISOString()});}
 else if(el.dataset.workDate){e.stopImmediatePropagation();if(!validDate(el.value)){const a=NS.actions.find(a=>a.id===el.dataset.workDate);el.value=a?.status==='planned'?a.due_date||'':'';workError(new Error('Escolha uma data válida.'));return;}await saveWorkRow(el,{status:'planned',due_date:el.value});}
},true);
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form.matches('#nc-dialog .nc-work-new'))return;
 e.preventDefault();e.stopImmediatePropagation();const context=workContext,dlg=document.getElementById('nc-dialog');if(!context||dlg.dataset.workBusy==='true')return;
 const summary=form.elements.summary.value.trim(),date=form.elements.date.value;
 if(!summary||(date&&!validDate(date))){workError(new Error('Preencha o texto e confira a data.'));return;}
 const controls=[...dlg.querySelectorAll('input,textarea,button')];dlg.dataset.workBusy='true';controls.forEach(x=>x.disabled=true);
 try{
  await NC.api.action({customer_id:context.customerId,summary,date:date||null});await NC.reload();
  if(dlg.open&&workContext===context)NC.workList(context.customerId,null,context);
 }catch(error){workError(error);}finally{delete dlg.dataset.workBusy;controls.forEach(x=>{if(x.isConnected)x.disabled=x.matches('[data-work-complete]')&&NS.actions.find(a=>a.id===x.dataset.workComplete)?.status==='done';});}
},true);

const handle=NC.handle;
NC.handle=async b=>{
 const action=b.dataset.nc;
 if(action==='cal-today'){NS.offset=0;const expanded=document.getElementById('nc-dialog')?.classList.contains('nc-calendar-modal');NC.render();if(expanded)NC.openCalendar();return;}
 if(action==='followup-kind'){const form=b.closest('form');form.elements.kind.value=b.dataset.id;form.querySelectorAll('[data-nc=followup-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}
 if(action==='followup-profile'){const c=NS.customers.find(c=>c.id===NS.customer);NC.dialog('Notas do cadastro','<p class="nc-text">'+NC.e(c?.notes||'')+'</p>');return;}
 if(action==='followup-edit'){
  const a=NS.actions.find(a=>a.id===b.dataset.id);if(!a)return;
  NC.dialog('Registro · '+shortDate(a.occurred_at||a.created_at),'<label>Nota<textarea name="summary" maxlength="160" required>'+NC.e(a.summary)+'</textarea></label><p class="nc-text">'+NC.e(a.details||'')+'</p>',async fd=>{
   const summary=String(fd.get('summary')||'').trim();if(!summary)throw new Error('Preencha a nota.');
   const r=await NC.api.guard(_supa.from('crm_actions').update({summary}).eq('id',a.id).eq('updated_at',a.updated_at).select().single());if(r.error)throw new Error('Não foi possível salvar. Confira se outra pessoa alterou este registro.');
   NS.actions=NS.actions.map(x=>x.id===a.id?r.data:x);NC.close();NC.render();
  });return;
 }
 return handle(b);
};
document.addEventListener('submit',async e=>{
 const form=e.target;if(form.id!=='nc-noteform'||!form.classList.contains('nc-followup-form'))return;
 e.preventDefault();e.stopImmediatePropagation();const submit=form.querySelector('[type=submit]');if(submit.disabled)return;
 const f=new FormData(form),summary=String(f.get('summary')||'').trim(),date=String(f.get('date')||''),schedule=f.get('kind')==='agenda',customer_id=NS.customer;
 if(!summary||!/^\d{4}-\d{2}-\d{2}$/.test(date)){NC.toast('Preencha o texto e a data.');return;}
 submit.disabled=true;
 try{const r=await NC.api.guard(_supa.rpc('crm_save_action',{p_customer_id:customer_id,p_type:'other',p_direction:null,p_occurred_at:schedule?null:new Date(date+'T12:00:00').toISOString(),p_summary:schedule?null:summary,p_details:null,p_responsible_user_id:authUser.id,p_next_summary:schedule?summary:null,p_next_due_date:schedule?date:null,p_action_id:null,p_mode:schedule?'schedule':'log',p_project_id:null}));if(r.error)throw r.error;await NC.reload();}catch(error){if(!NC.isStale?.(error))NC.toast(error.message||'Não foi possível salvar.');}finally{submit.disabled=false;}
},true);
})();
