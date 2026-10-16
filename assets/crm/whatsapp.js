let CRM_WHATSAPP_API_ENABLED=false;
const META_WHATSAPP_APP_ID='1346176517412643';
const META_WHATSAPP_CONFIG_ID='1015420251544011';
const META_EXPECTED_BUSINESS_ID='1641611699316923';
const META_EXPECTED_WABA_ID='167221385468781';
let crmWaCtx={customerId:null,personId:null,phone:null};
let crmMetaSdkPromise=null;
let crmMetaSdkInitialized=false;
let crmWaSignupSession=null;
let crmWaSignupAuthCode=null;
let crmWaFinalizing=false;

function crmIsWhatsAppOnboardingAdmin(){
  return !!(authUser?.email&&authUser.email.toLowerCase()===FRED_EMAIL);
}

function crmWaSetOnboardingStatus(message,tone='ink3'){
  const el=document.getElementById('crm-wa-onboarding-status');
  if(!el)return;
  el.style.display='block';
  el.style.color=`var(--${tone})`;
  el.textContent=message;
}

function crmWaConfigureOnboardingUi(){
  const controls=document.getElementById('crm-wa-onboarding-controls');
  if(controls)controls.style.display=crmIsWhatsAppOnboardingAdmin()?'block':'none';
  const connectBtn=document.getElementById('crm-wa-onboarding-btn');
  if(connectBtn)connectBtn.style.display=CRM_WHATSAPP_API_ENABLED?'none':'inline-flex';
  const sendBtn=document.getElementById('crm-wa-send-btn');
  if(sendBtn){
    sendBtn.disabled=!CRM_WHATSAPP_API_ENABLED;
    sendBtn.textContent=CRM_WHATSAPP_API_ENABLED?'Enviar WhatsApp':'Aguardando Coexistence';
    sendBtn.title=CRM_WHATSAPP_API_ENABLED?'':'Envio oficial bloqueado até o servidor confirmar o Coexistence.';
  }
}

async function crmWaRefreshConnectionStatus(){
  if(!_supaOK||!authUser)return false;
  try{
    const{data,error}=await NC.api.guard(_supa.functions.invoke('whatsapp-onboarding-complete',{body:{action:'status'}}));
    if(error)throw error;
    CRM_WHATSAPP_API_ENABLED=!!data?.connected;
    crmWaConfigureOnboardingUi();
    if(CRM_WHATSAPP_API_ENABLED){
      const integration=data?.integration||{};
      crmWaSetOnboardingStatus(`WhatsApp conectado: ${integration.display_phone_number||'+55 21 99231-6962'} · WABA ${integration.waba_id||META_EXPECTED_WABA_ID}`,'green');
    }
    return CRM_WHATSAPP_API_ENABLED;
  }catch(e){
    if(NC.isStale(e))return false;
    CRM_WHATSAPP_API_ENABLED=false;
    crmWaConfigureOnboardingUi();
    console.warn('Não foi possível confirmar o estado do WhatsApp',e);
    return false;
  }
}

function crmLoadMetaSdk(){
  const initialize=()=>{
    if(!window.FB)return null;
    if(!crmMetaSdkInitialized){
      // O cookie do Facebook Login pode acionar o fluxo FedCM/OpenID do navegador
      // (scope=openid) antes do Embedded Signup. Esse fluxo não recebe o config_id.
      window.FB.init({appId:META_WHATSAPP_APP_ID,cookie:false,status:false,xfbml:false,version:'v26.0'});
      crmMetaSdkInitialized=true;
    }
    return window.FB;
  };
  if(window.FB)return Promise.resolve(initialize());
  if(crmMetaSdkPromise)return crmMetaSdkPromise;
  crmMetaSdkPromise=new Promise((resolve,reject)=>{
    let settled=false;
    const finish=()=>{
      if(settled||!window.FB)return false;
      try{const fb=initialize();settled=true;clearInterval(poll);clearTimeout(timeout);resolve(fb);return true;}
      catch(e){settled=true;clearInterval(poll);clearTimeout(timeout);crmMetaSdkPromise=null;reject(e);return true;}
    };
    const fail=message=>{
      if(settled)return;settled=true;clearInterval(poll);clearTimeout(timeout);crmMetaSdkPromise=null;reject(new Error(message));
    };
    const previousInit=window.fbAsyncInit;
    window.fbAsyncInit=function(){
      if(typeof previousInit==='function')previousInit();
      finish();
    };
    const poll=setInterval(finish,200);
    const timeout=setTimeout(()=>fail('O SDK da Meta não carregou. Libere popups e bloqueadores para fgta00.github.io e tente novamente.'),12000);
    const existing=document.getElementById('facebook-jssdk');
    if(!existing){
      const script=document.createElement('script');
      script.id='facebook-jssdk';
      script.async=true;
      script.defer=true;
      script.crossOrigin='anonymous';
      script.src='https://connect.facebook.net/pt_BR/sdk.js';
      script.onload=finish;
      script.onerror=()=>fail('Não foi possível carregar o SDK da Meta. Verifique bloqueadores de conteúdo e tente novamente.');
      document.head.appendChild(script);
    }
  });
  return crmMetaSdkPromise;
}

function crmPreloadMetaSdk(){
  crmWaSetOnboardingStatus('Preparando o fluxo oficial da Meta…');
  crmLoadMetaSdk()
    .then(()=>crmWaSetOnboardingStatus('Fluxo da Meta pronto. Clique em “Conectar WhatsApp Business”.','green'))
    .catch(e=>crmWaSetOnboardingStatus(e?.message||'Não foi possível preparar o fluxo da Meta.','red'));
}

function crmWaRenderSignupSession(data){
  crmWaSignupSession=data||{};
  const safeInfo={
    session_id:data?.session_id||data?.sessionId||null,
    waba_id:data?.waba_id||null,
    phone_number_id:data?.phone_number_id||null,
    business_id:data?.business_id||null
  };
  const result=document.getElementById('crm-wa-onboarding-result');
  const copyBtn=document.getElementById('crm-wa-copy-session');
  if(result){result.style.display='block';result.textContent=JSON.stringify(safeInfo,null,2);}
  if(copyBtn)copyBtn.style.display='inline-flex';
  crmWaSetOnboardingStatus('A Meta confirmou a seleção. Finalizando a conexão segura no CRM…');
  crmTryFinalizeWhatsAppOnboarding();
}

async function crmTryFinalizeWhatsAppOnboarding(){
  if(crmWaFinalizing||!crmWaSignupSession||!crmWaSignupAuthCode)return;
  const wabaId=String(crmWaSignupSession.waba_id||'');
  const businessId=String(crmWaSignupSession.business_id||META_EXPECTED_BUSINESS_ID);
  if(wabaId!==META_EXPECTED_WABA_ID||businessId!==META_EXPECTED_BUSINESS_ID){
    crmWaSetOnboardingStatus('A Meta retornou outra WABA ou outro portfólio. Nada foi salvo. Tire um print e não prossiga.','red');
    return;
  }
  crmWaFinalizing=true;
  const btn=document.getElementById('crm-wa-onboarding-btn');
  if(btn){btn.disabled=true;btn.textContent='Finalizando…';}
  crmWaSetOnboardingStatus('Trocando a autorização e assinando a WABA no servidor…');
  try{
    const{data,error}=await NC.api.guard(_supa.functions.invoke('whatsapp-onboarding-complete',{
      body:{action:'complete',code:crmWaSignupAuthCode,session:crmWaSignupSession}
    }));
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.error||'A conexão não foi confirmada pelo servidor.');
    CRM_WHATSAPP_API_ENABLED=true;
    crmWaSignupAuthCode=null;
    crmWaConfigureOnboardingUi();
    const result=document.getElementById('crm-wa-onboarding-result');
    if(result)result.textContent=JSON.stringify(data.integration||{},null,2);
    crmWaSetOnboardingStatus('Coexistence conectado e validado. O WhatsApp oficial está pronto para os testes controlados.','green');
    toastSave('WhatsApp Business conectado');NC.close();NC.render();
  }catch(e){
    if(NC.isStale(e))return;
    let message=e?.message||'Falha ao finalizar o Coexistence.';
    if(e?.context instanceof Response){try{const detail=await e.context.clone().json();message=detail?.error||message;}catch{}}
    crmWaSetOnboardingStatus(`${message} Nada será removido do WhatsApp Business App.`,'red');
    if(btn){btn.disabled=false;btn.textContent='Tentar novamente';}
  }finally{
    crmWaFinalizing=false;
  }
}

function crmHandleWhatsAppSignupMessage(event){
  if(!['https://www.facebook.com','https://web.facebook.com'].includes(event.origin))return;
  let payload=event.data;
  if(typeof payload==='string'){
    try{payload=JSON.parse(payload);}catch{return;}
  }
  if(payload?.type!=='WA_EMBEDDED_SIGNUP')return;
  if(['FINISH','FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'].includes(payload.event))crmWaRenderSignupSession(payload.data);
  else if(payload.event==='CANCEL')crmWaSetOnboardingStatus('Onboarding cancelado antes da conclusão. Nenhuma alteração foi aplicada.','amber');
  else if(payload.event==='ERROR')crmWaSetOnboardingStatus(payload.data?.error_message||'A Meta informou um erro durante o onboarding.','red');
}
window.addEventListener('message',crmHandleWhatsAppSignupMessage);

async function crmStartWhatsAppCoexistence(){
  if(!crmIsWhatsAppOnboardingAdmin()){toastSave('Somente o administrador pode conectar o WhatsApp Business.');return;}
  const btn=document.getElementById('crm-wa-onboarding-btn');
  if(btn){btn.disabled=true;btn.textContent='Abrindo Meta…';}
  crmWaSetOnboardingStatus('Carregando o fluxo oficial da Meta…');
  try{
    const FB=await crmLoadMetaSdk();
    crmWaSignupSession=null;
    crmWaSignupAuthCode=null;
    let answered=false;
    const loginTimeout=setTimeout(()=>{
      if(answered)return;
      crmWaSetOnboardingStatus('Conclua o fluxo na janela da Meta. A conexão será finalizada quando ela retornar a autorização e a sessão.');
    },15000);
    FB.login(response=>{
      answered=true;clearTimeout(loginTimeout);
      if(btn){btn.disabled=false;btn.textContent='Conectar WhatsApp Business';}
      if(response?.authResponse?.code){
        crmWaSignupAuthCode=response.authResponse.code;
        if(!crmWaSignupSession)crmWaSetOnboardingStatus('Autorização recebida. Aguarde a confirmação final da sessão de Coexistence…');
        crmTryFinalizeWhatsAppOnboarding();
      }else{
        crmWaSetOnboardingStatus('A autorização não foi concluída. Você pode tentar novamente sem alterar o WhatsApp atual.','amber');
      }
    },{
      config_id:META_WHATSAPP_CONFIG_ID,
      // Também declaramos os escopos da configuração explicitamente. Assim, mesmo
      // em navegadores que tentem intermediar o login, a Meta não recebe só openid.
      scope:'whatsapp_business_management,whatsapp_business_messaging',
      response_type:'code',
      override_default_response_type:true,
      extras:{
        featureType:'whatsapp_business_app_onboarding',
        sessionInfoVersion:'3',
        version:'v4'
      }
    });
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Conectar WhatsApp Business';}
    crmWaSetOnboardingStatus(e?.message||'Não foi possível abrir o fluxo da Meta.','red');
  }
}

async function crmCopyWhatsAppSignupInfo(){
  if(!crmWaSignupSession)return;
  const safeInfo={
    session_id:crmWaSignupSession.session_id||crmWaSignupSession.sessionId||null,
    waba_id:crmWaSignupSession.waba_id||null,
    phone_number_id:crmWaSignupSession.phone_number_id||null,
    business_id:crmWaSignupSession.business_id||null
  };
  try{await navigator.clipboard.writeText(JSON.stringify(safeInfo,null,2));toastSave('Dados da sessão copiados');}
  catch{toastSave('Não foi possível copiar automaticamente. Selecione os dados exibidos.');}
}


NC.waSetup=()=>{NC.dialog('Conectar WhatsApp Business',`<p>Número atual: +55 21 99231-6962</p><div id="crm-wa-onboarding-controls"><button type="button" id="crm-wa-onboarding-btn" data-nc="wa-start">Conectar WhatsApp Business</button><p id="crm-wa-onboarding-status"></p><pre id="crm-wa-onboarding-result" style="display:none"></pre><button type="button" id="crm-wa-copy-session" data-nc="wa-copy" style="display:none">Copiar IDs da sessão</button></div>`);crmWaRefreshConnectionStatus();};
NC.waSend=async()=>{const p=NS.people.find(p=>p.id===(NS.selectedWa||NS.contact)),el=document.getElementById('nc-wa-draft');if(!p||!el)return;const attachment=NC.waAttachments?.get(p.id);if(!el.value.trim()&&!attachment)return;if(!CRM_WHATSAPP_API_ENABLED)throw new Error('Conecte o WhatsApp antes de enviar.');const key='wa:'+p.id,old=NS.sends.get(key);if(old?.pending||old?.uncertain)throw new Error('Envio aguardando confirmação. Confira a conversa antes de repetir.');const text=el.value.trim(),state={pending:true,uncertain:false,idempotency_key:crypto.randomUUID()};NS.sends.set(key,state);const btn=document.querySelector('[data-nc="wa-send"]');if(btn)btn.disabled=true;try{const result=await NC.api.invoke('whatsapp-send',{customer_id:p.customer_id,person_id:p.id,to_phone:p.phone_normalized||p.phone,message_type:attachment?(attachment.type.startsWith('image/')?'image':'document'):'text',message_body:text,attachment,idempotency_key:state.idempotency_key});if(!result.ok){state.uncertain=true;throw new Error('Envio ainda não confirmado. Confira o WhatsApp.');}el.value='';NS.drafts.delete('wa-draft:'+p.id);NC.waAttachments?.delete(p.id);await NC.api.history(p.customer_id);NC.render();NC.toast('WhatsApp enviado.');}catch(e){state.uncertain=!e.status||e.status>=500;throw e;}finally{state.pending=false;if(btn)btn.disabled=false;}};

// Logout/troca de conta: estado de conexão e sessão de cadastro da Meta não podem sobreviver ao usuário anterior.
NC.waResetSession=()=>{CRM_WHATSAPP_API_ENABLED=false;crmWaSignupSession=null;crmWaSignupAuthCode=null;crmWaFinalizing=false;try{crmWaConfigureOnboardingUi();}catch{}};
