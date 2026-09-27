/* ============================================================
   ShiftLedger — data layer (localStorage)
   ============================================================ */
const DB_KEYS = { users:'sl_users', jobs:'sl_jobs', apps:'sl_applications', session:'sl_session', messages:'sl_messages', documents:'sl_documents', time:'sl_time', notifications:'sl_notifications', shifts:'sl_shifts', ratings:'sl_ratings', audit:'sl_audit', liveChat:'sl_livechat', support:'sl_support' };

function load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

function seedIfEmpty(){
  if(load(DB_KEYS.users, null)) return;
  const users = [
    { id:'u_emp1', role:'employer', name:'Harbor Logistics Co.', email:'employer@demo.com', password:'demo' },
    { id:'u_emp2', role:'employer', name:'BlueLeaf Events Staffing', email:'events@demo.com', password:'demo' },
    { id:'u_app1', role:'applicant', name:'Jordan Reyes', email:'contractor@demo.com', password:'demo', phone:'(252) 555-0148', skills:['forklift cert','warehouse'], bio:'Available immediately, 1st/2nd shift.', availability:['Mon','Tue','Wed','Thu','Fri'], references:[{name:'Pat Alvarez', phone:'(252) 555-0110', relation:'Former Supervisor, Coastal Freight'}], bankLast4:'4821' },
    { id:'u_app2', role:'applicant', name:'Taylor Brooks', email:'taylor@demo.com', password:'demo', phone:'(252) 555-0199', skills:['event setup','customer service'], bio:'Weekends only.', availability:['Sat','Sun'], references:[], bankLast4:'' }
  ];
  const jobs = [
    { id:uid('job'), employerId:'u_emp1', title:'Warehouse Associate — Night Shift', location:'Greenville, NC', pay:'$19/hr', billRate:'$27/hr', type:'Temporary', desc:'Pick/pack and pallet loading, 6pm–2am. Steel-toe boots required.', tags:['forklift','overnight','lifting 50lbs'], status:'open', createdAt: Date.now()-86400000*3 },
    { id:uid('job'), employerId:'u_emp1', title:'Forklift Operator', location:'Winterville, NC', pay:'$21/hr', billRate:'$30/hr', type:'Contract', desc:'Certified forklift operator needed for a 6-week inventory contract.', tags:['forklift cert','inventory'], status:'open', createdAt: Date.now()-86400000*2 },
    { id:uid('job'), employerId:'u_emp2', title:'Event Setup Crew', location:'Greenville, NC', pay:'$17/hr', billRate:'$24/hr', type:'1099 Independent Contractor', desc:'Load-in/load-out for weekend conference events. Flexible weekend shifts.', tags:['event setup','weekends'], status:'open', createdAt: Date.now()-86400000 },
    { id:uid('job'), employerId:'u_emp2', title:'Registration Desk Staff', location:'Greenville, NC', pay:'$16/hr', billRate:'$23/hr', type:'Temp-to-Hire', desc:'Front-of-house check-in for a 3-day conference. Customer service experience preferred.', tags:['customer service','front desk'], status:'filled', createdAt: Date.now()-86400000*6 }
  ];
  const apps = [
    { id:uid('app'), jobId:jobs[0].id, applicantId:'u_app1', status:'reviewing', note:'Available to start Monday.', appliedAt: Date.now()-86400000*2 },
    { id:uid('app'), jobId:jobs[2].id, applicantId:'u_app2', status:'submitted', note:'Have my own transportation.', appliedAt: Date.now()-3600000*10 },
    { id:uid('app'), jobId:jobs[3].id, applicantId:'u_app2', status:'placed', note:'', appliedAt: Date.now()-86400000*5 }
  ];
  save(DB_KEYS.users, users);
  save(DB_KEYS.jobs, jobs);
  save(DB_KEYS.apps, apps);

  // Demo message thread + a completed timesheet for the already-placed application
  const placedApp = apps.find(a=>a.status==='placed');
  save(DB_KEYS.messages, [
    { id:uid('msg'), applicationId:placedApp.id, senderId:'u_emp2', senderRole:'employer', text:'Welcome aboard — please plan to clock in at 8am on your first day.', sentAt: Date.now()-86400000*4 },
    { id:uid('msg'), applicationId:placedApp.id, senderId:'u_app2', senderRole:'applicant', text:'Sounds good, see you then!', sentAt: Date.now()-86400000*4 + 600000 }
  ]);
  save(DB_KEYS.time, [
    { id:uid('time'), applicationId:placedApp.id, applicantId:'u_app2', jobId:placedApp.jobId, clockIn: Date.now()-86400000*3, clockOut: Date.now()-86400000*3+7*3600000, status:'approved', invoiced:false }
  ]);
  save(DB_KEYS.documents, []);
  save(DB_KEYS.shifts, [
    { id:uid('shift'), applicationId:placedApp.id, jobId:placedApp.jobId, applicantId:'u_app2', date: new Date(Date.now()+86400000*2).toISOString().slice(0,10), startTime:'08:00', endTime:'16:00', status:'scheduled', note:'' }
  ]);
  save(DB_KEYS.ratings, [
    { id:uid('rate'), applicationId:placedApp.id, raterId:'u_emp2', raterRole:'employer', rateeId:'u_app2', stars:5, comment:'On time and great attitude.', createdAt: Date.now()-86400000*3 }
  ]);
  save(DB_KEYS.notifications, [
    { id:uid('note'), userId:'u_app2', type:'rating', text:'BlueLeaf Events Staffing rated your shift 5 stars.', relatedId:placedApp.id, createdAt: Date.now()-86400000*3, read:false }
  ]);
  save(DB_KEYS.audit, [
    { id:uid('aud'), applicationId:placedApp.id, actor:'BlueLeaf Events Staffing', action:'Marked application as Placed', timestamp: Date.now()-86400000*5 }
  ]);
}
seedIfEmpty();

// EDIT THIS if the IT Support Ticket System file moves to a different path on your machine:
const IT_TICKET_SYSTEM_URL = 'file:///C:/Users/Kia/Desktop/Software/ITSupport.html';

let session = load(DB_KEYS.session, null);
let pendingAuthRole = 'employer';
let authMode = 'login';

/* ============================================================
   Utilities
   ============================================================ */
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}
function timeAgo(ts){
  const mins = Math.floor((Date.now()-ts)/60000);
  if(mins < 60) return mins+'m ago';
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs+'h ago';
  return Math.floor(hrs/24)+'d ago';
}
function statusStamp(status){
  const map = { submitted:'Submitted', reviewing:'Reviewing', interview:'Interview', placed:'Placed', rejected:'Not Selected' };
  return `<span class="stamp-badge stamp-${status}">${map[status]||status}</span>`;
}
function getUser(id){ return load(DB_KEYS.users, []).find(u=>u.id===id); }
function getJob(id){ return load(DB_KEYS.jobs, []).find(j=>j.id===id); }
function getApplication(id){ return load(DB_KEYS.apps, []).find(a=>a.id===id); }
function parsePayRate(payStr){ const m = (payStr||'').match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
function formatHMS(ms){
  const totalSec = Math.floor(ms/1000);
  const h = String(Math.floor(totalSec/3600)).padStart(2,'0');
  const m = String(Math.floor((totalSec%3600)/60)).padStart(2,'0');
  const s = String(totalSec%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}
function formatDateTime(ts){
  return new Date(ts).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
function otherPartyName(application){
  const job = getJob(application.jobId);
  if(!job) return 'Employer';
  if(session.role === 'employer') return getUser(application.applicantId)?.name || 'Applicant';
  return getUser(job.employerId)?.name || 'Employer';
}

/* ============================================================
   Navigation
   ============================================================ */
function showView(name){
  document.querySelectorAll('main > section').forEach(s=>s.classList.add('hidden'));
  document.getElementById('view-'+name).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`.nav-link[data-nav="${name}"]`);
  if(btn) btn.classList.add('active');
  if(name==='employer') renderEmployerPortal();
  if(name==='applicant') renderApplicantPortal();
  if(name==='landing') renderLanding();
  window.scrollTo(0,0);
}
document.querySelectorAll('.nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=> showView(btn.dataset.nav));
});

function refreshHeader(){
  const empBtn = document.getElementById('nav-employer');
  const appBtn = document.getElementById('nav-applicant');
  const chip = document.getElementById('sessionChip');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginBtn = document.getElementById('loginOpenBtn');
  const bellWrap = document.getElementById('bellWrap');
  empBtn.classList.add('hidden'); appBtn.classList.add('hidden');
  if(session){
    chip.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    bellWrap.classList.remove('hidden');
    chip.textContent = `${session.name} · ${session.role === 'employer' ? 'Employer' : 'Contractor'}`;
    if(session.role==='employer') empBtn.classList.remove('hidden');
    if(session.role==='applicant') appBtn.classList.remove('hidden');
    document.getElementById('botFab').classList.toggle('hidden', session.role !== 'applicant');
    document.getElementById('employerBotFab').classList.toggle('hidden', session.role !== 'employer');
    document.getElementById('itSupportBtn').classList.toggle('hidden', session.role !== 'employer');
    renderBell();
  } else {
    chip.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    bellWrap.classList.add('hidden');
    document.getElementById('botFab').classList.add('hidden');
    document.getElementById('employerBotFab').classList.add('hidden');
    document.getElementById('itSupportBtn').classList.add('hidden');
  }
}
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  session = null; save(DB_KEYS.session, null);
  refreshHeader(); showView('landing'); toast('Logged out.');
});
document.getElementById('loginOpenBtn').addEventListener('click', ()=> openAuth('employer'));

/* ============================================================
   Auth Modal
   ============================================================ */
function openAuth(role){
  pendingAuthRole = role;
  document.getElementById('authTitle').textContent = role==='employer' ? 'Employer Portal' : 'Contractor / Employee Portal';
  document.getElementById('authModal').classList.add('show');
  setAuthMode('login');
}
function closeAuth(){ document.getElementById('authModal').classList.remove('show'); document.getElementById('authForm').reset(); }
function setAuthMode(mode){
  authMode = mode;
  document.getElementById('modeLogin').classList.toggle('active', mode==='login');
  document.getElementById('modeRegister').classList.toggle('active', mode==='register');
  document.getElementById('regNameField').style.display = mode==='register' ? 'block' : 'none';
}
document.getElementById('authForm').addEventListener('submit', function(e){
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  let users = load(DB_KEYS.users, []);

  if(authMode === 'login'){
    const user = users.find(u=>u.email.toLowerCase()===email && u.password===password);
    if(!user){ toast('No matching account. Check email/password, or register.'); return; }
    if(user.role !== pendingAuthRole){ toast(`That account is registered as ${user.role==='employer'?'an Employer':'a Contractor'}. Use the matching portal.`); return; }
    session = { id:user.id, name:user.name, role:user.role, email:user.email };
  } else {
    if(users.some(u=>u.email.toLowerCase()===email)){ toast('An account with that email already exists.'); return; }
    if(!name){ toast('Please enter a name.'); return; }
    const newUser = { id: uid('u'), role: pendingAuthRole, name, email, password, skills:[], phone:'', bio:'' };
    users.push(newUser); save(DB_KEYS.users, users);
    session = { id:newUser.id, name:newUser.name, role:newUser.role, email:newUser.email };
    toast('Account created.');
  }
  save(DB_KEYS.session, session);
  closeAuth(); refreshHeader(); showView(session.role);
});

/* ============================================================
   Landing view
   ============================================================ */
function renderLanding(){
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.status==='open').sort((a,b)=>b.createdAt-a.createdAt);
  const apps = load(DB_KEYS.apps, []);
  const employers = load(DB_KEYS.users, []).filter(u=>u.role==='employer');

  document.getElementById('landingStats').innerHTML = `
    <div class="stat"><div class="num">${jobs.length}</div><div class="label">Open Work Orders</div></div>
    <div class="stat"><div class="num">${employers.length}</div><div class="label">Employers on Desk</div></div>
    <div class="stat"><div class="num">${apps.length}</div><div class="label">Applications Filed</div></div>
    <div class="stat"><div class="num">${apps.filter(a=>a.status==='placed').length}</div><div class="label">Placements Made</div></div>
  `;

  const container = document.getElementById('landingJobs');
  if(jobs.length===0){ container.innerHTML = `<div class="empty-state"><div class="glyph">&#128203;</div>No open work orders right now. Check back soon.</div>`; return; }
  container.innerHTML = jobs.map(j=>{
    const emp = getUser(j.employerId);
    return `<div class="ticket">
      <div class="ticket-top">
        <div>
          <h3>${j.title}</h3>
          <div class="ticket-meta">${emp?emp.name:'Employer'} · ${j.location} · ${j.pay} · ${j.type}</div>
        </div>
        <span class="stamp-badge stamp-open">Open</span>
      </div>
      <div class="ticket-desc">${j.desc}</div>
      <div class="ticket-tags">${(j.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="ticket-actions"><button class="btn btn-primary btn-sm" onclick="openAuth('applicant')">Apply as Contractor</button></div>
    </div>`;
  }).join('');
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function addNotification(userId, type, text, relatedId){
  const notes = load(DB_KEYS.notifications, []);
  notes.push({ id: uid('note'), userId, type, text, relatedId, createdAt: Date.now(), read:false });
  save(DB_KEYS.notifications, notes);
  if(session && session.id===userId) renderBell();
}
function renderBell(){
  if(!session) return;
  const notes = load(DB_KEYS.notifications, []).filter(n=>n.userId===session.id).sort((a,b)=>b.createdAt-a.createdAt);
  const unread = notes.filter(n=>!n.read).length;
  document.getElementById('bellDot').classList.toggle('hidden', unread===0);
  const list = document.getElementById('bellList');
  if(notes.length===0){ list.innerHTML = `<div class="note-item">No notifications yet.</div>`; return; }
  list.innerHTML = notes.slice(0,25).map(n=>`
    <div class="note-item ${n.read?'':'unread'}">${n.text}<div class="note-time">${timeAgo(n.createdAt)}</div></div>
  `).join('');
}
document.getElementById('bellBtn').addEventListener('click', ()=>{
  const panel = document.getElementById('bellPanel');
  panel.classList.toggle('show');
  if(panel.classList.contains('show')){
    const notes = load(DB_KEYS.notifications, []).map(n=> n.userId===session.id ? {...n, read:true} : n);
    save(DB_KEYS.notifications, notes);
    renderBell();
  }
});
document.addEventListener('click', (e)=>{
  const wrap = document.getElementById('bellWrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('bellPanel').classList.remove('show');
});

/* ============================================================
   AUDIT LOG
   ============================================================ */
function addAudit(applicationId, actor, action){
  const log = load(DB_KEYS.audit, []);
  log.push({ id: uid('aud'), applicationId, actor, action, timestamp: Date.now() });
  save(DB_KEYS.audit, log);
}
function renderAuditSnippet(applicationId){
  const entries = load(DB_KEYS.audit, []).filter(a=>a.applicationId===applicationId).sort((a,b)=>b.timestamp-a.timestamp);
  if(entries.length===0) return '';
  return `<div class="audit-log">${entries.slice(0,5).map(a=>`<div class="aud-entry"><b>${a.actor}</b> — ${a.action} · ${timeAgo(a.timestamp)}</div>`).join('')}</div>`;
}

/* ============================================================
   CHAT / MESSAGING (per-application thread)
   ============================================================ */
let currentChatAppId = null;

function openChat(applicationId){
  currentChatAppId = applicationId;
  const app = getApplication(applicationId);
  const job = getJob(app.jobId);
  document.getElementById('chatTitle').textContent = otherPartyName(app);
  document.getElementById('chatSub').textContent = job ? `Re: ${job.title}` : '';
  document.getElementById('quickReplyRow').classList.toggle('hidden', session.role !== 'employer');
  document.getElementById('linkInputRow').classList.remove('show');
  renderChatLog();
  document.getElementById('chatModal').classList.add('show');
  document.getElementById('chatInput').focus();
}
function closeChat(){ document.getElementById('chatModal').classList.remove('show'); currentChatAppId = null; }
function escapeHtml(str){ const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function renderChatLog(){
  const log = document.getElementById('chatLog');
  const msgs = load(DB_KEYS.messages, []).filter(m=>m.applicationId===currentChatAppId).sort((a,b)=>a.sentAt-b.sentAt);
  if(msgs.length===0){ log.innerHTML = `<div class="chat-empty">No messages yet. Say hello below.</div>`; return; }
  log.innerHTML = msgs.map(m=>{
    const mine = m.senderId === session.id;
    const isBot = m.senderId === 'bot';
    return `<div class="msg ${isBot ? 'them' : (mine?'me':'them')}">${isBot ? '<b>Assistant:</b> ' : ''}${m.text}<span class="meta">${formatDateTime(m.sentAt)}</span></div>`;
  }).join('');
  log.scrollTop = log.scrollHeight;
}
function sendChatMessage(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text || !currentChatAppId) return;
  const messages = load(DB_KEYS.messages, []);
  messages.push({ id: uid('msg'), applicationId: currentChatAppId, senderId: session.id, senderRole: session.role, text: escapeHtml(text), sentAt: Date.now() });
  save(DB_KEYS.messages, messages);
  const app = getApplication(currentChatAppId);
  const job = getJob(app.jobId);
  const recipientId = session.role==='employer' ? app.applicantId : job.employerId;
  addNotification(recipientId, 'message', `${session.name}: ${text.slice(0,60)}${text.length>60?'…':''}`, currentChatAppId);
  input.value = '';
  renderChatLog();
}
document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); sendChatMessage(); }});
function unreadBadge(applicationId){
  const msgs = load(DB_KEYS.messages, []).filter(m=>m.applicationId===applicationId);
  if(msgs.length===0) return '';
  const lastFromOther = msgs.filter(m=>m.senderId!==session.id).slice(-1)[0];
  return lastFromOther ? '<span class="msg-dot"></span>' : '';
}

/* ============================================================
   CHATBOT (Contractor Portal) + LIVE CHAT ESCALATION
   ============================================================ */
let botPickedApplicationId = null;

function openBot(){
  document.getElementById('botModal').classList.add('show');
  botStepRoot();
}
function closeBot(){ document.getElementById('botModal').classList.remove('show'); }

function botClear(){ document.getElementById('botLog').innerHTML = ''; }
function botSay(text){
  const log = document.getElementById('botLog');
  log.insertAdjacentHTML('beforeend', `<div class="bot-msg">${text}</div>`);
  log.scrollTop = log.scrollHeight;
}
function botUserSay(text){
  const log = document.getElementById('botLog');
  log.insertAdjacentHTML('beforeend', `<div class="bot-msg user">${text}</div>`);
  log.scrollTop = log.scrollHeight;
}
function botOptions(options){
  // options: [{label, onClick}]
  const log = document.getElementById('botLog');
  const wrap = document.createElement('div');
  wrap.className = 'bot-options';
  options.forEach(o=>{
    const btn = document.createElement('button');
    btn.className = 'bot-opt-btn';
    btn.textContent = o.label;
    btn.onclick = ()=>{ botUserSay(o.label); o.onClick(); };
    wrap.appendChild(btn);
  });
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function botStepRoot(){
  botClear();
  botSay("Hi! I'm the ShiftLedger Assistant. I can look up your applications, shifts, and pay, or connect you with your employer. What do you need?");
  botOptions([
    { label:'Check my application status', onClick: botCheckStatus },
    { label:"When's my next shift?", onClick: botNextShift },
    { label:'Have I been paid?', onClick: botPayStatus },
    { label:'How do I upload documents?', onClick: botUploadHelp },
    { label:'Talk to my employer', onClick: botPickApplication }
  ]);
}
function botFollowUp(){
  botOptions([
    { label:'Ask something else', onClick: botStepRoot },
    { label:'Talk to my employer', onClick: botPickApplication }
  ]);
}
function botCheckStatus(){
  const apps = load(DB_KEYS.apps, []).filter(a=>a.applicantId===session.id);
  if(apps.length===0){ botSay("You haven't applied to any jobs yet — check the Browse Jobs tab to get started."); }
  else {
    botSay(apps.map(a=>{ const job = getJob(a.jobId); return `<b>${job?job.title:'—'}</b>: ${PIPE_LABELS[a.status]||a.status}${a.interviewAt?` (interview: ${a.interviewAt})`:''}`; }).join('<br>'));
  }
  botFollowUp();
}
function botNextShift(){
  const shifts = load(DB_KEYS.shifts, []).filter(s=>s.applicantId===session.id && s.status==='scheduled').sort((a,b)=>a.date.localeCompare(b.date));
  if(shifts.length===0){ botSay("You don't have any upcoming shifts scheduled right now."); }
  else {
    const s = shifts[0]; const job = getJob(s.jobId);
    botSay(`Your next shift is <b>${job?job.title:'—'}</b> on ${s.date}, ${s.startTime}–${s.endTime}.`);
  }
  botFollowUp();
}
function botPayStatus(){
  const entries = load(DB_KEYS.time, []).filter(t=>t.applicantId===session.id).sort((a,b)=>b.clockIn-a.clockIn);
  if(entries.length===0){ botSay("You don't have any logged shifts yet — clock in from the Time Clock tab once you're placed."); }
  else {
    const t = entries[0];
    const map = { active:"still clocked in", pending_approval:"submitted and waiting on employer approval", approved:"approved — payment is queued", paid:"paid — check your records under Time Clock" };
    botSay(`Your most recent shift (${formatDateTime(t.clockIn)}) is: <b>${map[t.status]||t.status}</b>.`);
  }
  botFollowUp();
}
function botUploadHelp(){
  botSay('Go to the <b>Documents</b> tab in your portal, click the upload area, and choose a file (resume, ID, certifications, or tax forms). Employers you\'ve applied to can view what you upload.');
  botFollowUp();
}
function botPickApplication(){
  botClear();
  const apps = load(DB_KEYS.apps, []).filter(a=>a.applicantId===session.id);
  if(apps.length===0){ botSay("You don't have any applications yet, so there's no employer to connect you with. Apply to a job first!"); botOptions([{label:'Back to menu', onClick: botStepRoot}]); return; }
  botSay('Which application is this about?');
  botOptions(apps.map(a=>{
    const job = getJob(a.jobId); const emp = job ? getUser(job.employerId) : null;
    return { label: `${job?job.title:'—'} (${emp?emp.name:'Employer'})`, onClick: ()=>{ botPickedApplicationId = a.id; botPickReason(); } };
  }));
}
function botPickReason(){
  botClear();
  botSay("Got it. What's this about? I'll flag it for your employer if I can't help directly.");
  botOptions([
    { label:'Schedule an appointment', onClick: ()=> botEscalate('Schedule an appointment') },
    { label:'Payroll question', onClick: ()=> botEscalate('Payroll question') },
    { label:'New job opportunities', onClick: ()=> botEscalate('New job opportunities') },
    { label:'Resume & cover letter services', onClick: ()=> botEscalate('Resume & cover letter services') },
    { label:'Other', onClick: ()=> botEscalate('Other') }
  ]);
}
function botEscalate(reason){
  botClear();
  const app = getApplication(botPickedApplicationId);
  const job = getJob(app.jobId);
  const employer = getUser(job.employerId);
  const requests = load(DB_KEYS.liveChat, []);
  requests.push({ id: uid('lc'), applicationId: app.id, contractorId: session.id, employerId: employer.id, reason, status:'pending', createdAt: Date.now() });
  save(DB_KEYS.liveChat, requests);
  addAudit(app.id, session.name, `Requested live chat with employer — ${reason}`);
  addNotification(employer.id, 'livechat', `${session.name} needs to chat with you about: ${reason}. Respond in the message thread when ready.`, app.id);
  const messages = load(DB_KEYS.messages, []);
  messages.push({ id: uid('msg'), applicationId: app.id, senderId:'bot', senderRole:'bot', text: `🤖 ${session.name} requested a live chat regarding: <b>${reason}</b>. The assistant wasn't able to fully resolve this — please follow up here.`, sentAt: Date.now() });
  save(DB_KEYS.messages, messages);
  botSay(`I've let <b>${employer.name}</b> know — they'll respond right in your message thread for this job. You can check back anytime.`);
  botOptions([
    { label:'Open the chat thread now', onClick: ()=>{ closeBot(); openChat(app.id); } },
    { label:'Back to menu', onClick: botStepRoot }
  ]);
}

/* ---------- Employer: Live Chat Requests + Quick Replies ---------- */
function renderLiveChatRequests(){
  const box = document.getElementById('liveChatRequestsList');
  const panel = document.getElementById('liveChatPanel');
  const requests = load(DB_KEYS.liveChat, []).filter(r=>r.employerId===session.id && r.status==='pending').sort((a,b)=>b.createdAt-a.createdAt);
  if(requests.length===0){ panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  box.innerHTML = requests.map(r=>{
    const contractor = getUser(r.contractorId); const job = getJob(getApplication(r.applicationId)?.jobId);
    return `<div class="livechat-card">
      <div class="who">${contractor?contractor.name:'Contractor'}</div>
      <div class="why">Re: ${job?job.title:'a posting'} — ${r.reason} · ${timeAgo(r.createdAt)}</div>
      <div class="ticket-actions">
        <button class="btn btn-primary btn-sm" onclick="respondToLiveChat('${r.id}', true)">Respond Now</button>
        <button class="btn btn-ghost btn-sm" onclick="respondToLiveChat('${r.id}', false)">Respond Later</button>
      </div>
    </div>`;
  }).join('');
}
function respondToLiveChat(requestId, now){
  const requests = load(DB_KEYS.liveChat, []);
  const r = requests.find(x=>x.id===requestId);
  r.status = now ? 'responded' : 'later';
  save(DB_KEYS.liveChat, requests);
  renderLiveChatRequests();
  if(now) openChat(r.applicationId);
  else toast('No problem — it\'ll stay available from that application\'s message thread.');
}

function sendQuickReply(type){
  if(!currentChatAppId) return;
  const canned = {
    payroll: "Thanks for reaching out about payroll — could you tell me which shift or pay period this is about?",
    jobs: "We've got new openings that might be a good fit — check the Browse Jobs tab, or let me know what you're looking for and I'll flag good matches.",
    resume: "We offer resume and cover letter review — want me to send over some quick tips, or connect you with our review service?",
    other: null
  };
  if(canned[type] === null){ document.getElementById('chatInput').focus(); return; }
  const messages = load(DB_KEYS.messages, []);
  messages.push({ id: uid('msg'), applicationId: currentChatAppId, senderId: session.id, senderRole: session.role, text: canned[type], sentAt: Date.now() });
  save(DB_KEYS.messages, messages);
  const app = getApplication(currentChatAppId);
  addNotification(app.applicantId, 'message', `${session.name}: ${canned[type].slice(0,60)}…`, currentChatAppId);
  renderChatLog();
}
function toggleScheduleInput(){
  document.getElementById('linkInputRow').classList.toggle('show');
}
function sendScheduleLink(){
  const input = document.getElementById('scheduleLinkInput');
  const link = input.value.trim();
  if(!link || !currentChatAppId) return;
  const text = `Let's connect — please pick a time here: ${link}`;
  const messages = load(DB_KEYS.messages, []);
  messages.push({ id: uid('msg'), applicationId: currentChatAppId, senderId: session.id, senderRole: session.role, text, sentAt: Date.now() });
  save(DB_KEYS.messages, messages);
  const app = getApplication(currentChatAppId);
  addNotification(app.applicantId, 'message', `${session.name} sent a scheduling link.`, currentChatAppId);
  input.value = '';
  document.getElementById('linkInputRow').classList.remove('show');
  renderChatLog();
}

/* ============================================================
   CHATBOT (Employer Portal)
   ============================================================ */
let empBotPickedApplicationId = null;

function openEmployerBot(){
  document.getElementById('employerBotModal').classList.add('show');
  empBotStepRoot();
}
function closeEmployerBot(){ document.getElementById('employerBotModal').classList.remove('show'); }
function empBotClear(){ document.getElementById('employerBotLog').innerHTML = ''; }
function empBotSay(text){
  const log = document.getElementById('employerBotLog');
  log.insertAdjacentHTML('beforeend', `<div class="bot-msg">${text}</div>`);
  log.scrollTop = log.scrollHeight;
}
function empBotUserSay(text){
  const log = document.getElementById('employerBotLog');
  log.insertAdjacentHTML('beforeend', `<div class="bot-msg user">${text}</div>`);
  log.scrollTop = log.scrollHeight;
}
function empBotOptions(options){
  const log = document.getElementById('employerBotLog');
  const wrap = document.createElement('div');
  wrap.className = 'bot-options';
  options.forEach(o=>{
    const btn = document.createElement('button');
    btn.className = 'bot-opt-btn';
    btn.textContent = o.label;
    btn.onclick = ()=>{ empBotUserSay(o.label); o.onClick(); };
    wrap.appendChild(btn);
  });
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}
function empBotStepRoot(){
  empBotClear();
  empBotSay(`Hi ${session.name.split(' ')[0]}! I'm the ShiftLedger Assistant. I can pull up your pipeline, payroll, and posting stats, or point you to the right tab. What do you need?`);
  empBotOptions([
    { label:'Give me a pipeline summary', onClick: empBotPipelineSummary },
    { label:'What timesheets need my approval?', onClick: empBotPendingTimesheets },
    { label:'What do I currently owe in payroll?', onClick: empBotPayrollOwed },
    { label:'How do I post a job?', onClick: empBotHowToPost },
    { label:'How do I generate an invoice?', onClick: empBotHowToInvoice },
    { label:'I need to message a contractor', onClick: empBotPickContractor },
    { label:'Something else', onClick: empBotEscalateSupport }
  ]);
}
function empBotFollowUp(){
  empBotOptions([
    { label:'Ask something else', onClick: empBotStepRoot },
    { label:'Something else / contact support', onClick: empBotEscalateSupport }
  ]);
}
function empBotPipelineSummary(){
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const apps = load(DB_KEYS.apps, []).filter(a=>jobIds.includes(a.jobId));
  const open = jobs.filter(j=>j.status==='open').length;
  const counts = {};
  PIPE_STAGES.forEach(s=> counts[s] = apps.filter(a=>a.status===s).length);
  empBotSay(`You have <b>${open}</b> open posting${open===1?'':'s'} out of ${jobs.length} total, with <b>${apps.length}</b> total applicants.<br>
    Submitted: ${counts.submitted} · Reviewing: ${counts.reviewing} · Interview: ${counts.interview} · Placed: ${counts.placed} · Not Selected: ${counts.rejected}`);
  empBotFollowUp();
}
function empBotPendingTimesheets(){
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const pending = load(DB_KEYS.time, []).filter(t=>jobIds.includes(t.jobId) && t.status==='pending_approval');
  if(pending.length===0){ empBotSay('Nothing waiting on you right now — all caught up.'); }
  else {
    empBotSay(`You have <b>${pending.length}</b> shift${pending.length===1?'':'s'} awaiting approval:<br>` + pending.map(t=>{
      const job = getJob(t.jobId); const applicant = getUser(t.applicantId);
      const hours = ((t.clockOut-t.clockIn)/3600000).toFixed(2);
      return `${applicant?applicant.name:'Contractor'} — ${job?job.title:'—'} (${hours} hrs)`;
    }).join('<br>') + '<br>Head to the <b>Timesheets & Payroll</b> tab to approve them.');
  }
  empBotFollowUp();
}
function empBotPayrollOwed(){
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const approved = load(DB_KEYS.time, []).filter(t=>jobIds.includes(t.jobId) && t.status==='approved');
  const total = approved.reduce((sum,t)=>{ const job = getJob(t.jobId); const hours = (t.clockOut-t.clockIn)/3600000; return sum + hours*parsePayRate(job?.pay); }, 0);
  empBotSay(`You currently owe <b>$${total.toFixed(2)}</b> across ${approved.length} approved, unpaid shift${approved.length===1?'':'s'}. Mark them paid from the <b>Timesheets & Payroll</b> tab.`);
  empBotFollowUp();
}
function empBotHowToPost(){
  empBotSay('Go to <b>Post a Job</b>, fill in the title, location, pay rate, bill rate (optional — what you charge your client), engagement type, description, and tags. It goes live to contractors immediately after you submit.');
  empBotFollowUp();
}
function empBotHowToInvoice(){
  empBotSay('Under <b>Timesheets & Payroll</b>, once a shift is marked "Paid," click <b>Generate Invoice from Paid, Uninvoiced Shifts</b>. It totals everything at your bill rate and gives you a printable invoice — use "Print / Save as PDF" to export it.');
  empBotFollowUp();
}
function empBotPickContractor(){
  empBotClear();
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const apps = load(DB_KEYS.apps, []).filter(a=>jobIds.includes(a.jobId));
  if(apps.length===0){ empBotSay("You don't have any applicants yet — post a job to start getting applications."); empBotOptions([{label:'Back to menu', onClick: empBotStepRoot}]); return; }
  empBotSay('Which contractor would you like to message?');
  empBotOptions(apps.map(a=>{
    const applicant = getUser(a.applicantId); const job = getJob(a.jobId);
    return { label: `${applicant?applicant.name:'Contractor'} — ${job?job.title:'—'}`, onClick: ()=>{ closeEmployerBot(); openChat(a.id); } };
  }));
}
function empBotEscalateSupport(){
  empBotClear();
  const requests = load(DB_KEYS.support, []);
  requests.push({ id: uid('sup'), employerId: session.id, employerName: session.name, createdAt: Date.now() });
  save(DB_KEYS.support, requests);
  empBotSay("That's outside what I can help with directly — let's get you into the IT Support Ticket System to log it properly.");
  empBotOptions([
    { label:'Open IT Support Ticket System', onClick: ()=>{ window.open(IT_TICKET_SYSTEM_URL, '_blank'); empBotSay("Opened in a new tab. If it didn't load, confirm the file still lives at:<br><code>"+IT_TICKET_SYSTEM_URL+"</code>"); empBotOptions([{label:'Back to menu', onClick: empBotStepRoot}]); } },
    { label:'Back to menu', onClick: empBotStepRoot }
  ]);
}

/* ============================================================
   EMPLOYER PORTAL
   ============================================================ */
document.querySelectorAll('[data-etab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-etab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    ['dashboard','post','jobs','pipeline','schedule','timesheets','analytics'].forEach(t=> document.getElementById('etab-'+t).classList.add('hidden'));
    document.getElementById('etab-'+btn.dataset.etab).classList.remove('hidden');
    if(btn.dataset.etab==='pipeline') renderPipelineSelect();
    if(btn.dataset.etab==='timesheets') renderTimesheetsAndPayroll();
    if(btn.dataset.etab==='schedule') renderScheduleTab();
    if(btn.dataset.etab==='analytics') renderAnalytics();
  });
});

function renderEmployerPortal(){
  if(!session || session.role!=='employer') return;
  renderLiveChatRequests();
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const apps = load(DB_KEYS.apps, []).filter(a=> jobs.some(j=>j.id===a.jobId));

  document.getElementById('employerStats').innerHTML = `
    <div class="stat"><div class="num">${jobs.filter(j=>j.status==='open').length}</div><div class="label">Open Postings</div></div>
    <div class="stat"><div class="num">${jobs.length}</div><div class="label">Total Postings</div></div>
    <div class="stat"><div class="num">${apps.length}</div><div class="label">Total Applicants</div></div>
    <div class="stat"><div class="num">${apps.filter(a=>a.status==='placed').length}</div><div class="label">Placements</div></div>
  `;

  const recentBox = document.getElementById('employerRecent');
  const recent = [...apps].sort((a,b)=>b.appliedAt-a.appliedAt).slice(0,6);
  if(recent.length===0){ recentBox.innerHTML = `<div class="empty-state"><div class="glyph">&#128221;</div>No applications yet. Post a job to get started.</div>`; }
  else {
    recentBox.innerHTML = recent.map(a=>{
      const applicant = getUser(a.applicantId); const job = getJob(a.jobId);
      return `<div class="ticket">
        <div class="ticket-top">
          <div><h3>${applicant?applicant.name:'Applicant'}</h3><div class="ticket-meta">Applied to ${job?job.title:'a posting'} · ${timeAgo(a.appliedAt)}</div></div>
          ${statusStamp(a.status)}
        </div>
        <div class="ticket-actions">
          <button class="btn btn-ghost btn-sm msg-btn" onclick="openChat('${a.id}')">Message ${applicant?applicant.name.split(' ')[0]:''}${unreadBadge(a.id)}</button>
        </div>
      </div>`;
    }).join('');
  }

  renderEmployerJobList();
  renderPipelineSelect();
}

function renderEmployerJobList(){
  const box = document.getElementById('employerJobList');
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id).sort((a,b)=>b.createdAt-a.createdAt);
  if(jobs.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#128203;</div>You haven't posted any jobs yet.</div>`; return; }
  const apps = load(DB_KEYS.apps, []);
  box.innerHTML = jobs.map(j=>{
    const count = apps.filter(a=>a.jobId===j.id).length;
    const margin = (parsePayRate(j.billRate) - parsePayRate(j.pay)).toFixed(2);
    return `<div class="ticket ${j.status==='filled'?'filled':''}">
      <div class="ticket-top">
        <div><h3>${j.title}</h3><div class="ticket-meta">${j.location} · Pay ${j.pay} / Bill ${j.billRate||j.pay} (margin $${margin}/hr) · ${j.type} · ${count} applicant${count===1?'':'s'}</div></div>
        <span class="stamp-badge ${j.status==='open'?'stamp-open':'stamp-filled'}">${j.status==='open'?'Open':'Filled/Closed'}</span>
      </div>
      <div class="ticket-desc">${j.desc}</div>
      <div class="ticket-actions">
        ${j.status==='open' ? `<button class="btn btn-ghost btn-sm" onclick="closeJob('${j.id}')">Mark Filled / Close</button>` : `<button class="btn btn-ghost btn-sm" onclick="reopenJob('${j.id}')">Reopen</button>`}
        <button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')">Delete Posting</button>
      </div>
    </div>`;
  }).join('');
}
function closeJob(id){ const jobs = load(DB_KEYS.jobs,[]); const j = jobs.find(x=>x.id===id); j.status='filled'; save(DB_KEYS.jobs, jobs); renderEmployerJobList(); renderPipelineSelect(); toast('Posting marked filled/closed.'); }
function reopenJob(id){ const jobs = load(DB_KEYS.jobs,[]); const j = jobs.find(x=>x.id===id); j.status='open'; save(DB_KEYS.jobs, jobs); renderEmployerJobList(); toast('Posting reopened.'); }
function deleteJob(id){
  if(!confirm('Delete this posting and all its applications? This cannot be undone.')) return;
  save(DB_KEYS.jobs, load(DB_KEYS.jobs,[]).filter(j=>j.id!==id));
  save(DB_KEYS.apps, load(DB_KEYS.apps,[]).filter(a=>a.jobId!==id));
  renderEmployerPortal(); toast('Posting deleted.');
}

document.getElementById('jobForm').addEventListener('submit', function(e){
  e.preventDefault();
  const jobs = load(DB_KEYS.jobs, []);
  jobs.push({
    id: uid('job'), employerId: session.id,
    title: document.getElementById('jTitle').value.trim(),
    location: document.getElementById('jLocation').value.trim(),
    pay: document.getElementById('jPay').value.trim(),
    billRate: document.getElementById('jBillRate').value.trim() || document.getElementById('jPay').value.trim(),
    type: document.getElementById('jType').value,
    desc: document.getElementById('jDesc').value.trim(),
    tags: document.getElementById('jTags').value.split(',').map(t=>t.trim()).filter(Boolean),
    status:'open', createdAt: Date.now()
  });
  save(DB_KEYS.jobs, jobs);
  this.reset();
  toast('Job posted. It is now live in the Contractor Portal.');
  document.querySelector('[data-etab="jobs"]').click();
  renderEmployerPortal();
});

function renderPipelineSelect(){
  const sel = document.getElementById('pipelineJobSelect');
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  if(jobs.length===0){ sel.innerHTML = '<option>No postings yet</option>'; document.getElementById('pipelineBoard').innerHTML=''; return; }
  const prev = sel.value;
  sel.innerHTML = jobs.map(j=>`<option value="${j.id}">${j.title}</option>`).join('');
  if(prev && jobs.some(j=>j.id===prev)) sel.value = prev;
  renderPipelineBoard(sel.value);
}
document.getElementById('pipelineJobSelect').addEventListener('change', e=> renderPipelineBoard(e.target.value));

const PIPE_STAGES = ['submitted','reviewing','interview','placed','rejected'];
const PIPE_LABELS = { submitted:'Submitted', reviewing:'Reviewing', interview:'Interview', placed:'Placed', rejected:'Not Selected' };

function renderPipelineBoard(jobId){
  const board = document.getElementById('pipelineBoard');
  if(!jobId){ board.innerHTML=''; return; }
  const apps = load(DB_KEYS.apps, []).filter(a=>a.jobId===jobId);
  board.innerHTML = PIPE_STAGES.map(stage=>{
    const items = apps.filter(a=>a.status===stage);
    return `<div class="pipe-col">
      <h4>${PIPE_LABELS[stage]} (${items.length})</h4>
      ${items.map(a=>{
        const applicant = getUser(a.applicantId);
        const docs = load(DB_KEYS.documents, []).filter(d=>d.ownerId===a.applicantId);
        return `<div class="app-card">
          <div class="name">${applicant?applicant.name:'Applicant'}</div>
          <div>${applicant && applicant.skills && applicant.skills.length ? applicant.skills.join(', ') : 'No skills listed'}</div>
          ${a.note ? `<div style="margin-top:4px; font-style:italic;">"${a.note}"</div>` : ''}
          ${docs.length ? `<details style="margin-top:6px;"><summary style="cursor:pointer; font-size:11px; color:#3E7C7C;">Documents (${docs.length})</summary>
            ${docs.map(d=>`<div style="font-size:11px; margin-top:4px;"><a href="${d.dataUrl}" download="${d.name}" style="color:#3E7C7C;">${d.name}</a></div>`).join('')}
          </details>` : '<div style="font-size:11px; color:#948c78; margin-top:6px;">No documents uploaded</div>'}
          <select onchange="moveApplication('${a.id}', this.value)">
            ${PIPE_STAGES.map(s=>`<option value="${s}" ${s===a.status?'selected':''}>${PIPE_LABELS[s]}</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-sm msg-btn" style="width:100%; margin-top:6px;" onclick="openChat('${a.id}')">Message${unreadBadge(a.id)}</button>
        </div>`;
      }).join('') || '<div style="font-size:11.5px; color:#948c78;">No applicants</div>'}
    </div>`;
  }).join('');
}
function moveApplication(appId, newStatus){
  const apps = load(DB_KEYS.apps, []);
  const a = apps.find(x=>x.id===appId);
  const job = getJob(a.jobId);
  const employer = getUser(job.employerId);
  const applicant = getUser(a.applicantId);
  if(newStatus==='placed' && a.status!=='placed') a.placedAt = Date.now();
  a.status = newStatus;
  if(newStatus === 'interview'){
    const when = prompt('Interview date/time (e.g. "Thu Jul 30, 2pm"):', a.interviewAt || '');
    if(when) a.interviewAt = when;
  }
  save(DB_KEYS.apps, apps);
  addAudit(appId, employer.name, `Moved application to "${PIPE_LABELS[newStatus]}"${a.interviewAt && newStatus==='interview' ? ' — interview: '+a.interviewAt : ''}`);
  addNotification(applicant.id, 'status', `${employer.name}: your application for "${job.title}" is now ${PIPE_LABELS[newStatus]}${a.interviewAt && newStatus==='interview' ? ' ('+a.interviewAt+')' : ''}.`, appId);
  renderPipelineBoard(a.jobId);
  renderEmployerPortal();
  toast('Application status updated.');
}

/* ---------- Timesheets & Payroll ---------- */
function renderTimesheetsAndPayroll(){
  const myJobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const myJobIds = myJobs.map(j=>j.id);
  const entries = load(DB_KEYS.time, []).filter(t=>myJobIds.includes(t.jobId));

  const pending = entries.filter(t=>t.status==='pending_approval').sort((a,b)=>a.clockOut-b.clockOut);
  const pendingBox = document.getElementById('pendingTimesheets');
  if(pending.length===0){ pendingBox.innerHTML = `<div class="empty-state"><div class="glyph">&#9203;</div>No shifts waiting on approval.</div>`; }
  else {
    pendingBox.innerHTML = pending.map(t=>{
      const job = getJob(t.jobId); const applicant = getUser(t.applicantId);
      const hours = ((t.clockOut - t.clockIn)/3600000).toFixed(2);
      const pay = (hours * parsePayRate(job?.pay)).toFixed(2);
      return `<div class="ticket">
        <div class="ticket-top">
          <div><h3>${applicant?applicant.name:'Contractor'}</h3><div class="ticket-meta">${job?job.title:'—'} · ${formatDateTime(t.clockIn)} → ${formatDateTime(t.clockOut)} · ${hours} hrs · est. $${pay}</div></div>
          <span class="stamp-badge stamp-submitted">Pending</span>
        </div>
        <div class="ticket-actions"><button class="btn btn-primary btn-sm" onclick="approveTimesheet('${t.id}')">Approve Shift</button></div>
      </div>`;
    }).join('');
  }

  const approved = entries.filter(t=>t.status==='approved' || t.status==='paid').sort((a,b)=>b.clockIn-a.clockIn);
  const payBox = document.getElementById('payrollTable');
  if(approved.length===0){ payBox.innerHTML = `<div class="empty-state"><div class="glyph">&#128181;</div>No approved shifts yet.</div>`; return; }
  let totalOwed = 0;
  const rows = approved.map(t=>{
    const job = getJob(t.jobId); const applicant = getUser(t.applicantId);
    const hours = ((t.clockOut - t.clockIn)/3600000);
    const pay = hours * parsePayRate(job?.pay);
    if(t.status==='approved') totalOwed += pay;
    return `<tr>
      <td>${applicant?applicant.name:'Contractor'}</td>
      <td>${job?job.title:'—'}</td>
      <td>${formatDateTime(t.clockIn)}</td>
      <td>${hours.toFixed(2)} hrs</td>
      <td>$${pay.toFixed(2)}</td>
      <td><span class="stamp-badge ${t.status==='paid'?'stamp-placed':'stamp-reviewing'}">${t.status==='paid'?'Paid':'Approved'}</span></td>
      <td>${t.status==='approved' ? `<button class="btn btn-primary btn-sm" onclick="markPaid('${t.id}')">Mark Paid</button>` : ''}</td>
    </tr>`;
  }).join('');
  payBox.innerHTML = `<table class="ts-table"><thead><tr><th>Contractor</th><th>Job</th><th>Shift Date</th><th>Hours</th><th>Pay</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="4">Total Owed (Approved, Unpaid)</td><td colspan="3">$${totalOwed.toFixed(2)}</td></tr></tfoot></table>`;
}
function approveTimesheet(id){
  const entries = load(DB_KEYS.time, []);
  const t = entries.find(x=>x.id===id); t.status = 'approved';
  save(DB_KEYS.time, entries);
  addNotification(t.applicantId, 'payroll', `Your shift on ${formatDateTime(t.clockIn)} was approved and is queued for payment.`, t.applicationId);
  toast('Shift approved for payroll.');
  renderTimesheetsAndPayroll();
}
function markPaid(id){
  const entries = load(DB_KEYS.time, []);
  const t = entries.find(x=>x.id===id); t.status = 'paid';
  save(DB_KEYS.time, entries);
  addNotification(t.applicantId, 'payroll', `You were paid for your shift on ${formatDateTime(t.clockIn)}.`, t.applicationId);
  toast('Marked as paid.');
  renderTimesheetsAndPayroll();
}

/* ---------- Invoicing ---------- */
function generateInvoice(){
  const myJobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const myJobIds = myJobs.map(j=>j.id);
  const entries = load(DB_KEYS.time, []);
  const toInvoice = entries.filter(t=>myJobIds.includes(t.jobId) && t.status==='paid' && !t.invoiced);
  const box = document.getElementById('invoiceOutput');
  if(toInvoice.length===0){ box.innerHTML = `<div class="empty-state" style="padding:20px 0;">No paid, uninvoiced shifts to bill right now.</div>`; return; }
  let total = 0;
  const rows = toInvoice.map(t=>{
    const job = getJob(t.jobId); const applicant = getUser(t.applicantId);
    const hours = (t.clockOut - t.clockIn)/3600000;
    const lineTotal = hours * parsePayRate(job?.billRate || job?.pay);
    total += lineTotal;
    return `<tr><td>${applicant?applicant.name:'Contractor'}</td><td>${job?job.title:'—'}</td><td>${formatDateTime(t.clockIn)}</td><td>${hours.toFixed(2)}</td><td>${job?.billRate||job?.pay}</td><td>$${lineTotal.toFixed(2)}</td></tr>`;
  }).join('');
  box.innerHTML = `<div class="invoice-box">
    <h3>Invoice #${uid('INV').slice(4,10).toUpperCase()}</h3>
    <div class="invoice-meta-row"><span>${session.name}</span><span>Issued ${new Date().toLocaleDateString()}</span></div>
    <table class="ts-table"><thead><tr><th>Contractor</th><th>Job</th><th>Shift Date</th><th>Hours</th><th>Bill Rate</th><th>Line Total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5">Total Due</td><td>$${total.toFixed(2)}</td></tr></tfoot></table>
    <button class="btn btn-ghost btn-sm" style="margin-top:14px;" onclick="window.print()">Print / Save as PDF</button>
  </div>`;
  const allEntries = load(DB_KEYS.time, []).map(t=> toInvoice.some(x=>x.id===t.id) ? {...t, invoiced:true} : t);
  save(DB_KEYS.time, allEntries);
  toast('Invoice generated. These shifts are now marked invoiced.');
}

/* ---------- Shift scheduling ---------- */
function renderScheduleTab(){
  const select = document.getElementById('shiftAppSelect');
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const placements = load(DB_KEYS.apps, []).filter(a=>jobIds.includes(a.jobId) && a.status==='placed');
  select.innerHTML = placements.length
    ? placements.map(a=>{
        const job = getJob(a.jobId);
        const applicant = getUser(a.applicantId);
        return `<option value="${a.id}">${applicant?applicant.name:'Contractor'} — ${job?job.title:'Placement'}</option>`;
      }).join('')
    : '<option value="">No placed contractors available</option>';
  document.getElementById('shiftForm').querySelector('button[type="submit"]').disabled = placements.length===0;

  const shifts = load(DB_KEYS.shifts, []).filter(s=>jobIds.includes(s.jobId))
    .sort((a,b)=>`${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const box = document.getElementById('employerShiftList');
  if(shifts.length===0){ box.innerHTML='<div class="empty-state">No shifts scheduled yet.</div>'; return; }
  box.innerHTML = shifts.map(s=>{
    const app = getApplication(s.applicationId);
    const job = getJob(s.jobId);
    const applicant = app ? getUser(app.applicantId) : getUser(s.applicantId);
    return `<div class="shift-row"><div class="shift-date">${s.date} · ${s.startTime}–${s.endTime}</div><div class="shift-meta">${applicant?applicant.name:'Contractor'} · ${job?job.title:'Placement'} · ${s.status||'scheduled'}</div></div>`;
  }).join('');
}
document.getElementById('shiftForm').addEventListener('submit', function(e){
  e.preventDefault();
  const applicationId = document.getElementById('shiftAppSelect').value;
  const app = getApplication(applicationId);
  if(!app || app.status!=='placed'){ toast('Choose a valid placed contractor.'); return; }
  const shifts = load(DB_KEYS.shifts, []);
  shifts.push({
    id:uid('shift'), applicationId, jobId:app.jobId, applicantId:app.applicantId,
    date:document.getElementById('shiftDate').value,
    startTime:document.getElementById('shiftStart').value,
    endTime:document.getElementById('shiftEnd').value,
    status:'scheduled', note:''
  });
  save(DB_KEYS.shifts, shifts);
  addNotification(app.applicantId, 'shift', `A shift was scheduled for ${document.getElementById('shiftDate').value} (${document.getElementById('shiftStart').value}–${document.getElementById('shiftEnd').value}).`, app.id);
  this.reset();
  renderScheduleTab();
  toast('Shift assigned.');
});

/* ---------- Staffing analytics ---------- */
function renderAnalytics(){
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.employerId===session.id);
  const jobIds = jobs.map(j=>j.id);
  const apps = load(DB_KEYS.apps, []).filter(a=>jobIds.includes(a.jobId));
  const placements = apps.filter(a=>a.status==='placed');
  const placedDurations = placements.filter(a=>a.placedAt && a.appliedAt)
    .map(a=>(a.placedAt-a.appliedAt)/86400000);
  const averageDays = placedDurations.length
    ? `${(placedDurations.reduce((sum,days)=>sum+days,0)/placedDurations.length).toFixed(1)} days`
    : '—';
  const fillRate = jobs.length ? `${Math.round(jobs.filter(j=>j.status==='filled').length/jobs.length*100)}%` : '0%';
  const paidEntries = load(DB_KEYS.time, []).filter(t=>jobIds.includes(t.jobId) && t.status==='paid');
  const revenue = paidEntries.reduce((sum,t)=>{
    const job = getJob(t.jobId);
    return sum + ((t.clockOut-t.clockIn)/3600000)*parsePayRate(job?.billRate||job?.pay);
  },0);
  document.getElementById('analyticsStats').innerHTML = `
    <div class="stat"><div class="num">${fillRate}</div><div class="label">Posting Fill Rate</div></div>
    <div class="stat"><div class="num">${averageDays}</div><div class="label">Avg. Time to Place</div></div>
    <div class="stat"><div class="num">${placements.length}</div><div class="label">Current Placements</div></div>
    <div class="stat"><div class="num">$${revenue.toFixed(2)}</div><div class="label">Revenue from Paid Shifts</div></div>
  `;
  const marginTable = document.getElementById('marginTable');
  if(jobs.length===0){ marginTable.innerHTML='<div class="empty-state">Post a job to see margin analytics.</div>'; return; }
  marginTable.innerHTML = `<table class="ts-table"><thead><tr><th>Job</th><th>Pay/hr</th><th>Bill/hr</th><th>Margin/hr</th><th>Paid Hours</th><th>Revenue</th></tr></thead><tbody>${jobs.map(j=>{
    const hours = paidEntries.filter(t=>t.jobId===j.id).reduce((sum,t)=>sum+(t.clockOut-t.clockIn)/3600000,0);
    const pay = parsePayRate(j.pay);
    const bill = parsePayRate(j.billRate||j.pay);
    return `<tr><td>${j.title}</td><td>$${pay.toFixed(2)}</td><td>$${bill.toFixed(2)}</td><td>$${(bill-pay).toFixed(2)}</td><td>${hours.toFixed(2)}</td><td>$${(hours*bill).toFixed(2)}</td></tr>`;
  }).join('')}</tbody></table>`;
}

/* ============================================================
   APPLICANT / CONTRACTOR PORTAL
   ============================================================ */
document.querySelectorAll('[data-atab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-atab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    ['browse','applications','timeclock','documents','profile'].forEach(t=> document.getElementById('atab-'+t).classList.add('hidden'));
    document.getElementById('atab-'+btn.dataset.atab).classList.remove('hidden');
    if(btn.dataset.atab==='timeclock') renderTimeClock();
    if(btn.dataset.atab==='documents') renderMyDocuments();
  });
});

function renderApplicantPortal(){
  if(!session || session.role!=='applicant') return;
  const user = getUser(session.id);
  document.getElementById('pName').value = user.name || '';
  document.getElementById('pPhone').value = user.phone || '';
  document.getElementById('pSkills').value = (user.skills||[]).join(', ');
  document.getElementById('pBio').value = user.bio || '';
  renderApplicantJobs();
  renderMyApplications();
}

function renderApplicantJobs(filter=''){
  const box = document.getElementById('applicantJobList');
  const jobs = load(DB_KEYS.jobs, []).filter(j=>j.status==='open').sort((a,b)=>b.createdAt-a.createdAt);
  const myApps = load(DB_KEYS.apps, []).filter(a=>a.applicantId===session.id);
  const f = filter.toLowerCase();
  const filtered = jobs.filter(j => !f || j.title.toLowerCase().includes(f) || j.location.toLowerCase().includes(f) || (j.tags||[]).some(t=>t.toLowerCase().includes(f)));
  if(filtered.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#128269;</div>No open work orders match.</div>`; return; }
  box.innerHTML = filtered.map(j=>{
    const emp = getUser(j.employerId);
    const already = myApps.find(a=>a.jobId===j.id);
    return `<div class="ticket">
      <div class="ticket-top">
        <div><h3>${j.title}</h3><div class="ticket-meta">${emp?emp.name:'Employer'} · ${j.location} · ${j.pay} · ${j.type}</div></div>
        <span class="stamp-badge stamp-open">Open</span>
      </div>
      <div class="ticket-desc">${j.desc}</div>
      <div class="ticket-tags">${(j.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="ticket-actions">
        ${already ? `<span class="stamp-badge stamp-${already.status}">Already applied — ${PIPE_LABELS[already.status]}</span>`
                  : `<button class="btn btn-primary btn-sm" onclick="applyToJob('${j.id}')">Apply Now</button>`}
      </div>
    </div>`;
  }).join('');
}
document.getElementById('jobSearch').addEventListener('input', e=> renderApplicantJobs(e.target.value));

function applyToJob(jobId){
  const note = prompt('Optional note to the employer (availability, questions, etc.):', '');
  const apps = load(DB_KEYS.apps, []);
  const newApp = { id: uid('app'), jobId, applicantId: session.id, status:'submitted', note: note||'', appliedAt: Date.now() };
  apps.push(newApp);
  save(DB_KEYS.apps, apps);
  const job = getJob(jobId);
  addAudit(newApp.id, session.name, 'Submitted application');
  addNotification(job.employerId, 'application', `${session.name} applied to "${job.title}".`, newApp.id);
  toast('Application submitted!');
  renderApplicantJobs(document.getElementById('jobSearch').value);
  renderMyApplications();
}

function renderMyApplications(){
  const box = document.getElementById('myApplications');
  const apps = load(DB_KEYS.apps, []).filter(a=>a.applicantId===session.id).sort((a,b)=>b.appliedAt-a.appliedAt);
  if(apps.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#128203;</div>You haven't applied to anything yet.</div>`; return; }
  box.innerHTML = apps.map(a=>{
    const job = getJob(a.jobId);
    const emp = job ? getUser(job.employerId) : null;
    return `<div class="ticket">
      <div class="ticket-top">
        <div><h3>${job?job.title:'(posting removed)'}</h3><div class="ticket-meta">${emp?emp.name:''} · Applied ${timeAgo(a.appliedAt)}</div></div>
        ${statusStamp(a.status)}
      </div>
      ${a.note ? `<div class="ticket-desc" style="font-style:italic;">Your note: "${a.note}"</div>` : ''}
      <div class="ticket-actions">
        <button class="btn btn-ghost btn-sm msg-btn" onclick="openChat('${a.id}')">Message ${emp?emp.name:'Employer'}${unreadBadge(a.id)}</button>
      </div>
    </div>`;
  }).join('');
}

/* ---------- Time Clock ---------- */
function renderTimeClock(){
  const box = document.getElementById('timeclockList');
  const placedApps = load(DB_KEYS.apps, []).filter(a=>a.applicantId===session.id && a.status==='placed');
  const timeEntries = load(DB_KEYS.time, []);
  if(placedApps.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#9201;</div>You don't have any active placements yet. Once an employer marks you "Placed," you can clock in here.</div>`; renderMyShiftHistory(); return; }
  box.innerHTML = placedApps.map(a=>{
    const job = getJob(a.jobId);
    const active = timeEntries.find(t=>t.applicationId===a.id && t.status==='active');
    return `<div class="clock-card">
      <div class="ticket-meta">${job?job.title:'Placement'} · ${job?job.pay:''}</div>
      <div class="clock-face" id="clockface-${a.id}">${active ? formatHMS(Date.now()-active.clockIn) : '00:00:00'}</div>
      <div class="clock-status ${active?'active':'idle'}">${active ? 'Clocked In — On Shift' : 'Clocked Out'}</div>
      <div class="ticket-actions">
        ${active
          ? `<button class="btn btn-primary btn-sm" onclick="clockOut('${active.id}')">Clock Out</button>`
          : `<button class="btn btn-primary btn-sm" onclick="clockIn('${a.id}')">Clock In</button>`}
      </div>
    </div>`;
  }).join('');
  startClockTicker();
  renderMyShiftHistory();
}
let clockTickerHandle = null;
function startClockTicker(){
  clearInterval(clockTickerHandle);
  clockTickerHandle = setInterval(()=>{
    const timeEntries = load(DB_KEYS.time, []).filter(t=>t.status==='active' && t.applicantId===session.id);
    timeEntries.forEach(t=>{
      const el = document.getElementById('clockface-'+t.applicationId);
      if(el) el.textContent = formatHMS(Date.now()-t.clockIn);
    });
  }, 1000);
}
function clockIn(applicationId){
  const app = getApplication(applicationId);
  const entries = load(DB_KEYS.time, []);
  entries.push({ id: uid('time'), applicationId, applicantId: session.id, jobId: app.jobId, clockIn: Date.now(), clockOut:null, status:'active' });
  save(DB_KEYS.time, entries);
  toast('Clocked in.');
  renderTimeClock();
}
function clockOut(entryId){
  const entries = load(DB_KEYS.time, []);
  const t = entries.find(x=>x.id===entryId);
  t.clockOut = Date.now();
  t.status = 'pending_approval';
  save(DB_KEYS.time, entries);
  clearInterval(clockTickerHandle);
  toast('Clocked out. Shift sent to employer for approval.');
  renderTimeClock();
}
function renderMyShiftHistory(){
  const box = document.getElementById('myShiftHistory');
  const entries = load(DB_KEYS.time, []).filter(t=>t.applicantId===session.id && t.status!=='active').sort((a,b)=>b.clockIn-a.clockIn);
  if(entries.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#128203;</div>No completed shifts yet.</div>`; return; }
  const statusLabel = { pending_approval:'Pending Approval', approved:'Approved', paid:'Paid' };
  const statusClass = { pending_approval:'stamp-submitted', approved:'stamp-reviewing', paid:'stamp-placed' };
  box.innerHTML = `<table class="ts-table"><thead><tr><th>Job</th><th>Date</th><th>Hours</th><th>Status</th></tr></thead><tbody>
    ${entries.map(t=>{
      const job = getJob(t.jobId);
      const hours = ((t.clockOut - t.clockIn)/3600000).toFixed(2);
      return `<tr><td>${job?job.title:'—'}</td><td>${formatDateTime(t.clockIn)}</td><td>${hours} hrs</td><td><span class="stamp-badge ${statusClass[t.status]}">${statusLabel[t.status]}</span></td></tr>`;
    }).join('')}
  </tbody></table>`;
}

/* ---------- Documents ---------- */
document.getElementById('fileInput').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 4*1024*1024){ toast('File too large — please keep uploads under 4MB.'); return; }
  const reader = new FileReader();
  reader.onload = function(ev){
    const docs = load(DB_KEYS.documents, []);
    docs.push({ id: uid('doc'), ownerId: session.id, name: file.name, type: file.type || 'file', dataUrl: ev.target.result, size: file.size, uploadedAt: Date.now() });
    save(DB_KEYS.documents, docs);
    toast('File uploaded.');
    renderMyDocuments();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});
function renderMyDocuments(){
  const box = document.getElementById('myDocuments');
  const docs = load(DB_KEYS.documents, []).filter(d=>d.ownerId===session.id).sort((a,b)=>b.uploadedAt-a.uploadedAt);
  if(docs.length===0){ box.innerHTML = `<div class="empty-state"><div class="glyph">&#128193;</div>No documents uploaded yet.</div>`; return; }
  box.innerHTML = docs.map(d=>`
    <div class="doc-row">
      <div><div class="doc-name">${d.name}</div><div class="doc-meta">${(d.size/1024).toFixed(0)} KB · uploaded ${timeAgo(d.uploadedAt)}</div></div>
      <div style="display:flex; gap:8px;">
        <a class="btn btn-ghost btn-sm" href="${d.dataUrl}" download="${d.name}">Download</a>
        <button class="btn btn-danger btn-sm" onclick="deleteDocument('${d.id}')">Delete</button>
      </div>
    </div>`).join('');
}
function deleteDocument(id){
  save(DB_KEYS.documents, load(DB_KEYS.documents, []).filter(d=>d.id!==id));
  renderMyDocuments();
  toast('Document deleted.');
}

document.getElementById('profileForm').addEventListener('submit', function(e){
  e.preventDefault();
  const users = load(DB_KEYS.users, []);
  const user = users.find(u=>u.id===session.id);
  user.name = document.getElementById('pName').value.trim();
  user.phone = document.getElementById('pPhone').value.trim();
  user.skills = document.getElementById('pSkills').value.split(',').map(s=>s.trim()).filter(Boolean);
  user.bio = document.getElementById('pBio').value.trim();
  save(DB_KEYS.users, users);
  session.name = user.name; save(DB_KEYS.session, session);
  refreshHeader();
  toast('Profile saved.');
});

/* ============================================================
   Init
   ============================================================ */
refreshHeader();
showView(session ? session.role : 'landing');
