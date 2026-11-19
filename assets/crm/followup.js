/* Acompanhamento do cliente e apresentação unificada das agendas. */
(()=>{
'use strict';
if(NC.followupV63)return;NC.followupV63=true;
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
 old.replaceWith(panel);return t.innerHTML;
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
