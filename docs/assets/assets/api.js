// Pemanggil API Apps Script + utilitas kecil yang dipakai halaman publik & admin.

function apiMsg_(en, id) {
  const l = (window.LANG || document.documentElement.lang || '').slice(0, 2);
  return l === 'id' ? id : en;
}

async function api(action, payload, token) {
  const url = (window.APP_CONFIG || {}).API_URL || '';
  if (!url || url.indexOf('GANTI_DENGAN') >= 0) {
    throw new Error(apiMsg_('API_URL is not set in assets/config.js', 'API_URL belum diatur di assets/config.js'));
  }
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      // text/plain = "simple request" → tanpa CORS preflight (wajib untuk Apps Script)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload || {}, token: token || null }),
      redirect: 'follow',
    });
  } catch (e) {
    throw new Error(apiMsg_('Cannot connect to the server. Please check your internet connection.', 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda.'));
  }
  let json;
  try { json = await res.json(); } catch (e) { throw new Error(apiMsg_('Invalid server response. Please try again later.', 'Respons server tidak valid. Pastikan Web App sudah di-deploy dengan akses "Anyone".')); }
  if (!json.ok) {
    const err = new Error(json.error || 'Terjadi kesalahan.');
    err.code = json.code;
    throw err;
  }
  return json.data;
}

function rupiah(n) {
  return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

function tglIndo(s, withDay) {
  const d = parseYmd(s);
  if (!d) return s || '-';
  return (withDay ? HARI_ID[d.getDay()] + ', ' : '') + d.getDate() + ' ' + BULAN_ID[d.getMonth()] + ' ' + d.getFullYear();
}

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function toast(msg, type) {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.classList.add('hide'), 4200);
  setTimeout(() => t.remove(), 4800);
}

function setLoading(btn, on, text) {
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span>' + (text || apiMsg_('Processing…', 'Memproses…'));
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}
