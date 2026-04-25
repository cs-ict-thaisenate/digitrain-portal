// ============================================================
// DigiTrain Frontend — api.js
// API client สำหรับ GAS backend
// ============================================================

const API = (() => {
  async function call(action, body = {}, method = 'POST') {
    const token = Auth.getToken();
    const url   = DigiTrain.GAS_URL;

    let fetchUrl = url + '?action=' + encodeURIComponent(action);
    if (token) fetchUrl += '&token=' + encodeURIComponent(token);

    const opts = {
      method,
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' }
    };

    if (method === 'POST' && Object.keys(body).length > 0) {
      if (token) body.token = token;
      opts.body = JSON.stringify(body);
    }

    const resp = await fetch(fetchUrl, opts);
    const data = await resp.json();

    if (!data.success) {
      const err = new Error(data.error || 'เกิดข้อผิดพลาด');
      err.code  = data.code || 'UNKNOWN';
      throw err;
    }

    return data;
  }

  // GET helper
  async function get(action, params = {}) {
    const token = Auth.getToken();
    let url = DigiTrain.GAS_URL + '?action=' + encodeURIComponent(action);
    if (token) url += '&token=' + encodeURIComponent(token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null)
        url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
    });
    const resp = await fetch(url, { redirect: 'follow' });
    const data = await resp.json();
    if (!data.success) {
      const err = new Error(data.error || 'เกิดข้อผิดพลาด');
      err.code = data.code || 'UNKNOWN';
      throw err;
    }
    return data;
  }

  return {
    // ── Public ───────────────────────────────────────────────
    getConfig:      ()       => get('getConfig'),
    getCourses:     (p={})   => get('getCourses', p),
    getSchedules:   (p={})   => get('getSchedules', p),

    // ── Auth ─────────────────────────────────────────────────
    register:       (d)      => call('register', d),
    login:          (e, p)   => call('login',    { email: e, password: p }),
    verifyEmail:    (tok)    => get('verifyEmail', { token: tok }),
    resendVerify:   (email)  => call('resendVerification', { email }),

    // ── User ─────────────────────────────────────────────────
    getMe:              ()   => get('getMe'),
    updateMe:           (d)  => call('updateMe', d),
    getMyRegistrations: ()   => get('getMyRegistrations'),
    registerCourse:     (sid)=> call('registerCourse',     { schedule_id: sid }),
    cancelRegistration: (rid)=> call('cancelRegistration', { reg_id: rid }),
    confirmWaitlist:    (rid)=> call('confirmWaitlistOffer',{ reg_id: rid }),

    // ── Admin: Config ─────────────────────────────────────────
    adminGetConfig:    ()       => get('admin_getConfig'),
    adminUpdateConfig: (k, v)   => call('admin_updateConfig', { key: k, value: v }),

    // ── Admin: Courses ────────────────────────────────────────
    adminGetCourses:    ()      => get('admin_getCourses'),
    adminCreateCourse:  (d)     => call('admin_createCourse', d),
    adminUpdateCourse:  (id, d) => call('admin_updateCourse', { course_id: id, ...d }),

    // ── Admin: Schedules ──────────────────────────────────────
    adminGetSchedules:    ()      => get('admin_getSchedules'),
    adminCreateSchedule:  (d)     => call('admin_createSchedule', d),
    adminUpdateSchedule:  (id, d) => call('admin_updateSchedule', { schedule_id: id, ...d }),
    adminCancelSchedule:  (id, r) => call('admin_cancelSchedule', { schedule_id: id, reason: r }),
    adminGetScheduleStats:(id)    => get('admin_getScheduleStats', { schedule_id: id }),

    // ── Admin: Registrations ──────────────────────────────────
    adminGetRegistrations:   (sid) => get('admin_getRegistrations', { schedule_id: sid }),
    adminCancelRegistration: (rid, reason) => call('admin_cancelRegistration', { reg_id: rid, reason }),
    adminApproveRegistration:(rid) => call('admin_approveRegistration', { reg_id: rid }),
    adminAssignDelivery:     (rid, mode) => call('admin_assignDelivery', { reg_id: rid, delivery_mode: mode }),
    adminPromoteWaitlist:    (sid, rid=null) => call('admin_promoteWaitlist', { schedule_id: sid, reg_id: rid }),

    // ── Admin: Users ──────────────────────────────────────────
    adminGetUsers:        (p={})      => get('admin_getUsers', p),
    adminUpdateUserQuota: (uid, q)    => call('admin_updateUserQuota', { user_id: uid, quota_override: q }),
    adminResetApproval:   (uid, sid)  => call('admin_resetUserApproval', { user_id: uid, schedule_id: sid }),

    // ── Admin: Check-in ───────────────────────────────────────
    adminGetCheckinSlots:   (sid) => get('admin_getCheckinSlots', { schedule_id: sid }),
    adminCreateCheckinSlot: (d)   => call('admin_createCheckinSlot', d),
    adminUpdateCheckinSlot: (id,d)=> call('admin_updateCheckinSlot', { slot_id: id, ...d }),
    adminCheckin:           (qr, slotId) => call('admin_checkin', { qr_data: qr, slot_id: slotId }),
    adminGetCheckinLog:     (sid) => get('admin_getCheckinLog',  { schedule_id: sid }),

    // ── Admin: Certificates ───────────────────────────────────
    adminGetCertificates:  (sid) => get('admin_getCertificates', { schedule_id: sid }),
    adminApproveCert:      (rid) => call('admin_approveCert',    { reg_id: rid }),
    adminBatchIssueCerts:  (sid) => call('admin_batchIssueCerts',{ schedule_id: sid }),
  };
})();

// ============================================================
// Auth — token management
// ============================================================
const Auth = (() => {
  const KEY  = 'dt_token';
  const UKEY = 'dt_user';

  return {
    getToken:  ()        => localStorage.getItem(KEY),
    getUser:   ()        => { try { return JSON.parse(localStorage.getItem(UKEY)); } catch { return null; } },
    isLoggedIn:()        => !!localStorage.getItem(KEY),
    isAdmin:   ()        => { const u = Auth.getUser(); return u && u.role === 'admin'; },

    save: (token, user)  => {
      localStorage.setItem(KEY, token);
      localStorage.setItem(UKEY, JSON.stringify(user));
    },
    clear: () => {
      localStorage.removeItem(KEY);
      localStorage.removeItem(UKEY);
    }
  };
})();

// ============================================================
// UI Helpers — toast, loading, modal
// ============================================================
const UI = (() => {
  // Toast
  function toast(title, msg, type = 'success', duration = 4500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const colors = { success:'#16a34a', error:'#dc2626', info:'#1e4fa0', warning:'#d97706' };
    const el = document.createElement('div');
    el.style.cssText = `background:white;border-radius:10px;box-shadow:0 8px 30px rgba(13,33,72,.18);
      padding:14px 18px;display:flex;align-items:flex-start;gap:12px;min-width:300px;max-width:400px;
      border-left:4px solid ${colors[type]||colors.info};animation:dtSlideIn .3s cubic-bezier(.175,.885,.32,1.275)`;
    el.innerHTML = `
      <div style="width:24px;height:24px;border-radius:50%;background:${colors[type]}22;
        display:flex;align-items:center;justify-content:center;font-size:13px;
        color:${colors[type]};font-weight:700;flex-shrink:0;margin-top:1px">${icons[type]||'ℹ'}</div>
      <div><div style="font-weight:700;font-size:14px;color:#1a2744;margin-bottom:2px">${title}</div>
      <div style="font-size:13px;color:#64748b">${msg||''}</div></div>`;
    container.appendChild(el);
    setTimeout(() => { el.style.animation='dtSlideIn .3s reverse'; setTimeout(()=>el.remove(), 280); }, duration);
  }

  // Loading overlay on button
  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn._origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> กำลังดำเนินการ...';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn._origText || btn.innerHTML;
    }
  }

  // Modal open/close
  function openModal(id)  { document.getElementById(id)?.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow=''; }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }

  // Format Thai Date
  function thaiDate(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return isoStr; }
  }

  // Format Thai DateTime
  function thaiDateTime(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  }

  // Status badge HTML
  function statusBadge(status) {
    const map = {
      confirmed:        { cls: 'status-open',   label: 'ยืนยันแล้ว' },
      waitlist:         { cls: 'status-soon',    label: 'รายชื่อสำรอง' },
      waitlist_offered: { cls: 'status-soon',    label: '⚡ รอยืนยันสิทธิ์' },
      pending_approval: { cls: 'status-soon',    label: 'รออนุมัติ' },
      cancelled:        { cls: 'status-done',    label: 'ยกเลิกแล้ว' },
      active:           { cls: 'status-open',    label: 'เปิดรับ' },
      full:             { cls: 'status-full',    label: 'เต็มแล้ว' },
      closed:           { cls: 'status-done',    label: 'ปิดรับสมัคร' },
      not_issued:       { cls: 'status-done',    label: 'ยังไม่ออก' },
      approved:         { cls: 'status-soon',    label: 'อนุมัติแล้ว' },
      issued:           { cls: 'status-open',    label: 'ออกแล้ว' },
    };
    const s = map[status] || { cls: 'status-done', label: status };
    return `<span class="status-badge ${s.cls}">${s.label}</span>`;
  }

  // Seat bar HTML
  function seatBar(used, cap, unlimited = false) {
    if (unlimited) return `<span style="font-size:12px;color:var(--success)">ไม่จำกัดที่นั่ง</span>`;
    const pct   = cap > 0 ? Math.round(used / cap * 100) : 0;
    const avail = cap - used;
    const cls   = pct >= 100 ? 'seat-full' : pct >= 80 ? 'seat-warn' : 'seat-ok';
    const text  = avail <= 0 ? 'เต็มแล้ว' : `ว่าง ${avail}/${cap}`;
    return `<div class="seat-bar-wrap ${cls}">
      <div class="seat-bar"><div class="seat-fill" style="width:${Math.min(pct,100)}%"></div></div>
      <span class="seat-text">${text}</span></div>`;
  }

  // Escape HTML
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { toast, setLoading, openModal, closeModal, closeAllModals, thaiDate, thaiDateTime, statusBadge, seatBar, esc };
})();
