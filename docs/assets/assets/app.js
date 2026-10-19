// Public site (EN/ID): package info, party spots, add-ons, live estimate & booking.
(function () {
  const $ = (s) => document.querySelector(s);
  const form = $('#bookingForm');
  const S = { data: null, addons: new Map(), menu: new Set(), avail: null, cat: null, clash: false, closed: false,
    cake: { jenis: 'none', size: '', flavour: '', qty: 1 }, design: null, month: null, months: {} };

  const EMOJI = { E01: '🎁', E02: '🎁', E03: '💌', E07: '🫧', E09: '🍬', E10: '🎩', E12: '🎤', E13: '🎤', C04: '🎂', C05: '🍰', F01: '🧊', F02: '🧃', F03: '🥤', F04: '🍭', F05: '🍪', F06: '🍹', F07: '🍺' };
  const CAT_EMOJI = { 'Entertainment': '🎈', 'Science Show': '🔬', 'Creative Workshop': '🎨', 'Decoration': '🎉', 'Cake': '🎂', 'Food & Drinks': '🥤' };
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isId = () => window.LANG === 'id';

  // ---- Mode admin (booking manual): index.html?admin=1, hanya jika admin sudah login di tab ini ----
  const QS = new URLSearchParams(location.search);
  let ADMIN = null;
  if (QS.get('admin') === '1') {
    try { ADMIN = JSON.parse(sessionStorage.getItem('eo_admin_session') || 'null'); } catch (e) { ADMIN = null; }
    if (!ADMIN || !ADMIN.token) { location.href = 'admin.html'; return; }
  }
  const adminApi = (action, payload) => api(action, payload, ADMIN && ADMIN.token);
  const WA = (window.APP_CONFIG || {}).WHATSAPP || '';
  const waUrl = (txt) => 'https://wa.me/' + WA + (txt ? '?text=' + encodeURIComponent(txt) : '');
  const K = (n) => (n >= 1000 && n % 1000 === 0) ? (n / 1000).toLocaleString('id-ID') + 'K' : rupiah(n);
  const dateL = (s) => {
    const d = parseYmd(s);
    if (!d) return '-';
    return isId() ? HARI_ID[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_ID[d.getMonth()] + ' ' + d.getFullYear()
      : DAYS_EN[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_EN[d.getMonth()] + ' ' + d.getFullYear();
  };
  const toMin = (x) => { const m = /^(\d{1,2}):(\d{2})/.exec(x || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
  const fromMin = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  // ---- Konten dari Sheet sesuai bahasa (fallback ke English) ----
  const pick = (en, idv) => (isId() && idv && String(idv).trim()) ? idv : en;
  const aName = (a) => pick(a.nama, a.namaId);
  const aDesc = (a) => pick(a.deskripsi, a.deskripsiId);
  const optLabel = (a, v) => { const i = a.pilihan.indexOf(v); return i >= 0 ? pick(v, a.pilihanId[i]) : v; };
  const catName = (c) => (t('cat') || {})[c] || c;

  function paket() { return S.data.paket[0]; }

  function setupAdminMode() {
    document.body.classList.add('is-admin');
    $('#adminBar').classList.remove('hidden');
    $('#adminWho').textContent = 'login sebagai ' + (ADMIN.nama || ADMIN.username);
    $('#adminOpts').classList.remove('hidden');
    ['#email', '#tglLahir', '#usia', '#setuju', '#setujuPark'].forEach(s => $(s).removeAttribute('required'));
    ['#email', '#tglLahir', '#usia'].forEach(s => { const sp = $(s).closest('label').querySelector('span'); sp.removeAttribute('data-i18n'); sp.textContent = sp.textContent.replace(/\s*\*$/, '') + ' (opsional)'; });
    $('#aLepasBlokir').addEventListener('change', recalc);
    document.title = 'Booking manual – Admin';
    // preset dari tab Ketersediaan: ?admin=1&date=yyyy-mm-dd&lok=L01&jam=15:00
    const d = QS.get('date'), lok = QS.get('lok'), jam = QS.get('jam');
    if (d) {
      setTimeout(() => {
        renderSlots();
        if (jam) $('#jam').value = jam;
        if (lok) { const r = form.querySelector(`input[name="lokasiId"][value="${CSS.escape(lok)}"]`); if (r) r.checked = true; }
        $('#tglAcara').value = d;
        $('#tglAcara').dispatchEvent(new Event('change', { bubbles: true }));
        $('#book').scrollIntoView();
      }, 0);
    } else setTimeout(() => $('#book').scrollIntoView(), 0);
  }

  // ---------------- Init ----------------
  async function init() {
    applyI18n();
    document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    setWaLinks();
    $('#summaryBody').innerHTML = `<div class="empty">${escapeHtml(t('sum_empty'))}</div>`;

    try {
      S.data = await api('getPackages');
    } catch (e) {
      const msg = '<div class="card">' + escapeHtml(t('load_err', { e: e.message })) + '</div>';
      $('#spotList').innerHTML = msg; $('#addonGrid').innerHTML = msg;
      return;
    }
    const min = new Date(); min.setDate(min.getDate() + (ADMIN ? 0 : (Number(S.data.info.minHariBooking) || 0)));
    $('#tglAcara').min = ymd(min);
    S.minMonth = ymd(min).slice(0, 7);
    S.month = S.minMonth;
    loadMonth(S.month);
    $('#jumlahAnak').value = paket() ? paket().minAnak : 10;
    const firstNonCake = S.data.addon.find(a => a.kategori !== 'Cake');
    S.cat = firstNonCake ? firstNonCake.kategori : null;
    const std = standardCakes();
    if (std.length) { S.cake.size = std[0].id; S.cake.flavour = std[0].pilihan[0] || ''; }
    if (ADMIN) setupAdminMode();
    renderAll();
  }

  function setWaLinks() {
    ['#heroWa', '#footWa', '#waFloat'].forEach(id => {
      const a = $(id);
      if (!WA) a.classList.add('hidden');
      else a.href = waUrl(t('wa_msg'));
    });
  }

  function renderAll() {
    if (!S.data) return;
    const info = S.data.info;
    $('#footInfo').innerHTML = t('foot_info', { k: escapeHtml(info.kontak), t: escapeHtml(info.telp) }) + '<br>' + escapeHtml(info.alamat) +
      (info.website ? ' · <a href="https://' + escapeHtml(info.website) + '" target="_blank" rel="noopener">' + escapeHtml(info.website) + '</a>' : '');
    $('#menuIntro').innerHTML = t('menu_intro', { n: info.maxMenu });
    renderSlots();
    renderCal();
    renderCake();
    renderHero();
    renderSpots();
    renderTabs();
    renderAddons();
    renderMenu();
    renderSelected();
    const rules = isId() && info.rulesId && info.rulesId.length ? info.rulesId : info.rules;
    $('#rulesList').innerHTML = rules.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    recalc();
  }

  document.addEventListener('langchange', () => { setWaLinks(); renderAll(); if (!S.data) $('#summaryBody').innerHTML = `<div class="empty">${escapeHtml(t('sum_empty'))}</div>`; });

  function renderHero() {
    const p = paket();
    if (!p) return;
    $('#pWeekday').textContent = K(p.hargaWeekday);
    $('#pWeekend').textContent = K(p.hargaWeekend);
    const fas = isId() && p.fasilitasId && p.fasilitasId.length ? p.fasilitasId : p.fasilitas;
    $('#inclList').innerHTML = fas.map(f => `<li>${escapeHtml(f)}</li>`).join('');
    $('#anakHint').textContent = t('hint_kids', { n: p.minAnak });
    $('#dewasaHint').textContent = t('hint_adults', { n: p.dewasaPerAnak });
  }

  // ---------------- Slot jam ----------------
  function slotLabel(v) {
    if (isId()) return v.replace(':', '.');
    const [h, m] = v.split(':').map(Number);
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' am' : ' pm');
  }
  function renderSlots() {
    const sel = $('#jam');
    const cur = sel.value;
    let slots = (S.data.info.jamSlot && S.data.info.jamSlot.length) ? S.data.info.jamSlot.slice() : ['09:00', '10:00', '15:00', '16:00', '17:00', '18:00'];
    if (ADMIN) { for (let m = 8 * 60; m <= 20 * 60; m += 30) { const v = fromMin(m); if (slots.indexOf(v) < 0) slots.push(v); } slots.sort(); }
    sel.innerHTML = slots.map(v => `<option value="${v}">${slotLabel(v)}</option>`).join('');
    sel.value = slots.indexOf(cur) >= 0 ? cur : (slots.indexOf('10:00') >= 0 ? '10:00' : slots[0]);
  }

  // ---------------- Kue ulang tahun ----------------
  const standardCakes = () => S.data.addon.filter(a => a.kategori === 'Cake' && a.pilihan.length);
  const cakeById = (id) => S.data.addon.find(a => a.id === id);
  const CUSTOM_ID = 'C04', OWN_ID = 'C05';

  function fillSelect(el, list, cur, withBlank) {
    el.innerHTML = (withBlank ? `<option value="">${escapeHtml(t('opt_choose'))}</option>` : '') +
      list.map(o => `<option value="${escapeHtml(o.v)}" ${o.v === cur ? 'selected' : ''}>${escapeHtml(o.l)}</option>`).join('');
  }

  function renderCake() {
    const std = standardCakes();
    const cus = cakeById(CUSTOM_ID), own = cakeById(OWN_ID);
    const minStd = std.length ? Math.min.apply(null, std.map(a => a.harga)) : 0;
    $('#cakeStdSub').textContent = std.length ? t('cake_std_s', { p: rupiah(minStd) }) : '';
    $('#cakeCusSub').textContent = cus ? t('cake_cus_s', { p: rupiah(cus.harga) }) : '';
    $('#cakeOwnSub').textContent = own ? t('cake_own_s', { p: rupiah(own.harga) }) : '';
    if (!cus) form.querySelector('input[name="kueJenis"][value="custom"]').closest('label').classList.add('hidden');
    if (!own) form.querySelector('input[name="kueJenis"][value="own"]').closest('label').classList.add('hidden');
    if (!std.length) form.querySelector('input[name="kueJenis"][value="standard"]').closest('label').classList.add('hidden');

    fillSelect($('#cakeSize'), std.map(a => {
      const m = /(\d+)\s*[–-]\s*(\d+)/.exec(a.deskripsi) || /(\d+)/.exec(a.deskripsi);
      return { v: a.id, l: t('size_opt', { n: aName(a).replace(/^(Favorite Cake|Kue Favorit)\s*/i, ''), sl: m ? m[0].replace(/\s/g, '') : '-', p: rupiah(a.harga) }) };
    }), S.cake.size);
    const size = cakeById(S.cake.size) || std[0];
    if (size && size.pilihan.indexOf(S.cake.flavour) < 0) S.cake.flavour = size.pilihan[0];
    fillSelect($('#cakeFlavour'), size ? size.pilihan.map(o => ({ v: o, l: optLabel(size, o) })) : [], S.cake.flavour);
    $('#cakeQty').value = S.cake.qty || 1;

    const info = S.data.info;
    const toOpts = (arr) => (arr || []).map(x => ({ v: x, l: x }));
    fillSelect($('#cakeLayered'), toOpts(info.cakeLayered), $('#cakeLayered').value, true);
    fillSelect($('#cakeNonLayered'), toOpts(info.cakeNonLayered), $('#cakeNonLayered').value, true);
    fillSelect($('#cakeFilling'), toOpts(info.cakeFilling), $('#cakeFilling').value, true);
    fillSelect($('#cakeFinishing'), toOpts(info.cakeFinishing), $('#cakeFinishing').value, true);
    $('#cakeCusInfo').innerHTML = cus ? t('cus_info', { p: rupiah(cus.harga) }) : '';
    $('#cakeOwnInfo').innerHTML = own ? t('own_info', { p: rupiah(own.harga) }) : '';
    syncCakePanels();
  }

  function syncCakePanels() {
    const j = S.cake.jenis;
    $('#cakeStd').classList.toggle('hidden', j !== 'standard');
    $('#cakeCus').classList.toggle('hidden', j !== 'custom');
    $('#cakeOwn').classList.toggle('hidden', j !== 'own');
    $('#cakeCommon').classList.toggle('hidden', j === 'none' || j === 'own');
  }

  /** Add-on kue yang ikut dihitung, sesuai pilihan di langkah kue. */
  function cakeItems() {
    const j = S.cake.jenis;
    if (j === 'standard' && cakeById(S.cake.size)) return [{ a: cakeById(S.cake.size), st: { qty: Math.max(1, S.cake.qty || 1), pilihan: S.cake.flavour } }];
    if (j === 'custom' && cakeById(CUSTOM_ID)) return [{ a: cakeById(CUSTOM_ID), st: { qty: 1, pilihan: '' } }];
    if (j === 'own' && cakeById(OWN_ID)) return [{ a: cakeById(OWN_ID), st: { qty: 1, pilihan: '' } }];
    return [];
  }

  $('#cakePick').addEventListener('change', (e) => {
    if (e.target.name !== 'kueJenis') return;
    S.cake.jenis = e.target.value;
    syncCakePanels();
    recalc();
  });
  $('#cakeSize').addEventListener('change', (e) => { S.cake.size = e.target.value; renderCake(); recalc(); });
  $('#cakeFlavour').addEventListener('change', (e) => { S.cake.flavour = e.target.value; recalc(); });
  $('#cakeQty').addEventListener('input', (e) => { S.cake.qty = Math.max(1, Math.floor(+e.target.value || 1)); recalc(); });

  // Foto desain: diperkecil di browser (maks. 1600 px, JPEG) supaya cepat terkirim
  $('#cakeDesign').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    const prev = $('#cakeDesignPrev');
    S.design = null; prev.classList.add('hidden');
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast(t('err_photo_big'), 'error'); e.target.value = ''; return; }
    try {
      S.design = await shrinkImage(file);
      prev.src = S.design.data; prev.classList.remove('hidden');
    } catch (err) {
      if (file.size <= 8 * 1024 * 1024 && /^image\//.test(file.type)) {
        S.design = { name: file.name, type: file.type, data: await readAsDataURL(file) };
      } else { toast(t('err_photo'), 'error'); e.target.value = ''; }
    }
  });

  function readAsDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }
  async function shrinkImage(file) {
    const url = await readAsDataURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85) };
  }

  // ---------------- Party spots ----------------
  function renderSpots() {
    const list = S.data.lokasi;
    const checked = (form.querySelector('input[name="lokasiId"]:checked') || {}).value;
    $('#spotList').innerHTML = list.map((l, i) => {
      const label = pick(l.label, l.labelId);
      const price = (!l.hargaWeekday && !l.hargaWeekend) ? t('spot_included') : t('spot_price', { wd: K(l.hargaWeekday), we: K(l.hargaWeekend) });
      return `
      <div class="spot" data-id="${escapeHtml(l.id)}">
        <div class="ph" style="${l.gambar ? `background-image:url('${escapeHtml(l.gambar)}')` : ''}"><span class="num">${i + 1}</span></div>
        <div class="bd">
          <h3>${escapeHtml(l.nama)} ${label ? `<span class="badge-new">${escapeHtml(label)}</span>` : ''}</h3>
          <p>${escapeHtml(pick(l.deskripsi, l.deskripsiId))}</p>
          <div class="price">${escapeHtml(price)}</div>
          <button type="button" class="btn sm green" style="margin-top:10px" data-spot="${escapeHtml(l.id)}">${escapeHtml(t('choose_spot'))}</button>
        </div>
      </div>`;
    }).join('');
    $('#spotPick').innerHTML = list.map(l => `
      <label class="spot-opt"><input type="radio" name="lokasiId" value="${escapeHtml(l.id)}" ${l.id === checked ? 'checked' : ''}>
        <b>${escapeHtml(l.nama)}</b><span class="s">${(l.hargaWeekday || l.hargaWeekend) ? '+' + K(l.hargaWeekday) + ' / +' + K(l.hargaWeekend) : escapeHtml(t('included'))}${l.kapasitas ? escapeHtml(t('up_to_seats', { n: l.kapasitas })) : ''}</span>
        <div class="busy" data-busy="${escapeHtml(l.id)}"></div></label>`).join('');
  }

  $('#spotList').addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-spot');
    if (!id) return;
    const r = form.querySelector(`input[name="lokasiId"][value="${CSS.escape(id)}"]`);
    if (r) { r.checked = true; recalc(); }
    $('#book').scrollIntoView({ behavior: 'smooth' });
  });

  // ---------------- Add-ons browse (all categories shown, stacked) ----------------
  const catSlug = (c) => 'cat-' + String(c).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  function addonCats() {
    const cats = [];
    S.data.addon.forEach(a => { if (a.kategori !== 'Cake' && cats.indexOf(a.kategori) < 0) cats.push(a.kategori); });
    return cats;
  }
  const catTotal = (c) => S.data.addon.filter(a => a.kategori === c).length;
  const catAdded = (c) => S.data.addon.filter(a => a.kategori === c && S.addons.has(a.id)).length;

  function renderTabs() {
    const cats = addonCats();
    const n = cats.reduce((s, c) => s + catTotal(c), 0);
    $('#catIntro').innerHTML = escapeHtml(t('cat_intro', { c: cats.length, n: n }));
    $('#catTabs').innerHTML = cats.map(c => {
      const k = catAdded(c);
      return `<button type="button" data-cat="${escapeHtml(c)}" class="${c === S.cat ? 'active' : ''}${k ? ' has' : ''}">${CAT_EMOJI[c] || '✨'} ${escapeHtml(catName(c))}<span class="cnt">${k ? '✓ ' + k : catTotal(c)}</span></button>`;
    }).join('');
    renderCatCheck();
  }

  // Step 5 reminder: one chip per category, so nobody misses a category by accident
  function renderCatCheck() {
    const el = $('#catCheck');
    if (!el) return;
    el.innerHTML = `<div class="small" style="font-weight:800;margin-bottom:6px">${escapeHtml(t('cat_check'))}</div>` +
      addonCats().map(c => {
        const k = catAdded(c);
        return `<a href="#${catSlug(c)}" data-jump="${escapeHtml(c)}" class="cc ${k ? 'has' : ''}">${CAT_EMOJI[c] || '✨'} ${escapeHtml(catName(c))} <b>${k ? '✓ ' + k : catTotal(c) + ' ' + escapeHtml(t('cat_opts_short'))}</b></a>`;
      }).join('');
  }

  function jumpToCat(c) {
    const sec = document.getElementById(catSlug(c));
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#catTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (b) jumpToCat(b.dataset.cat);
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    jumpToCat(a.dataset.jump);
  });

  // Highlight the category currently on screen
  let spyTick = null;
  function catSpy() {
    if (spyTick) return;
    spyTick = requestAnimationFrame(() => {
      spyTick = null;
      const secs = document.querySelectorAll('#addonGrid .addon-cat');
      if (!secs.length) return;
      const line = $('#catTabs').getBoundingClientRect().bottom + 40;
      let cur = secs[0].dataset.cat;
      secs.forEach(x => { if (x.getBoundingClientRect().top <= line) cur = x.dataset.cat; });
      if (cur === S.cat) return;
      S.cat = cur;
      document.querySelectorAll('#catTabs button').forEach(b => {
        const on = b.dataset.cat === cur;
        b.classList.toggle('active', on);
        if (on) { const bar = $('#catTabs'); bar.scrollTo({ left: b.offsetLeft - bar.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' }); }
      });
    });
  }
  window.addEventListener('scroll', catSpy, { passive: true });

  function priceLabel(a) {
    switch (a.satuan) {
      case 'per_anak': return [rupiah(a.harga), t('unit_child')];
      case 'per_pax': return [rupiah(a.harga), t('unit_pax', { n: a.termasukPax, e: K(a.hargaExtraPax) })];
      case 'per_item': return [rupiah(a.harga), t(a.hargaMulai ? 'unit_start_each' : 'unit_each')];
      case 'on_request': return [t('on_request'), t('see_menu')];
      default: return [rupiah(a.harga), t(a.hargaMulai ? 'unit_start' : 'unit_party')];
    }
  }

  function addonCard(a) {
    const added = S.addons.has(a.id);
    const [p, unit] = priceLabel(a);
    const chips = [];
    if (a.durasi) chips.push(`<span class="chip">⏱ ${escapeHtml(isId() ? a.durasi.replace(/hours?/i, 'jam').replace(/min\b/i, 'menit') : a.durasi)}</span>`);
    a.bahasa.split(',').map(x => x.trim()).filter(Boolean).forEach(l => chips.push(`<span class="chip">${escapeHtml(l)}</span>`));
    if (a.minJam) chips.push(`<span class="chip warn">${escapeHtml(t('chip_eve', { t: a.minJam }))}</span>`);
    if (a.pilihan.length) chips.push(`<span class="chip">${escapeHtml(t('chip_opts', { n: a.pilihan.length }))}</span>`);
    return `
      <article class="addon ${added ? 'added' : ''}">
        <div class="ph" style="${a.gambar ? `background-image:url('${escapeHtml(a.gambar)}')` : ''}">${a.gambar ? '' : (EMOJI[a.id] || CAT_EMOJI[a.kategori] || '✨')}${added ? '<span class="tick">✓</span>' : ''}</div>
        <div class="bd">
          <h4>${escapeHtml(aName(a))}</h4>
          ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
          <p>${escapeHtml(aDesc(a))}</p>
          <div class="row">
            <div class="price">${escapeHtml(p)}<small>${escapeHtml(unit)}</small></div>
            <button type="button" class="btn" data-add="${escapeHtml(a.id)}">${escapeHtml(t(added ? 'added' : 'add'))}</button>
          </div>
        </div>
      </article>`;
  }

  function renderAddons() {
    const cats = addonCats();
    $('#addonGrid').innerHTML = cats.map((c, i) => {
      const list = S.data.addon.filter(a => a.kategori === c);
      const k = catAdded(c);
      return `
        <section class="addon-cat" id="${catSlug(c)}" data-cat="${escapeHtml(c)}">
          <div class="addon-cat-head">
            <span class="ic">${CAT_EMOJI[c] || '✨'}</span>
            <h3>${escapeHtml(catName(c))}</h3>
            <span class="meta">${escapeHtml(t('cat_count', { i: i + 1, c: cats.length, n: list.length }))}</span>
            ${k ? `<span class="got">✓ ${escapeHtml(t('cat_added', { n: k }))}</span>` : ''}
          </div>
          <div class="addon-grid">${list.map(addonCard).join('')}</div>
        </section>`;
    }).join('');
    renderTabs();
    S.cat = null; catSpy();
  }

  $('#addonGrid').addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-add');
    if (id) toggleAddon(id);
  });

  function toggleAddon(id) {
    const a = S.data.addon.find(x => x.id === id);
    if (!a) return;
    if (S.addons.has(id)) {
      S.addons.delete(id);
    } else {
      if (a.grup) {
        S.data.addon.filter(x => x.grup === a.grup && S.addons.has(x.id)).forEach(x => {
          S.addons.delete(x.id);
          toast(t('toast_replaced', { a: aName(x), b: aName(a) }));
        });
      }
      S.addons.set(id, { qty: a.satuan === 'per_item' ? 1 : null, pilihan: a.pilihan[0] || '' });
      toast(t('toast_added', { x: aName(a) }), 'success');
    }
    renderAddons();
    renderSelected();
    recalc();
  }

  // ---------------- Selected add-ons (step 4) ----------------
  function renderSelected() {
    if (!S.addons.size) {
      $('#selList').innerHTML = `<div class="empty-sel">${escapeHtml(t('sel_empty'))}</div>`;
      return;
    }
    const anak = Math.max(1, Math.floor(+$('#jumlahAnak').value || 1));
    $('#selList').innerHTML = S.data.addon.filter(a => S.addons.has(a.id)).map(a => {
      const st = S.addons.get(a.id);
      const [p, unit] = priceLabel(a);
      let ctl = '';
      if (a.pilihan.length) ctl += `<select data-pil="${escapeHtml(a.id)}">${a.pilihan.map(o => `<option value="${escapeHtml(o)}" ${o === st.pilihan ? 'selected' : ''}>${escapeHtml(optLabel(a, o))}</option>`).join('')}</select>`;
      if (a.satuan === 'per_pax') ctl += `<label class="small" style="font-weight:800">${escapeHtml(t('lbl_pax'))} <input type="number" min="1" max="500" data-qty="${escapeHtml(a.id)}" value="${st.qty || anak}"></label>`;
      if (a.satuan === 'per_item') ctl += `<label class="small" style="font-weight:800">${escapeHtml(t('lbl_qty'))} <input type="number" min="1" max="500" data-qty="${escapeHtml(a.id)}" value="${st.qty || 1}"></label>`;
      if (a.satuan === 'per_anak') ctl += `<span class="small muted">${escapeHtml(t('x_children'))}</span>`;
      return `<div class="sel-item">
        <div><b>${escapeHtml(aName(a))}</b><div class="small muted">${escapeHtml(p)} ${escapeHtml(unit)}</div></div>
        <button type="button" class="x" data-rm="${escapeHtml(a.id)}" aria-label="${escapeHtml(t('remove'))}">×</button>
        ${ctl ? `<div class="ctl">${ctl}</div>` : ''}</div>`;
    }).join('');
  }

  $('#selList').addEventListener('click', (e) => { const id = e.target.getAttribute('data-rm'); if (id) toggleAddon(id); });
  $('#selList').addEventListener('input', (e) => {
    const q = e.target.getAttribute('data-qty');
    const pl = e.target.getAttribute('data-pil');
    if (q && S.addons.has(q)) S.addons.get(q).qty = Math.max(1, Math.floor(+e.target.value || 1));
    if (pl && S.addons.has(pl)) S.addons.get(pl).pilihan = e.target.value;
    recalc();
  });

  // ---------------- Buffet menu ----------------
  function renderMenu() {
    const groups = {}, order = [];
    S.data.menu.forEach(m => {
      const g = pick(m.kategori, m.kategoriId);
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(m);
    });
    $('#menuBox').innerHTML = order.map(g => `
      <div class="menu-group"><h4>${escapeHtml(g)}</h4><div class="check-list" style="margin-bottom:12px">
        ${groups[g].map(m => `<label class="check"><input type="checkbox" data-menu value="${escapeHtml(m.nama)}" ${S.menu.has(m.nama) ? 'checked' : ''}><div><b>${escapeHtml(pick(m.nama, m.namaId))}</b>${(m.ket || m.ketId) ? `<span class="menu-ket">${escapeHtml(pick(m.ket, m.ketId))}</span>` : ''}</div></label>`).join('')}
      </div></div>`).join('');
    syncMenu();
  }

  function syncMenu() {
    const max = S.data.info.maxMenu;
    const boxes = Array.from(document.querySelectorAll('[data-menu]'));
    S.menu = new Set(boxes.filter(b => b.checked).map(b => b.value));
    boxes.forEach(b => { b.disabled = !b.checked && S.menu.size >= max; });
    $('#menuCounter').textContent = S.menu.size + ' / ' + max;
  }
  $('#menuBox').addEventListener('change', syncMenu);

  // ---------------- Date & availability ----------------
  function dayType(tgl) {
    const d = parseYmd(tgl);
    if (!d) return { tipe: 'weekday', label: t('d_weekday') };
    const h = S.data.libur.find(x => x.tanggal === tgl);
    if (h && h.tutup) return { tipe: 'tutup', label: t('d_closed', { x: h.ket }), ket: h.ket };
    if (h) return { tipe: 'weekend', label: t('d_holiday', { x: h.ket }) };
    if (d.getDay() === 0 || d.getDay() === 6) return { tipe: 'weekend', label: t('d_weekend') };
    return { tipe: 'weekday', label: t('d_weekday') };
  }

  // ---------------- Kalender & ketersediaan ----------------
  async function loadMonth(month) {
    if (S.months[month]) return renderCal();
    renderCal();
    try {
      const r = ADMIN ? await adminApi('adminMonth', { bulan: month }) : await api('getMonth', { bulan: month });
      S.months[month] = r.days;
      if (S.month === month) renderCal();
    } catch (e) {
      // backend lama / gagal: tetap tampilkan kalender (tanpa jumlah slot), booking tetap dicek server
      const days = {};
      const last = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
      for (let d = 1; d <= last; d++) {
        const tgl = month + '-' + String(d).padStart(2, '0');
        const dt = dayType(tgl);
        days[tgl] = { st: tgl < $('#tglAcara').min ? 'past' : dt.tipe === 'tutup' ? 'closed' : 'open', weekend: dt.tipe === 'weekend' };
      }
      S.months[month] = days;
      if (S.month === month) renderCal();
    }
  }

  function renderCal() {
    if (!S.data || !S.month || typeof renderCalendar !== 'function') return;
    renderCalendar($('#calBox'), {
      month: S.month, days: S.months[S.month] || null, selected: $('#tglAcara').value, minMonth: S.minMonth, lang: window.LANG, allowAll: !!ADMIN,
      legend: [['open', t('lg_open')], ['few', t('lg_few')], ['full', t('lg_full')], ['closed', t('lg_closed')]],
      cellExtra: (d, info) => (info.free !== undefined && (info.st === 'open' || info.st === 'few')) ? `<span class="cal-n">${escapeHtml(t('slots_left', { n: info.free }))}</span>` : '',
      onNav: (m) => { S.month = m; loadMonth(m); },
      onPick: (d) => { $('#tglAcara').value = d; $('#tglAcara').dispatchEvent(new Event('change', { bubbles: true })); },
    });
  }

  let availTimer = null;
  $('#tglAcara').addEventListener('change', () => {
    S.avail = null;
    clearTimeout(availTimer);
    const tgl = $('#tglAcara').value;
    if (tgl && tgl.slice(0, 7) !== S.month) { S.month = tgl.slice(0, 7); loadMonth(S.month); } else renderCal();
    if (!tgl) return recalc();
    availTimer = setTimeout(async () => {
      try {
        const a = ADMIN ? await adminApi('adminDay', { tanggal: tgl }) : await api('getAvailability', { tglAcara: tgl, lang: window.LANG });
        if ($('#tglAcara').value === tgl) { S.avail = a; recalc(); }
      } catch (e) { /* ketersediaan tetap dicek server saat booking */ }
    }, 150);
  });

  function cellOf(lokasiId, jam) {
    if (!S.avail || S.avail.tanggal !== $('#tglAcara').value || !S.avail.rows) return null;
    const r = S.avail.rows.find(x => x.lokasiId === lokasiId);
    return r ? r.slots.find(x => x.jam === jam) : null;
  }

  /** Mode admin dengan jam bebas: cari slot grid yang bertumpuk dengan rentang jam. */
  function overlapCell(lokasiId, start, end) {
    const r = S.avail.rows.find(x => x.lokasiId === lokasiId);
    if (!r) return null;
    const dur = S.avail.durasiMenit || 180;
    return r.slots.find(x => {
      const s = toMin(x.dari || x.jam), e = x.sampai ? toMin(x.sampai === '24:00' ? '23:59' : x.sampai) : s + dur;
      return (x.st === 'booked' || x.st === 'blocked') && start < e && s < end;
    }) || null;
  }

  function renderSlotGrid() {
    const wrap = $('#slotWrap');
    const tgl = $('#tglAcara').value;
    if (!S.avail || S.avail.tanggal !== tgl || !S.avail.rows) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    const lok = (form.querySelector('input[name="lokasiId"]:checked') || {}).value;
    const jam = $('#jam').value;
    const times = S.avail.slotTimes || [];
    const wknd = dayType(tgl).tipe === 'weekend';
    const spotHead = (r) => {
      const l = S.data.lokasi.find(x => x.id === r.lokasiId) || {};
      const hp = wknd ? l.hargaWeekend : l.hargaWeekday;
      const price = hp ? '+' + K(hp) : t('included');
      const open = S.spotInfo === r.lokasiId;
      return `<th class="sp-h${r.lokasiId === lok ? ' on' : ''}"><div class="sp-cell">
        <span class="sp-ph" style="${l.gambar ? `background-image:url('${escapeHtml(l.gambar)}')` : ''}">${l.gambar ? '' : '🌿'}</span>
        <div class="sp-tx"><b>${escapeHtml(r.nama)}</b><small>${escapeHtml(price + (l.kapasitas ? t('up_to_seats', { n: l.kapasitas }) : ''))}</small>
        <button type="button" class="sp-more" data-info="${escapeHtml(r.lokasiId)}" aria-expanded="${open}">${escapeHtml(t(open ? 'spot_hide' : 'spot_details'))}</button></div></div></th>`;
    };
    const spotInfo = (r) => {
      if (S.spotInfo !== r.lokasiId) return '';
      const l = S.data.lokasi.find(x => x.id === r.lokasiId) || {};
      const label = pick(l.label, l.labelId);
      const price = (!l.hargaWeekday && !l.hargaWeekend) ? t('spot_included') : t('spot_price', { wd: K(l.hargaWeekday), we: K(l.hargaWeekend) });
      return `<tr class="sp-info"><td colspan="${times.length + 1}"><div class="sp-info-box">
        <div class="sp-big" style="${l.gambar ? `background-image:url('${escapeHtml(l.gambar)}')` : ''}"></div>
        <div><b>${escapeHtml(l.nama || r.nama)}</b> ${label ? `<span class="badge-new">${escapeHtml(label)}</span>` : ''}
          <p>${escapeHtml(pick(l.deskripsi, l.deskripsiId) || '')}</p>
          <div class="small" style="font-weight:800;color:var(--jungle)">${escapeHtml(price + (l.kapasitas ? t('up_to_seats', { n: l.kapasitas }) : ''))}</div></div></div></td></tr>`;
    };
    $('#slotGrid').innerHTML =
      `<thead><tr><th class="sp-h">${escapeHtml(t('spot_th'))}</th>${times.map(x => `<th>${escapeHtml(slotLabel(x))}</th>`).join('')}</tr></thead><tbody>` +
      S.avail.rows.map(r => `<tr>${spotHead(r)}${r.slots.map(c => {
        const sel = r.lokasiId === lok && c.jam === jam;
        const lbl = sel && c.st === 'free' ? t('slot_selected') : t('slot_' + c.st);
        const pickable = c.st === 'free' || (ADMIN && c.st === 'blocked');
        const title = ADMIN && c.ket ? ` title="${escapeHtml(c.ket)}"` : ADMIN && c.bookingId ? ` title="${escapeHtml(c.bookingId + ' ' + (c.anak || ''))}"` : '';
        return `<td><button type="button" class="slot st-${c.st}${sel ? ' selected' : ''}" data-lok="${escapeHtml(r.lokasiId)}" data-jam="${escapeHtml(c.jam)}"${title} ${pickable ? '' : 'disabled'}>${escapeHtml(sel && c.st === 'blocked' ? '🔓 ' + t('slot_selected') : lbl)}</button></td>`;
      }).join('')}</tr>${spotInfo(r)}`).join('') + '</tbody>';
  }

  $('#slotGrid').addEventListener('click', (e) => {
    const info = e.target.closest('[data-info]');
    if (info) { S.spotInfo = S.spotInfo === info.dataset.info ? null : info.dataset.info; renderSlotGrid(); return; }
    const b = e.target.closest('[data-lok]');
    if (!b || b.disabled) return;
    const r = form.querySelector(`input[name="lokasiId"][value="${CSS.escape(b.dataset.lok)}"]`);
    if (r) r.checked = true;
    $('#jam').value = b.dataset.jam;
    recalc();
  });

  function renderAvailability() {
    const tgl = $('#tglAcara').value;
    const day = dayType(tgl);
    const p = paket();
    S.closed = day.tipe === 'tutup';
    let badge = '';
    if (tgl) {
      if (S.closed) badge = `<div class="day-badge closed">${escapeHtml(t('day_closed', { d: dateL(tgl), x: day.ket }))}</div>`;
      else if (tgl < $('#tglAcara').min) badge = `<div class="day-badge closed">${escapeHtml(t('too_soon', { n: S.data.info.minHariBooking }))}</div>`;
      else badge = `<div class="day-badge ${day.tipe === 'weekend' ? 'weekend' : ''}">${day.tipe === 'weekend' ? '🌴' : '☀️'} ${t('rate_badge', { d: escapeHtml(dateL(tgl)), l: escapeHtml(day.label), p: rupiah(day.tipe === 'weekend' ? p.hargaWeekend : p.hargaWeekday) })}</div>`;
    }
    $('#dayBadge').innerHTML = badge;

    const ready = S.avail && S.avail.tanggal === tgl && S.avail.rows;
    document.querySelectorAll('[data-busy]').forEach(el => {
      if (!ready) { el.textContent = ''; return; }
      const row = S.avail.rows.find(r => r.lokasiId === el.dataset.busy);
      const taken = row ? row.slots.filter(c => c.st === 'booked' || c.st === 'blocked').map(c => slotLabel(c.jam)) : [];
      el.textContent = taken.length ? t('busy', { x: taken.join(', ') }) : t('free');
      el.style.color = taken.length ? '' : 'var(--leaf)';
    });

    const lok = form.querySelector('input[name="lokasiId"]:checked');
    const start = toMin($('#jam').value);
    S.clash = false;
    if (lok && !isNaN(start)) {
      const end = start + Math.round((p.durasiJam || 3) * 60);
      let c = cellOf(lok.value, $('#jam').value);
      if (ADMIN && S.avail && S.avail.rows && !c) c = overlapCell(lok.value, start, end);
      if (c && c.st !== 'free') S.clash = true;
      if (ADMIN && c && c.st === 'blocked' && $('#aLepasBlokir').checked) {
        S.clash = false;
        $('#clashBox').innerHTML = `<div class="warn-box" style="background:#fff1d6;color:#8a5a00">🔒 Slot diblokir: "${escapeHtml(c.ket || '')}" – blokir akan dilepas saat booking disimpan.</div>`;
      } else $('#clashBox').innerHTML = S.clash
        ? `<div class="warn-box">${escapeHtml(t('slot_taken'))}</div>`
        : `<div class="hint" style="margin-top:8px">${escapeHtml(t('reserved', { a: fromMin(start), b: fromMin(end) }))}</div>`;
    } else {
      $('#clashBox').innerHTML = '';
    }
    document.querySelectorAll('.spot').forEach(el => el.classList.toggle('selected', !!lok && el.dataset.id === lok.value));
    renderSlotGrid();
  }

  // ---------------- Estimate (mirrors calcEstimate_ in Apps Script) ----------------
  function hitung() {
    const d = S.data, p = paket();
    if (!d || !p) return null;
    const anak = Math.floor(+$('#jumlahAnak').value || 0);
    if (anak < 1) return null;
    const dewasa = Math.max(0, Math.floor(+$('#jumlahDewasa').value || 0));
    const tgl = $('#tglAcara').value;
    const day = dayType(tgl);
    const wknd = day.tipe === 'weekend';
    const lines = [], notes = [];
    let mulai = false;

    const tagih = Math.max(anak, p.minAnak);
    const ha = wknd ? p.hargaWeekend : p.hargaWeekday;
    lines.push({ desc: t('line_pkg', { r: t(wknd ? 'r_we' : 'r_wd'), n: tagih }), total: tagih * ha });
    if (anak < p.minAnak) notes.push(t('n_min', { n: p.minAnak }));

    const incl = tagih * p.dewasaPerAnak;
    if (dewasa > incl) {
      const ex = dewasa - incl;
      if (d.info.hargaDewasaTambahan > 0) lines.push({ desc: t('line_adults', { n: ex }), total: ex * d.info.hargaDewasaTambahan });
      else notes.push(t('n_adults', { x: ex, n: p.dewasaPerAnak }));
    }

    const lokEl = form.querySelector('input[name="lokasiId"]:checked');
    const lok = lokEl ? d.lokasi.find(l => l.id === lokEl.value) : null;
    if (lok) {
      const hl = wknd ? lok.hargaWeekend : lok.hargaWeekday;
      if (hl > 0) lines.push({ desc: t('line_spot', { s: lok.nama }), total: hl });
      if (lok.kapasitas > 0 && anak + dewasa > lok.kapasitas) notes.push(t('n_cap', { s: lok.nama, n: lok.kapasitas }));
    }

    const start = toMin($('#jam').value);
    d.addon.filter(a => S.addons.has(a.id) && a.kategori !== 'Cake').map(a => ({ a, st: S.addons.get(a.id) })).concat(cakeItems()).forEach(({ a, st }) => {
      const nm = aName(a) + (st.pilihan ? ' – ' + optLabel(a, st.pilihan) : '');
      let l;
      if (a.satuan === 'per_anak') l = { desc: nm + ' × ' + anak, total: anak * a.harga };
      else if (a.satuan === 'per_pax') { const pax = st.qty || anak; l = { desc: nm + ' (' + pax + ' pax)', total: a.harga + Math.max(0, pax - a.termasukPax) * a.hargaExtraPax }; }
      else if (a.satuan === 'per_item') { const q = st.qty || 1; l = { desc: nm + (q > 1 ? ' × ' + q : ''), total: q * a.harga }; }
      else if (a.satuan === 'on_request') { l = { desc: nm, total: 0, req: true }; notes.push(t('n_req', { x: aName(a) })); }
      else l = { desc: nm, total: a.harga };
      if (a.hargaMulai) { l.desc += ' *'; mulai = true; }
      if (a.minJam && !isNaN(start) && start < toMin(a.minJam)) notes.push(t('n_eve', { x: aName(a), t: a.minJam }));
      lines.push(l);
    });
    if (mulai) notes.push(t('n_start'));

    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const pajak = Math.round(subtotal * (d.info.pajakPersen || 0) / 100);
    const total = subtotal + pajak;
    const dp = Math.max(0, Math.min(total, Math.ceil(total * (d.info.persenDP || 0) / 100 / 1000) * 1000));
    return { tgl, lok, anak, dewasa, lines, notes, pajak, total, dp };
  }

  function recalc() {
    if (!S.data) return;
    renderAvailability();
    const e = hitung();
    if (!e) { $('#summaryBody').innerHTML = `<div class="empty">${escapeHtml(t('sum_empty'))}</div>`; return; }
    const meta = [e.tgl ? dateL(e.tgl) : t('choose_date'), e.lok ? e.lok.nama : t('choose_spot2'), t('meta_guests', { a: e.anak, d: e.dewasa })];
    if (!e.tgl || !e.lok) {
      $('#summaryBody').innerHTML =
        `<div class="meta">${meta.map(escapeHtml).join('<br>')}</div>` +
        `<p class="small muted" style="margin:12px 0 0">${escapeHtml(t('sum_wait'))}</p>` +
        `<div class="total"><span>${escapeHtml(t('total'))}</span><span>${rupiah(0)}</span></div>` +
        `<div class="dp"><span>${escapeHtml(t('deposit'))}</span><span>${rupiah(0)}</span></div>` +
        `<div style="height:14px"></div>`;
      $('#submitBtn').disabled = S.clash || S.closed;
      return;
    }
    $('#summaryBody').innerHTML =
      `<div class="meta">${meta.map(escapeHtml).join('<br>')}</div>` +
      e.lines.map(l => `<div class="line"><span>${escapeHtml(l.desc)}</span><span>${l.req ? escapeHtml(t('on_request')) : rupiah(l.total)}</span></div>`).join('') +
      (e.pajak ? `<div class="line"><span>${escapeHtml(t('line_tax', { n: S.data.info.pajakPersen }))}</span><span>${rupiah(e.pajak)}</span></div>` : '') +
      `<div class="total"><span>${escapeHtml(t('total'))}</span><span>${rupiah(e.total)}</span></div>` +
      (e.dp ? `<div class="dp"><span>${escapeHtml(t('deposit'))}</span><span>${rupiah(e.dp)}</span></div>` : '') +
      (e.notes.length ? `<ul class="notes">${e.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>` : '') +
      `<div style="height:14px"></div>`;
    $('#submitBtn').disabled = S.clash || S.closed;
  }

  form.addEventListener('input', (e) => {
    if (e.target.id === 'jumlahAnak') renderSelected();
    if (!e.target.closest('#selList')) recalc();
  });
  form.addEventListener('change', (e) => { if (!e.target.closest('#selList')) recalc(); });

  // ---------------- Terms & Conditions modal ----------------
  function openTerms() {
    const info = S.data ? S.data.info : {};
    const txt = (isId() && info.syaratId) ? info.syaratId : (info.syarat || '');
    $('#termsText').innerHTML = txt ? txt.split(/\r?\n/).filter(x => x.trim()).map(x => `<p>${escapeHtml(x)}</p>`).join('') : '';
    const rules = isId() && info.rulesId && info.rulesId.length ? info.rulesId : (info.rules || []);
    $('#termsRules').innerHTML = rules.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    $('#parkRulesLink').href = t('park_url');
    $('#termsModal').showModal();
  }
  $('#openTerms').addEventListener('click', openTerms);
  $('#termsClose').addEventListener('click', () => $('#termsModal').close());
  $('#termsAgree').addEventListener('click', () => { $('#setuju').checked = true; $('#termsModal').close(); });

  // ---------------- Submit ----------------
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!form.querySelector('input[name="lokasiId"]:checked')) { toast(t('err_spot'), 'error'); $('#spotPick').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!ADMIN && (!$('#setuju').checked || !$('#setujuPark').checked)) {
      toast(t('err_consent'), 'error');
      document.querySelector('.consent').classList.add('flash');
      document.querySelector('.consent').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => document.querySelector('.consent').classList.remove('flash'), 1600);
      return;
    }
    if (!form.reportValidity()) return;
    if (ADMIN && !$('#email').value.trim() && $('#aKirimEmail').checked) toast('Email kosong – konfirmasi tidak dikirim lewat email. Kirim lewat WhatsApp dari layar berikutnya.');
    if (S.clash || S.closed) { toast(t('err_avail'), 'error'); return; }
    if (S.cake.jenis === 'standard' && (!S.cake.size || !S.cake.flavour)) { toast(t('err_cake'), 'error'); return; }
    if (S.cake.jenis === 'custom' && !$('#cakeLayered').value && !$('#cakeNonLayered').value) { toast(t('err_cake_flavour'), 'error'); $('#cakeCus').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { if (!(v instanceof File)) payload[k] = String(v).trim(); });
    delete payload.kueJenis;
    payload.lang = window.LANG;
    payload.jumlahAnak = Number(payload.jumlahAnak);
    payload.jumlahDewasa = Number(payload.jumlahDewasa || 0);
    payload.setuju = $('#setuju').checked && $('#setujuPark').checked;
    delete payload.setujuPark;
    payload.menu = Array.from(S.menu);
    payload.addOns = Array.from(S.addons.entries()).filter(([id]) => (cakeById(id) || {}).kategori !== 'Cake')
      .map(([id, st]) => ({ id: id, qty: st.qty || '', pilihan: st.pilihan || '' }))
      .concat(cakeItems().map(({ a, st }) => ({ id: a.id, qty: st.qty || '', pilihan: st.pilihan || '' })));
    payload.kue = {
      jenis: S.cake.jenis, tulisan: $('#cakeWriting').value.trim(), lain: $('#cakeOther').value.trim(),
      layered: $('#cakeLayered').value, nonlayered: $('#cakeNonLayered').value, filling: $('#cakeFilling').value, finishing: $('#cakeFinishing').value,
    };
    if (S.cake.jenis === 'custom' && S.design) payload.desainKue = S.design;
    if (ADMIN) { payload.kirimWa = $('#aKirimWa').checked; payload.kirimEmail = $('#aKirimEmail').checked; payload.lepasBlokir = $('#aLepasBlokir').checked; delete payload.website; }

    const btn = $('#submitBtn');
    setLoading(btn, true, t('sending'));
    try {
      const r = ADMIN ? await adminApi('adminCreateBooking', payload) : await api('createBooking', payload);
      $('#sBookingId').textContent = r.bookingId;
      $('#sDetail').innerHTML = `
        <p>${t('m_thanks', { n: escapeHtml(r.nama), d: escapeHtml(dateL(r.tglAcara)), t: escapeHtml(r.jam), s: escapeHtml(r.lokasi) })}</p>
        <div class="summary" style="position:static">
          <div class="line"><span>${escapeHtml(t('m_total'))}</span><span>${rupiah(r.total)}</span></div>
          <div class="line"><span>${escapeHtml(t('m_dp'))}</span><span>${rupiah(r.dp)}</span></div>
        </div>
        ${r.waKonfirmasi ? `<p class="small" style="margin-top:14px;font-weight:800;color:var(--leaf)">✓ ${escapeHtml(t('m_wa_sent', { h: r.hp }))}</p>` : ''}
        <p class="small muted" style="margin-top:14px">${r.emailKonfirmasi ? t(r.proforma ? 'm_sent2' : 'm_sent1', { e: escapeHtml(r.email) }) : ADMIN ? 'Tidak ada email terkirim ke pelanggan. Kirim ringkasan lewat WhatsApp; proforma bisa dikirim dari admin setelah email diisi.' : escapeHtml(t('m_fail'))}</p>`;
      const sWa = $('#sWa');
      if (ADMIN) {
        const no = String(r.hp || '').replace(/\D/g, '').replace(/^0/, '62');
        sWa.textContent = 'Kirim ringkasan ke pelanggan via WhatsApp';
        sWa.href = 'https://wa.me/' + no + '?text=' + encodeURIComponent(t('wa_summary', { n: r.nama, id: r.bookingId, d: dateL(r.tglAcara), t: r.jam, s: r.lokasi, tot: rupiah(r.total), dp: rupiah(r.dp) }));
        $('#sAdmin').href = 'admin.html#booking=' + encodeURIComponent(r.bookingId);
        $('#sAdmin').classList.remove('hidden');
        $('#sClose').textContent = 'Buat booking lain';
      } else if (WA) sWa.href = waUrl(t('wa_booked', { id: r.bookingId, d: dateL(r.tglAcara), t: r.jam }));
      else sWa.classList.add('hidden');
      $('#successModal').showModal();
      form.reset();
      S.addons.clear(); S.menu.clear(); S.avail = null; S.design = null; S.months = {}; loadMonth(S.month);
      S.cake = { jenis: 'none', size: S.cake.size, flavour: S.cake.flavour, qty: 1 };
      $('#cakeDesignPrev').classList.add('hidden');
      $('#jumlahAnak').value = paket().minAnak;
      renderAll();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(btn, false);
      $('#submitBtn').disabled = S.clash || S.closed;
    }
  });

  $('#sClose').addEventListener('click', () => { $('#successModal').close(); $('#book').scrollIntoView({ behavior: 'smooth' }); });

  init();
})();
