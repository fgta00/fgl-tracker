/* V44 — extensão isolada: fila WhatsApp real e SM Foco. */
(()=>{
'use strict';
if(NC.waTriageV44)return;
NC.waTriageV44=true;
const rpc=async(name,args)=>{const r=await NC.api.guard(_supa.rpc(name,args));if(r.error)throw new Error(r.error.message);return r.data;};
const exact=phone=>(NS.people||[]).filter(p=>!p.deleted&&NS.customers.some(c=>c.id===p.customer_id&&!c.deleted)&&NC.normal(p.phone_normalized||p.phone)===phone);
const customerLabel=c=>(c.trade_name||c.display_name||'Cliente')+' · '+c.id.slice(0,8);
let queueRequest=0;
const searchValue=()=>document.getElementById('nc-wa-triage-search')?.value||'';
NC.waTriage=async(search='',offset=0)=>{
 const sess=NC.session(),request=++queueRequest;
 NC.dialog('Conciliar WhatsApp','<div class="nc-wa-triage"><p role="status">Consultando conversas sem vínculo…</p></div>');
 const dialog=document.getElementById('nc-dialog');
 try{
  const result=await rpc('crm_whatsapp_triage_list',{p_search:search,p_offset:offset});
  if(request!==queueRequest||!NC.live(sess)||!dialog?.open||!dialog.querySelector('.nc-wa-triage'))return;
  const rows=result.rows||[],total=Number(result.total||0);
  NC.dialog('Conciliar WhatsApp',`<div class="nc-wa-triage"><p><b>${total}</b> ${total===1?'número sem vínculo':'números sem vínculo'} no banco · mensagens enviadas e recebidas, incluindo o histórico importado.</p><div class="nc-triage-search"><input id="nc-wa-triage-search" type="search" inputmode="tel" value="${NC.e(search)}" placeholder="Buscar número com país e DDD" aria-label="Buscar número"><button data-nc="wa-triage-search">Buscar</button></div>${rows.length?NC.table(['WhatsApp','Mensagens','Última troca','Conferência',''],rows.map(r=>{const matches=exact(r.phone);return [NC.e('+'+r.phone),`${NC.e(r.messages)}<small>${NC.e(r.inbound)} recebidas · ${NC.e(Number(r.messages)-Number(r.inbound))} enviadas</small>`,`<span>${NC.e(NC.date(r.latest))}</span><small class="nc-triage-preview" title="${NC.e(r.preview||'')}">${NC.e(r.preview||'')}</small>`,matches.length===1?`${NC.e(matches[0].name)}<small>${NC.e(NC.name(matches[0].customer_id))}</small>`:matches.length>1?'Telefone duplicado · revisar':'Escolher cliente e contato',`<button data-nc="wa-triage-choose" data-phone="${NC.e(r.phone)}">Conferir</button>`];})): '<p>Nenhuma conversa sem vínculo neste filtro.</p>'}<div class="nc-triage-pages"><button data-nc="wa-triage-page" data-offset="${Math.max(0,offset-50)}" ${offset===0?'disabled':''}>Anterior</button><span>${total?offset+1:0}–${offset+rows.length} de ${total}</span><button data-nc="wa-triage-page" data-offset="${offset+50}" ${offset+rows.length>=total?'disabled':''}>Próxima</button></div><p class="nc-muted">Correspondências são sugestões. Cada vínculo exige conferência; nenhum cliente é criado automaticamente. O estado de leitura permanece próprio do CRM.</p></div>`);
 }catch(e){if(request!==queueRequest||!NC.live(sess)||NC.isStale(e))return;NC.dialog('Conciliar WhatsApp',`<div class="nc-wa-triage"><p>Não foi possível consultar a fila: ${NC.e(e.message)}</p><p class="nc-muted">Confira se o SQL V44 já foi instalado no Supabase.</p><button data-nc="wa-triage">Tentar novamente</button></div>`);}
};
NC.waTriageChoose=phone=>{
 queueRequest++;
 const matches=exact(phone),customers=NS.customers.filter(c=>!c.deleted).sort((a,b)=>customerLabel(a).localeCompare(customerLabel(b),'pt-BR'));
 const suggested=matches.length===1?customers.find(c=>c.id===matches[0].customer_id):null;
 NC.dialog('WhatsApp · +'+phone,`<div class="nc-wa-triage"><p>Escolha o cliente ao qual esta conversa pertence.</p>${matches.length?`<p class="nc-muted">${matches.length>1?'Telefone presente em múltiplos contatos. Resolva a duplicidade no cadastro antes de vincular.':'Correspondência exata encontrada:'} ${matches.map(p=>NC.e(p.name)+' · '+NC.e(NC.name(p.customer_id))).join('; ')}</p>`:''}<label>Cliente<input id="nc-wa-triage-customer" list="nc-wa-customer-options" value="${NC.e(suggested?customerLabel(suggested):'')}" placeholder="Digite o nome e selecione na lista" autocomplete="off"></label><datalist id="nc-wa-customer-options">${customers.map(c=>`<option value="${NC.e(customerLabel(c))}"></option>`).join('')}</datalist><p><button class="nc-primary" data-nc="wa-triage-contact" data-phone="${NC.e(phone)}">Escolher contato</button> <button data-nc="wa-triage">Voltar à fila</button></p><p class="nc-muted">Se o cliente ainda não existe, cadastre-o em Clientes e depois retorne a esta fila.</p><button data-nc="new-customer">Cadastrar cliente</button></div>`);
};
NC.waTriageContact=(phone,customerId)=>{
 const customer=NS.customers.find(c=>c.id===customerId&&!c.deleted);if(!customer)throw new Error('Selecione um cliente da lista.');
 const sess=NC.session(),contacts=NS.people.filter(p=>p.customer_id===customerId&&!p.deleted),matches=exact(phone),suggested=matches.length===1&&matches[0].customer_id===customerId?matches[0].id:'';
 NC.dialog('Vincular WhatsApp',`<div class="nc-wa-triage"><p><b>+${NC.e(phone)}</b> → <b>${NC.e(NC.name(customerId))}</b></p><label>Contato<select name="person_id" id="nc-wa-triage-person">${NC.options(contacts.map(p=>[p.id,p.name+(p.phone?' · '+p.phone:' · sem telefone')]),suggested,'Criar novo contato neste cliente')}</select></label><label id="nc-wa-triage-name-label" ${suggested?'hidden':''}>Nome do novo contato<input name="contact_name" maxlength="200" autocomplete="off" ${suggested?'':'required'}></label><p class="nc-muted">Ao confirmar, as mensagens desse número serão vinculadas a este contato e cliente. Conteúdo e anexos serão preservados. Um telefone já preenchido com outro número não será substituído.</p><label class="nc-triage-confirm"><input type="checkbox" name="confirmed" required> Conferi o número e o cliente.</label></div>`,async fd=>{
  if(!NC.live(sess))throw NC.stale();
  if(!fd.get('confirmed'))throw new Error('Confirme que conferiu o número e o cliente.');
  const personId=String(fd.get('person_id')||''),name=String(fd.get('contact_name')||'').trim();
  if(!personId&&!name)throw new Error('Informe o nome do novo contato.');
  const result=await rpc('crm_whatsapp_triage_link',{p_phone:phone,p_customer_id:customerId,p_person_id:personId||null,p_contact_name:personId?null:name});
  if(!NC.live(sess))throw NC.stale();
  NC.close();
  try{await NC.api.load();if(!NC.live(sess))return;await NC.openCustomer(customerId);if(!NC.live(sess))return;NS.contact=result.person_id;NS.selectedWa=result.person_id;NC.render();NC.toast(result.linked+' mensagens vinculadas. Conversa disponível na ficha do cliente.');}
  catch(e){if(!NC.live(sess)||NC.isStale(e))return;NC.toast('Vínculo salvo no banco. Reabra a ficha para carregar a conversa: '+e.message);}
 });
 document.getElementById('nc-dialogform')?.querySelector('footer button.nc-primary')?.replaceChildren(document.createTextNode('Confirmar vínculo'));
 const select=document.getElementById('nc-wa-triage-person');
 select?.addEventListener('change',()=>{const label=document.getElementById('nc-wa-triage-name-label'),input=label?.querySelector('input');if(label)label.hidden=Boolean(select.value);if(input)input.required=!select.value;});
};
const previousHandle=NC.handle;
NC.handle=async b=>{
 switch(b.dataset.nc){
  case 'wa-triage':return NC.waTriage();
  case 'wa-triage-search':return NC.waTriage(searchValue(),0);
  case 'wa-triage-page':return NC.waTriage(searchValue(),Number(b.dataset.offset)||0);
  case 'wa-triage-choose':return NC.waTriageChoose(b.dataset.phone);
  case 'wa-triage-contact':{const value=document.getElementById('nc-wa-triage-customer')?.value;const c=NS.customers.find(c=>!c.deleted&&customerLabel(c)===value);if(!c)throw new Error('Escolha um cliente da lista de sugestões.');return NC.waTriageContact(b.dataset.phone,c.id);}
  default:return previousHandle(b);
 }
};
const previousFocus=NC.focusDialog;
NC.focusDialog=()=>{previousFocus();document.querySelectorAll('#nc-dialog .nc-focus-link').forEach(el=>el.title=el.textContent.trim());};
})();
