// Progress saved on this device only (localStorage). Nothing leaves the device.
const KEY = 'kipina.v1';
let state = null;

function defaults() {
  return {
    profiles: {
      leo: { id: 'leo', name: 'Leo', gen: 'Leon', level: 'leo', avatar: '🦁', color: '#3b82f6', lang: 'fi', setup: false, skills: {}, missed: [], months: {} },
      lili: { id: 'lili', name: 'Lili', gen: 'Lilin', level: 'lili', avatar: '🐰', color: '#ec4899', lang: 'fi', setup: false, skills: {}, missed: [], months: {} },
    },
    settings: { rate: 0.9, month: null },
    together: {},
  };
}

function merge(saved) {
  const d = defaults();
  return saved ? { ...d, ...saved, profiles: { leo: { ...d.profiles.leo, ...saved.profiles?.leo }, lili: { ...d.profiles.lili, ...saved.profiles?.lili } }, settings: { ...d.settings, ...saved.settings } } : d;
}
export function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* private mode etc. */ }
  state = merge(saved);
  return state;
}
export const S = () => state;
function writeLocal() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }

// ---- Cloud copy (only when running as a claude.ai artifact) ----
// Progress is also kept in the signed-in parent's private space, so it survives a cleared browser
// and follows the account to another device. Without it, the game simply uses this device only.
let remote = null, writing = false, dirty = false, timer = null;
function push() {
  if (!remote) return;
  if (writing) { dirty = true; return; }
  writing = true;
  remote.set(JSON.parse(JSON.stringify(state))).catch(() => {}).finally(() => {
    writing = false;
    if (dirty) { dirty = false; push(); }
  });
}
export async function connectCloud(onRemoteNewer) {
  try {
    let c = window.claude;
    for (let i = 0; i < 10 && !c?.use; i++) { await new Promise(r => setTimeout(r, 300)); c = window.claude; }
    if (!c?.use) return false;
    const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
    if (!db || !user) return false;
    const id = await user.id();
    if (!id) return false;
    remote = db.doc(`data/users/${id}/kipina`);
    const snap = await remote.get();
    const data = snap.exists ? snap.data() : null;
    if (data && (data.savedAt || 0) > (state.savedAt || 0)) {
      state = merge(JSON.parse(JSON.stringify(data)));
      writeLocal();
      onRemoteNewer();
    } else if (state.savedAt && (!data || state.savedAt > (data.savedAt || 0))) push();
    return true;
  } catch { remote = null; return false; }
}

export function save() {
  state.savedAt = Date.now();
  writeLocal();
  clearTimeout(timer);
  timer = setTimeout(push, 1500); // one cloud write per pause
}
export function resetProfile(id) {
  const d = defaults().profiles[id];
  const p = state.profiles[id];
  state.profiles[id] = { ...d, avatar: p.avatar, color: p.color, lang: p.lang, setup: p.setup };
  save();
}
export function mstate(p, month) { return (p.months[month] ||= { days: {} }); }
export function dstate(p, month, d) { const m = mstate(p, month); return (m.days[d] ||= { off: {} }); }
