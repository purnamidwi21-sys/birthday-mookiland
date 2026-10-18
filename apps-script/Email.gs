/**
 * Template & pengiriman email + dokumen PDF (proforma & invoice).
 * Email & PDF untuk PELANGGAN memakai bahasa yang dipilih pelanggan saat booking
 * (kolom BahasaPelanggan: EN / ID). Teks ada di I18n.gs.
 * Notifikasi internal admin berbahasa Indonesia.
 * Kuota MailApp: ±100 email/hari (Gmail biasa), ±1.500/hari (Google Workspace).
 */

const BRAND_ = '#1d5b2c';   // hijau jungle
const ACCENT_ = '#f37021';  // oranye

// ======================= PENGIRIMAN =======================

function sendMail_(o) {
  const s = getSettings_();
  const opts = { to: o.to, subject: o.subject, htmlBody: o.html, name: String(s.NAMA_EO || 'Mookiland Bali') };
  if (o.attachments && o.attachments.length) opts.attachments = o.attachments;
  if (isEmail_(s.EMAIL_EO)) opts.replyTo = String(s.EMAIL_EO).trim();
  try {
    MailApp.sendEmail(opts);
    logEmail_(o.bookingId, o.jenis, o.to, 'Terkirim', o.lang ? 'Bahasa ' + String(o.lang).toUpperCase() : '');
    return true;
  } catch (err) {
    logEmail_(o.bookingId, o.jenis, o.to, 'Gagal', err.message);
    console.error('Email gagal: ' + err.message);
    return false;
  }
}

function logEmail_(bookingId, jenis, to, status, ket) {
  try {
    appendObj_(SHEETS.LOG, {
      Waktu: new Date(), BookingID: bookingId || '-', Jenis: jenis, Penerima: txt_(to, 300),
      Status: txt_(status, 100), Keterangan: txt_(ket, 300),
    });
  } catch (e) { console.error(e); }
}

function makePdf_(html, name) {
  return Utilities.newBlob(html, MimeType.HTML, name + '.html').getAs(MimeType.PDF).setName(name + '.pdf');
}

function waLink_() {
  const n = String(getSettings_().TELP_EO || '').replace(/\D/g, '');
  return n ? 'https://wa.me/' + n : '';
}

/** Aturan & syarat sesuai bahasa (fallback ke English bila versi ID kosong). */
function rulesL_(lang) {
  const s = getSettings_();
  return splitList_(lang_(lang) === 'id' && s.RULES_ID ? s.RULES_ID : s.RULES, /\r?\n/);
}
function syaratL_(lang) {
  const s = getSettings_();
  return String(lang_(lang) === 'id' && s.SYARAT_ID ? s.SYARAT_ID : (s.SYARAT || ''));
}

/** Menu buffet disimpan dengan nama Inggris; tampilkan versi Indonesia bila ada. */
function menuL_(menuStr, lang) {
  if (!menuStr || lang_(lang) !== 'id') return menuStr;
  const map = {};
  readTable_(SHEETS.MENU).forEach(r => { map[String(r.Nama)] = String(r.NamaID || r.Nama); });
  return String(menuStr).split(',').map(x => x.trim()).filter(Boolean).map(x => map[x] || x).join(', ');
}

// ======================= KOMPONEN TEMPLATE =======================

function layout_(judul, isi) {
  const s = getSettings_();
  const logo = s.LOGO_URL ? '<img src="' + esc_(s.LOGO_URL) + '" alt="' + esc_(s.NAMA_EO) + '" height="54" style="display:block;margin-bottom:6px">'
    : '<div style="font-size:22px;font-weight:bold">' + esc_(s.NAMA_EO) + '</div>';
  const wa = waLink_();
  return '' +
    '<div style="background:#eef3e6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d9e5cf">' +
      '<div style="background:' + BRAND_ + ';color:#ffffff;padding:20px 26px">' + logo +
        '<div style="display:inline-block;background:' + ACCENT_ + ';color:#fff;font-size:12px;font-weight:bold;padding:4px 10px;border-radius:6px;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">' + esc_(judul) + '</div>' +
      '</div>' +
      '<div style="padding:24px 26px;color:#1f2d1f;font-size:14px;line-height:1.6">' + isi + '</div>' +
      '<div style="padding:16px 26px;background:#f5f8f0;color:#5d6b5d;font-size:12px;line-height:1.6">' +
        '<b>' + esc_(s.NAMA_EO) + '</b> · ' + esc_(s.ALAMAT_EO) + '<br>' +
        'WhatsApp ' + esc_(s.KONTAK_NAMA) + ': ' + (wa ? '<a href="' + wa + '" style="color:' + BRAND_ + '">' + esc_(s.TELP_EO) + '</a>' : esc_(s.TELP_EO)) +
        (s.WEBSITE ? ' · <a href="https://' + esc_(String(s.WEBSITE).replace(/^https?:\/\//, '')) + '" style="color:' + BRAND_ + '">' + esc_(s.WEBSITE) + '</a>' : '') +
      '</div>' +
    '</div></div>';
}

function infoTable_(rows) {
  return '<table style="width:100%;border-collapse:collapse;margin:12px 0">' + rows.filter(r => r[1] !== '' && r[1] != null).map(r =>
    '<tr><td style="padding:5px 0;color:#5d6b5d;width:40%;vertical-align:top">' + esc_(r[0]) + '</td>' +
    '<td style="padding:5px 0;font-weight:bold;vertical-align:top">' + esc_(r[1]) + '</td></tr>').join('') + '</table>';
}

function partyDetails_(b) {
  const L = b.lang;
  return infoTable_([
    [tx_(L, 'bookingNo'), b.id],
    [tx_(L, 'birthdayChild'), b.namaAnak + (b.usia ? ' (' + tx_(L, 'turning', { n: b.usia }) + ')' : '')],
    [tx_(L, 'date'), tglL_(b.tglAcara, L)],
    [tx_(L, 'time'), b.jam + (b.jamSelesai ? ' – ' + b.jamSelesai : '')],
    [tx_(L, 'spot'), b.lokasiNama],
    [tx_(L, 'rate'), b.rincian.tipeLabel || b.tipeHari],
    [tx_(L, 'guests'), tx_(L, 'guestsVal', { a: b.jumlahAnak, d: b.jumlahDewasa })],
    [tx_(L, 'buffet'), menuL_(b.menu, L) || tx_(L, 'toBeChosen')],
    [tx_(L, 'theme'), b.tema],
    [tx_(L, 'entLang'), b.bahasa],
  ]);
}

function costTable_(b) {
  const L = b.lang;
  const td = 'padding:8px;border-bottom:1px solid #e6ece0;';
  let h = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px">' +
    '<tr style="background:#eef3e6"><th style="text-align:left;padding:8px">' + tx_(L, 'item') + '</th><th style="padding:8px">' + tx_(L, 'qty') + '</th>' +
    '<th style="text-align:right;padding:8px">' + tx_(L, 'price') + '</th><th style="text-align:right;padding:8px">' + tx_(L, 'amount') + '</th></tr>';
  (b.rincian.lines || []).forEach(l => {
    h += '<tr><td style="' + td + '">' + esc_(l.desc) + '</td><td style="' + td + 'text-align:center">' + l.qty + '</td>' +
      '<td style="' + td + 'text-align:right">' + rp_(l.harga) + '</td><td style="' + td + 'text-align:right">' + rp_(l.total) + '</td></tr>';
  });
  const row = (label, val, bold) => '<tr><td colspan="3" style="padding:6px 8px;text-align:right;' + (bold ? 'font-weight:bold;font-size:15px' : 'color:#5d6b5d') + '">' +
    label + '</td><td style="padding:6px 8px;text-align:right;white-space:nowrap;' + (bold ? 'font-weight:bold;font-size:15px;color:' + BRAND_ : '') + '">' + rp_(val) + '</td></tr>';
  h += row(tx_(L, 'subtotal'), b.subtotal);
  if (b.pajak) h += row(esc_(tx_(L, 'tax', { n: b.rincian.pajakPersen })), b.pajak);
  h += row(tx_(L, 'total'), b.total, true);
  if (b.dibayar > 0) { h += row(tx_(L, 'paid'), b.dibayar); h += row(tx_(L, 'balance'), b.sisa, true); }
  h += '</table>';
  if ((b.rincian.notes || []).length) {
    h += '<div style="font-size:12px;color:#5d6b5d;margin:-4px 0 10px">' + b.rincian.notes.map(n => '• ' + esc_(n)).join('<br>') + '</div>';
  }
  return h;
}

function bankBox_(L) {
  const s = getSettings_();
  if (!s.REKENING) return '';
  return '<div style="background:#fff4e8;border-left:4px solid ' + ACCENT_ + ';border-radius:8px;padding:14px 16px;margin:14px 0">' +
    '<div style="font-weight:bold;margin-bottom:4px">' + tx_(L, 'bankTitle') + '</div>' + nl2br_(s.REKENING) +
    '<div style="font-size:12px;color:#8a4b14;margin-top:6px">' + tx_(L, 'bankNote') + '</div></div>';
}

function rulesBox_(L) {
  const rules = rulesL_(L);
  if (!rules.length) return '';
  return '<div style="background:#f5f8f0;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:12px;color:#3d4b3d">' +
    '<b style="font-size:13px">' + tx_(L, 'reminders') + '</b><br>' + rules.map(r => '• ' + esc_(r)).join('<br>') + '</div>';
}

function dueDate_(b) {
  const s = getSettings_();
  const booked = parseYmd_(String(b.tglBooking).slice(0, 10)) || new Date();
  let due = addDays_(booked, num_(s.JATUH_TEMPO_DP_HARI) || 3);
  const acara = parseYmd_(b.tglAcara);
  if (acara && due >= acara) due = addDays_(acara, -1);
  return due;
}

function balanceDate_(b) {
  const acara = parseYmd_(b.tglAcara);
  return acara ? addDays_(acara, -(num_(getSettings_().PELUNASAN_H_MINUS) || 0)) : null;
}

function signoff_(L) {
  const s = getSettings_();
  return '<p>' + esc_(tx_(L, 'questions', { k: s.KONTAK_NAMA || 'us', t: s.TELP_EO })) + '</p>' +
    '<p>' + tx_(L, 'seeYou') + '<br><b>' + esc_(tx_(L, 'team', { x: s.NAMA_EO })) + '</b></p>';
}

function greet_(b) {
  return '<p>' + tx_(b.lang, 'hi') + ' <b>' + esc_(b.nama) + '</b>,</p>';
}

// ======================= 4. KONFIRMASI BOOKING =======================

function emailConfirmation_(b) {
  const s = getSettings_();
  const L = b.lang;
  const isi = greet_(b) +
    '<p>' + tx_(L, 'confIntro', { eo: esc_(s.NAMA_EO), c: esc_(b.namaAnak) }) + '</p>' +
    partyDetails_(b) +
    '<h3 style="margin:18px 0 4px;font-size:15px;color:' + BRAND_ + '">' + tx_(L, 'costEstimate') + '</h3>' + costTable_(b) +
    '<p>' + tx_(L, 'depositNeed', { dp: rp_(b.dp) }) + ' ' +
    tx_(L, isTrue_(s.AUTO_PROFORMA) ? 'proformaSent' : 'proformaSoon') + ' ' + tx_(L, 'availability') + '</p>' +
    (b.catatan ? '<p style="color:#5d6b5d"><i>' + tx_(L, 'yourNotes') + ': ' + esc_(b.catatan) + '</i></p>' : '') +
    rulesBox_(L) + signoff_(L);
  return sendMail_({
    bookingId: b.id, jenis: 'Konfirmasi Booking', to: b.email, lang: L,
    subject: tx_(L, 'confSubject', { id: b.id, c: b.namaAnak, eo: s.NAMA_EO }),
    html: layout_(tx_(L, 'confTitle'), isi),
  });
}

// ======================= 5. PROFORMA INVOICE =======================

function sendProforma_(b) {
  const s = getSettings_();
  const L = b.lang;
  const no = 'PI-' + b.id;
  const kurangDP = Math.max(0, b.dp - b.dibayar);
  const ajakan = kurangDP > 0
    ? tx_(L, 'payDeposit', { x: rp_(kurangDP), d: tglL_(dueDate_(b), L) })
    : tx_(L, 'depositReceived', { x: rp_(b.sisa), d: tglL_(balanceDate_(b), L) });
  const isi = greet_(b) +
    '<p>' + tx_(L, 'proIntro', { no: no, c: esc_(b.namaAnak), d: tglL_(b.tglAcara, L) }) + '</p>' +
    costTable_(b) + '<p>' + ajakan + '</p>' + bankBox_(L) + signoff_(L);
  const ok = sendMail_({
    bookingId: b.id, jenis: 'Proforma Invoice', to: b.email, lang: L,
    subject: tx_(L, 'proSubject', { no: no, eo: s.NAMA_EO }),
    html: layout_(tx_(L, 'proTitle'), isi),
    attachments: [makePdf_(docHtml_('proforma', b, getPayments_(b.id)), no)],
  });
  if (ok) updateObj_(SHEETS.BOOKING, b._row, { ProformaTerkirim: new Date() });
  return ok;
}

// ======================= 6. KONFIRMASI PEMBAYARAN =======================

function emailPayment_(b, pay) {
  const L = b.lang;
  const lunas = b.sisa <= 0;
  const isi = greet_(b) +
    '<p>' + tx_(L, 'payIntro', { id: esc_(b.id) }) + '</p>' +
    infoTable_([
      [tx_(L, 'payNo'), pay.id],
      [tx_(L, 'date'), tglL_(pay.tanggal, L)],
      [tx_(L, 'amountReceived'), rp_(pay.jumlah)],
      [tx_(L, 'method'), pay.metode],
    ]) +
    '<div style="background:#eef3e6;border-radius:10px;padding:10px 16px">' + infoTable_([
      [tx_(L, 'total'), rp_(b.total)],
      [tx_(L, 'totalPaid'), rp_(b.dibayar)],
      [tx_(L, 'balance'), rp_(b.sisa)],
    ]) + '</div>' +
    (lunas ? '<p>' + tx_(L, 'nowPaid') + '</p>'
      : '<p>' + tx_(L, 'secured', { x: rp_(b.sisa), d: tglL_(balanceDate_(b), L) }) + '</p>' + bankBox_(L)) +
    '<p>' + esc_(tx_(L, 'partyDetails', { d: tglL_(b.tglAcara, L), t: b.jam, s: b.lokasiNama })) + '</p>' + signoff_(L);
  return sendMail_({
    bookingId: b.id, jenis: 'Konfirmasi Pembayaran', to: b.email, lang: L,
    subject: tx_(L, lunas ? 'paySubjectFull' : 'paySubject', { id: b.id }),
    html: layout_(tx_(L, 'payTitle'), isi),
  });
}

// ======================= 7. INVOICE LUNAS =======================

function sendPaidInvoice_(b) {
  const s = getSettings_();
  const L = b.lang;
  const no = 'INV-' + b.id;
  const isi = greet_(b) +
    '<p>' + tx_(L, 'invIntro', { id: esc_(b.id), no: no }) + '</p>' +
    partyDetails_(b) +
    '<p>' + esc_(tx_(L, 'cantWait', { c: b.namaAnak })) + '</p>' +
    rulesBox_(L) + signoff_(L);
  const ok = sendMail_({
    bookingId: b.id, jenis: 'Invoice Lunas', to: b.email, lang: L,
    subject: tx_(L, 'invSubject', { no: no, eo: s.NAMA_EO }),
    html: layout_(tx_(L, 'invTitle'), isi),
    attachments: [makePdf_(docHtml_('invoice', b, getPayments_(b.id)), no)],
  });
  if (ok) updateObj_(SHEETS.BOOKING, b._row, { InvoiceTerkirim: new Date() });
  return ok;
}

// ======================= NOTIFIKASI ADMIN (Bahasa Indonesia) =======================

function emailAdminNewBooking_(b) {
  const s = getSettings_();
  const to = String(s.EMAIL_ADMIN || '').split(/[,;\s]+/).filter(isEmail_).join(',');
  if (!to) return false;
  const isi = '<p>Ada booking baru masuk dari website:</p>' + infoTable_([
    ['No. booking', b.id], ['Tanggal acara', tglIndo_(b.tglAcara) + ' (' + b.tipeHari + ')'], ['Jam', b.jam + ' – ' + b.jamSelesai],
    ['Lokasi', b.lokasiNama], ['Anak / dewasa', b.jumlahAnak + ' / ' + b.jumlahDewasa], ['Yang ulang tahun', b.namaAnak + (b.usia ? ' (' + b.usia + ' th)' : '')],
    ['Pemesan', b.nama], ['Email', b.email], ['WhatsApp', b.hp], ['Bahasa pelanggan', b.lang === 'id' ? 'Indonesia' : 'English'],
    ['Tema', b.tema], ['Bahasa hiburan', b.bahasa],
    ['Menu buffet', menuL_(b.menu, 'id') || '-'], ['Add-on', b.addOn || '-'], ['Catatan', b.catatan || '-'], ['Total', rp_(b.total)], ['DP', rp_(b.dp)],
  ]) + ((b.rincian.notes || []).length ? '<p style="font-size:12px;color:#8a4b14">⚠️ ' + b.rincian.notes.map(esc_).join('<br>⚠️ ') + '</p>' : '');
  return sendMail_({ bookingId: b.id, jenis: 'Notifikasi Admin', to: to, subject: '[Booking Baru] ' + b.id + ' – ' + b.namaAnak + ' – ' + tglPendek_(b.tglAcara) + ' – ' + b.lokasiNama, html: layout_('Booking baru', isi) });
}

// ======================= DOKUMEN PDF =======================

function docHtml_(jenis, b, payments) {
  const s = getSettings_();
  const L = b.lang;
  const t = (k, v) => tx_(L, k, v);
  const pro = jenis === 'proforma';
  const no = (pro ? 'PI-' : 'INV-') + b.id;
  const logo = s.LOGO_URL ? '<img src="' + esc_(s.LOGO_URL) + '" height="56"><br>' : '';
  const items = (b.rincian.lines || []).map((l, i) =>
    '<tr><td class="c">' + (i + 1) + '</td><td>' + esc_(l.desc) + '</td><td class="c">' + l.qty + '</td><td class="r">' + rp_(l.harga) + '</td><td class="r">' + rp_(l.total) + '</td></tr>').join('');
  const tot = (label, val, strong) => '<tr><td class="r ' + (strong ? 'b' : 'm') + '">' + label + '</td><td class="r ' + (strong ? 'b' : '') + '" style="width:140px">' + rp_(val) + '</td></tr>';
  const payRows = payments.map(p => '<tr><td>' + esc_(p.id) + '</td><td>' + tglPendekL_(p.tanggal, L) + '</td><td>' + esc_(p.metode) + '</td><td class="r">' + rp_(p.jumlah) + '</td></tr>').join('');
  const notes = (b.rincian.notes || []).map(n => '• ' + esc_(n)).join('<br>');
  const menu = menuL_(b.menu, L);
  const syarat = syaratL_(L);

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#222;margin:28px}' +
    'td,th{font-size:11px}' +
    'table{border-collapse:collapse;width:100%}' +
    'h1{font-size:22px;color:' + BRAND_ + ';margin:0 0 6px 0}' +
    '.items th{background:' + BRAND_ + ';color:#fff;padding:7px;text-align:left}' +
    '.items td{padding:7px;border-bottom:1px solid #ddd}' +
    '.c{text-align:center}.r{text-align:right}.b{font-weight:bold;font-size:13px}.m{color:#666}' +
    '.box{border:1px solid #d9e5cf;background:#f5f8f0;padding:10px}' +
    '.sec{font-weight:bold;font-size:12px;margin:16px 0 6px 0;color:' + BRAND_ + '}' +
    '.stamp{border:3px solid #16a34a;color:#16a34a;font-size:24px;font-weight:bold;padding:4px 16px}' +
    '</style></head><body>' +
    '<table><tr><td style="vertical-align:top">' + logo + '<div style="font-size:16px;font-weight:bold">' + esc_(s.NAMA_EO) + '</div>' +
      '<div class="m">' + nl2br_(s.ALAMAT_EO) + '<br>WhatsApp ' + esc_(s.TELP_EO) + (s.EMAIL_EO ? ' · ' + esc_(s.EMAIL_EO) : '') + (s.WEBSITE ? '<br>' + esc_(s.WEBSITE) : '') + '</div></td>' +
      '<td class="r" style="vertical-align:top"><h1>' + t(pro ? 'docPro' : 'docInv') + '</h1>' +
      t('docNo') + ': <b>' + no + '</b><br>' + t('docDate') + ': ' + tglPendekL_(new Date(), L) +
      (pro ? '<br>' + t('depositDue') + ': <b>' + tglPendekL_(dueDate_(b), L) + '</b>' : '') + '</td></tr></table>' +
    '<br><table><tr>' +
      '<td style="width:50%;vertical-align:top" class="box"><b>' + t('billTo') + ':</b><br>' + esc_(b.nama) + '<br>' + esc_(b.email) + '<br>' + esc_(b.hp) + '</td>' +
      '<td style="width:50%;vertical-align:top" class="box"><b>' + t('partyDet') + ':</b><br>' + esc_(t('birthdayOf', { c: b.namaAnak })) + (b.usia ? ' (' + b.usia + ')' : '') +
        '<br>' + tglL_(b.tglAcara, L) + ', ' + esc_(b.jam) + (b.jamSelesai ? '–' + esc_(b.jamSelesai) : '') +
        '<br>' + esc_(b.lokasiNama) + ' · ' + esc_(t('childrenAdults', { a: b.jumlahAnak, d: b.jumlahDewasa })) +
        (menu ? '<br>' + t('buffet') + ': ' + esc_(menu) : '') + '</td>' +
    '</tr></table>' +
    '<div class="sec">' + t('details') + '</div>' +
    '<table class="items"><tr><th style="width:24px">#</th><th>' + t('description') + '</th><th class="c" style="width:50px">' + t('qty') + '</th><th class="r" style="width:100px">' + t('price') + '</th><th class="r" style="width:110px">' + t('amount') + '</th></tr>' + items + '</table>' +
    '<table style="margin-top:6px">' + tot(t('subtotal'), b.subtotal) + (b.pajak ? tot(esc_(t('tax', { n: b.rincian.pajakPersen })), b.pajak) : '') +
      tot(t('total'), b.total, true) +
      (pro ? tot(t('depositReq', { n: b.rincian.persenDP || '' }), b.dp) : '') +
      tot(t('paid'), b.dibayar) + tot(t('balance'), b.sisa, true) + '</table>' +
    (notes ? '<div class="m" style="margin-top:8px">' + notes + '</div>' : '') +
    (payments.length ? '<div class="sec">' + t('payHistory') + '</div><table class="items"><tr><th>' + t('payNo') + '</th><th>' + t('date') + '</th><th>' + t('method') + '</th><th class="r">' + t('amount') + '</th></tr>' + payRows + '</table>' : '') +
    (pro && s.REKENING ? '<div class="sec">' + t('payment') + '</div><div class="box">' + nl2br_(s.REKENING) + '<br><i>' + esc_(t('transferRef', { id: b.id })) + '</i></div>' : '') +
    (!pro ? '<br><br><div style="text-align:center"><span class="stamp">' + t('stampPaid') + '</span></div>' : '') +
    (syarat ? '<div class="sec">' + esc_(t('terms')) + '</div><div class="m">' + nl2br_(syarat) + '</div>' : '') +
    '<br><div class="m" style="text-align:center">' + esc_(t('autoDoc', { eo: s.NAMA_EO })) + '</div>' +
    '</body></html>';
}
