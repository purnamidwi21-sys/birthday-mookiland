/**
 * Helper "database" berbasis Google Sheet + utilitas format.
 * Setiap sheet dibaca berdasarkan NAMA KOLOM di baris 1, jadi
 * urutan kolom boleh diubah selama nama header tetap sama.
 */

const SHEETS = {
  PAKET: 'Paket',
  LOKASI: 'Lokasi',
  ADDON: 'AddOn',
  MENU: 'MenuBuffet',
  LIBUR: 'HariLibur',
  BOOKING: 'Booking',
  BAYAR: 'Pembayaran',
  ADMIN: 'Admin',
  SETTINGS: 'Settings',
  LOG: 'LogEmail',
};

const STATUS = {
  MENUNGGU: 'Menunggu Pembayaran',
  DP: 'DP Diterima',
  LUNAS: 'Lunas',
  SELESAI: 'Selesai',
  BATAL: 'Batal',
};

// ---------------- Akses sheet ----------------

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan fungsi setup() terlebih dahulu.');
  return sh;
}

function headers_(name) {
  const sh = sheet_(name);
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
}

/** Membaca seluruh baris sheet menjadi array objek { Header: nilai, _row: nomorBaris }. */
function readTable_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (r.every(v => v === '' || v === null)) continue;
    const o = { _row: i + 1 };
    headers.forEach((h, j) => { if (h) o[h] = r[j]; });
    out.push(o);
  }
  return out;
}

/** Menambah baris baru; kunci objek = nama header. */
function appendObj_(name, obj) {
  const sh = sheet_(name);
  const h = headers_(name);
  sh.appendRow(h.map(k => (obj[k] !== undefined && obj[k] !== null) ? obj[k] : ''));
  return sh.getLastRow();
}

/** Mengubah sel tertentu saja (bukan seluruh baris) agar format teks lain tidak rusak. */
function updateObj_(name, row, obj) {
  const sh = sheet_(name);
  const h = headers_(name);
  Object.keys(obj).forEach(k => {
    const c = h.indexOf(k);
    if (c >= 0) sh.getRange(row, c + 1).setValue(obj[k]);
  });
}

function findBy_(name, key, value) {
  return readTable_(name).find(o => String(o[key]).trim() === String(value).trim()) || null;
}

function getSettings_() {
  const s = {};
  readTable_(SHEETS.SETTINGS).forEach(r => {
    const k = String(r.Key || '').trim();
    if (k) s[k] = r.Value;
  });
  return s;
}

// ---------------- Konversi & validasi ----------------

function num_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = Number(String(v == null ? '' : v).replace(/[^\d-]/g, ''));
  return isFinite(n) ? n : 0;
}

function isTrue_(v) {
  return v === true || /^(true|ya|yes|1|aktif)$/i.test(String(v).trim());
}

/** Simpan sebagai teks murni (awalan apostrof) agar Sheet tidak mengubah 0812.. / tanggal / rumus. */
function txt_(v, max) {
  const s = String(v == null ? '' : v).trim().slice(0, max || 500);
  return s ? "'" + s : '';
}

function isEmail_(e) {
  return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(String(e || '').trim());
}

function tz_() {
  return Session.getScriptTimeZone() || 'Asia/Makassar';
}

function toDateStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  return String(v).trim().slice(0, 10);
}

function toTimeStr_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'HH:mm');
  return String(v).trim();
}

function fmtDateTime_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd HH:mm');
  return String(v);
}

function parseYmd_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

function addDays_(d, n) {
  return new Date(d.getTime() + n * 86400000);
}

const HARI_ = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "Sabtu, 21 November 2026" */
function tglIndo_(v) {
  const d = parseYmd_(toDateStr_(v));
  if (!d) return String(v || '-');
  return HARI_[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_[d.getMonth()] + ' ' + d.getFullYear();
}

/** "21 Nov 2026" */
function tglPendek_(v) {
  const d = parseYmd_(toDateStr_(v));
  if (!d) return String(v || '-');
  return d.getDate() + ' ' + BULAN_[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
}

const DAY_EN_ = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_EN_ = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Saturday, 21 November 2026" – untuk email/invoice pelanggan */
function tglEn_(v) {
  const d = parseYmd_(toDateStr_(v));
  if (!d) return String(v || '-');
  return DAY_EN_[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_EN_[d.getMonth()] + ' ' + d.getFullYear();
}

/** "21 Nov 2026" */
function tglPendekEn_(v) {
  const d = parseYmd_(toDateStr_(v));
  if (!d) return String(v || '-');
  return d.getDate() + ' ' + MONTH_EN_[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
}

/** "14:30" → 870 menit */
function toMin_(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

function fromMin_(min) {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2);
}

function rp_(n) {
  const v = Math.round(Number(n) || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-Rp ' : 'Rp ') + s;
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nl2br_(s) {
  return esc_(s).replace(/\r?\n/g, '<br>');
}
