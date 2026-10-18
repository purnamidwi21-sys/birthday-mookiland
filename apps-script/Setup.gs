/**
 * SETUP AWAL – jalankan fungsi setup() SATU KALI dari editor Apps Script.
 * Membuat semua sheet beserta header dan data dari brosur Mookiland Bali.
 * Sheet yang sudah berisi data TIDAK akan ditimpa.
 *
 * Ingin mengulang dari nol? Hapus sheet yang ingin dibuat ulang, lalu jalankan setup() lagi.
 */

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Buka Apps Script dari Google Sheet (Extensions > Apps Script), lalu jalankan setup() lagi.');

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());

  const ownerEmail = Session.getEffectiveUser().getEmail() || '';
  const schema = getSchema_(ownerEmail);

  Object.keys(schema).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      const rows = schema[name];
      const width = rows[0].length;
      const padded = rows.map(r => r.concat(Array(Math.max(0, width - r.length)).fill('')));
      sh.getRange(1, 1, padded.length, width).setValues(padded);
      sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#d9ead3');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, width);
    }
  });

  formatColumns_(SHEETS.PAKET, ['HargaWeekday', 'HargaWeekend'], '#,##0');
  formatColumns_(SHEETS.LOKASI, ['HargaWeekday', 'HargaWeekend'], '#,##0');
  formatColumns_(SHEETS.ADDON, ['Harga', 'HargaExtraPax'], '#,##0');
  formatColumns_(SHEETS.BOOKING, ['Subtotal', 'Pajak', 'Total', 'DP', 'Dibayar', 'Sisa'], '#,##0');
  formatColumns_(SHEETS.BAYAR, ['Jumlah'], '#,##0');

  if (readTable_(SHEETS.ADMIN).length === 0) createAdmin_('admin', 'admin123', 'Administrator');

  ['Sheet1', 'Lembar1'].forEach(n => {
    const s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  Logger.log('✅ Setup selesai. Login admin awal → username: admin | password: admin123');
  Logger.log('⚠️  SEGERA ganti password lewat menu Akun di halaman admin.');
}

function formatColumns_(sheetName, cols, fmt) {
  const sh = sheet_(sheetName);
  const h = headers_(sheetName);
  cols.forEach(c => {
    const i = h.indexOf(c);
    if (i >= 0) sh.getRange(2, i + 1, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat(fmt);
  });
}

function getSchema_(ownerEmail) {
  const T = "'"; // awalan teks untuk tanggal & jam
  return {
    // ---------------- PAKET ----------------
    [SHEETS.PAKET]: [
      ['ID', 'Nama', 'Deskripsi', 'HargaWeekday', 'HargaWeekend', 'MinAnak', 'DewasaPerAnak', 'DurasiJam', 'Fasilitas', 'Aktif', 'DeskripsiID', 'FasilitasID'],
      ['P01', 'Birthday Party Package', 'Everything you need for a wild jungle birthday adventure at Mookiland Bali.',
        275000, 325000, 10, 2, 3,
        'Minimum charge of 10 children; Entrance fee for 1 child + up to 2 adults – all day playtime; Dedicated outdoor area reserved for 3 hours; Children\'s buffet menu (choose up to 4 items); Complimentary free-flow mineral water; Mookiland-themed e-invitation card',
        true, 'Semua yang Anda butuhkan untuk petualangan ulang tahun ala hutan di Mookiland Bali.',
        'Minimum pembayaran 10 anak; Tiket masuk 1 anak + maksimal 2 dewasa – bermain sepanjang hari; Area outdoor khusus selama 3 jam; Menu buffet anak (pilih hingga 4 menu); Air mineral gratis sepuasnya; Undangan digital bertema Mookiland'],
    ],

    // ---------------- LOKASI ----------------
    [SHEETS.LOKASI]: [
      ['ID', 'Nama', 'Deskripsi', 'HargaWeekday', 'HargaWeekend', 'Kapasitas', 'Label', 'Gambar', 'Aktif', 'DeskripsiID', 'LabelID'],
      ['L01', 'Mooki Garden', 'Our newest shaded garden spot, close to the play areas.', 0, 0, 0, 'NEW!', 'img/loc-garden.jpg', true, 'Area taman teduh terbaru kami, dekat area bermain.', 'BARU!'],
      ['L02', 'Mooki Backyard', 'A cosy backyard under the trees with plenty of space for games.', 0, 0, 0, '', 'img/loc-backyard.jpg', true, 'Halaman belakang yang nyaman di bawah pepohonan, luas untuk bermain.', ''],
      ['L03', 'Covered Terrace Lounge', 'Upgrade: covered terrace by the restaurant, reserved for 3 hours. Up to 30 seats, 50 m².', 1000000, 1200000, 30, 'UPGRADE', 'img/loc-terrace.jpg', true, 'Upgrade: teras beratap di samping restoran, dipesan selama 3 jam. Hingga 30 kursi, 50 m².', 'UPGRADE'],
    ],

    // ---------------- ADD-ON ----------------
    // Satuan: per_event (sekali) | per_anak (× jumlah anak) | per_pax (harga dasar utk TermasukPax + extra/pax)
    //         per_item (× qty yang diisi) | on_request (harga dikonfirmasi tim)
    // Grup: add-on dengan grup yang sama hanya bisa dipilih salah satu.
    // Pilihan: opsi dipisah "|" (mis. rasa kue). MinJamMulai: jam mulai paling awal (HH:mm).
    [SHEETS.ADDON]: [
      ['ID', 'Kategori', 'Nama', 'Deskripsi', 'Harga', 'Satuan', 'TermasukPax', 'HargaExtraPax', 'Pilihan', 'Grup', 'MinJamMulai', 'HargaMulai', 'Durasi', 'Bahasa', 'Gambar', 'Aktif', 'NamaID', 'DeskripsiID', 'PilihanID'],
      ['E01', 'Entertainment', 'Gift Bag – Fun Snacks', 'Your own theme! Fun snacks + milk box.', 90000, 'per_anak', '', '', '', 'giftbag', '', false, '', '', '', true, 'Gift Bag – Snack Seru', 'Tema bebas sesuai pilihan Anda! Snack seru + susu kotak.', ''],
      ['E02', 'Entertainment', 'Gift Bag – Stationery Kit', 'Your own theme! Stationery kit + fun snacks + milk box.', 125000, 'per_anak', '', '', '', 'giftbag', '', false, '', '', '', true, 'Gift Bag – Alat Tulis', 'Tema bebas sesuai pilihan Anda! Paket alat tulis + snack seru + susu kotak.', ''],
      ['E03', 'Entertainment', 'Custom E-Invitation Card', 'E-invitation in your own theme (a Mookiland-themed e-invitation is already included).', 150000, 'per_event', '', '', '', '', '', false, '', '', '', true, 'Undangan Digital Custom', 'Undangan digital dengan tema pilihan Anda (undangan digital bertema Mookiland sudah termasuk paket).', ''],
      ['E04', 'Entertainment', 'Face Painting', '2 hours, 10 pax (kids or adults) included.', 400000, 'per_pax', 10, 40000, '', '', '', false, '2 hours', '', 'img/facepaint.jpg', true, 'Face Painting', '2 jam, sudah termasuk 10 pax (anak atau dewasa).', ''],
      ['E05', 'Entertainment', 'Mooki Funtime', '2× 15 minutes with Mooki! Photos & fun moments with our mascot.', 500000, 'per_event', '', '', '', '', '', false, '2 × 15 min', '', 'img/funtime.jpg', true, 'Mooki Funtime', '2× 15 menit bersama Mooki! Foto & momen seru bersama maskot kami.', ''],
      ['E06', 'Entertainment', 'Bubble Station', '20 minutes of bubble fun using our bubble machine.', 950000, 'per_event', '', '', '', '', '', false, '20 min', '', 'img/bubble.jpg', true, 'Bubble Station', '20 menit keseruan gelembung dengan mesin bubble kami.', ''],
      ['E07', 'Entertainment', 'Bubble Station – Extra 20 Minutes', 'Extend the Bubble Station by 20 minutes.', 500000, 'per_item', '', '', '', '', '', false, '20 min', '', '', true, 'Bubble Station – Tambahan 20 Menit', 'Perpanjang Bubble Station selama 20 menit.', ''],
      ['E08', 'Entertainment', 'Custom Piñata', 'Kid\'s favourite! Snacks for up to 10–12 kids.', 580000, 'per_event', '', '', '', '', '', false, '', '', 'img/pinata.jpg', true, 'Piñata Custom', 'Favorit anak-anak! Berisi snack untuk 10–12 anak.', ''],
      ['E09', 'Entertainment', 'Piñata Extra Snacks', 'Extra snacks per kid.', 15000, 'per_item', '', '', '', '', '', true, '', '', '', true, 'Snack Tambahan Piñata', 'Snack tambahan per anak.', ''],
      ['E10', 'Entertainment', 'Magic Show', 'A fun 30-minute magic show.', 1900000, 'per_event', '', '', '', '', '', false, '30 min', 'ENG, IND', '', true, 'Pertunjukan Sulap', 'Pertunjukan sulap seru selama 30 menit.', ''],
      ['E11', 'Entertainment', 'Kids Corner', 'Cake assistant, face painting, blow bubble play, balloon twisting & tattoos.', 2000000, 'per_event', '', '', '', '', '', false, '2 hours', 'ENG, IND', 'img/kidscorner.jpg', true, 'Kids Corner', 'Asisten kue, face painting, main gelembung, balon twist & tato temporer.', ''],
      ['E12', 'Entertainment', 'MC Character – 60 Minutes', 'MC & live character appearance, standard party games, character cake presentation.', 2100000, 'per_event', '', '', '', 'mc', '', false, '60 min', 'ENG, RUS', '', true, 'MC Karakter – 60 Menit', 'MC & penampilan karakter langsung, permainan pesta standar, presentasi kue bersama karakter.', ''],
      ['E13', 'Entertainment', 'MC Character – 90 Minutes', 'MC & live character appearance, premium interactive games, enhanced game equipment, character cake presentation.', 2500000, 'per_event', '', '', '', 'mc', '', false, '90 min', 'ENG, RUS', '', true, 'MC Karakter – 90 Menit', 'MC & penampilan karakter langsung, permainan interaktif premium, perlengkapan permainan lebih lengkap, presentasi kue bersama karakter.', ''],
      ['S01', 'Science Show', 'Giant Bubble Show', 'Science show with professional animator included.', 2800000, 'per_event', '', '', '', '', '', false, '30 min', 'ENG, RUS', 'img/sci-bubble.jpg', true, 'Giant Bubble Show', 'Pertunjukan sains, sudah termasuk animator profesional.', ''],
      ['S02', 'Science Show', 'Nitro Blast', 'Science show with professional animator included.', 2800000, 'per_event', '', '', '', '', '', false, '30 min', 'ENG, RUS', 'img/sci-nitro.jpg', true, 'Nitro Blast', 'Pertunjukan sains, sudah termasuk animator profesional.', ''],
      ['S03', 'Science Show', 'Tesla Glow', 'Evening event only. Science show with professional animator included.', 3800000, 'per_event', '', '', '', '', T + '17:00', false, '30 min', 'ENG, RUS', 'img/sci-tesla.jpg', true, 'Tesla Glow', 'Khusus acara malam. Pertunjukan sains, sudah termasuk animator profesional.', ''],
      ['W01', 'Creative Workshop', 'Choco Pop-Its', '30-minute workshop for 10 kids, animator included.', 2800000, 'per_pax', 10, 280000, '', '', '', false, '30 min', 'ENG, RUS', 'img/ws-choco.jpg', true, 'Choco Pop-Its', 'Workshop 30 menit untuk 10 anak, sudah termasuk animator.', ''],
      ['W02', 'Creative Workshop', 'Slime Lab', '30-minute workshop for 10 kids, animator included.', 2300000, 'per_pax', 10, 230000, '', '', '', false, '30 min', 'ENG, RUS', 'img/ws-slime.jpg', true, 'Slime Lab', 'Workshop 30 menit untuk 10 anak, sudah termasuk animator.', ''],
      ['W03', 'Creative Workshop', 'Art Canvas', '30-minute workshop for 10 kids, animator included.', 2300000, 'per_pax', 10, 230000, '', '', '', false, '30 min', 'ENG, RUS', 'img/ws-art.jpg', true, 'Art Canvas', 'Workshop 30 menit untuk 10 anak, sudah termasuk animator.', ''],
      ['D01', 'Decoration', 'Easy Mooki', '75 colorful balloons OR 50 balloons + hanging flags, 1× number balloon, 1× balloon arrangement.', 850000, 'per_event', '', '', '75 colorful balloons|50 balloons + hanging flags', 'deco', '', false, '', '', 'img/deco-easy.jpg', true, 'Easy Mooki', '75 balon warna-warni ATAU 50 balon + bendera gantung, 1× balon angka, 1× rangkaian balon.', '75 balon warna-warni|50 balon + bendera gantung'],
      ['D02', 'Decoration', 'Happy Mooki', '1× big backdrop, 1× small backdrop, 1× venue decoration, 200 balloons & 3D paper.', 1500000, 'per_event', '', '', '', 'deco', '', false, '', '', 'img/deco-happy.jpg', true, 'Happy Mooki', '1× backdrop besar, 1× backdrop kecil, 1× dekorasi venue, 200 balon & 3D paper.', ''],
      ['D03', 'Decoration', 'Super Mooki', '1× big backdrop, 2× small backdrop, 1× venue decoration, 1× big 3D styrofoam, 300 balloons & 3D paper.', 3000000, 'per_event', '', '', '', 'deco', '', false, '', '', 'img/deco-super.jpg', true, 'Super Mooki', '1× backdrop besar, 2× backdrop kecil, 1× dekorasi venue, 1× styrofoam 3D besar, 300 balon & 3D paper.', ''],
      ['D04', 'Decoration', 'Mooki Dream', '1× big backdrop, 2× small backdrop, 1× venue decoration, 2× big 3D styrofoam, hanging flags, 600 balloons & 3D paper.', 4500000, 'per_event', '', '', '', 'deco', '', false, '', '', 'img/deco-dream.jpg', true, 'Mooki Dream', '1× backdrop besar, 2× backdrop kecil, 1× dekorasi venue, 2× styrofoam 3D besar, bendera gantung, 600 balon & 3D paper.', ''],
      ['C01', 'Cake', 'Favorite Cake 20 cm', 'Up to 10–12 slices. Ready-to-go favourite.', 550000, 'per_item', '', '', 'Chocolate Cake|Red Velvet|Apple Crumble|Strawberry Cheesecake|Raspberry Cheesecake|Vegan Chocolate Cake|Lemon Cake', '', '', true, '', '', 'img/cake-lemon.jpg', true, 'Kue Favorit 20 cm', 'Hingga 10–12 potong. Kue favorit siap pesan.', 'Kue Cokelat|Red Velvet|Apple Crumble|Strawberry Cheesecake|Raspberry Cheesecake|Kue Cokelat Vegan|Kue Lemon'],
      ['C02', 'Cake', 'Favorite Cake 24 cm', 'Up to 14–18 slices. Ready-to-go favourite.', 740000, 'per_item', '', '', 'Chocolate Cake|Red Velvet|Vegan Chocolate Cake|Lemon Cake', '', '', true, '', '', 'img/cake-choco.jpg', true, 'Kue Favorit 24 cm', 'Hingga 14–18 potong. Kue favorit siap pesan.', 'Kue Cokelat|Red Velvet|Kue Cokelat Vegan|Kue Lemon'],
      ['C03', 'Cake', 'Favorite Cake 30 cm', 'Up to 22–26 slices. Ready-to-go favourite.', 1100000, 'per_item', '', '', 'Chocolate Cake|Red Velvet|Vegan Chocolate Cake|Lemon Cake', '', '', true, '', '', 'img/cake-redvelvet.jpg', true, 'Kue Favorit 30 cm', 'Hingga 22–26 potong. Kue favorit siap pesan.', 'Kue Cokelat|Red Velvet|Kue Cokelat Vegan|Kue Lemon'],
      ['C04', 'Cake', 'Custom Cake 16 cm (tiered)', 'Fully personalised, made to order (up to 15 slices). Please book early and describe your theme in the notes.', 1600000, 'per_item', '', '', '', '', '', true, '', '', '', true, 'Kue Custom 16 cm (bertingkat)', 'Dibuat khusus sesuai keinginan (hingga 15 potong). Mohon pesan lebih awal dan tuliskan tema kue di catatan.', ''],
      ['C05', 'Cake', 'Outside Cake Charge', 'Applies if you bring your own cake.', 165000, 'per_event', '', '', '', '', '', false, '', '', '', true, 'Biaya Kue dari Luar', 'Berlaku jika Anda membawa kue sendiri.', ''],
      ['F01', 'Food & Drinks', 'Refreshing Slushy (400 ml)', 'Per glass.', 39500, 'per_item', '', '', '', '', '', false, '', '', '', true, 'Slushy Segar (400 ml)', 'Per gelas.', ''],
      ['F02', 'Food & Drinks', 'Fresh Juice (350 ml)', 'Per glass.', 32000, 'per_item', '', '', '', '', '', false, '', '', '', true, 'Jus Segar (350 ml)', 'Per gelas.', ''],
      ['F03', 'Food & Drinks', 'Mix Juice / Smoothie (350 ml)', 'Per glass.', 43000, 'per_item', '', '', '', '', '', false, '', '', '', true, 'Jus Campur / Smoothie (350 ml)', 'Per gelas.', ''],
      ['F04', 'Food & Drinks', 'Cotton Candy', 'Per piece.', 46500, 'per_item', '', '', '', '', '', false, '', '', '', true, 'Gulali (Cotton Candy)', 'Per porsi.', ''],
      ['F05', 'Food & Drinks', 'Cookie', 'Per piece.', 38500, 'per_item', '', '', 'Chocolate Cookie|Walnut Cookie', '', '', false, '', '', '', true, 'Cookie', 'Per buah.', 'Cookie Cokelat|Cookie Walnut'],
      ['F06', 'Food & Drinks', 'Jungle Cocktail (1 liter)', 'Fruit cocktail with Havana rum. Adults only.', 345000, 'per_item', '', '', '', '', '', false, '', '', '', true, 'Jungle Cocktail (1 liter)', 'Koktail buah dengan rum Havana. Khusus dewasa.', ''],
      ['F07', 'Food & Drinks', 'Cold Beer Package', 'Your private fridge stocked with cold beers at your party spot. Min. order 24 beers – see our beer menu. Adults only.', 0, 'on_request', '', '', '', '', '', false, '', '', '', true, 'Paket Bir Dingin', 'Kulkas pribadi berisi bir dingin di lokasi pesta Anda. Min. 24 botol – lihat menu bir kami. Khusus dewasa.', ''],
    ],

    // ---------------- MENU BUFFET ANAK (pilih maks. 4) ----------------
    [SHEETS.MENU]: [
      ['No', 'Nama', 'Kategori', 'Aktif', 'NamaID', 'KategoriID'],
      [1, 'Chicken Nuggets', 'Kids\' Favorites', true, 'Nugget Ayam', 'Favorit Anak'],
      [2, 'Cheese Quesadillas', 'Kids\' Favorites', true, 'Quesadilla Keju', 'Favorit Anak'],
      [3, 'Chicken Quesadillas', 'Kids\' Favorites', true, 'Quesadilla Ayam', 'Favorit Anak'],
      [4, 'Chicken Wings', 'Kids\' Favorites', true, 'Sayap Ayam', 'Favorit Anak'],
      [5, 'Veggie Spring Rolls', 'Kids\' Favorites', true, 'Lumpia Sayur', 'Favorit Anak'],
      [6, 'Salty / Plain Popcorn', 'Kids\' Favorites', true, 'Popcorn Asin / Original', 'Favorit Anak'],
      [7, 'Steam Vegetables', 'Healthy Picks', true, 'Sayur Kukus', 'Pilihan Sehat'],
      [9, 'Fruit Brochette', 'Healthy Picks', true, 'Sate Buah', 'Pilihan Sehat'],
      [10, 'French Fries', 'Healthy Picks', true, 'Kentang Goreng', 'Pilihan Sehat'],
      [11, 'Nasi Goreng Veggie', 'Healthy Picks', true, 'Nasi Goreng Sayur', 'Pilihan Sehat'],
      [12, 'Mie Goreng Veggie', 'Healthy Picks', true, 'Mie Goreng Sayur', 'Pilihan Sehat'],
    ],

    // ---------------- HARI LIBUR (harga weekend) ----------------
    // Jenis: Libur = harga weekend/public holiday | Tutup = tidak menerima booking
    // Sumber: SKB 3 Menteri 2026 & 2027 (libur nasional + cuti bersama). Hapus/ubah sesuai kebijakan.
    [SHEETS.LIBUR]: [
      ['Tanggal', 'Keterangan', 'Jenis'],
      [T + '2026-12-24', 'Cuti bersama Natal', 'Libur'],
      [T + '2026-12-25', 'Hari Raya Natal', 'Libur'],
      [T + '2027-01-01', 'Tahun Baru 2027', 'Libur'],
      [T + '2027-01-05', 'Isra Mikraj', 'Libur'],
      [T + '2027-02-05', 'Cuti bersama Imlek', 'Libur'],
      [T + '2027-02-06', 'Tahun Baru Imlek', 'Libur'],
      [T + '2027-03-08', 'Hari Suci Nyepi', 'Tutup'],
      [T + '2027-03-09', 'Cuti bersama Idulfitri', 'Libur'],
      [T + '2027-03-10', 'Idulfitri', 'Libur'],
      [T + '2027-03-11', 'Idulfitri', 'Libur'],
      [T + '2027-03-12', 'Cuti bersama Idulfitri', 'Libur'],
      [T + '2027-03-15', 'Cuti bersama Idulfitri', 'Libur'],
      [T + '2027-03-25', 'Cuti bersama Wafat Yesus Kristus', 'Libur'],
      [T + '2027-03-26', 'Wafat Yesus Kristus', 'Libur'],
      [T + '2027-03-28', 'Paskah', 'Libur'],
      [T + '2027-05-01', 'Hari Buruh', 'Libur'],
      [T + '2027-05-06', 'Kenaikan Yesus Kristus', 'Libur'],
      [T + '2027-05-17', 'Iduladha', 'Libur'],
      [T + '2027-05-18', 'Cuti bersama Iduladha', 'Libur'],
      [T + '2027-05-19', 'Cuti bersama Waisak', 'Libur'],
      [T + '2027-05-20', 'Hari Raya Waisak', 'Libur'],
      [T + '2027-06-01', 'Hari Lahir Pancasila', 'Libur'],
      [T + '2027-06-06', 'Tahun Baru Islam', 'Libur'],
      [T + '2027-08-15', 'Maulid Nabi', 'Libur'],
      [T + '2027-08-17', 'Hari Kemerdekaan RI', 'Libur'],
      [T + '2027-12-24', 'Cuti bersama Natal', 'Libur'],
      [T + '2027-12-25', 'Hari Raya Natal', 'Libur'],
      [T + '2027-12-26', 'Isra Mikraj', 'Libur'],
    ],

    // ---------------- TRANSAKSI ----------------
    [SHEETS.BOOKING]: [[
      'BookingID', 'TglBooking', 'Status', 'BahasaPelanggan', 'Nama', 'Email', 'HP', 'NamaAnak', 'Usia', 'Tema', 'Bahasa',
      'TglAcara', 'TipeHari', 'Jam', 'JamSelesai', 'LokasiID', 'NamaLokasi', 'PaketID', 'NamaPaket',
      'JumlahAnak', 'JumlahDewasa', 'MenuBuffet', 'AddOn', 'Catatan', 'Rincian',
      'Subtotal', 'Pajak', 'Total', 'DP', 'Dibayar', 'Sisa', 'ProformaTerkirim', 'InvoiceTerkirim', 'UpdatedAt',
    ]],
    [SHEETS.BAYAR]: [['PaymentID', 'BookingID', 'Tanggal', 'Jumlah', 'Metode', 'Keterangan', 'DicatatOleh', 'DicatatPada']],
    [SHEETS.ADMIN]: [['Username', 'Salt', 'PasswordHash', 'Nama', 'Aktif']],
    [SHEETS.LOG]: [['Waktu', 'BookingID', 'Jenis', 'Penerima', 'Status', 'Keterangan']],

    // ---------------- PENGATURAN ----------------
    [SHEETS.SETTINGS]: [
      ['Key', 'Value', 'Keterangan'],
      ['NAMA_EO', 'Mookiland Bali', 'Nama di website, email & invoice'],
      ['KONTAK_NAMA', 'Bu Dwi', 'Nama kontak booking'],
      ['TELP_EO', '+62 812 3684 3020', 'Nomor WhatsApp kontak'],
      ['EMAIL_EO', ownerEmail, 'Email balasan (reply-to) untuk pelanggan'],
      ['WEBSITE', 'balimookilandpark.com', 'Website taman'],
      ['ALAMAT_EO', 'Mookiland Family Park, Bali', 'Alamat lengkap di invoice'],
      ['LOGO_URL', '', 'URL logo publik utk email/PDF, mis. https://<user>.github.io/<repo>/img/logo.png'],
      ['REKENING', 'Bank XXX 0000000000 a.n. PT Mookiland\n(ganti dengan rekening resmi)', 'Info transfer di proforma (boleh multi-baris)'],
      ['PERSEN_DP', 30, 'Persentase DP dari total (%)'],
      ['PAJAK_PERSEN', 0, 'Pajak/service (%) – 0 jika harga brosur sudah termasuk'],
      ['HARGA_DEWASA_TAMBAHAN', 0, 'Tiket dewasa di atas 2 per anak. 0 = dibayar di lokasi'],
      ['MAX_MENU_BUFFET', 4, 'Maksimal pilihan menu buffet anak'],
      ['JATUH_TEMPO_DP_HARI', 3, 'Batas bayar DP (hari setelah booking)'],
      ['PELUNASAN_H_MINUS', 3, 'Pelunasan paling lambat H-berapa sebelum acara'],
      ['MIN_HARI_BOOKING', 7, 'Booking online minimal H-berapa dari hari ini'],
      ['MAX_EVENT_PER_HARI', 0, 'Batas total acara per tanggal (0 = tanpa batas; bentrok lokasi tetap dicek)'],
      ['AUTO_PROFORMA', true, 'TRUE = proforma langsung dikirim saat booking masuk'],
      ['NOTIF_ADMIN', true, 'TRUE = admin dapat email setiap ada booking baru'],
      ['EMAIL_ADMIN', ownerEmail, 'Penerima notifikasi & laporan default (pisahkan koma)'],
      ['RULES', [
        'Decorations, animations and the children\'s food menu are only available through our Birthday Party Package.',
        'Birthday bookings and add-ons depend on availability. Book early to secure your preferred options.',
        'Outside food and beverages are not allowed inside the premises.',
        'No external decorations are permitted.',
        'No external event organizers, MCs or animators are permitted without prior approval. Additional fees may apply.',
        'Please avoid bringing outside games or recreational items such as balloons, water guns, etc.',
        'Personal speakers or music are not allowed. We\'ve got a great playlist ready for everyone to enjoy!',
        'Sorry, pets are not allowed.',
        'Outside cakes are subject to an extra charge of Rp 165.000.',
      ].join('\n'), 'Aturan versi English (1 baris = 1 poin) – tampil di website & email'],
      ['RULES_ID', [
        'Dekorasi, hiburan/animasi, dan menu makanan anak hanya tersedia melalui Birthday Party Package kami.',
        'Booking ulang tahun dan add-on tergantung ketersediaan. Pesan lebih awal untuk mendapatkan pilihan favorit Anda.',
        'Makanan dan minuman dari luar tidak diperbolehkan masuk area taman.',
        'Dekorasi dari luar tidak diperbolehkan.',
        'EO, MC, atau animator dari luar tidak diperbolehkan tanpa persetujuan sebelumnya. Biaya tambahan dapat berlaku.',
        'Mohon tidak membawa permainan dari luar seperti balon, pistol air, dll.',
        'Speaker atau musik pribadi tidak diperbolehkan. Kami sudah menyiapkan playlist seru untuk semua!',
        'Mohon maaf, hewan peliharaan tidak diperbolehkan.',
        'Kue dari luar dikenakan biaya tambahan Rp 165.000.',
      ].join('\n'), 'Aturan versi Bahasa Indonesia (1 baris = 1 poin)'],
      ['SYARAT', 'Deposit secures your date and is non-refundable for cancellations made less than 14 days before the event. Final guest numbers must be confirmed no later than 3 days before the event. Add-ons are subject to availability.', 'Syarat & ketentuan (English) di proforma/invoice – silakan sesuaikan'],
      ['SYARAT_ID', 'DP mengamankan tanggal acara dan tidak dapat dikembalikan untuk pembatalan kurang dari 14 hari sebelum acara. Jumlah tamu final dikonfirmasi paling lambat 3 hari sebelum acara. Add-on tergantung ketersediaan.', 'Syarat & ketentuan versi Bahasa Indonesia'],
    ],
  };
}
