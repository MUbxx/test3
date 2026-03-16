import { auth, db } from "./firebase.js";
import {
collection, getDocs, doc, onSnapshot, updateDoc,
query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
function toast(msg, type = 'ok') {
const t = document.getElementById('toast');
t.textContent = msg; t.className = `show ${type}`;
setTimeout(() => t.className = '', 3000);
}
let userData = null;
let allCourses = [];
onAuthStateChanged(auth, user => {
if (!user) { window.location = 'login.html'; return; }
onSnapshot(doc(db, 'users', user.uid), snap => {
userData = snap.data();
if (!userData) return;
const name = userData.name || 'Student';
const email = userData.email || user.email;
const phone = userData.phone || '';
const role = userData.role || 'user';
const purchased = userData.purchasedCourses || [];
const courseProgress = userData.courseProgress || {};
const wn = document.getElementById('welcomeName');
if (wn) wn.textContent = name.split(' ')[0];
const sbe = document.getElementById('sbUserEmail');
if (sbe) sbe.textContent = email;
const completedCourses = purchased.filter(cid => courseProgress[cid]?.completed === true);
const completedCount = completedCourses.length;
let totalPct = 0;
purchased.forEach(cid => { totalPct += Math.min(100, courseProgress[cid]?.pct || 0); });
const avgPct = purchased.length > 0 ? Math.round(totalPct / purchased.length) : 0;
const se = document.getElementById('statEnrolled');
const sc = document.getElementById('statCompleted');
const sap = document.getElementById('statAvgProg');
if (se) se.textContent = purchased.length;
if (sc) sc.textContent = completedCount;
if (sap) sap.textContent = avgPct + '%';
const pName = document.getElementById('profileName');
const pEmail = document.getElementById('profileEmail');
const pPhone = document.getElementById('profilePhone');
const pRole = document.getElementById('profileRole');
const pAvatar = document.getElementById('profileAvatar');
const mAvatar = document.getElementById('mobileAvatar');
const pSC = document.getElementById('pStatCourses');
const pSCom = document.getElementById('pStatCompleted');
const editN = document.getElementById('editName');
const editE = document.getElementById('editEmail');
const editP = document.getElementById('editPhone');
if (pName) pName.textContent = name;
if (pEmail) pEmail.textContent = email;
if (pPhone && phone) pPhone.textContent = '📞 ' + phone;
if (pRole) pRole.textContent = role === 'admin' ? '🛡 Admin' : 'Student';
if (pAvatar){ pAvatar.textContent = name[0].toUpperCase(); }
if (mAvatar){ mAvatar.textContent = name[0].toUpperCase(); }
if (pSC) pSC.textContent = purchased.length;
if (pSCom) pSCom.textContent = completedCount;
if (editN) editN.value = name;
if (editE) editE.value = email;
if (editP) editP.value = phone;
const si = document.getElementById('sessionInfo');
const ssi = document.getElementById('secSessionInfo');
if (si) si.textContent = `Signed in as ${email}`;
if (ssi) ssi.textContent = `Signed in as ${email} (${role})`;
renderCourses(allCourses, purchased, courseProgress);
renderMyCourses(allCourses, purchased, courseProgress);
renderProgress(allCourses, purchased, courseProgress, completedCount, avgPct);
renderEarnedCerts(allCourses, purchased, courseProgress);
loadCertificates(email);
loadInvoices(email);
loadNotifications(purchased);
checkUnreadAnnouncements(purchased);
checkUnreadAnnouncements(purchased);
checkUnreadNotifications(purchased);
});
loadCourses(user);
});
async function loadCourses(user) {
const snap = await getDocs(collection(db, 'courses'));
allCourses = [];
snap.forEach(c => allCourses.push({ id: c.id, ...c.data() }));
const purchased = userData?.purchasedCourses || [];
const cp = userData?.courseProgress || {};
renderCourses(allCourses, purchased, cp);
renderMyCourses(allCourses, purchased, cp);
}
function courseCard(c, access, courseProgress) {
const pct = Math.min(100, courseProgress?.[c.id]?.pct || 0);
const isComplete = courseProgress?.[c.id]?.completed === true;
const lessonCount = c.lessons?.length || 0;
return `
<div class="cc">
<div style="overflow:hidden;"><img src="${c.image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=70'}" alt="${c.title}"></div>
<div style="padding:13px;flex:1;display:flex;flex-direction:column;">
${access ? `<span style="font-size:.62rem;font-weight:700;color:${isComplete?'#f59e0b':'#22c55e'};background:${isComplete?'rgba(245,158,11,.1)':'rgba(34,197,94,.1)'};padding:2px 7px;border-radius:99px;border:1px solid ${isComplete?'rgba(245,158,11,.2)':'rgba(34,197,94,.2)'};display:inline-flex;align-items:center;gap:4px;margin-bottom:7px;align-self:flex-start;">${isComplete?'<i class="fas fa-check-circle"></i> Completed':'Enrolled'}</span>` : ''}
<h4 style="font-size:.86rem;font-weight:700;margin-bottom:4px;line-height:1.3;">${c.title}</h4>
<p style="font-size:.72rem;color:var(--dim);margin-bottom:8px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;flex:1;">${c.description || ''}</p>
${lessonCount ? `<p style="font-size:.67rem;color:var(--dim);margin-bottom:8px;"><i class="fas fa-list" style="margin-right:3px;color:var(--c);"></i>${lessonCount} lessons</p>` : ''}
${access ? `
<div style="margin-bottom:10px;">
<div style="display:flex;justify-content:space-between;font-size:.64rem;color:var(--dim);margin-bottom:4px;"><span>Progress</span><span style="color:${isComplete?'#f59e0b':'var(--c)'};">${pct}%</span></div>
<div class="prog-track"><div class="prog-fill${isComplete?' prog-gold':''}" style="width:${pct}%;"></div></div>
</div>
${isComplete
? `<div style="display:flex;gap:6px;">
<a href="web-pentesting.html?id=${c.id}" style="flex:1;display:block;text-align:center;padding:8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--dim);font-weight:600;font-size:.76rem;text-decoration:none;"><i class="fas fa-redo" style="margin-right:3px;"></i>Review</a>
<a href="certificate.html?course=${c.id}" style="flex:1;display:block;text-align:center;padding:8px;border-radius:8px;background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(251,191,36,.1));border:1px solid rgba(245,158,11,.3);color:#fcd34d;font-weight:700;font-size:.76rem;text-decoration:none;"><i class="fas fa-certificate" style="margin-right:3px;"></i>Certificate</a>
</div>`
: `<a href="web-pentesting.html?id=${c.id}" style="display:block;text-align:center;padding:8px;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#042028;font-weight:700;font-size:.77rem;text-decoration:none;"><i class="fas fa-play" style="margin-right:4px;"></i>Continue Learning</a>`
}`
: `<button style="width:100%;padding:8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:var(--dim);font-family:'Poppins',sans-serif;font-size:.77rem;font-weight:600;cursor:not-allowed;"><i class="fas fa-lock" style="margin-right:4px;"></i>Locked</button>`}
</div>
</div>`;
}
function renderCourses(courses, purchased, cp) {
const grid = document.getElementById('coursesGrid');
if (!grid) return;
const q = document.getElementById('searchCourse')?.value?.toLowerCase() || '';
const filtered = q ? courses.filter(c => c.title.toLowerCase().includes(q)) : courses;
if (!filtered.length) { grid.innerHTML = '<p style="color:var(--dim);font-size:.82rem;grid-column:1/-1;">No courses available yet.</p>'; return; }
grid.innerHTML = filtered.map(c => courseCard(c, purchased.includes(c.id), cp)).join('');
}
function renderMyCourses(courses, purchased, cp) {
const grid = document.getElementById('myGrid');
if (!grid) return;
const mine = courses.filter(c => purchased.includes(c.id));
if (!mine.length) { grid.innerHTML = '<p style="color:var(--dim);font-size:.82rem;grid-column:1/-1;">No courses yet. Contact admin for access.</p>'; return; }
grid.innerHTML = mine.map(c => courseCard(c, true, cp)).join('');
}
document.getElementById('searchCourse')?.addEventListener('input', () => {
renderCourses(allCourses, userData?.purchasedCourses || [], userData?.courseProgress || {});
});
function renderProgress(courses, purchased, courseProgress, completedCount, avgPct) {
const myCourses = courses.filter(c => purchased.includes(c.id));
const e1 = document.getElementById('progTotalEnrolled');
const e2 = document.getElementById('progTotalCompleted');
const e3 = document.getElementById('progOverallPct');
const e4 = document.getElementById('progOverallBar');
if (e1) e1.textContent = myCourses.length;
if (e2) e2.textContent = completedCount;
if (e3) e3.textContent = avgPct + '%';
if (e4) { e4.style.width = avgPct + '%'; if (avgPct >= 100) e4.classList.add('prog-gold'); }
const listEl = document.getElementById('progCourseList');
if (!listEl) return;
if (!myCourses.length) { listEl.innerHTML = '<p style="font-size:.78rem;color:var(--dim);">No enrolled courses.</p>'; return; }
listEl.innerHTML = myCourses.map(c => {
const pct = Math.min(100, courseProgress[c.id]?.pct || 0);
const isComplete = courseProgress[c.id]?.completed === true;
const done = courseProgress[c.id]?.completedLessons?.length || 0;
const total = c.lessons?.length || courseProgress[c.id]?.total || 0;
return `
<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);">
${c.image ? `<img src="${c.image}" style="width:44px;height:32px;border-radius:5px;object-fit:cover;flex-shrink:0;">` : `<div style="width:44px;height:32px;border-radius:5px;background:rgba(6,182,212,.07);flex-shrink:0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-book" style="color:#06b6d4;font-size:.7rem;"></i></div>`}
<div style="flex:1;min-width:0;">
<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
<p style="font-size:.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">${c.title}</p>
<span style="font-size:.72rem;font-weight:700;color:${isComplete?'#f59e0b':'var(--c)'};flex-shrink:0;margin-left:8px;">${pct}%${isComplete?' ✓':''}</span>
</div>
<div class="prog-track"><div class="prog-fill${isComplete?' prog-gold':''}" style="width:${pct}%;"></div></div>
${total ? `<p style="font-size:.65rem;color:var(--dim);margin-top:3px;">${done} / ${total} lessons</p>` : ''}
</div>
<a href="web-pentesting.html?id=${c.id}" style="padding:5px 10px;border-radius:7px;background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.14);color:#06b6d4;font-size:.7rem;font-weight:700;text-decoration:none;flex-shrink:0;white-space:nowrap;">
<i class="fas fa-${isComplete?'redo':'play'}" style="margin-right:2px;"></i>${isComplete?'Review':'Continue'}
</a>
</div>`;
}).join('');
}
function renderEarnedCerts(courses, purchased, courseProgress) {
const el = document.getElementById('earnedCertList');
if (!el) return;
const completedCourses = purchased.filter(cid => courseProgress[cid]?.completed === true);
const statCerts = document.getElementById('statCerts');
const pStatCerts = document.getElementById('pStatCerts');
if (statCerts) statCerts.textContent = completedCourses.length;
if (pStatCerts) pStatCerts.textContent = completedCourses.length;
if (!completedCourses.length) {
el.innerHTML = '<p style="font-size:.78rem;color:var(--dim);">Complete a course to earn a certificate. Your progress is saved securely.</p>';
return;
}
const courseMap = {};
courses.forEach(c => courseMap[c.id] = c);
el.innerHTML = completedCourses.map(cid => {
const c = courseMap[cid];
const title = c?.title || cid;
const date = courseProgress[cid]?.lastUpdated
? new Date(courseProgress[cid].lastUpdated).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'})
: 'Completed';
return `
<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
<div style="width:42px;height:42px;border-radius:10px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-trophy" style="color:#f59e0b;font-size:.9rem;"></i></div>
<div style="flex:1;min-width:0;">
<p style="font-weight:600;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</p>
<p style="font-size:.72rem;color:var(--dim);margin-top:2px;">${date}</p>
</div>
<a href="certificate.html?course=${cid}" style="padding:7px 14px;border-radius:8px;background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(251,191,36,.1));border:1px solid rgba(245,158,11,.3);color:#fcd34d;font-size:.73rem;font-weight:700;text-decoration:none;white-space:nowrap;display:flex;align-items:center;gap:4px;">
<i class="fas fa-certificate"></i> View
</a>
</div>`;
}).join('');
}
async function loadCertificates(email) {
const el = document.getElementById('certList');
if (!el) return;
el.innerHTML = '<p style="color:var(--dim);font-size:.78rem;">Loading...</p>';
try {
const res = await fetch('https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json');
if (!res.ok) throw new Error('Not reachable');
const data = await res.json();
const arr = Array.isArray(data) ? data : (data.certificates || []);
const mine = arr.filter(c => c.email?.toLowerCase() === email.toLowerCase());
if (!mine.length) { el.innerHTML = '<p style="color:var(--dim);font-size:.78rem;">No issued certificates found for your account.</p>'; return; }
el.innerHTML = mine.map(cert => `
<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
<div style="width:42px;height:42px;border-radius:10px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-certificate" style="color:var(--c);font-size:.9rem;"></i></div>
<div style="flex:1;min-width:0;">
<p style="font-weight:600;font-size:.85rem;">${cert.course}</p>
<p style="font-size:.72rem;color:var(--dim);margin-top:2px;">${cert.type||'Certificate'}${cert.duration?' • '+cert.duration:''}${cert.issuedOn?' • '+cert.issuedOn:''}</p>
</div>
${cert.certId ? `<a href="certificate.html?id=${cert.certId}" style="padding:7px 14px;border-radius:8px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.25);color:var(--c);font-size:.72rem;font-weight:700;text-decoration:none;white-space:nowrap;"><i class="fas fa-external-link-alt" style="margin-right:3px;"></i>View</a>` : ''}
</div>`).join('');
} catch (e) {
el.innerHTML = `<p style="color:var(--dim);font-size:.78rem;">Certificate data unavailable — check your GitHub JSON file.</p>`;
}
}
async function loadInvoices(email) {
const el = document.getElementById('invoiceList');
if (!el) return;
el.innerHTML = '<p style="color:var(--dim);font-size:.78rem;">Loading billing records...</p>';
try {
const res = await fetch('https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json');
if (!res.ok) throw new Error('Not reachable');
const data = await res.json();
const arr = Array.isArray(data) ? data : (data.bills || []);
const mine = arr.filter(b => b.email?.toLowerCase() === email.toLowerCase());
if (!mine.length) { el.innerHTML = '<p style="color:var(--dim);font-size:.78rem;">No billing records found for your account.</p>'; return; }
el.innerHTML = mine.map(bill => `
<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
<div style="width:42px;height:42px;border-radius:10px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-receipt" style="color:#22c55e;font-size:.9rem;"></i></div>
<div style="flex:1;min-width:0;">
<p style="font-weight:600;font-size:.85rem;">${bill.course}</p>
<p style="font-size:.72rem;color:var(--dim);margin-top:2px;">₹${bill.amount} • ${bill.date}${bill.paymentMode?' • '+bill.paymentMode:''}</p>
</div>
${bill.verifyUrl ? `<a href="${bill.verifyUrl}" target="_blank" style="padding:7px 14px;border-radius:8px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:#22c55e;font-size:.72rem;font-weight:700;text-decoration:none;white-space:nowrap;"><i class="fas fa-check-circle" style="margin-right:3px;"></i>Verify</a>` : ''}
</div>`).join('');
} catch (e) {
el.innerHTML = `<p style="color:var(--dim);font-size:.78rem;">Billing data unavailable — check your GitHub JSON file.</p>`;
}
}
document.getElementById('saveProfile')?.addEventListener('click', async () => {
const user = auth.currentUser;
if (!user) return;
const name = document.getElementById('editName').value.trim();
const phone = document.getElementById('editPhone').value.trim();
if (!name) { toast('Name cannot be empty', 'err'); return; }
await updateDoc(doc(db, 'users', user.uid), { name, phone });
toast('Profile updated ✅', 'ok');
});
async function sendReset() {
const user = auth.currentUser;
if (!user) return;
await sendPasswordResetEmail(auth, user.email);
toast('Password reset email sent to ' + user.email, 'ok');
}
document.getElementById('resetPwBtn')?.addEventListener('click', sendReset);
document.getElementById('secResetBtn')?.addEventListener('click', sendReset);
document.getElementById('deleteAccBtn')?.addEventListener('click', async () => {
if (!confirm('Delete your account? This cannot be undone.')) return;
try { await deleteUser(auth.currentUser); window.location = 'login.html'; }
catch (e) { toast('Re-login and try again', 'err'); }
});
async function checkUnreadAnnouncements(userPurchased) {
try {
const snap = await getDocs(query(collection(db,'announcements'), orderBy('createdAt','desc'), limit(30)));
const seen = JSON.parse(localStorage.getItem(ANN_SEEN_KEY) || '[]');
let unread = 0;
snap.forEach(d => {
const a = d.data();
if (a.target === 'enrolled' && (!userPurchased || !userPurchased.length)) return;
if (!seen.includes(d.id)) unread++;
});
const dot = document.querySelector('.notif-dot');
if (dot) dot.style.display = unread > 0 ? '' : 'none';
} catch(_) {}
}
const ANN_SEEN_KEY = 'cb_ann_seen';
async function checkUnreadNotifications(userPurchased) {
try {
const snap = await getDocs(query(collection(db,'announcements'), orderBy('createdAt','desc'), limit(30)));
const seen = JSON.parse(localStorage.getItem(ANN_SEEN_KEY) || '[]');
let unread = 0;
snap.forEach(d => {
const a = d.data();
if (a.target === 'enrolled' && (!userPurchased || !userPurchased.length)) return;
if (!seen.includes(d.id)) unread++;
});
const dot = document.querySelector('.notif-dot');
if (dot) dot.style.display = unread > 0 ? '' : 'none';
} catch(_) {}
}
async function loadNotifications(userPurchased) {
const container = document.getElementById('notifList');
if (!container) return;
container.innerHTML = '<p style="color:var(--dim);font-size:.78rem;">Loading...</p>';
try {
const snap = await getDocs(query(collection(db,'announcements'), orderBy('createdAt','desc'), limit(30)));
const seen = JSON.parse(localStorage.getItem(ANN_SEEN_KEY) || '[]');
const typeConfig = {
info: { icon:'fas fa-info-circle', color:'#06b6d4', bg:'rgba(6,182,212,.07)', border:'rgba(6,182,212,.18)' },
success: { icon:'fas fa-check-circle', color:'#22c55e', bg:'rgba(34,197,94,.07)', border:'rgba(34,197,94,.18)' },
warning: { icon:'fas fa-exclamation-triangle', color:'#f59e0b', bg:'rgba(245,158,11,.07)', border:'rgba(245,158,11,.18)' },
alert: { icon:'fas fa-exclamation-circle', color:'#f87171', bg:'rgba(239,68,68,.07)', border:'rgba(239,68,68,.18)' }
};
const announcements = [];
snap.forEach(d => {
const a = d.data();
if (a.target === 'enrolled' && (!userPurchased || !userPurchased.length)) return;
announcements.push({ id: d.id, ...a });
});
const unread = announcements.filter(a => !seen.includes(a.id)).length;
const dot = document.querySelector('.notif-dot');
if (dot) {
dot.style.display = unread > 0 ? '' : 'none';
dot.style.background = '#f87171';
}
if (!announcements.length) {
container.innerHTML = `
<div class="card">
<div style="display:flex;gap:10px;align-items:flex-start;">
<div style="width:36px;height:36px;border-radius:9px;background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
<i class="fas fa-bell" style="color:var(--c);font-size:.85rem;"></i>
</div>
<div>
<p style="font-size:.82rem;font-weight:600;margin-bottom:3px;">Welcome to Cyber Buddy Academy!</p>
<p style="font-size:.74rem;color:var(--dim);line-height:1.5;">Start your cybersecurity journey. Explore courses and contact your admin to get enrolled.</p>
</div>
</div>
</div>`;
return;
}
container.innerHTML = announcements.map(a => {
const cfg = typeConfig[a.type] || typeConfig.info;
const ts = a.createdAt?.toDate?.()?.toLocaleString() || '';
const isNew = !seen.includes(a.id);
return `
<div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:10px;padding:14px 16px;position:relative;">
${isNew ? `<span style="position:absolute;top:10px;right:12px;font-size:.6rem;font-weight:700;background:${cfg.color};color:#000;padding:2px 7px;border-radius:99px;">NEW</span>` : ''}
<div style="display:flex;gap:10px;align-items:flex-start;">
<i class="${cfg.icon}" style="color:${cfg.color};margin-top:2px;flex-shrink:0;font-size:1rem;"></i>
<div>
<p style="font-size:.84rem;font-weight:700;margin-bottom:4px;padding-right:40px;">${a.title||'Announcement'}</p>
<p style="font-size:.76rem;color:var(--dim);line-height:1.55;">${a.message||''}</p>
${ts ? `<p style="font-size:.65rem;color:var(--dim);margin-top:5px;">${ts}</p>` : ''}
</div>
</div>
</div>`;
}).join('');
const allIds = announcements.map(a => a.id);
localStorage.setItem(ANN_SEEN_KEY, JSON.stringify([...new Set([...seen, ...allIds])]));
if (dot) dot.style.display = 'none';
} catch(e) {
container.innerHTML = `<p style="color:var(--dim);font-size:.78rem;">Could not load notifications.</p>`;
}
}
window._loadNotifs = () => loadNotifications(userData?.purchasedCourses || []);
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
try { await signOut(auth); } catch(_) {}
window.location = 'login.html';
});