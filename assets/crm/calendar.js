/* V47 — calendário ampliado e agenda de clientes em foco. */
(()=>{
'use strict';
if(NC.calendarV47)return;
NC.calendarV47=true;
const focused=id=>Boolean(id)&&(typeof NC.focused==='function'?NC.focused(id):(NC.api.setting('asia').rows||[]).some(r=>r.customer_id===id));
const previousCalendar=NC.calendar;
NC.calendar=history=>{
 const template=document.createElement('template');template.innerHTML=previousCalendar(history);
 const events=new Map(NC.events(history).map(e=>[e.key+'|'+e.id,e]));
 template.content.querySelectorAll('.nc-event').forEach(button=>{
  const event=events.get(button.dataset.kind+'|'+button.dataset.id);
  if(event?.type==='schedule'&&focused(event.customer)){
   button.classList.add('nc-focus-appointment');
   button.title=(button.title||event.label||'Compromisso')+' · Cliente com estrela no SM Foco';
  }
 });
 if(!history){
  const section=template.content.querySelector('.nc-dashboard-calendar');
  if(section){
   section.dataset.calendarExpand='true';
   const button=document.createElement('button');button.type='button';button.dataset.nc='calendar-open';button.className='nc-calendar-expand';button.textContent='⤢';button.title='Ampliar calendário';button.setAttribute('aria-label','Abrir calendário ampliado');
   section.querySelector('.nc-head')?.append(button);
  }
 }
 return template.innerHTML;
};
const previousDialog=NC.dialog;
NC.dialog=(...args)=>{document.getElementById('nc-dialog')?.classList.remove('nc-calendar-modal');return previousDialog(...args);};
NC.openCalendar=()=>{
 if(NS.page!=='dashboard')return;
 const template=document.createElement('template');template.innerHTML=NC.calendar(false);
 const section=template.content.querySelector('.nc-dashboard-calendar');
 section?.removeAttribute('data-calendar-expand');section?.classList.add('nc-calendar-expanded');
 template.content.querySelector('.nc-calendar-expand')?.remove();
 NC.dialog('Agenda',`<div class="nc-calendar-large-content">${template.innerHTML}</div>`);
 const dialog=document.getElementById('nc-dialog');if(!dialog)return;
 dialog.classList.add('nc-calendar-modal');dialog.querySelector('footer')?.remove();
 dialog.addEventListener('close',()=>dialog.classList.remove('nc-calendar-modal'),{once:true});
};
const previousHandle=NC.handle;
NC.handle=async button=>{
 const action=button.dataset.nc;
 if(action==='calendar-open')return NC.openCalendar();
 const dialog=document.getElementById('nc-dialog');
 if(dialog?.open&&dialog.classList.contains('nc-calendar-modal')&&['cal-prev','cal-next','cal-view','month'].includes(action)){
  if(action==='cal-prev')NS.offset--;
  else if(action==='cal-next')NS.offset++;
  else if(action==='cal-view'){NS.calendar=button.dataset.view;NS.offset=0;}
  else{NS.calendar='month';NS.offset=(Number(button.dataset.year)-new Date().getFullYear())*12+Number(button.dataset.month)-new Date().getMonth();}
  NC.render();NC.openCalendar();return;
 }
 return previousHandle(button);
};
document.addEventListener('click',event=>{
 if(!(event.target instanceof Element))return;
 const calendar=event.target.closest('.nc-dashboard-calendar[data-calendar-expand="true"]');
 if(!calendar||NS.page!=='dashboard'||event.target.closest('button,a,input,select,textarea,summary,[data-nc]'))return;
 NC.openCalendar();
});
})();
