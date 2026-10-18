/**
 * Kamus dua bahasa untuk teks yang dilihat PELANGGAN (estimasi, pesan error, email, PDF).
 * 'en' = English, 'id' = Bahasa Indonesia. Variabel ditulis {nama}.
 * Notifikasi & laporan internal admin tetap berbahasa Indonesia.
 */

const TX_ = {
  en: {
    // ---- jenis hari ----
    weekday: 'Weekday', weekend: 'Weekend', holiday: 'Public holiday ({x})', closed: 'Closed – {x}',
    rateWD: 'Weekday', rateWE: 'Weekend/Holiday',
    // ---- estimasi ----
    pkgLine: '{p} – {r} rate (per child)',
    minCharge: 'Minimum charge of {n} children applies ({m} registered).',
    extraAdultLine: 'Additional adult entrance',
    extraAdultNote: '{x} adult(s) beyond the included {n} per child – regular entrance fee payable on the day.',
    spotLine: '{s} upgrade ({h} hours)',
    capacity: '{s} seats up to {n} guests – our team will help arrange extra space.',
    perChild: ' (per child)',
    paxDesc: ' – {p} pax (incl. {i}, extra {e}/pax)',
    onRequest: ' – price on request', onRequestNote: '{x}: our team will send the price & menu.',
    starting: ' (starting price)', startingNote: 'Items marked "starting price" will be confirmed by our team; the final amount may differ.',
    // ---- error ----
    noPackage: 'No active package.', minChildren: 'Please enter the number of children (min. 1).',
    tooLarge: 'For very large parties please contact us directly.', spotNotFound: 'Party spot not found.',
    chooseOption: 'Please choose an option for {x}.', evening: '{x} is available for evening events only (start time {t} or later).',
    menuNotFound: 'Menu item not found: {x}', menuMax: 'Please choose up to {n} buffet menu items.',
    rejected: 'Request rejected.', required: '{f} is required.', badEmail: 'Please enter a valid email address.',
    badWa: 'Please enter a valid WhatsApp number.', badTime: 'Invalid start time (e.g. 14:00).',
    rules: 'Please confirm that you have read the park rules.', badDate: 'Invalid party date.',
    minDays: 'Online bookings must be made at least {n} days in advance. Please contact us on WhatsApp for earlier dates.',
    parkClosed: 'Sorry, the park is closed on {d} ({x}).',
    clash: '{s} is already booked from {a} to {b} on that date. Please choose another time or party spot.',
    dayFull: 'Sorry, {d} is fully booked. Please choose another date.', invalidDate: 'Invalid date.',
    f_nama: 'Parent / contact name', f_email: 'Email', f_hp: 'WhatsApp number', f_namaAnak: 'Birthday child\'s name',
    f_tglAcara: 'Party date', f_jam: 'Start time', f_lokasiId: 'Party spot', f_jumlahAnak: 'Number of children',
    // ---- email & PDF ----
    hi: 'Hi', bookingNo: 'Booking no.', birthdayChild: 'Birthday child', turning: 'turning {n}', date: 'Date', time: 'Time',
    spot: 'Party spot', rate: 'Rate', guests: 'Guests', guestsVal: '{a} children, {d} adults', buffet: 'Children\'s buffet',
    toBeChosen: 'To be chosen', theme: 'Party theme', entLang: 'Entertainment language',
    item: 'Item', qty: 'Qty', price: 'Price', amount: 'Amount', subtotal: 'Subtotal', tax: 'Tax & service ({n}%)', total: 'TOTAL',
    paid: 'Paid', balance: 'Balance due', bankTitle: 'Bank transfer details',
    bankNote: 'Please include your booking number in the transfer reference and reply to this email (or WhatsApp us) with your payment receipt.',
    reminders: 'Important reminders',
    questions: 'Questions? Simply reply to this email or WhatsApp {k} at {t}.', seeYou: 'See you in the jungle! 🐒', team: 'The {x} Team',
    // konfirmasi
    confTitle: 'Booking received', confSubject: 'Booking received {id} – {c}\'s birthday at {eo}',
    confIntro: 'Thank you for choosing <b>{eo}</b> for {c}\'s birthday! We have received your booking request:',
    costEstimate: 'Cost estimate',
    depositNeed: 'To secure your date, a deposit of <b>{dp}</b> is required.',
    proformaSent: 'Your proforma invoice has been sent in a separate email.', proformaSoon: 'We will send your proforma invoice shortly.',
    availability: 'Add-ons are subject to availability – our team will confirm everything with you.', yourNotes: 'Your notes',
    // proforma
    proTitle: 'Proforma invoice', proSubject: 'Proforma invoice {no} – {eo}',
    proIntro: 'Please find your proforma invoice <b>{no}</b> for {c}\'s birthday party on {d} attached (PDF).',
    payDeposit: 'Please pay the deposit of at least <b>{x}</b> by <b>{d}</b> to secure your party date.',
    depositReceived: 'Your deposit has been received. The remaining balance of <b>{x}</b> is due by <b>{d}</b>.',
    // pembayaran
    payTitle: 'Payment received', paySubject: 'Payment received – {id}', paySubjectFull: 'Payment received – {id} (fully paid)',
    payIntro: 'We have received your payment for booking <b>{id}</b>. Thank you! 🎉',
    payNo: 'Payment no.', amountReceived: 'Amount received', method: 'Method', totalPaid: 'Total paid',
    nowPaid: 'Your booking is now <b style="color:#16a34a">FULLY PAID</b>. Your paid invoice is attached to a separate email.',
    secured: 'Your party date is secured! The remaining balance of <b>{x}</b> is due by <b>{d}</b>.',
    partyDetails: 'Party details: {d}, {t} at {s}.',
    // invoice lunas
    invTitle: 'Paid invoice', invSubject: 'Paid invoice {no} – {eo}',
    invIntro: 'Thank you – booking <b>{id}</b> is <b style="color:#16a34a">FULLY PAID</b>. Your official invoice <b>{no}</b> is attached (PDF).',
    cantWait: 'We can\'t wait to make {c}\'s birthday a wild and unforgettable adventure!',
    // PDF
    docPro: 'PROFORMA INVOICE', docInv: 'INVOICE', docNo: 'No', docDate: 'Date', depositDue: 'Deposit due', billTo: 'Bill to',
    partyDet: 'Party details', birthdayOf: '{c}\'s birthday', details: 'Details', description: 'Description',
    depositReq: 'Deposit required ({n}%)', payHistory: 'Payment history', payment: 'Payment',
    transferRef: 'Please include booking no. {id} in the transfer reference.', stampPaid: 'PAID', terms: 'Terms & conditions',
    autoDoc: 'This document was generated automatically by the {eo} booking system and is valid without signature.',
    childrenAdults: '{a} children, {d} adults',
  },

  id: {
    weekday: 'Hari kerja', weekend: 'Akhir pekan', holiday: 'Hari libur ({x})', closed: 'Tutup – {x}',
    rateWD: 'Hari kerja', rateWE: 'Akhir pekan/Libur',
    pkgLine: '{p} – tarif {r} (per anak)',
    minCharge: 'Berlaku minimum pembayaran {n} anak ({m} terdaftar).',
    extraAdultLine: 'Tiket dewasa tambahan',
    extraAdultNote: '{x} dewasa melebihi {n} per anak yang termasuk paket – tiket masuk reguler dibayar di lokasi.',
    spotLine: 'Upgrade {s} ({h} jam)',
    capacity: '{s} memuat hingga {n} tamu – tim kami akan membantu mengatur ruang tambahan.',
    perChild: ' (per anak)',
    paxDesc: ' – {p} pax (termasuk {i}, tambahan {e}/pax)',
    onRequest: ' – harga atas permintaan', onRequestNote: '{x}: tim kami akan mengirimkan harga & menu.',
    starting: ' (harga mulai)', startingNote: 'Item bertanda "harga mulai" akan dikonfirmasi tim kami; jumlah akhir dapat berbeda.',
    noPackage: 'Tidak ada paket aktif.', minChildren: 'Masukkan jumlah anak (min. 1).',
    tooLarge: 'Untuk pesta yang sangat besar silakan hubungi kami langsung.', spotNotFound: 'Lokasi pesta tidak ditemukan.',
    chooseOption: 'Silakan pilih opsi untuk {x}.', evening: '{x} hanya tersedia untuk acara malam (mulai pukul {t} atau lebih).',
    menuNotFound: 'Menu tidak ditemukan: {x}', menuMax: 'Silakan pilih maksimal {n} menu buffet.',
    rejected: 'Permintaan ditolak.', required: '{f} wajib diisi.', badEmail: 'Format email tidak valid.',
    badWa: 'Nomor WhatsApp tidak valid.', badTime: 'Format jam mulai tidak valid (contoh 14:00).',
    rules: 'Mohon centang bahwa Anda sudah membaca aturan taman.', badDate: 'Tanggal acara tidak valid.',
    minDays: 'Booking online minimal {n} hari sebelum acara. Untuk tanggal yang lebih dekat silakan hubungi kami via WhatsApp.',
    parkClosed: 'Maaf, taman tutup pada {d} ({x}).',
    clash: '{s} sudah dibooking pukul {a}–{b} pada tanggal tersebut. Silakan pilih jam atau lokasi lain.',
    dayFull: 'Maaf, {d} sudah penuh. Silakan pilih tanggal lain.', invalidDate: 'Tanggal tidak valid.',
    f_nama: 'Nama orang tua / kontak', f_email: 'Email', f_hp: 'Nomor WhatsApp', f_namaAnak: 'Nama anak yang berulang tahun',
    f_tglAcara: 'Tanggal acara', f_jam: 'Jam mulai', f_lokasiId: 'Lokasi pesta', f_jumlahAnak: 'Jumlah anak',
    hi: 'Halo', bookingNo: 'No. booking', birthdayChild: 'Yang berulang tahun', turning: '{n} tahun', date: 'Tanggal', time: 'Jam',
    spot: 'Lokasi pesta', rate: 'Tarif', guests: 'Tamu', guestsVal: '{a} anak, {d} dewasa', buffet: 'Menu buffet anak',
    toBeChosen: 'Belum dipilih', theme: 'Tema pesta', entLang: 'Bahasa hiburan',
    item: 'Item', qty: 'Jml', price: 'Harga', amount: 'Jumlah', subtotal: 'Subtotal', tax: 'Pajak & service ({n}%)', total: 'TOTAL',
    paid: 'Sudah dibayar', balance: 'Sisa tagihan', bankTitle: 'Info transfer bank',
    bankNote: 'Cantumkan nomor booking pada berita transfer, lalu balas email ini (atau kirim via WhatsApp) beserta bukti transfer.',
    reminders: 'Hal penting yang perlu diperhatikan',
    questions: 'Ada pertanyaan? Cukup balas email ini atau WhatsApp {k} di {t}.', seeYou: 'Sampai jumpa di Mookiland! 🐒', team: 'Tim {x}',
    confTitle: 'Booking diterima', confSubject: 'Booking diterima {id} – Ulang tahun {c} di {eo}',
    confIntro: 'Terima kasih telah memilih <b>{eo}</b> untuk ulang tahun {c}! Permintaan booking Anda sudah kami terima:',
    costEstimate: 'Estimasi biaya',
    depositNeed: 'Untuk mengunci tanggal, diperlukan DP sebesar <b>{dp}</b>.',
    proformaSent: 'Proforma invoice dikirim dalam email terpisah.', proformaSoon: 'Proforma invoice akan segera kami kirimkan.',
    availability: 'Add-on tergantung ketersediaan – tim kami akan mengonfirmasi semuanya kepada Anda.', yourNotes: 'Catatan Anda',
    proTitle: 'Proforma invoice', proSubject: 'Proforma invoice {no} – {eo}',
    proIntro: 'Terlampir proforma invoice <b>{no}</b> (PDF) untuk pesta ulang tahun {c} pada {d}.',
    payDeposit: 'Mohon bayar DP minimal <b>{x}</b> paling lambat <b>{d}</b> untuk mengunci tanggal pesta Anda.',
    depositReceived: 'DP Anda sudah kami terima. Sisa tagihan <b>{x}</b> mohon dilunasi paling lambat <b>{d}</b>.',
    payTitle: 'Pembayaran diterima', paySubject: 'Pembayaran diterima – {id}', paySubjectFull: 'Pembayaran diterima – {id} (lunas)',
    payIntro: 'Pembayaran Anda untuk booking <b>{id}</b> sudah kami terima. Terima kasih! 🎉',
    payNo: 'No. pembayaran', amountReceived: 'Jumlah diterima', method: 'Metode', totalPaid: 'Total sudah dibayar',
    nowPaid: 'Booking Anda sekarang sudah <b style="color:#16a34a">LUNAS</b>. Invoice lunas dikirim dalam email terpisah.',
    secured: 'Tanggal pesta Anda sudah terkunci! Sisa tagihan <b>{x}</b> mohon dilunasi paling lambat <b>{d}</b>.',
    partyDetails: 'Detail pesta: {d}, pukul {t} di {s}.',
    invTitle: 'Invoice lunas', invSubject: 'Invoice lunas {no} – {eo}',
    invIntro: 'Terima kasih – booking <b>{id}</b> sudah <b style="color:#16a34a">LUNAS</b>. Invoice resmi <b>{no}</b> terlampir (PDF).',
    cantWait: 'Kami tidak sabar membuat ulang tahun {c} menjadi petualangan seru yang tak terlupakan!',
    docPro: 'PROFORMA INVOICE', docInv: 'INVOICE', docNo: 'No', docDate: 'Tanggal', depositDue: 'Jatuh tempo DP', billTo: 'Ditagihkan kepada',
    partyDet: 'Detail pesta', birthdayOf: 'Ulang tahun {c}', details: 'Rincian', description: 'Deskripsi',
    depositReq: 'DP minimal ({n}%)', payHistory: 'Riwayat pembayaran', payment: 'Pembayaran',
    transferRef: 'Cantumkan no. booking {id} pada berita transfer.', stampPaid: 'LUNAS', terms: 'Syarat & ketentuan',
    autoDoc: 'Dokumen ini dibuat otomatis oleh sistem booking {eo} dan sah tanpa tanda tangan.',
    childrenAdults: '{a} anak, {d} dewasa',
  },
};

function lang_(v) {
  return String(v || '').toLowerCase().slice(0, 2) === 'id' ? 'id' : 'en';
}

/** Ambil teks terjemahan dan isi variabel {x}. */
function tx_(lang, key, vars) {
  const dict = TX_[lang_(lang)];
  let s = dict[key] !== undefined ? dict[key] : (TX_.en[key] !== undefined ? TX_.en[key] : key);
  if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k])); });
  return s;
}

/** Error dengan pesan sesuai bahasa pelanggan. */
function txErr_(lang, key, vars) {
  return new Error(tx_(lang, key, vars));
}

/** Tanggal panjang sesuai bahasa. */
function tglL_(v, lang) {
  return lang_(lang) === 'id' ? tglIndo_(v) : tglEn_(v);
}

function tglPendekL_(v, lang) {
  return lang_(lang) === 'id' ? tglPendek_(v) : tglPendekEn_(v);
}

/** Pilih nilai versi Indonesia bila tersedia. */
function pickL_(lang, en, idv) {
  return lang_(lang) === 'id' && String(idv || '').trim() ? String(idv) : String(en || '');
}
