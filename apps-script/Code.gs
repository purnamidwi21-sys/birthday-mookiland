/**
 * ============================================================
 *  MOOKILAND BIRTHDAY – Backend API (Google Apps Script)
 * ============================================================
 *  Router utama. Semua request dari frontend (GitHub Pages)
 *  dikirim sebagai POST berisi JSON: { action, payload, token }.
 *
 *  Content-Type yang dipakai frontend adalah "text/plain" agar
 *  browser tidak melakukan CORS preflight (Apps Script tidak
 *  mendukung OPTIONS).
 * ============================================================
 */

const ROUTES = {
  // ---------- Publik (tanpa login) ----------
  getPackages:        { fn: () => getPackages_() },
  estimate:           { fn: (p) => calcEstimate_(p) },
  getAvailability:    { fn: (p) => getAvailability_(p) },
  createBooking:      { fn: (p) => createBooking_(p) },
  login:              { fn: (p) => login_(p) },

  // ---------- Admin (wajib token login) ----------
  me:                 { admin: true, fn: (p, s) => s },
  logout:             { admin: true, fn: (p, s, body) => logout_(body.token) },
  listBookings:       { admin: true, fn: (p) => listBookings_(p) },
  getBooking:         { admin: true, fn: (p) => getBookingDetail_(p.bookingId) },
  updateStatus:       { admin: true, fn: (p, s) => updateStatus_(p, s) },
  resendConfirmation: { admin: true, fn: (p) => resendConfirmation_(p.bookingId) },
  sendProforma:       { admin: true, fn: (p) => sendProformaById_(p.bookingId) },
  recordPayment:      { admin: true, fn: (p, s) => recordPayment_(p, s) },
  adjustPrice:        { admin: true, fn: (p, s) => adjustPrice_(p, s) },
  sendPaidInvoice:    { admin: true, fn: (p) => sendPaidInvoiceById_(p.bookingId) },
  dashboard:          { admin: true, fn: (p) => dashboard_(p) },
  sendReport:         { admin: true, fn: (p, s) => sendReport_(p, s) },
  changePassword:     { admin: true, fn: (p, s) => changePassword_(p, s) },
};

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const body = JSON.parse(raw);
    const route = ROUTES[body.action];
    if (!route) throw new Error('Aksi tidak dikenal: ' + body.action);

    let session = null;
    if (route.admin) session = requireAdmin_(body.token);

    const data = route.fn(body.payload || {}, session, body);
    return json_({ ok: true, data: data });
  } catch (err) {
    if (err && err.code === 401) console.warn('401: ' + err.message);
    else console.warn(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err), code: err.code || 400 });
  }
}

/** GET dipakai untuk cek API hidup & mengambil daftar paket (opsional). */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    if (action === 'packages') return json_({ ok: true, data: getPackages_() });
    return json_({ ok: true, data: { app: 'Mookiland Birthday API', status: 'online', time: new Date() } });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
