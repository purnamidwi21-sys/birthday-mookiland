// Kamus teks website pelanggan: English (en) & Bahasa Indonesia (id).
// Ubah teks di sini. Variabel ditulis {nama}. Konten paket/add-on/menu/aturan diambil dari Google Sheet.
window.I18N = {
  en: {
    nav_package: 'Package', nav_spots: 'Party Spots', nav_addons: 'Add-ons', nav_book: 'Plan & Book', nav_rules: 'Rules', book_now: 'Book now',
    hero_sign: 'Birthday Party Package',
    hero_h1: 'A <em>wild jungle</em> birthday adventure',
    hero_lead: 'All-day playtime, a reserved party spot, a children\'s buffet and endless fun with Mooki. Build your party, see the price instantly and book online.',
    cta_plan: 'Plan my party', cta_wa: 'WhatsApp us',
    weekday: 'Weekday', weekend: 'Weekend', per_child: 'PER CHILD', days_wd: 'Monday – Friday', days_we: 'Saturday – Sunday<br>&amp; Public Holiday',
    incl: 'Package inclusions',
    spots_sign: 'First, pick your party spot!',
    spots_p: 'Choose where your celebration will take place. Every spot is reserved for your party for 3 hours.',
    addons_sign: 'Add more fun to the party!',
    addons_p: 'Tap <b>Add</b> on anything you like – it goes straight into your party plan below. Availability is subject to confirmation, so early booking is recommended.',
    book_sign: 'Plan & book your party',
    book_p: 'Your estimate updates as you go. When it looks right, send your booking – we\'ll email your confirmation and proforma invoice straight away.',
    s1: 'When & where', f_date: 'Party date *', f_time: 'Start time *',
    f_spot: 'Party spot * <span class="muted" style="display:inline;font-weight:600">· reserved for 3 hours</span>',
    s2: 'Guests', f_kids: 'Children *', f_adults: 'Adults',
    hint_kids: 'Minimum charge of {n} children.', hint_adults: 'Entrance for up to {n} adults per child is included.',
    s3: 'Children\'s buffet menu',
    menu_intro: 'Included with the package – choose up to <b>{n}</b> items. The children\'s buffet is for kids only; adult meals can be ordered separately.',
    s4: 'Your add-ons', browse: '＋ Browse all add-ons',
    s5: 'Your details', f_nama: 'Parent / contact name *', f_hp: 'WhatsApp number *', f_child: 'Birthday child\'s name *', f_age: 'Turning (age)',
    f_theme: 'Party theme', ph_theme: 'e.g. Jungle, Dinosaurs, Princess', f_entlang: 'Entertainment language',
    opt_en: 'English', opt_ru: 'Russian', opt_id: 'Indonesian',
    f_notes: 'Notes (allergies, custom cake idea, special requests)',
    agree_b: 'I have read the park rules',
    agree_small: 'Outside food, decorations and entertainers are not permitted. <a href="#rules">Read the rules</a>',
    sum_title: 'Your party estimate', sum_empty: 'Enter the number of children to see your estimate.', submit: 'Send booking',
    sum_note: 'Your date is secured once the deposit is received. Final prices for items marked "starting price" are confirmed by our team.',
    rules_sign: 'Important reminders', rules_p: 'For all visitors – thank you for helping us keep Mookiland fun and safe!',
    foot_info: 'More info &amp; pre-booking with <b>{k}</b> · {t}', foot_wa: 'WhatsApp Bu Dwi', admin_login: 'Admin login', wa_float: 'Chat with Bu Dwi',
    wa_msg: 'Hi Bu Dwi, I would like to ask about a birthday party at Mookiland.',
    wa_booked: 'Hi Bu Dwi, I just booked a birthday party at Mookiland. Booking no. {id} ({d}, {t}).',
    m_title: 'Booking sent!', m_keep: 'Please keep your booking number:', m_wa: 'Send my booking no. to Bu Dwi', m_done: 'Done',
    m_thanks: 'Thank you, <b>{n}</b>! We\'ve received your booking for <b>{d}</b>, {t} at <b>{s}</b>.',
    m_total: 'Estimated total', m_dp: 'Deposit to secure your date',
    m_sent2: 'Your confirmation and proforma invoice have been sent to <b>{e}</b>. Please also check your spam/promotions folder.',
    m_sent1: 'Your confirmation has been sent to <b>{e}</b>. Please also check your spam/promotions folder.',
    m_fail: 'We could not send the confirmation email – our team will contact you on WhatsApp.',
    load_err: 'Sorry, we could not load the party information ({e}). Please WhatsApp us.',
    spot_included: 'Included in the package', spot_price: '+{wd} weekday · +{we} weekend & holiday', choose_spot: 'Choose this spot',
    included: 'Included', up_to_seats: ' · up to {n} seats',
    unit_child: 'per child', unit_pax: 'for {n} pax · +{e}/pax', unit_each: 'each', unit_start_each: 'starting price, each',
    unit_start: 'starting price', unit_party: 'per party', on_request: 'On request', see_menu: 'see our menu',
    chip_eve: '🌙 Evening only (from {t})', chip_opts: '{n} options', add: '＋ Add', added: '✓ Added',
    toast_added: '✓ {x} added to your party plan', toast_replaced: 'Replaced {a} with {b}',
    sel_empty: 'No add-ons yet – browse entertainment, decorations, cakes and drinks above.',
    lbl_pax: 'Pax', lbl_qty: 'Qty', x_children: '× number of children', remove: 'Remove',
    day_closed: '⛔ {d} – the park is closed ({x}). Please choose another date.',
    too_soon: 'Online bookings need at least {n} days\' notice. For earlier dates please WhatsApp us.',
    rate_badge: '{d} · {l} rate: <b>{p}</b> per child',
    busy: 'Booked {x}', free: '✓ Free all day',
    clash: 'This spot is already booked {a}–{b} on that day. Please choose another start time or spot.',
    reserved: 'Your spot is reserved {a} – {b}.',
    d_weekday: 'Weekday', d_weekend: 'Weekend', d_holiday: 'Public holiday ({x})', d_closed: 'Closed – {x}',
    r_we: 'Weekend/Holiday', r_wd: 'Weekday',
    line_pkg: '{r} package × {n} children', n_min: 'Minimum charge of {n} children applies.',
    line_adults: 'Additional adults × {n}', n_adults: '{x} adult(s) beyond the included {n} per child pay the regular entrance fee on the day.',
    line_spot: '{s} upgrade', n_cap: '{s} seats up to {n} guests – our team will help arrange extra space.',
    n_req: '{x}: price on request – our team will send the menu.',
    n_eve: '⚠️ {x} is for evening events only – please start at {t} or later.',
    n_start: '* Starting price – the final amount is confirmed by our team.',
    choose_date: 'Choose a date', choose_spot2: 'Choose a spot', meta_guests: '{a} kids · {d} adults',
    line_tax: 'Tax & service {n}%', total: 'Total', deposit: 'Deposit to secure your date',
    err_spot: 'Please choose a party spot.', err_avail: 'Please choose an available date, time and spot.', sending: 'Sending your booking…',
    cat: { 'Entertainment': 'Entertainment', 'Science Show': 'Science Show', 'Creative Workshop': 'Creative Workshop', 'Decoration': 'Decoration', 'Cake': 'Cake', 'Food & Drinks': 'Food & Drinks' },
  },

  id: {
    nav_package: 'Paket', nav_spots: 'Lokasi Pesta', nav_addons: 'Add-on', nav_book: 'Rencana & Booking', nav_rules: 'Aturan', book_now: 'Booking sekarang',
    hero_sign: 'Paket Pesta Ulang Tahun',
    hero_h1: 'Petualangan ulang tahun <em>ala hutan</em> yang seru',
    hero_lead: 'Bermain sepanjang hari, area pesta khusus, buffet anak, dan keseruan tanpa henti bersama Mooki. Rancang pesta Anda, lihat harganya langsung, dan booking online.',
    cta_plan: 'Rancang pesta saya', cta_wa: 'WhatsApp kami',
    weekday: 'Hari Kerja', weekend: 'Akhir Pekan', per_child: 'PER ANAK', days_wd: 'Senin – Jumat', days_we: 'Sabtu – Minggu<br>&amp; Hari Libur',
    incl: 'Termasuk dalam paket',
    spots_sign: 'Pertama, pilih lokasi pesta!',
    spots_p: 'Pilih tempat perayaan Anda. Setiap lokasi dipesan khusus untuk pesta Anda selama 3 jam.',
    addons_sign: 'Tambah keseruan pesta!',
    addons_p: 'Klik <b>Tambah</b> pada pilihan yang Anda suka – langsung masuk ke rencana pesta di bawah. Ketersediaan perlu dikonfirmasi, jadi sebaiknya pesan lebih awal.',
    book_sign: 'Rancang & booking pesta Anda',
    book_p: 'Estimasi diperbarui otomatis. Jika sudah sesuai, kirim booking – email konfirmasi dan proforma invoice langsung kami kirimkan.',
    s1: 'Kapan & di mana', f_date: 'Tanggal acara *', f_time: 'Jam mulai *',
    f_spot: 'Lokasi pesta * <span class="muted" style="display:inline;font-weight:600">· dipesan selama 3 jam</span>',
    s2: 'Tamu', f_kids: 'Jumlah anak *', f_adults: 'Jumlah dewasa',
    hint_kids: 'Minimum pembayaran {n} anak.', hint_adults: 'Sudah termasuk tiket masuk hingga {n} dewasa per anak.',
    s3: 'Menu buffet anak',
    menu_intro: 'Termasuk dalam paket – pilih hingga <b>{n}</b> menu. Buffet khusus untuk anak-anak; makanan dewasa dapat dipesan terpisah.',
    s4: 'Add-on pilihan Anda', browse: '＋ Lihat semua add-on',
    s5: 'Data Anda', f_nama: 'Nama orang tua / kontak *', f_hp: 'Nomor WhatsApp *', f_child: 'Nama anak yang berulang tahun *', f_age: 'Usia (tahun)',
    f_theme: 'Tema pesta', ph_theme: 'mis. Hutan, Dinosaurus, Putri', f_entlang: 'Bahasa hiburan',
    opt_en: 'Inggris', opt_ru: 'Rusia', opt_id: 'Indonesia',
    f_notes: 'Catatan (alergi, ide kue custom, permintaan khusus)',
    agree_b: 'Saya sudah membaca aturan taman',
    agree_small: 'Makanan, dekorasi, dan pengisi acara dari luar tidak diperbolehkan. <a href="#rules">Baca aturan</a>',
    sum_title: 'Estimasi pesta Anda', sum_empty: 'Masukkan jumlah anak untuk melihat estimasi.', submit: 'Kirim booking',
    sum_note: 'Tanggal Anda terkunci setelah DP diterima. Harga final untuk item bertanda "harga mulai" dikonfirmasi oleh tim kami.',
    rules_sign: 'Hal penting', rules_p: 'Untuk semua pengunjung – terima kasih telah membantu menjaga Mookiland tetap seru dan aman!',
    foot_info: 'Info &amp; pre-booking dengan <b>{k}</b> · {t}', foot_wa: 'WhatsApp Bu Dwi', admin_login: 'Login admin', wa_float: 'Chat dengan Bu Dwi',
    wa_msg: 'Halo Bu Dwi, saya ingin bertanya tentang pesta ulang tahun di Mookiland.',
    wa_booked: 'Halo Bu Dwi, saya baru booking pesta ulang tahun di Mookiland. No. booking {id} ({d}, {t}).',
    m_title: 'Booking terkirim!', m_keep: 'Simpan nomor booking Anda:', m_wa: 'Kirim no. booking ke Bu Dwi', m_done: 'Selesai',
    m_thanks: 'Terima kasih, <b>{n}</b>! Booking Anda untuk <b>{d}</b>, pukul {t} di <b>{s}</b> sudah kami terima.',
    m_total: 'Estimasi total', m_dp: 'DP untuk mengunci tanggal',
    m_sent2: 'Email konfirmasi dan proforma invoice sudah dikirim ke <b>{e}</b>. Cek juga folder spam/promosi.',
    m_sent1: 'Email konfirmasi sudah dikirim ke <b>{e}</b>. Cek juga folder spam/promosi.',
    m_fail: 'Email konfirmasi gagal dikirim – tim kami akan menghubungi Anda via WhatsApp.',
    load_err: 'Maaf, informasi pesta gagal dimuat ({e}). Silakan hubungi kami via WhatsApp.',
    spot_included: 'Termasuk dalam paket', spot_price: '+{wd} hari kerja · +{we} akhir pekan & libur', choose_spot: 'Pilih lokasi ini',
    included: 'Termasuk', up_to_seats: ' · hingga {n} kursi',
    unit_child: 'per anak', unit_pax: 'untuk {n} pax · +{e}/pax', unit_each: 'per item', unit_start_each: 'harga mulai, per item',
    unit_start: 'harga mulai', unit_party: 'per acara', on_request: 'Atas permintaan', see_menu: 'lihat menu kami',
    chip_eve: '🌙 Khusus malam (mulai {t})', chip_opts: '{n} pilihan', add: '＋ Tambah', added: '✓ Ditambahkan',
    toast_added: '✓ {x} ditambahkan ke rencana pesta', toast_replaced: '{a} diganti dengan {b}',
    sel_empty: 'Belum ada add-on – lihat pilihan hiburan, dekorasi, kue, dan minuman di atas.',
    lbl_pax: 'Pax', lbl_qty: 'Jumlah', x_children: '× jumlah anak', remove: 'Hapus',
    day_closed: '⛔ {d} – taman tutup ({x}). Silakan pilih tanggal lain.',
    too_soon: 'Booking online minimal {n} hari sebelum acara. Untuk tanggal yang lebih dekat silakan WhatsApp kami.',
    rate_badge: '{d} · tarif {l}: <b>{p}</b> per anak',
    busy: 'Terisi {x}', free: '✓ Kosong seharian',
    clash: 'Lokasi ini sudah terisi pukul {a}–{b} di hari tersebut. Silakan pilih jam mulai atau lokasi lain.',
    reserved: 'Lokasi Anda dipesan pukul {a} – {b}.',
    d_weekday: 'Hari kerja', d_weekend: 'Akhir pekan', d_holiday: 'Hari libur ({x})', d_closed: 'Tutup – {x}',
    r_we: 'Akhir pekan/Libur', r_wd: 'Hari kerja',
    line_pkg: 'Paket {r} × {n} anak', n_min: 'Berlaku minimum pembayaran {n} anak.',
    line_adults: 'Dewasa tambahan × {n}', n_adults: '{x} dewasa melebihi {n} per anak membayar tiket masuk reguler di lokasi.',
    line_spot: 'Upgrade {s}', n_cap: '{s} memuat hingga {n} tamu – tim kami akan membantu mengatur ruang tambahan.',
    n_req: '{x}: harga atas permintaan – tim kami akan mengirimkan menu.',
    n_eve: '⚠️ {x} khusus acara malam – silakan mulai pukul {t} atau lebih.',
    n_start: '* Harga mulai – jumlah final dikonfirmasi oleh tim kami.',
    choose_date: 'Pilih tanggal', choose_spot2: 'Pilih lokasi', meta_guests: '{a} anak · {d} dewasa',
    line_tax: 'Pajak & service {n}%', total: 'Total', deposit: 'DP untuk mengunci tanggal',
    err_spot: 'Silakan pilih lokasi pesta.', err_avail: 'Silakan pilih tanggal, jam, dan lokasi yang tersedia.', sending: 'Mengirim booking…',
    cat: { 'Entertainment': 'Hiburan', 'Science Show': 'Pertunjukan Sains', 'Creative Workshop': 'Workshop Kreatif', 'Decoration': 'Dekorasi', 'Cake': 'Kue', 'Food & Drinks': 'Makanan & Minuman' },
  },
};

(function () {
  const KEY = 'mookiland_lang';
  function detect() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'id' || q === 'en') return q;
    try { const s = localStorage.getItem(KEY); if (s === 'id' || s === 'en') return s; } catch (e) { /* abaikan */ }
    return /^id\b|^in\b/i.test(navigator.language || '') ? 'id' : 'en';
  }
  window.LANG = detect();

  /** t('key', {vars}) – teks sesuai bahasa aktif */
  window.t = function (key, vars) {
    const d = window.I18N[window.LANG] || window.I18N.en;
    let s = d[key] !== undefined ? d[key] : (window.I18N.en[key] !== undefined ? window.I18N.en[key] : key);
    if (vars && typeof s === 'string') Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k])); });
    return s;
  };

  /** Terapkan teks ke elemen ber-atribut data-i18n / data-i18n-html / data-i18n-ph */
  window.applyI18n = function () {
    document.documentElement.lang = window.LANG;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = window.t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = window.t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = window.t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === window.LANG));
  };

  window.setLang = function (l) {
    window.LANG = l === 'id' ? 'id' : 'en';
    try { localStorage.setItem(KEY, window.LANG); } catch (e) { /* abaikan */ }
    window.applyI18n();
    document.dispatchEvent(new CustomEvent('langchange'));
  };
})();
