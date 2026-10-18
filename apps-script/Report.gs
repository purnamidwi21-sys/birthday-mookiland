/**
 * Laporan & dashboard.
 * Periode memfilter: jumlah/nilai booking → berdasarkan tanggal booking masuk,
 * pembayaran diterima → berdasarkan tanggal pembayaran.
 */

function dashboard_(p) {
  p = p || {};
  const today = toDateStr_(new Date());
  const from = /^\d{4}-\d{2}-\d{2}$/.test(p.from || '') ? p.from : today.slice(0, 4) + '-01-01';
  const to = /^\d{4}-\d{2}-\d{2}$/.test(p.to || '') ? p.to : today;
  if (from > to) throw new Error('Tanggal awal harus sebelum tanggal akhir.');

  const bookings = readTable_(SHEETS.BOOKING).map(toBooking_);
  const pays = readTable_(SHEETS.BAYAR).map(r => ({
    bookingId: String(r.BookingID), tanggal: toDateStr_(r.Tanggal), jumlah: num_(r.Jumlah), metode: String(r.Metode || 'Lainnya'),
  }));

  const inP = d => d >= from && d <= to;
  const periodBk = bookings.filter(b => inP(b.tglBooking.slice(0, 10)));
  const aktif = periodBk.filter(b => b.status !== STATUS.BATAL);
  const periodPay = pays.filter(x => inP(x.tanggal));
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

  const nilaiBooking = sum(aktif, b => b.total);
  const months = monthKeys_(from, to);
  const monthly = months.map(m => {
    const bk = aktif.filter(b => b.tglBooking.slice(0, 7) === m);
    return { bulan: m, label: labelBulan_(m), booking: bk.length, nilai: sum(bk, b => b.total), diterima: sum(periodPay.filter(x => x.tanggal.slice(0, 7) === m), x => x.jumlah) };
  });

  const group = (arr, keyFn, valFn) => {
    const o = {};
    arr.forEach(x => { const k = keyFn(x) || '-'; o[k] = o[k] || { nama: k, jumlah: 0, nilai: 0 }; o[k].jumlah++; o[k].nilai += valFn ? valFn(x) : 0; });
    return Object.keys(o).map(k => o[k]).sort((a, b) => b.nilai - a.nilai || b.jumlah - a.jumlah);
  };

  // Popularitas add-on (per ID add-on, nama dari master)
  const master = {};
  getPackages_().addon.forEach(a => master[a.id] = a.nama);
  const addOnCount = {};
  aktif.forEach(b => (b.rincian.lines || []).filter(l => l.addonId).forEach(l => {
    const k = master[l.addonId] || l.desc;
    addOnCount[k] = addOnCount[k] || { nama: k, jumlah: 0, nilai: 0 };
    addOnCount[k].jumlah++; addOnCount[k].nilai += num_(l.total);
  }));

  // Popularitas menu buffet (untuk dapur)
  const menuCount = {};
  aktif.forEach(b => String(b.menu || '').split(',').map(x => x.trim()).filter(Boolean).forEach(m => {
    menuCount[m] = menuCount[m] || { nama: m, jumlah: 0, nilai: 0 };
    menuCount[m].jumlah++; menuCount[m].nilai += b.jumlahAnak; // nilai = total porsi anak
  }));

  const upcoming = bookings
    .filter(b => b.status !== STATUS.BATAL && b.tglAcara >= today)
    .sort((a, b) => (a.tglAcara + a.jam).localeCompare(b.tglAcara + b.jam))
    .slice(0, 20)
    .map(b => ({ id: b.id, tglAcara: b.tglAcara, jam: b.jam, jamSelesai: b.jamSelesai, namaAnak: b.namaAnak, nama: b.nama,
      lokasi: b.lokasiNama, anak: b.jumlahAnak, dewasa: b.jumlahDewasa, menu: b.menu, addOn: b.addOn, status: b.status, sisa: b.sisa }));

  const piutangList = bookings.filter(b => b.status !== STATUS.BATAL && b.sisa > 0);

  let quota = null;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (e) { /* abaikan */ }

  return {
    periode: { from: from, to: to },
    kpi: {
      totalBooking: periodBk.length,
      bookingAktif: aktif.length,
      batal: periodBk.length - aktif.length,
      nilaiBooking: nilaiBooking,
      rataRata: aktif.length ? Math.round(nilaiBooking / aktif.length) : 0,
      totalAnak: sum(aktif, b => b.jumlahAnak),
      totalDewasa: sum(aktif, b => b.jumlahDewasa),
      pembayaranDiterima: sum(periodPay, x => x.jumlah),
      jumlahTransaksi: periodPay.length,
      piutang: sum(piutangList, b => b.sisa),
      bookingBelumLunas: piutangList.length,
      lunas: aktif.filter(b => b.sisa <= 0).length,
      eventMendatang: bookings.filter(b => b.status !== STATUS.BATAL && b.tglAcara >= today).length,
    },
    monthly: monthly,
    byStatus: group(periodBk, b => b.status, b => b.total),
    byLokasi: group(aktif, b => b.lokasiNama, b => b.total),
    byTipeHari: group(aktif, b => b.tipeHari, b => b.total),
    byMetode: group(periodPay, x => x.metode, x => x.jumlah),
    byAddOn: Object.keys(addOnCount).map(k => addOnCount[k]).sort((a, b) => b.jumlah - a.jumlah),
    byMenu: Object.keys(menuCount).map(k => menuCount[k]).sort((a, b) => b.jumlah - a.jumlah),
    upcoming: upcoming,
    emailQuota: quota,
  };
}

function monthKeys_(from, to) {
  const out = [];
  let y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7));
  const ey = Number(to.slice(0, 4)), em = Number(to.slice(5, 7));
  while ((y < ey || (y === ey && m <= em)) && out.length < 36) {
    out.push(y + '-' + ('0' + m).slice(-2));
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

function labelBulan_(ym) {
  return BULAN_[Number(ym.slice(5, 7)) - 1].slice(0, 3) + ' ' + ym.slice(0, 4);
}

// ======================= 9. KIRIM LAPORAN =======================

function sendReport_(p, session) {
  p = p || {};
  const s = getSettings_();
  const list = String(p.penerima || s.EMAIL_ADMIN || '').split(/[,;\s]+/).map(x => x.trim()).filter(Boolean);
  if (!list.length) throw new Error('Isi minimal satu email penerima.');
  if (list.length > 10) throw new Error('Maksimal 10 penerima.');
  list.forEach(e => { if (!isEmail_(e)) throw new Error('Email tidak valid: ' + e); });

  const d = dashboard_(p);
  const html = reportHtml_(d, String(p.catatan || ''), session);
  const csv = bookingsCsv_(d.periode.from, d.periode.to);
  const subject = 'Laporan ' + s.NAMA_EO + ' (' + tglPendek_(d.periode.from) + ' – ' + tglPendek_(d.periode.to) + ')';

  const opts = { to: list.join(','), subject: subject, htmlBody: html, name: String(s.NAMA_EO || 'Laporan'), attachments: [csv] };
  MailApp.sendEmail(opts);
  logEmail_('-', 'Laporan', list.join(', '), 'Terkirim', 'Periode ' + d.periode.from + ' s/d ' + d.periode.to + ' oleh ' + session.username);
  return { terkirim: list, subject: subject };
}

function reportHtml_(d, catatan, session) {
  const k = d.kpi;
  const th = 'style="background:#f5f3ff;padding:7px;text-align:left;font-size:12px"';
  const td = 'style="padding:7px;border-bottom:1px solid #eee;font-size:12px"';
  const tdr = 'style="padding:7px;border-bottom:1px solid #eee;font-size:12px;text-align:right"';
  const table = (heads, rows) => '<table style="width:100%;border-collapse:collapse;margin:8px 0 18px">' +
    '<tr>' + heads.map(h => '<th ' + th + '>' + h + '</th>').join('') + '</tr>' +
    (rows.length ? rows.join('') : '<tr><td ' + td + ' colspan="' + heads.length + '">Tidak ada data</td></tr>') + '</table>';
  const kpiCell = (label, val) => '<td style="width:50%;padding:10px;border:1px solid #eee;vertical-align:top"><div style="color:#6b7280;font-size:12px">' + label + '</div><div style="font-size:18px;font-weight:bold;color:#2b1d4e">' + val + '</div></td>';

  const isi =
    '<p>Periode <b>' + tglIndo_(d.periode.from) + '</b> s/d <b>' + tglIndo_(d.periode.to) + '</b></p>' +
    (catatan ? '<p style="background:#fef3c7;padding:10px 12px;border-radius:8px">' + nl2br_(catatan) + '</p>' : '') +
    '<table style="width:100%;border-collapse:collapse;margin:10px 0 18px">' +
      '<tr>' + kpiCell('Booking masuk', k.totalBooking + ' <span style="font-size:12px;color:#6b7280">(' + k.batal + ' batal)</span>') + kpiCell('Nilai booking', rp_(k.nilaiBooking)) + '</tr>' +
      '<tr>' + kpiCell('Pembayaran diterima', rp_(k.pembayaranDiterima)) + kpiCell('Piutang berjalan', rp_(k.piutang)) + '</tr>' +
      '<tr>' + kpiCell('Rata-rata per booking', rp_(k.rataRata)) + kpiCell('Total anak / dewasa', k.totalAnak + ' / ' + k.totalDewasa) + '</tr>' +
    '</table>' +
    '<h3 style="font-size:14px;margin:0">Per Bulan</h3>' +
    table(['Bulan', 'Booking', 'Nilai', 'Diterima'], d.monthly.map(m => '<tr><td ' + td + '>' + m.label + '</td><td ' + tdr + '>' + m.booking + '</td><td ' + tdr + '>' + rp_(m.nilai) + '</td><td ' + tdr + '>' + rp_(m.diterima) + '</td></tr>')) +
    '<h3 style="font-size:14px;margin:0">Per Lokasi</h3>' +
    table(['Lokasi', 'Booking', 'Nilai'], d.byLokasi.map(x => '<tr><td ' + td + '>' + esc_(x.nama) + '</td><td ' + tdr + '>' + x.jumlah + '</td><td ' + tdr + '>' + rp_(x.nilai) + '</td></tr>')) +
    '<h3 style="font-size:14px;margin:0">Weekday vs Weekend/Libur</h3>' +
    table(['Jenis hari', 'Booking', 'Nilai'], d.byTipeHari.map(x => '<tr><td ' + td + '>' + esc_(x.nama) + '</td><td ' + tdr + '>' + x.jumlah + '</td><td ' + tdr + '>' + rp_(x.nilai) + '</td></tr>')) +
    '<h3 style="font-size:14px;margin:0">Per Status</h3>' +
    table(['Status', 'Booking', 'Nilai'], d.byStatus.map(x => '<tr><td ' + td + '>' + esc_(x.nama) + '</td><td ' + tdr + '>' + x.jumlah + '</td><td ' + tdr + '>' + rp_(x.nilai) + '</td></tr>')) +
    '<h3 style="font-size:14px;margin:0">Add-on Terpopuler</h3>' +
    table(['Add-on', 'Dipesan', 'Nilai'], d.byAddOn.slice(0, 10).map(x => '<tr><td ' + td + '>' + esc_(x.nama) + '</td><td ' + tdr + '>' + x.jumlah + '×</td><td ' + tdr + '>' + rp_(x.nilai) + '</td></tr>')) +
    '<h3 style="font-size:14px;margin:0">Acara Mendatang</h3>' +
    table(['Tanggal', 'Anak', 'Lokasi', 'Pax', 'Status', 'Sisa'], d.upcoming.map(u => '<tr><td ' + td + '>' + tglPendek_(u.tglAcara) + ' ' + esc_(u.jam) + '</td><td ' + td + '>' + esc_(u.namaAnak) + '</td><td ' + td + '>' + esc_(u.lokasi) + '</td><td ' + tdr + '>' + u.anak + '/' + u.dewasa + '</td><td ' + td + '>' + esc_(u.status) + '</td><td ' + tdr + '>' + rp_(u.sisa) + '</td></tr>')) +
    '<p style="font-size:12px;color:#6b7280">Detail seluruh booking periode ini terlampir dalam file CSV (bisa dibuka di Excel/Google Sheets). Dikirim oleh ' + esc_(session.nama || session.username) + '.</p>';
  return layout_('Laporan Booking & Pendapatan', isi);
}

function bookingsCsv_(from, to) {
  const rows = readTable_(SHEETS.BOOKING).map(toBooking_).filter(b => b.tglBooking.slice(0, 10) >= from && b.tglBooking.slice(0, 10) <= to);
  const head = ['No Booking', 'Tgl Booking', 'Status', 'Pemesan', 'Email', 'HP', 'Yang Ultah', 'Usia', 'Tgl Acara', 'Jenis Hari', 'Jam', 'Selesai', 'Lokasi', 'Anak', 'Dewasa', 'Menu Buffet', 'Add-on', 'Tema', 'Bahasa Hiburan', 'Bahasa Pelanggan', 'Total', 'Dibayar', 'Sisa'];
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const lines = [head.map(q).join(',')].concat(rows.map(b => [
    b.id, b.tglBooking, b.status, b.nama, b.email, b.hp, b.namaAnak, b.usia, b.tglAcara, b.tipeHari, b.jam, b.jamSelesai, b.lokasiNama,
    b.jumlahAnak, b.jumlahDewasa, b.menu, b.addOn, b.tema, b.bahasa, b.lang.toUpperCase(), b.total, b.dibayar, b.sisa,
  ].map(q).join(',')));
  return Utilities.newBlob('﻿' + lines.join('\r\n'), 'text/csv', 'booking_' + from + '_sd_' + to + '.csv');
}

// ======================= LAPORAN OTOMATIS (opsional) =======================

/** Dipanggil trigger mingguan: mengirim laporan 7 hari terakhir ke EMAIL_ADMIN. */
function kirimLaporanMingguan() {
  const end = new Date();
  sendReport_({ from: toDateStr_(addDays_(end, -6)), to: toDateStr_(end) }, { username: 'otomatis', nama: 'Sistem (otomatis)' });
}

/** Jalankan SEKALI dari editor untuk mengaktifkan laporan otomatis tiap Senin jam 07.00. */
function pasangTriggerLaporanMingguan() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'kirimLaporanMingguan')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('kirimLaporanMingguan').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  Logger.log('Trigger laporan mingguan aktif (Senin ±07.00).');
}
