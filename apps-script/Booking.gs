/**
 * Paket, lokasi, add-on, estimasi biaya, ketersediaan, booking, pembayaran.
 * Model harga Mookiland:
 *   harga per anak (weekday / weekend & libur) × max(jumlah anak, minimum anak)
 *   + upgrade lokasi (weekday / weekend) + add-on
 */

// ======================= DATA MASTER =======================

function splitList_(v, sep) {
  return String(v || '').split(sep).map(x => x.trim()).filter(Boolean);
}

function getPackages_() {
  const s = getSettings_();
  const today = toDateStr_(new Date());

  const paket = readTable_(SHEETS.PAKET).filter(r => isTrue_(r.Aktif)).map(r => ({
    id: String(r.ID).trim(),
    nama: String(r.Nama || ''),
    deskripsi: String(r.Deskripsi || ''),
    deskripsiId: String(r.DeskripsiID || ''),
    hargaWeekday: num_(r.HargaWeekday),
    hargaWeekend: num_(r.HargaWeekend),
    minAnak: num_(r.MinAnak),
    dewasaPerAnak: num_(r.DewasaPerAnak),
    durasiJam: Number(r.DurasiJam) || 3,
    fasilitas: splitList_(r.Fasilitas, ';'),
    fasilitasId: splitList_(r.FasilitasID, ';'),
  }));

  const lokasi = readTable_(SHEETS.LOKASI).filter(r => isTrue_(r.Aktif)).map(r => ({
    id: String(r.ID).trim(),
    nama: String(r.Nama || ''),
    deskripsi: String(r.Deskripsi || ''),
    deskripsiId: String(r.DeskripsiID || ''),
    hargaWeekday: num_(r.HargaWeekday),
    hargaWeekend: num_(r.HargaWeekend),
    kapasitas: num_(r.Kapasitas),
    label: String(r.Label || ''),
    labelId: String(r.LabelID || ''),
    gambar: String(r.Gambar || ''),
  }));

  const satuanOk = ['per_event', 'per_anak', 'per_pax', 'per_item', 'on_request'];
  const addon = readTable_(SHEETS.ADDON).filter(r => isTrue_(r.Aktif)).map(r => {
    const sat = String(r.Satuan || '').trim().toLowerCase();
    return {
      id: String(r.ID).trim(),
      kategori: String(r.Kategori || 'Lainnya'),
      nama: String(r.Nama || ''),
      namaId: String(r.NamaID || ''),
      deskripsi: String(r.Deskripsi || ''),
      deskripsiId: String(r.DeskripsiID || ''),
      harga: num_(r.Harga),
      satuan: satuanOk.indexOf(sat) >= 0 ? sat : 'per_event',
      termasukPax: num_(r.TermasukPax),
      hargaExtraPax: num_(r.HargaExtraPax),
      pilihan: splitList_(r.Pilihan, '|'),
      pilihanId: splitList_(r.PilihanID, '|'),
      grup: String(r.Grup || '').trim(),
      minJam: toTimeStr_(r.MinJamMulai),
      hargaMulai: isTrue_(r.HargaMulai),
      durasi: String(r.Durasi || ''),
      bahasa: String(r.Bahasa || ''),
      gambar: String(r.Gambar || ''),
    };
  });

  const menu = readTable_(SHEETS.MENU).filter(r => isTrue_(r.Aktif)).map(r => ({
    no: num_(r.No), nama: String(r.Nama || ''), namaId: String(r.NamaID || ''),
    kategori: String(r.Kategori || ''), kategoriId: String(r.KategoriID || ''),
  }));

  const libur = readTable_(SHEETS.LIBUR).map(r => ({
    tanggal: toDateStr_(r.Tanggal), ket: String(r.Keterangan || ''),
    tutup: /tutup|closed/i.test(String(r.Jenis || '')),
  })).filter(h => h.tanggal >= today);

  return {
    paket: paket, lokasi: lokasi, addon: addon, menu: menu, libur: libur,
    info: {
      namaEO: String(s.NAMA_EO || ''),
      kontak: String(s.KONTAK_NAMA || ''),
      telp: String(s.TELP_EO || ''),
      email: String(s.EMAIL_EO || ''),
      website: String(s.WEBSITE || ''),
      alamat: String(s.ALAMAT_EO || ''),
      persenDP: num_(s.PERSEN_DP),
      pajakPersen: Number(s.PAJAK_PERSEN) || 0,
      hargaDewasaTambahan: num_(s.HARGA_DEWASA_TAMBAHAN),
      maxMenu: num_(s.MAX_MENU_BUFFET) || 4,
      minHariBooking: num_(s.MIN_HARI_BOOKING),
      rules: splitList_(s.RULES, /\r?\n/),
      rulesId: splitList_(s.RULES_ID, /\r?\n/),
      syarat: String(s.SYARAT || ''),
      syaratId: String(s.SYARAT_ID || ''),
    },
  };
}

/** Jenis hari: weekday / weekend (Sabtu, Minggu, libur) / tutup – label sesuai bahasa */
function dayType_(tglStr, libur, lang) {
  const d = parseYmd_(tglStr);
  if (!d) return { tipe: 'weekday', label: tx_(lang, 'weekday') };
  const h = (libur || []).find(x => x.tanggal === tglStr);
  if (h && h.tutup) return { tipe: 'tutup', label: tx_(lang, 'closed', { x: h.ket }), ket: h.ket };
  if (h) return { tipe: 'weekend', label: tx_(lang, 'holiday', { x: h.ket }) };
  if (d.getDay() === 0 || d.getDay() === 6) return { tipe: 'weekend', label: tx_(lang, 'weekend') };
  return { tipe: 'weekday', label: tx_(lang, 'weekday') };
}

/** Nama add-on & label pilihan sesuai bahasa */
function addonName_(ad, lang) { return pickL_(lang, ad.nama, ad.namaId); }
function optionLabel_(ad, pil, lang) {
  const i = ad.pilihan.indexOf(pil);
  return i >= 0 ? pickL_(lang, pil, ad.pilihanId[i]) : pil;
}

// ======================= ESTIMASI =======================
// PENTING: rumus ini dicerminkan di frontend docs/assets/app.js → hitung(). Ubah keduanya bersamaan.

function calcEstimate_(p, data) {
  data = data || getPackages_();
  const L = lang_(p.lang);
  const paket = data.paket.find(x => x.id === String(p.paketId || '').trim()) || data.paket[0];
  if (!paket) throw txErr_(L, 'noPackage');

  const anak = Math.floor(num_(p.jumlahAnak));
  const dewasa = Math.max(0, Math.floor(num_(p.jumlahDewasa)));
  if (anak < 1) throw txErr_(L, 'minChildren');
  if (anak > 300 || dewasa > 600) throw txErr_(L, 'tooLarge');

  const tgl = /^\d{4}-\d{2}-\d{2}$/.test(String(p.tglAcara || '')) ? String(p.tglAcara) : '';
  const day = tgl ? dayType_(tgl, data.libur, L)
    : { tipe: p.tipeHari === 'weekend' ? 'weekend' : 'weekday', label: tx_(L, p.tipeHari === 'weekend' ? 'weekend' : 'weekday') };
  const wknd = day.tipe === 'weekend';

  const lines = [];
  const notes = [];
  let hargaMulai = false;

  // Paket per anak
  const anakTagih = Math.max(anak, paket.minAnak);
  const hargaAnak = wknd ? paket.hargaWeekend : paket.hargaWeekday;
  lines.push({ desc: tx_(L, 'pkgLine', { p: paket.nama, r: tx_(L, wknd ? 'rateWE' : 'rateWD') }), qty: anakTagih, harga: hargaAnak, total: anakTagih * hargaAnak });
  if (anak < paket.minAnak) notes.push(tx_(L, 'minCharge', { n: paket.minAnak, m: anak }));

  // Dewasa
  const dewasaIncl = anakTagih * paket.dewasaPerAnak;
  if (dewasa > dewasaIncl) {
    const extra = dewasa - dewasaIncl;
    if (data.info.hargaDewasaTambahan > 0) {
      lines.push({ desc: tx_(L, 'extraAdultLine'), qty: extra, harga: data.info.hargaDewasaTambahan, total: extra * data.info.hargaDewasaTambahan });
    } else {
      notes.push(tx_(L, 'extraAdultNote', { x: extra, n: paket.dewasaPerAnak }));
    }
  }

  // Lokasi
  let lokasi = null;
  if (p.lokasiId) {
    lokasi = data.lokasi.find(x => x.id === String(p.lokasiId).trim());
    if (!lokasi) throw txErr_(L, 'spotNotFound');
    const hl = wknd ? lokasi.hargaWeekend : lokasi.hargaWeekday;
    if (hl > 0) lines.push({ desc: tx_(L, 'spotLine', { s: lokasi.nama, h: paket.durasiJam }), qty: 1, harga: hl, total: hl });
    if (lokasi.kapasitas > 0 && anak + dewasa > lokasi.kapasitas) notes.push(tx_(L, 'capacity', { s: lokasi.nama, n: lokasi.kapasitas }));
  }

  // Add-on
  const usedGroups = {};
  const usedIds = {};
  (Array.isArray(p.addOns) ? p.addOns : []).forEach(item => {
    const id = String(item && item.id !== undefined ? item.id : item).trim();
    const ad = data.addon.find(x => x.id === id);
    if (!ad) return;
    const key = id + '|' + String(item.pilihan || '');
    if (usedIds[key]) return;
    if (ad.grup && usedGroups[ad.grup] && usedGroups[ad.grup] !== id) return; // satu per grup
    usedIds[key] = true;
    if (ad.grup) usedGroups[ad.grup] = id;

    const adName = addonName_(ad, L);
    let pil = '';
    if (ad.pilihan.length) {
      pil = String(item.pilihan || '').trim();
      if (ad.pilihan.indexOf(pil) < 0) throw txErr_(L, 'chooseOption', { x: adName });
    }
    if (ad.minJam && p.jam && toMin_(p.jam) < toMin_(ad.minJam)) throw txErr_(L, 'evening', { x: adName, t: ad.minJam });

    const name = adName + (pil ? ' – ' + optionLabel_(ad, pil, L) : '');
    const rawQty = Math.floor(num_(item.qty));
    let line;
    if (ad.satuan === 'per_anak') {
      line = { desc: name + tx_(L, 'perChild'), qty: anak, harga: ad.harga, total: anak * ad.harga };
    } else if (ad.satuan === 'per_pax') {
      const pax = Math.min(500, Math.max(1, rawQty || anak));
      const total = ad.harga + Math.max(0, pax - ad.termasukPax) * ad.hargaExtraPax;
      line = { desc: name + tx_(L, 'paxDesc', { p: pax, i: ad.termasukPax, e: rp_(ad.hargaExtraPax) }), qty: 1, harga: total, total: total, pax: pax };
    } else if (ad.satuan === 'per_item') {
      const q = Math.min(500, Math.max(1, rawQty || 1));
      line = { desc: name, qty: q, harga: ad.harga, total: q * ad.harga };
    } else if (ad.satuan === 'on_request') {
      line = { desc: name + tx_(L, 'onRequest'), qty: 1, harga: 0, total: 0 };
      notes.push(tx_(L, 'onRequestNote', { x: adName }));
    } else {
      line = { desc: name, qty: 1, harga: ad.harga, total: ad.harga };
    }
    if (ad.hargaMulai) { line.desc += tx_(L, 'starting'); hargaMulai = true; }
    line.addonId = ad.id;
    if (pil) line.pilihan = pil;
    lines.push(line);
  });
  if (hargaMulai) notes.push(tx_(L, 'startingNote'));

  // Menu buffet (disimpan dengan nama Inggris sebagai kunci)
  const maxMenu = data.info.maxMenu;
  const menuNames = data.menu.map(m => m.nama);
  const menu = (Array.isArray(p.menu) ? p.menu : []).map(x => String(x).trim()).filter((x, i, a) => x && a.indexOf(x) === i);
  menu.forEach(m => { if (menuNames.indexOf(m) < 0) throw txErr_(L, 'menuNotFound', { x: m }); });
  if (menu.length > maxMenu) throw txErr_(L, 'menuMax', { n: maxMenu });

  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const pajakPersen = data.info.pajakPersen;
  const pajak = Math.round(subtotal * pajakPersen / 100);
  const total = subtotal + pajak;
  const persenDP = data.info.persenDP;

  return {
    lang: L,
    paketId: paket.id, paketNama: paket.nama, durasiJam: paket.durasiJam,
    tglAcara: tgl, tipeHari: day.tipe, tipeLabel: day.label, dayKet: day.ket || '',
    jumlahAnak: anak, jumlahDewasa: dewasa, anakTagih: anakTagih,
    lokasiId: lokasi ? lokasi.id : '', lokasiNama: lokasi ? lokasi.nama : '',
    menu: menu, lines: lines, notes: notes, hargaMulai: hargaMulai,
    subtotal: subtotal, pajakPersen: pajakPersen, pajak: pajak, total: total,
    persenDP: persenDP, dp: calcDP_(total, persenDP),
  };
}

function calcDP_(total, persen) {
  return Math.max(0, Math.min(total, Math.ceil(total * persen / 100 / 1000) * 1000));
}

// ======================= KETERSEDIAAN =======================

function getAvailability_(p) {
  const L = lang_(p.lang);
  const tgl = toDateStr_(p.tglAcara);
  if (!parseYmd_(tgl)) throw txErr_(L, 'invalidDate');
  const data = getPackages_();
  const day = dayType_(tgl, data.libur, L);
  const slots = readTable_(SHEETS.BOOKING)
    .filter(r => toDateStr_(r.TglAcara) === tgl && String(r.Status) !== STATUS.BATAL)
    .map(r => ({ lokasiId: String(r.LokasiID), jam: toTimeStr_(r.Jam), jamSelesai: toTimeStr_(r.JamSelesai) }));
  return { tanggal: tgl, tipe: day.tipe, label: day.label, tutup: day.tipe === 'tutup', slots: slots };
}

function findConflict_(all, tgl, lokasiId, startMin, endMin, exceptId) {
  return all.find(b => {
    if (exceptId && String(b.BookingID) === exceptId) return false;
    if (String(b.Status) === STATUS.BATAL) return false;
    if (toDateStr_(b.TglAcara) !== tgl || String(b.LokasiID) !== lokasiId) return false;
    const s = toMin_(toTimeStr_(b.Jam));
    let e = toMin_(toTimeStr_(b.JamSelesai));
    if (isNaN(e)) e = s + 180;
    return startMin < e && s < endMin;
  }) || null;
}

// ======================= BOOKING =======================

const REQUIRED_FIELDS_ = ['nama', 'email', 'hp', 'namaAnak', 'tglAcara', 'jam', 'lokasiId', 'jumlahAnak'];

function createBooking_(p) {
  const L = lang_(p.lang);
  if (p.website) throw txErr_(L, 'rejected'); // honeypot anti-bot

  REQUIRED_FIELDS_.forEach(k => {
    if (!String(p[k] == null ? '' : p[k]).trim()) throw txErr_(L, 'required', { f: tx_(L, 'f_' + k) });
  });
  if (!isEmail_(p.email)) throw txErr_(L, 'badEmail');
  if (String(p.hp).replace(/\D/g, '').length < 9) throw txErr_(L, 'badWa');
  if (!/^\d{2}:\d{2}$/.test(String(p.jam).trim())) throw txErr_(L, 'badTime');
  if (!p.setuju) throw txErr_(L, 'rules');

  const s = getSettings_();
  const data = getPackages_();
  const tgl = parseYmd_(p.tglAcara);
  if (!tgl) throw txErr_(L, 'badDate');
  const tglStr = toDateStr_(tgl);
  const today = parseYmd_(toDateStr_(new Date()));
  const minHari = num_(s.MIN_HARI_BOOKING);
  if (Math.round((tgl - today) / 86400000) < minHari) throw txErr_(L, 'minDays', { n: minHari });
  const day = dayType_(tglStr, data.libur, L);
  if (day.tipe === 'tutup') throw txErr_(L, 'parkClosed', { d: tglL_(tglStr, L), x: day.ket });

  const est = calcEstimate_(p, data);
  const startMin = toMin_(p.jam);
  const endMin = startMin + Math.round(est.durasiJam * 60);

  let id;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const all = readTable_(SHEETS.BOOKING);
    const clash = findConflict_(all, tglStr, est.lokasiId, startMin, endMin);
    if (clash) throw txErr_(L, 'clash', { s: est.lokasiNama, a: toTimeStr_(clash.Jam), b: toTimeStr_(clash.JamSelesai) });
    const max = num_(s.MAX_EVENT_PER_HARI);
    if (max > 0 && all.filter(b => toDateStr_(b.TglAcara) === tglStr && String(b.Status) !== STATUS.BATAL).length >= max) {
      throw txErr_(L, 'dayFull', { d: tglL_(tglStr, L) });
    }

    const prefix = 'MK-' + Utilities.formatDate(new Date(), tz_(), 'yyMMdd') + '-';
    id = prefix + ('00' + (all.filter(b => String(b.BookingID).indexOf(prefix) === 0).length + 1)).slice(-3);

    const now = new Date();
    appendObj_(SHEETS.BOOKING, {
      BookingID: id,
      TglBooking: now,
      Status: STATUS.MENUNGGU,
      BahasaPelanggan: L.toUpperCase(),
      Nama: txt_(p.nama, 100),
      Email: txt_(String(p.email).toLowerCase(), 120),
      HP: txt_(p.hp, 30),
      NamaAnak: txt_(p.namaAnak, 100),
      Usia: Math.max(0, Math.min(120, Math.floor(num_(p.usia)))) || '',
      Tema: txt_(p.tema, 150),
      Bahasa: txt_(p.bahasa, 30),
      TglAcara: txt_(tglStr),
      TipeHari: est.tipeHari === 'weekend' ? 'Weekend/Libur' : 'Weekday',
      Jam: txt_(fromMin_(startMin)),
      JamSelesai: txt_(fromMin_(endMin)),
      LokasiID: txt_(est.lokasiId),
      NamaLokasi: txt_(est.lokasiNama),
      PaketID: txt_(est.paketId),
      NamaPaket: txt_(est.paketNama),
      JumlahAnak: est.jumlahAnak,
      JumlahDewasa: est.jumlahDewasa,
      MenuBuffet: txt_(est.menu.join(', '), 500),
      AddOn: txt_(est.lines.filter(l => l.addonId).map(l => l.desc + (l.qty > 1 ? ' ×' + l.qty : '')).join('; '), 2000),
      Catatan: txt_(p.catatan, 1000),
      Rincian: "'" + JSON.stringify({ lines: est.lines, notes: est.notes, pajakPersen: est.pajakPersen, persenDP: est.persenDP, tipeLabel: est.tipeLabel, lang: L }),
      Subtotal: est.subtotal,
      Pajak: est.pajak,
      Total: est.total,
      DP: est.dp,
      Dibayar: 0,
      Sisa: est.total,
      UpdatedAt: now,
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const b = getBookingObj_(id);
  const result = {
    bookingId: id, nama: b.nama, total: b.total, dp: b.dp, tglAcara: b.tglAcara, jam: b.jam, lokasi: b.lokasiNama,
    email: b.email, emailKonfirmasi: false, proforma: false,
  };
  result.emailKonfirmasi = emailConfirmation_(b);
  if (isTrue_(s.AUTO_PROFORMA)) result.proforma = sendProforma_(getBookingObj_(id));
  if (isTrue_(s.NOTIF_ADMIN)) emailAdminNewBooking_(b);
  return result;
}

/** Baris sheet Booking → objek rapi. */
function toBooking_(r) {
  let rincian = {};
  try { rincian = JSON.parse(String(r.Rincian || '{}')); } catch (e) { rincian = {}; }
  if (!rincian.lines) rincian.lines = [];
  if (!rincian.notes) rincian.notes = [];
  return {
    _row: r._row,
    id: String(r.BookingID),
    tglBooking: fmtDateTime_(r.TglBooking),
    status: String(r.Status || ''),
    lang: lang_(r.BahasaPelanggan || rincian.lang),
    nama: String(r.Nama || ''),
    email: String(r.Email || ''),
    hp: String(r.HP || ''),
    namaAnak: String(r.NamaAnak || ''),
    usia: r.Usia === '' ? '' : num_(r.Usia),
    tema: String(r.Tema || ''),
    bahasa: String(r.Bahasa || ''),
    tglAcara: toDateStr_(r.TglAcara),
    tipeHari: String(r.TipeHari || ''),
    jam: toTimeStr_(r.Jam),
    jamSelesai: toTimeStr_(r.JamSelesai),
    lokasiId: String(r.LokasiID || ''),
    lokasiNama: String(r.NamaLokasi || ''),
    paketId: String(r.PaketID || ''),
    paketNama: String(r.NamaPaket || ''),
    jumlahAnak: num_(r.JumlahAnak),
    jumlahDewasa: num_(r.JumlahDewasa),
    menu: String(r.MenuBuffet || ''),
    addOn: String(r.AddOn || ''),
    catatan: String(r.Catatan || ''),
    rincian: rincian,
    subtotal: num_(r.Subtotal),
    pajak: num_(r.Pajak),
    total: num_(r.Total),
    dp: num_(r.DP),
    dibayar: num_(r.Dibayar),
    sisa: num_(r.Sisa),
    proformaTerkirim: fmtDateTime_(r.ProformaTerkirim),
    invoiceTerkirim: fmtDateTime_(r.InvoiceTerkirim),
    updatedAt: fmtDateTime_(r.UpdatedAt),
  };
}

function getBookingObj_(id) {
  const r = findBy_(SHEETS.BOOKING, 'BookingID', id);
  if (!r) throw new Error('Booking ' + id + ' tidak ditemukan.');
  return toBooking_(r);
}

function getPayments_(id) {
  return readTable_(SHEETS.BAYAR)
    .filter(r => String(r.BookingID) === String(id))
    .map(r => ({
      id: String(r.PaymentID), bookingId: String(r.BookingID), tanggal: toDateStr_(r.Tanggal),
      jumlah: num_(r.Jumlah), metode: String(r.Metode || ''), keterangan: String(r.Keterangan || ''),
      dicatatOleh: String(r.DicatatOleh || ''),
    }));
}

function statusFor_(total, dibayar, current) {
  if (current === STATUS.BATAL || current === STATUS.SELESAI) return current;
  if (dibayar <= 0) return STATUS.MENUNGGU;
  return total - dibayar <= 0 ? STATUS.LUNAS : STATUS.DP;
}

// ======================= ADMIN: BOOKING =======================

function listBookings_(p) {
  p = p || {};
  const q = String(p.q || '').toLowerCase().trim();
  let rows = readTable_(SHEETS.BOOKING).map(toBooking_);
  if (p.status) rows = rows.filter(b => b.status === p.status);
  if (p.lokasiId) rows = rows.filter(b => b.lokasiId === p.lokasiId);
  if (p.from) rows = rows.filter(b => b.tglAcara >= p.from);
  if (p.to) rows = rows.filter(b => b.tglAcara <= p.to);
  if (q) rows = rows.filter(b => [b.id, b.nama, b.email, b.hp, b.namaAnak, b.lokasiNama, b.tema].join(' ').toLowerCase().indexOf(q) >= 0);
  if (p.urut === 'acara') rows.sort((a, b) => (a.tglAcara + a.jam).localeCompare(b.tglAcara + b.jam));
  else rows.sort((a, b) => b.tglBooking.localeCompare(a.tglBooking));
  return rows.map(b => { const o = Object.assign({}, b); delete o.rincian; delete o._row; return o; });
}

function getBookingDetail_(id) {
  const b = getBookingObj_(id);
  delete b._row;
  const emails = readTable_(SHEETS.LOG)
    .filter(r => String(r.BookingID) === String(id))
    .map(r => ({ waktu: fmtDateTime_(r.Waktu), jenis: String(r.Jenis), penerima: String(r.Penerima), status: String(r.Status), ket: String(r.Keterangan || '') }))
    .reverse();
  return { booking: b, payments: getPayments_(id), emails: emails };
}

function updateStatus_(p, session) {
  const allowed = [STATUS.MENUNGGU, STATUS.DP, STATUS.LUNAS, STATUS.SELESAI, STATUS.BATAL];
  if (allowed.indexOf(p.status) < 0) throw new Error('Status tidak valid.');
  const b = getBookingObj_(p.bookingId);
  if (p.status === STATUS.LUNAS && b.sisa > 0) throw new Error('Masih ada sisa tagihan ' + rp_(b.sisa) + '. Gunakan "Catat Pembayaran".');
  updateObj_(SHEETS.BOOKING, b._row, { Status: p.status, UpdatedAt: new Date() });
  logEmail_(b.id, 'Ubah Status', '-', p.status, 'oleh ' + session.username);
  return getBookingDetail_(b.id);
}

/**
 * Penyesuaian harga oleh admin: diskon (minus), harga final kue custom, paket bir,
 * tambahan tamu, dll. Menambah baris ke rincian lalu menghitung ulang total/DP/sisa.
 */
function adjustPrice_(p, session) {
  const desc = String(p.desc || '').trim();
  const amount = Math.round(Number(String(p.amount).replace(/[^\d-]/g, '')) || 0);
  if (!desc) throw new Error('Isi keterangan penyesuaian.');
  if (!amount) throw new Error('Isi nominal penyesuaian (gunakan minus untuk diskon).');

  let b;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    b = getBookingObj_(p.bookingId);
    if (b.status === STATUS.BATAL) throw new Error('Booking sudah dibatalkan.');
    const r = b.rincian;
    r.lines.push({ desc: desc, qty: 1, harga: amount, total: amount, adjust: true });
    const subtotal = r.lines.reduce((a, l) => a + num_(l.total), 0);
    if (subtotal < 0) throw new Error('Total tidak boleh negatif.');
    const pajak = Math.round(subtotal * (Number(r.pajakPersen) || 0) / 100);
    const total = subtotal + pajak;
    const dp = calcDP_(total, Number(r.persenDP) || 0);
    updateObj_(SHEETS.BOOKING, b._row, {
      Rincian: "'" + JSON.stringify(r), Subtotal: subtotal, Pajak: pajak, Total: total, DP: dp,
      Sisa: total - b.dibayar, Status: statusFor_(total, b.dibayar, b.status), UpdatedAt: new Date(),
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  logEmail_(b.id, 'Penyesuaian Harga', '-', (amount > 0 ? '+' : '') + rp_(amount), desc + ' – oleh ' + session.username);
  const res = getBookingDetail_(b.id);
  if (p.kirimProforma && res.booking.sisa > 0) res.proformaTerkirim = sendProforma_(getBookingObj_(b.id));
  return res;
}

function resendConfirmation_(id) {
  const b = getBookingObj_(id);
  if (!emailConfirmation_(b)) throw new Error('Email gagal dikirim. Cek sheet LogEmail.');
  return getBookingDetail_(id);
}

function sendProformaById_(id) {
  const b = getBookingObj_(id);
  if (b.status === STATUS.BATAL) throw new Error('Booking sudah dibatalkan.');
  if (b.sisa <= 0) throw new Error('Booking sudah lunas, kirim invoice lunas saja.');
  if (!sendProforma_(b)) throw new Error('Email gagal dikirim. Cek sheet LogEmail.');
  return getBookingDetail_(id);
}

function sendPaidInvoiceById_(id) {
  const b = getBookingObj_(id);
  if (b.sisa > 0) throw new Error('Booking belum lunas (sisa ' + rp_(b.sisa) + ').');
  if (!sendPaidInvoice_(b)) throw new Error('Email gagal dikirim. Cek sheet LogEmail.');
  return getBookingDetail_(id);
}

// ======================= ADMIN: PEMBAYARAN =======================

function recordPayment_(p, session) {
  const jumlah = Math.round(num_(p.jumlah));
  if (jumlah <= 0) throw new Error('Jumlah pembayaran harus lebih dari 0.');
  const metode = String(p.metode || 'Transfer').trim();
  const tgl = p.tanggal ? parseYmd_(p.tanggal) : new Date();
  if (!tgl) throw new Error('Tanggal pembayaran tidak valid.');

  let payId, b;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    b = getBookingObj_(p.bookingId);
    if (b.status === STATUS.BATAL) throw new Error('Booking sudah dibatalkan.');
    if (b.sisa <= 0) throw new Error('Booking ini sudah lunas.');
    if (jumlah > b.sisa) throw new Error('Jumlah melebihi sisa tagihan (' + rp_(b.sisa) + ').');

    payId = 'PAY-' + b.id.replace(/^[A-Z]+-/, '') + '-' + (getPayments_(b.id).length + 1);
    appendObj_(SHEETS.BAYAR, {
      PaymentID: payId, BookingID: b.id, Tanggal: tgl, Jumlah: jumlah,
      Metode: txt_(metode, 50), Keterangan: txt_(p.keterangan, 300),
      DicatatOleh: txt_(session.username), DicatatPada: new Date(),
    });
    const dibayar = b.dibayar + jumlah;
    updateObj_(SHEETS.BOOKING, b._row, {
      Dibayar: dibayar, Sisa: b.total - dibayar, Status: statusFor_(b.total, dibayar, b.status), UpdatedAt: new Date(),
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const updated = getBookingObj_(b.id);
  const pay = { id: payId, tanggal: toDateStr_(tgl), jumlah: jumlah, metode: metode, keterangan: String(p.keterangan || '') };
  const res = { emailPembayaran: false, emailInvoice: false };
  if (p.kirimEmail !== false) {
    res.emailPembayaran = emailPayment_(updated, pay);
    if (updated.sisa <= 0) res.emailInvoice = sendPaidInvoice_(updated);
  }
  return Object.assign(getBookingDetail_(b.id), res);
}
