// Halaman admin: login, dashboard, kelola booking, kirim email, laporan.
(function () {
  const $ = (s) => document.querySelector(s);
  const KEY = 'eo_admin_session';
  let session = null;
  let charts = {};
  let currentDetail = null;

  // ---------- Sesi ----------
  function loadSession() { try { session = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { session = null; } }
  function saveSession(s) { session = s; try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ } }
  function clearSession() { session = null; try { sessionStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }

  async function call(action, payload) {
    try {
      return await api(action, payload, session && session.token);
    } catch (e) {
      if (e.code === 401) { clearSession(); showLogin(); }
      throw e;
    }
  }

  function showLogin() { $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); }
  function showApp() {
    $('#loginView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    $('#whoami').textContent = session.nama || session.username;
    const hb = /#booking=([^&]+)/.exec(location.hash);
    switchTab(hb ? 'bookings' : 'dashboard');
    if (hb) { history.replaceState(null, '', location.pathname); openDetail(decodeURIComponent(hb[1])); }
  }

  // ---------- Login / logout ----------
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = $('#loginBtn');
    setLoading(btn, true, 'Memeriksa…');
    try {
      const r = await api('login', { username: fd.get('username'), password: fd.get('password') });
      saveSession(r);
      e.target.reset();
      showApp();
    } catch (err) {
      toast(err.message, 'error');
    } finally { setLoading(btn, false); }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try { await call('logout'); } catch (e) { /* abaikan */ }
    clearSession();
    showLogin();
  });

  // ---------- Tab ----------
  function switchTab(name) {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    ['dashboard', 'bookings', 'slot', 'akun'].forEach(t => $('#tab-' + t).classList.toggle('hidden', t !== name));
    if (name === 'dashboard') loadDashboard();
    if (name === 'slot') loadSlotTab();
    if (name === 'bookings') loadBookings();
  }
  $('#tabs').addEventListener('click', (e) => { if (e.target.dataset.tab) switchTab(e.target.dataset.tab); });

  // ============================================================
  //  DASHBOARD
  // ============================================================
  function setRange(kind) {
    const now = new Date();
    let from;
    if (kind === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (kind === '3m') from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    else from = new Date(now.getFullYear(), 0, 1);
    $('#dFrom').value = ymd(from);
    $('#dTo').value = ymd(now);
  }
  document.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => { setRange(b.dataset.range); loadDashboard(); }));
  $('#dLoad').addEventListener('click', loadDashboard);

  const statusClass = (s) => ({ 'Menunggu Pembayaran': 'b-menunggu', 'DP Diterima': 'b-dp', 'Lunas': 'b-lunas', 'Selesai': 'b-selesai', 'Batal': 'b-batal' }[s] || 'b-menunggu');
  const badge = (s) => `<span class="badge ${statusClass(s)}">${escapeHtml(s)}</span>`;

  async function loadDashboard() {
    if (!$('#dFrom').value) setRange('3m');
    const btn = $('#dLoad');
    setLoading(btn, true, 'Memuat…');
    try {
      const d = await call('dashboard', { from: $('#dFrom').value, to: $('#dTo').value });
      renderDashboard(d);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(btn, false); }
  }

  function renderDashboard(d) {
    const k = d.kpi;
    const kpi = (lbl, val, sub, cls) => `<div class="kpi ${cls || ''}"><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="sub">${sub || ''}</div></div>`;
    $('#kpis').innerHTML =
      kpi('Pembayaran diterima', rupiah(k.pembayaranDiterima), k.jumlahTransaksi + ' transaksi', 'accent') +
      kpi('Nilai booking', rupiah(k.nilaiBooking), 'rata-rata ' + rupiah(k.rataRata)) +
      kpi('Booking masuk', k.totalBooking, k.bookingAktif + ' aktif · ' + k.batal + ' batal') +
      kpi('Piutang berjalan', rupiah(k.piutang), k.bookingBelumLunas + ' booking belum lunas') +
      kpi('Acara mendatang', k.eventMendatang, 'semua tanggal ke depan') +
      kpi('Anak / dewasa', k.totalAnak + ' / ' + k.totalDewasa, k.lunas + ' booking lunas');

    // Grafik bulanan
    const ctx1 = $('#chMonthly');
    if (charts.m) charts.m.destroy();
    if (window.Chart) {
      charts.m = new Chart(ctx1, {
        data: {
          labels: d.monthly.map(m => m.label),
          datasets: [
            { type: 'bar', label: 'Nilai booking', data: d.monthly.map(m => m.nilai), backgroundColor: '#b9dc8a', borderRadius: 6, yAxisID: 'y' },
            { type: 'bar', label: 'Pembayaran diterima', data: d.monthly.map(m => m.diterima), backgroundColor: '#17502a', borderRadius: 6, yAxisID: 'y' },
            { type: 'line', label: 'Jumlah booking', data: d.monthly.map(m => m.booking), borderColor: '#f37021', backgroundColor: '#f37021', tension: .3, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + (c.dataset.yAxisID === 'y' ? rupiah(c.raw) : c.raw) } } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => v >= 1e6 ? (v / 1e6) + ' jt' : v.toLocaleString('id-ID') } },
            y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { precision: 0 } },
          },
        },
      });

      if (charts.p) charts.p.destroy();
      charts.p = new Chart($('#chLokasi'), {
        type: 'doughnut',
        data: { labels: d.byLokasi.map(x => x.nama), datasets: [{ data: d.byLokasi.map(x => x.jumlah), backgroundColor: ['#17502a', '#8dc63f', '#f37021', '#2f7d32', '#f7b267', '#5b8c5a'] }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
      });
    }

    const mini = (heads, rows) => `<table class="mini-table"><tr>${heads.map((h, i) => `<th class="${i ? 'r' : ''}">${h}</th>`).join('')}</tr>${rows.length ? rows.join('') : `<tr><td colspan="${heads.length}" class="muted">Tidak ada data</td></tr>`}</table>`;
    $('#statusTable').innerHTML = mini(['Status', 'Booking', 'Nilai'], d.byStatus.map(x => `<tr><td>${badge(x.nama)}</td><td class="r">${x.jumlah}</td><td class="r">${rupiah(x.nilai)}</td></tr>`));
    $('#dayTable').innerHTML = mini(['Jenis hari', 'Booking', 'Nilai'], d.byTipeHari.map(x => `<tr><td>${escapeHtml(x.nama)}</td><td class="r">${x.jumlah}</td><td class="r">${rupiah(x.nilai)}</td></tr>`));
    $('#addonTable').innerHTML = mini(['Add-on', 'Dipesan', 'Nilai'], d.byAddOn.slice(0, 10).map(x => `<tr><td>${escapeHtml(x.nama)}</td><td class="r">${x.jumlah}×</td><td class="r">${rupiah(x.nilai)}</td></tr>`));
    $('#menuTable').innerHTML = mini(['Menu', 'Booking', 'Porsi'], d.byMenu.map(x => `<tr><td>${escapeHtml(x.nama)}</td><td class="r">${x.jumlah}</td><td class="r">${x.nilai}</td></tr>`));
    $('#upcomingTable').innerHTML = mini(['Tanggal', 'Anak', 'Lokasi', 'Anak/Dws', 'Menu & add-on', 'Status', 'Sisa'], d.upcoming.map(u =>
      `<tr class="click" data-id="${escapeHtml(u.id)}" style="cursor:pointer"><td>${tglIndo(u.tglAcara)}<br><span class="muted small">${escapeHtml(u.jam)}–${escapeHtml(u.jamSelesai)}</span></td><td>${escapeHtml(u.namaAnak)}<br><span class="muted small">${escapeHtml(u.nama)}</span></td><td>${escapeHtml(u.lokasi)}</td><td class="r">${u.anak} / ${u.dewasa}</td><td class="small">${escapeHtml(u.menu || '-')}<br><span class="muted">${escapeHtml(u.addOn || '')}</span></td><td class="r">${badge(u.status)}</td><td class="r">${rupiah(u.sisa)}</td></tr>`));
    $('#quota').textContent = d.emailQuota != null ? 'Sisa kuota email hari ini: ' + d.emailQuota : '';
  }

  $('#upcomingTable').addEventListener('click', (e) => { const tr = e.target.closest('[data-id]'); if (tr) openDetail(tr.dataset.id); });

  // ---------- Kirim laporan ----------
  $('#reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#rBtn');
    setLoading(btn, true, 'Mengirim laporan…');
    try {
      const r = await call('sendReport', { from: $('#dFrom').value, to: $('#dTo').value, penerima: $('#rTo').value.trim(), catatan: $('#rNote').value });
      toast('Laporan terkirim ke ' + r.terkirim.join(', '), 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(btn, false); }
  });

  // ============================================================
  //  BOOKING
  // ============================================================
  $('#bLoad').addEventListener('click', loadBookings);
  $('#bQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadBookings(); });
  $('#bStatus').addEventListener('change', loadBookings);
  $('#bLokasi').addEventListener('change', loadBookings);
  $('#bUrut').addEventListener('change', loadBookings);

  let lokasiLoaded = false;
  async function loadLokasiOptions() {
    if (lokasiLoaded) return;
    try {
      const d = await api('getPackages');
      $('#bLokasi').innerHTML = '<option value="">Semua lokasi</option>' + d.lokasi.map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.nama)}</option>`).join('');
      lokasiLoaded = true;
    } catch (e) { /* abaikan */ }
  }

  async function loadBookings() {
    loadLokasiOptions();
    const tbody = $('#bRows');
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Memuat…</td></tr>';
    try {
      const rows = await call('listBookings', { q: $('#bQ').value, status: $('#bStatus').value, lokasiId: $('#bLokasi').value, urut: $('#bUrut').value, from: $('#bFrom').value, to: $('#bTo').value });
      $('#bCount').textContent = rows.length + ' booking ditemukan';
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Belum ada booking.</td></tr>'; return; }
      tbody.innerHTML = rows.map(b => `
        <tr class="click" data-id="${escapeHtml(b.id)}">
          <td><b>${escapeHtml(b.id)}</b><br><span class="muted small">${escapeHtml(b.tglBooking)}</span>${b.sumber && b.sumber !== 'Website' ? ` <span class="badge b-wknd">${escapeHtml(b.sumber)}</span>` : ''}</td>
          <td>${tglIndo(b.tglAcara)}<br><span class="muted small">${escapeHtml(b.jam)}–${escapeHtml(b.jamSelesai)}</span> ${/weekend/i.test(b.tipeHari) ? '<span class="badge b-wknd">WE</span>' : ''}</td>
          <td>${escapeHtml(b.namaAnak)}<br><span class="muted small">${escapeHtml(b.nama)}</span></td>
          <td>${escapeHtml(b.lokasiNama)}</td>
          <td class="r">${b.jumlahAnak} / ${b.jumlahDewasa}</td>
          <td class="r">${rupiah(b.total)}</td>
          <td class="r">${rupiah(b.sisa)}</td>
          <td>${badge(b.status)}</td>
        </tr>`).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${escapeHtml(e.message)}</td></tr>`;
    }
  }
  $('#bRows').addEventListener('click', (e) => { const tr = e.target.closest('[data-id]'); if (tr) openDetail(tr.dataset.id); });

  // ---------- Detail booking ----------
  async function openDetail(id) {
    const body = $('#detailBody');
    body.innerHTML = '<p class="muted">Memuat detail…</p>';
    if (!$('#detailModal').open) $('#detailModal').showModal();
    try {
      renderDetail(await call('getBooking', { bookingId: id }));
    } catch (e) { body.innerHTML = '<p>' + escapeHtml(e.message) + '</p>'; }
  }

  function renderDetail(d) {
    currentDetail = d;
    const b = d.booking;
    const batal = b.status === 'Batal';
    const lunas = b.sisa <= 0;
    const info = (l, v) => `<div><span>${l}</span>${v}</div>`;
    const lines = (b.rincian.lines || []).map(l => `<tr><td>${escapeHtml(l.desc)}</td><td class="r">${l.qty}</td><td class="r">${rupiah(l.total)}</td></tr>`).join('');

    $('#detailBody').innerHTML = `
      <div class="modal-head"><div><h2 style="margin:0">${escapeHtml(b.id)}</h2><div class="muted small">Masuk ${escapeHtml(b.tglBooking)}</div></div>
        <div style="display:flex;gap:10px;align-items:center">${badge(b.status)}<button class="x" data-act="close" aria-label="Tutup">×</button></div></div>

      <div class="detail-grid">
        ${info('Yang berulang tahun', escapeHtml(b.namaAnak) + (b.usia ? ' (' + b.usia + ' th)' : ''))}
        ${info('Tanggal & jam', tglIndo(b.tglAcara, true) + ', ' + escapeHtml(b.jam) + '–' + escapeHtml(b.jamSelesai) + ' <span class="badge ' + (/weekend/i.test(b.tipeHari) ? 'b-wknd' : 'b-selesai') + '">' + escapeHtml(b.tipeHari) + '</span>')}
        ${info('Pemesan', escapeHtml(b.nama))}
        ${info('Kontak', `<a href="https://wa.me/${escapeHtml(b.hp.replace(/\D/g, '').replace(/^0/, '62'))}" target="_blank" rel="noopener">${escapeHtml(b.hp)}</a><br>${escapeHtml(b.email)}`)}
        ${info('Lokasi', escapeHtml(b.lokasiNama))}
        ${info('Anak / dewasa', b.jumlahAnak + ' / ' + b.jumlahDewasa)}
        ${info('Menu buffet', escapeHtml(b.menu || '— belum dipilih —'))}
        ${info('Tema · bahasa hiburan', escapeHtml(b.tema || '-') + ' · ' + escapeHtml(b.bahasa || '-'))}
        ${info('Sumber booking', escapeHtml(b.sumber || 'Website') + (b.dibuatOleh ? ' · dibuat oleh ' + escapeHtml(b.dibuatOleh) : ''))}
        ${info('Bahasa email pelanggan', b.lang === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English')}
        ${info('Tanggal lahir', b.tglLahir ? tglIndo(b.tglLahir) : '-')}
        ${info('Kue', escapeHtml(({ none: 'Tanpa kue', standard: 'Kue favorit', custom: 'Kue custom', own: 'Bawa kue sendiri' })[b.jenisKue] || '-') + (b.detailKue ? '<br><span class="small">' + escapeHtml(b.detailKue) + '</span>' : ''))}
        ${info('Tulisan di kue', b.tulisanKue ? '“' + escapeHtml(b.tulisanKue) + '”' : '-')}
        ${info('Foto desain kue', b.desainKue ? `<a href="${escapeHtml(b.desainKue)}" target="_blank" rel="noopener">🎂 Lihat foto</a>` : '-')}
        ${b.catatan ? '<div style="grid-column:1/-1"><span>Catatan pelanggan</span>' + escapeHtml(b.catatan) + '</div>' : ''}
      </div>

      <table class="mini-table"><tr><th>Item</th><th class="r">Qty</th><th class="r">Jumlah</th></tr>${lines}
        ${b.pajak ? `<tr><td colspan="2" class="r muted">Pajak</td><td class="r">${rupiah(b.pajak)}</td></tr>` : ''}
        <tr><td colspan="2" class="r"><b>Total</b></td><td class="r"><b>${rupiah(b.total)}</b></td></tr>
        <tr><td colspan="2" class="r muted">DP minimal</td><td class="r">${rupiah(b.dp)}</td></tr>
        <tr><td colspan="2" class="r muted">Sudah dibayar</td><td class="r">${rupiah(b.dibayar)}</td></tr>
        <tr><td colspan="2" class="r"><b>Sisa</b></td><td class="r"><b style="color:${lunas ? 'var(--leaf)' : 'var(--red)'}">${rupiah(b.sisa)}</b></td></tr>
      </table>
      ${(b.rincian.notes || []).length ? `<ul class="note-list">${b.rincian.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : ''}

      <h4 class="subhead">Aksi</h4>
      <div class="actions">
        <button class="btn sm ghost" data-act="confirm">✉️ Kirim ulang konfirmasi</button>
        <button class="btn sm ghost" data-act="wa">💬 Kirim WA konfirmasi</button>
        <button class="btn sm ghost" data-act="proforma" ${batal || lunas ? 'disabled' : ''}>📄 Kirim proforma invoice</button>
        <button class="btn sm" data-act="pay" ${batal || lunas ? 'disabled' : ''}>💰 Catat pembayaran</button>
        <button class="btn sm mint" data-act="invoice" ${!lunas ? 'disabled' : ''}>✅ Kirim invoice lunas</button>
        <button class="btn sm ghost" data-act="adjust" ${batal ? 'disabled' : ''}>± Penyesuaian harga</button>
      </div>
      <div id="payFormBox"></div>

      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <label class="f" style="flex:1;min-width:180px"><span>Ubah status</span>
          <select id="newStatus">${['Menunggu Pembayaran', 'DP Diterima', 'Lunas', 'Selesai', 'Batal'].map(s => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <button class="btn sm ghost" data-act="status">Simpan status</button>
      </div>
      <p class="small muted" style="margin:6px 0 0">Proforma terkirim: ${escapeHtml(b.proformaTerkirim || '-')} · Invoice lunas terkirim: ${escapeHtml(b.invoiceTerkirim || '-')}</p>

      <h4 class="subhead">Riwayat Pembayaran</h4>
      ${d.payments.length ? `<table class="mini-table"><tr><th>No.</th><th>Tanggal</th><th>Metode</th><th class="r">Jumlah</th></tr>
        ${d.payments.map(p => `<tr><td>${escapeHtml(p.id)}</td><td>${tglIndo(p.tanggal)}</td><td>${escapeHtml(p.metode)}${p.keterangan ? '<br><span class="muted small">' + escapeHtml(p.keterangan) + '</span>' : ''}</td><td class="r">${rupiah(p.jumlah)}</td></tr>`).join('')}</table>`
        : '<p class="muted small">Belum ada pembayaran.</p>'}

      <h4 class="subhead">Log Email &amp; Aktivitas</h4>
      ${d.emails.length ? `<table class="mini-table">${d.emails.map(m => `<tr><td class="small">${escapeHtml(m.waktu)}</td><td>${escapeHtml(m.jenis)}</td><td>${m.status === 'Gagal' ? '<span class="badge b-batal">Gagal</span>' : escapeHtml(m.status)}${m.ket ? '<br><span class="muted small">' + escapeHtml(m.ket) + '</span>' : ''}</td></tr>`).join('')}</table>`
        : '<p class="muted small">Belum ada.</p>'}
    `;
  }

  function payForm(b) {
    const saran = b.dibayar < b.dp ? b.dp - b.dibayar : b.sisa;
    $('#payFormBox').innerHTML = `
      <form class="pay-form" id="payForm">
        <div class="form-grid">
          <label class="f"><span>Jumlah (Rp)</span><input name="jumlah" inputmode="numeric" required value="${Number(saran).toLocaleString('id-ID')}"></label>
          <label class="f"><span>Tanggal bayar</span><input name="tanggal" type="date" required value="${ymd(new Date())}"></label>
          <label class="f"><span>Metode</span><select name="metode"><option>Transfer</option><option>QRIS</option><option>Tunai</option><option>Kartu Debit/Kredit</option><option>Lainnya</option></select></label>
          <label class="f"><span>Keterangan</span><input name="keterangan" maxlength="300" placeholder="mis. BCA a.n. …"></label>
          <label class="check full" style="padding:8px 10px"><input type="checkbox" name="kirimEmail" checked><div><b>Kirim email konfirmasi pembayaran</b><small>Jika lunas, invoice lunas juga otomatis dikirim.</small></div></label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn sm" id="paySave">Simpan pembayaran</button>
          <button class="btn sm ghost" type="button" data-act="paycancel">Batal</button>
          <button class="btn sm ghost" type="button" data-act="paylunas">Isi sisa penuh (${rupiah(b.sisa)})</button>
        </div>
      </form>`;
    const input = $('#payForm [name=jumlah]');
    input.addEventListener('input', () => {
      const n = input.value.replace(/\D/g, '');
      input.value = n ? Number(n).toLocaleString('id-ID') : '';
    });
    input.focus();
  }

  function adjustForm(b) {
    $('#payFormBox').innerHTML = `
      <form class="pay-form" id="adjForm">
        <p class="small" style="margin:0 0 10px"><b>Penyesuaian harga</b> – untuk harga final kue custom, paket bir, tamu tambahan, diskon, dll. Isi minus (mis. <code>-200000</code>) untuk diskon.</p>
        <div class="form-grid">
          <label class="f"><span>Keterangan (tampil di invoice)</span><input name="desc" required maxlength="150" placeholder="mis. Custom cake – final price adjustment"></label>
          <label class="f"><span>Nominal (Rp, boleh minus)</span><input name="amount" required inputmode="numeric" placeholder="250000 / -200000"></label>
          <label class="check full" style="padding:8px 10px"><input type="checkbox" name="kirimProforma" checked><div><b>Kirim ulang proforma invoice</b><small>Pelanggan menerima rincian harga terbaru.</small></div></label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn sm" id="adjSave">Simpan penyesuaian</button>
          <button class="btn sm ghost" type="button" data-act="paycancel">Batal</button>
        </div>
      </form>`;
    $('#adjForm [name=desc]').focus();
  }

  async function doAction(action, payload, btn, okMsg) {
    setLoading(btn, true);
    try {
      const d = await call(action, payload);
      renderDetail(d);
      toast(okMsg, 'success');
      if (!$('#tab-bookings').classList.contains('hidden')) loadBookings();
      return d;
    } catch (e) { toast(e.message, 'error'); }
    finally { if (document.body.contains(btn)) setLoading(btn, false); }
  }

  $('#detailBody').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || !currentDetail) return;
    const b = currentDetail.booking;
    const act = btn.dataset.act;
    if (act === 'close') return $('#detailModal').close();
    if (act === 'confirm') return doAction('resendConfirmation', { bookingId: b.id }, btn, 'Email konfirmasi terkirim.');
    if (act === 'wa') return doAction('resendWa', { bookingId: b.id }, btn, 'WhatsApp konfirmasi terkirim.');
    if (act === 'proforma') return doAction('sendProforma', { bookingId: b.id }, btn, 'Proforma invoice terkirim.');
    if (act === 'invoice') return doAction('sendPaidInvoice', { bookingId: b.id }, btn, 'Invoice lunas terkirim.');
    if (act === 'pay') return payForm(b);
    if (act === 'adjust') return adjustForm(b);
    if (act === 'paycancel') { $('#payFormBox').innerHTML = ''; return; }
    if (act === 'paylunas') { $('#payForm [name=jumlah]').value = Number(b.sisa).toLocaleString('id-ID'); return; }
    if (act === 'status') {
      const st = $('#newStatus').value;
      if (st === b.status) return;
      if (st === 'Batal' && !confirm('Batalkan booking ' + b.id + '?')) return;
      return doAction('updateStatus', { bookingId: b.id, status: st }, btn, 'Status diperbarui.');
    }
  });

  $('#detailBody').addEventListener('submit', async (e) => {
    if (e.target.id === 'adjForm') {
      e.preventDefault();
      const fd = new FormData(e.target);
      const raw = String(fd.get('amount')).trim();
      const amount = (raw.startsWith('-') ? -1 : 1) * Number(raw.replace(/\D/g, ''));
      if (!amount) return toast('Isi nominal penyesuaian.', 'error');
      const b = currentDetail.booking;
      if (!confirm((amount > 0 ? 'Tambah ' : 'Kurangi ') + rupiah(Math.abs(amount)) + ' pada ' + b.id + '?')) return;
      const d = await doAction('adjustPrice', { bookingId: b.id, desc: fd.get('desc'), amount: amount, kirimProforma: !!fd.get('kirimProforma') }, $('#adjSave'), 'Penyesuaian tersimpan.');
      if (d) toast('Total baru: ' + rupiah(d.booking.total) + (d.proformaTerkirim ? ' · proforma terkirim' : ''), 'success');
      return;
    }
    if (e.target.id !== 'payForm') return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const jumlah = Number(String(fd.get('jumlah')).replace(/\D/g, ''));
    const b = currentDetail.booking;
    if (!jumlah) return toast('Isi jumlah pembayaran.', 'error');
    if (!confirm('Catat pembayaran ' + rupiah(jumlah) + ' untuk ' + b.id + '?')) return;
    const d = await doAction('recordPayment', {
      bookingId: b.id, jumlah: jumlah, tanggal: fd.get('tanggal'), metode: fd.get('metode'),
      keterangan: fd.get('keterangan'), kirimEmail: !!fd.get('kirimEmail'),
    }, $('#paySave'), 'Pembayaran tercatat.');
    if (d && fd.get('kirimEmail')) {
      toast(d.emailPembayaran ? 'Email konfirmasi pembayaran terkirim.' : 'Email pembayaran gagal dikirim, cek log.', d.emailPembayaran ? 'success' : 'error');
      if (d.booking.sisa <= 0) toast(d.emailInvoice ? 'Invoice lunas terkirim.' : 'Invoice lunas gagal dikirim.', d.emailInvoice ? 'success' : 'error');
    }
  });


  // ============================================================
  //  KETERSEDIAAN (kalender + blokir slot)
  // ============================================================
  const A = { month: null, days: {}, date: null, grid: null, lokasi: null };

  async function loadSlotTab() {
    if (!A.month) A.month = ymd(new Date()).slice(0, 7);
    if (!A.lokasi) {
      try { A.lokasi = (await api('getPackages')).lokasi; } catch (e) { A.lokasi = []; }
    }
    loadAdminMonth(A.month);
    if (A.date) loadAdminDay(A.date);
  }

  async function loadAdminMonth(m) {
    A.month = m;
    renderAdminCal();
    try {
      A.days[m] = (await call('adminMonth', { bulan: m })).days;
      if (A.month === m) renderAdminCal();
    } catch (e) { toast(e.message, 'error'); }
  }

  function renderAdminCal() {
    renderCalendar($('#aCal'), {
      month: A.month, days: A.days[A.month] || null, selected: A.date, lang: 'id', allowAll: true,
      legend: [['open', 'Banyak kosong'], ['few', 'Hampir penuh'], ['full', 'Penuh'], ['closed', 'Tutup'], ['past', 'Lewat']],
      cellExtra: (d, i) => `<span class="cal-n">${i.events ? i.events + ' acara' : ''}${i.blocked ? ' 🔒' : ''}</span>`,
      onNav: (m) => loadAdminMonth(m),
      onPick: (d) => { A.date = d; renderAdminCal(); loadAdminDay(d); },
    });
  }

  async function loadAdminDay(d) {
    $('#aDayTitle').textContent = tglIndo(d, true);
    $('#aGrid').innerHTML = '<tr><td class="muted">Memuat…</td></tr>';
    try { renderAdminDay(await call('adminDay', { tanggal: d })); } catch (e) { toast(e.message, 'error'); }
  }

  const ST_LABEL = { free: 'Kosong', booked: 'Terisi', blocked: '🔒 Diblokir', closed: 'Tutup', past: 'Lewat' };

  function renderAdminDay(g) {
    A.grid = g;
    $('#aDayBadge').innerHTML = `<div class="day-badge ${g.tipe === 'weekend' ? 'weekend' : ''} ${g.tutup ? 'closed' : ''}" style="margin:0 0 10px">${escapeHtml(g.label)} · ${g.free} dari ${g.total} slot kosong</div>`;
    $('#aGrid').innerHTML =
      `<thead><tr><th>Lokasi</th>${g.slotTimes.map(x => `<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>` +
      g.rows.map(r => `<tr><th>${escapeHtml(r.nama)}</th>${r.slots.map(c => {
        let sub = '';
        if (c.st === 'booked') sub = `<small>${escapeHtml(c.bookingId)}<br>${escapeHtml(c.anak)}</small>`;
        if (c.st === 'blocked') sub = `<small>${escapeHtml(c.ket)}</small>`;
        const data = c.st === 'booked' ? `data-bk="${escapeHtml(c.bookingId)}"` : c.st === 'blocked' ? `data-bl="${escapeHtml(c.blockId)}"` : c.st === 'free' ? `data-free="${escapeHtml(r.lokasiId)}|${escapeHtml(c.jam)}"` : '';
        return `<td><button type="button" class="slot st-${c.st}" ${data} ${data ? '' : 'disabled'} title="${c.dari ? escapeHtml(c.dari + '–' + c.sampai) : ''}">${ST_LABEL[c.st]}${sub}</button></td>`;
      }).join('')}</tr>`).join('') + '</tbody>';
    $('#aGridHint').textContent = 'Klik slot Kosong untuk memblokir · klik Terisi untuk membuka detail booking · klik 🔒 untuk membuka blokir.';

    $('#blockForm').classList.toggle('hidden', g.tutup);
    const nb = $('#aNewBooking');
    nb.classList.toggle('hidden', g.tutup || g.rows.every(r => r.slots.every(x => x.st === 'past')));
    nb.href = 'index.html?admin=1&date=' + g.tanggal;
    $('#bfLokasi').innerHTML = '<option value="">Semua lokasi</option>' + (A.lokasi || []).map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.nama)}</option>`).join('');
    $('#bfJam').innerHTML = g.slotTimes.map(x => `<option>${x}</option>`).join('');
    syncBlockMode();

    $('#aBlocks').innerHTML = g.blocks.length ? `<table class="mini-table">${g.blocks.map(b => `
      <tr><td>${escapeHtml(b.lokasiId ? ((A.lokasi || []).find(l => l.id === b.lokasiId) || {}).nama || b.lokasiId : 'Semua lokasi')}</td>
      <td>${b.jamMulai ? escapeHtml(b.jamMulai + '–' + b.jamSelesai) : 'Seharian'}</td><td>${escapeHtml(b.ket)}<br><span class="muted small">oleh ${escapeHtml(b.oleh)}</span></td>
      <td class="r"><button class="btn sm danger" data-unblock="${escapeHtml(b.id)}">Buka</button></td></tr>`).join('')}</table>`
      : '<p class="muted small">Tidak ada blokir.</p>';
  }

  function syncBlockMode() {
    const day = $('#bfMode').value === 'day';
    $('#bfJamWrap').classList.toggle('hidden', day);
    $('#bfSelesaiWrap').classList.toggle('hidden', day);
    if (!day && A.grid) {
      const s = $('#bfJam').value.split(':').map(Number);
      const e = s[0] * 60 + s[1] + (A.grid.durasiMenit || 180);
      $('#bfSelesai').value = String(Math.floor(e / 60) % 24).padStart(2, '0') + ':' + String(e % 60).padStart(2, '0');
    }
  }
  $('#bfMode').addEventListener('change', syncBlockMode);
  $('#bfJam').addEventListener('change', syncBlockMode);

  $('#aGrid').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.bk) return openDetail(b.dataset.bk);
    if (b.dataset.bl) {
      const bl = (A.grid.blocks || []).find(x => x.id === b.dataset.bl) || {};
      const tr = b.closest('tr');
      const lok = A.grid.rows[[...tr.parentNode.children].indexOf(tr)].lokasiId;
      const jam = bl.jamMulai || A.grid.slotTimes[[...tr.children].indexOf(b.closest('td')) - 1];
      if (confirm('Slot ini diblokir: "' + (bl.ket || '') + '".\n\nOK = jadikan BOOKING (pre-booking dikonfirmasi)\nCancel = buka blokir saja')) {
        location.href = 'index.html?admin=1&date=' + A.grid.tanggal + '&lok=' + encodeURIComponent(lok) + '&jam=' + encodeURIComponent(jam);
        return;
      }
      return unblock(b.dataset.bl, b);
    }
    if (b.dataset.free) {
      const [lok, jam] = b.dataset.free.split('|');
      $('#bfLokasi').value = lok; $('#bfMode').value = 'slot'; $('#bfJam').value = jam; syncBlockMode();
      $('#aNewBooking').href = 'index.html?admin=1&date=' + A.grid.tanggal + '&lok=' + encodeURIComponent(lok) + '&jam=' + encodeURIComponent(jam);
      $('#aNewBooking').textContent = '＋ Booking manual di slot ini (' + jam + ')';
      $('#blockForm [name=ket]').focus();
      $('#blockForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  $('#aBlocks').addEventListener('click', (e) => { const b = e.target.closest('[data-unblock]'); if (b) unblock(b.dataset.unblock, b); });

  async function unblock(id, btn) {
    const bl = (A.grid.blocks || []).find(x => x.id === id);
    if (!confirm('Buka blokir' + (bl ? ' "' + bl.ket + '"' : '') + '?')) return;
    setLoading(btn, true, '…');
    try {
      renderAdminDay(await call('removeBlock', { id: id }));
      toast('Blokir dibuka.', 'success');
      loadAdminMonth(A.month);
    } catch (err) { toast(err.message, 'error'); setLoading(btn, false); }
  }

  $('#blockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = $('#bfSave');
    setLoading(btn, true, 'Menyimpan…');
    try {
      renderAdminDay(await call('addBlock', {
        tanggal: A.date, lokasiId: fd.get('lokasiId'), seharian: fd.get('mode') === 'day',
        jamMulai: fd.get('jamMulai'), jamSelesai: fd.get('jamSelesai'), ket: fd.get('ket'),
      }));
      e.target.querySelector('[name=ket]').value = '';
      toast('Slot diblokir.', 'success');
      loadAdminMonth(A.month);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(btn, false); }
  });

  // ============================================================
  //  AKUN
  // ============================================================
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('newPassword') !== fd.get('newPassword2')) return toast('Konfirmasi password tidak sama.', 'error');
    const btn = $('#pwBtn');
    setLoading(btn, true, 'Menyimpan…');
    try {
      await call('changePassword', { oldPassword: fd.get('oldPassword'), newPassword: fd.get('newPassword') });
      e.target.reset();
      toast('Password berhasil diganti.', 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(btn, false); }
  });

  // ---------- Mulai ----------
  async function start() {
    loadSession();
    if (!session || !session.token) return showLogin();
    try { await call('me'); showApp(); } catch (e) { showLogin(); }
  }
  start();
})();
