// Public site (EN/ID): package info, party spots, add-ons, live estimate & booking.
(function () {
  const $ = (s) => document.querySelector(s);
  const form = $('#bookingForm');
  const S = { data: null, addons: new Map(), menu: new Set(), avail: null, cat: null, clash: false, closed: false,
    cake: { jenis: 'none', size: '', flavour: '', qty: 1 }, design: null };

  const EMOJI = { E01: '🎁', E02: '🎁', E03: '💌', E07: '🫧', E09: '🍬', E10: '🎩', E12: '🎤', E13: '🎤', C04: '🎂', C05: '🍰', F01: '🧊', F02: '🧃', F03: '🥤', F04: '🍭', F05: '🍪', F06: '🍹', F07: '🍺' };
  const CAT_EMOJI = { 'Entertainment': '🎈', 'Science Show': '🔬', 'Creative Workshop': '🎨', 'Decoration': '🎉', 'Cake': '🎂', 'Food & Drinks': '🥤' };
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isId = () => window.LANG === 'id';
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
    const min = new Date(); min.setDate(min.getDate() + (Number(S.data.info.minHariBooking) || 0));
    $('#tglAcara').min = ymd(min);
    $('#jumlahAnak').value = paket() ? paket().minAnak : 10;
    const firstNonCake = S.data.addon.find(a => a.kategori !== 'Cake');
    S.cat = firstNonCake ? firstNonCake.kategori : null;
    const std = standardCakes();
    if (std.length) { S.cake.size = std[0].id; S.cake.flavour = std[0].pilihan[0] || ''; }
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
    const slots = (S.data.info.jamSlot && S.data.info.jamSlot.length) ? S.data.info.jamSlot : ['09:00', '10:00', '15:00', '16:00', '17:00', '18:00'];
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

  // ---------------- Add-ons browse ----------------
  function renderTabs() {
    const cats = [];
    S.data.addon.forEach(a => { if (a.kategori !== 'Cake' && cats.indexOf(a.kategori) < 0) cats.push(a.kategori); });
    $('#catTabs').innerHTML = cats.map(c => `<button type="button" data-cat="${escapeHtml(c)}" class="${c === S.cat ? 'active' : ''}">${CAT_EMOJI[c] || '✨'} ${escapeHtml(catName(c))}</button>`).join('');
  }

  $('#catTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    S.cat = b.dataset.cat;
    document.querySelectorAll('#catTabs button').forEach(x => x.classList.toggle('active', x === b));
    renderAddons();
  });

  function priceLabel(a) {
    switch (a.satuan) {
      case 'per_anak': return [rupiah(a.harga), t('unit_child')];
      case 'per_pax': return [rupiah(a.harga), t('unit_pax', { n: a.termasukPax, e: K(a.hargaExtraPax) })];
      case 'per_item': return [rupiah(a.harga), t(a.hargaMulai ? 'unit_start_each' : 'unit_each')];
      case 'on_request': return [t('on_request'), t('see_menu')];
      default: return [rupiah(a.harga), t(a.hargaMulai ? 'unit_start' : 'unit_party')];
    }
  }

  function renderAddons() {
    const list = S.data.addon.filter(a => a.kategori === S.cat);
    $('#addonGrid').innerHTML = list.map(a => {
      const added = S.addons.has(a.id);
      const [p, unit] = priceLabel(a);
      const chips = [];
      if (a.durasi) chips.push(`<span class="chip">⏱ ${escapeHtml(isId() ? a.durasi.replace(/hours?/i, 'jam').replace(/min\b/i, 'menit') : a.durasi)}</span>`);
      a.bahasa.split(',').map(x => x.trim()).filter(Boolean).forEach(l => chips.push(`<span class="chip">${escapeHtml(l)}</span>`));
      if (a.minJam) chips.push(`<span class="chip warn">${escapeHtml(t('chip_eve', { t: a.minJam }))}</span>`);
      if (a.pilihan.length) chips.push(`<span class="chip">${escapeHtml(t('chip_opts', { n: a.pilihan.length }))}</span>`);
      return `
        <article class="addon ${added ? 'added' : ''}">
          <div class="ph" style="${a.gambar ? `background-image:url('${escapeHtml(a.gambar)}')` : ''}">${a.gambar ? '' : (EMOJI[a.id] || CAT_EMOJI[a.kategori] || '✨')}</div>
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
    }).join('');
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

  let availTimer = null;
  $('#tglAcara').addEventListener('change', () => {
    S.avail = null;
    clearTimeout(availTimer);
    const tgl = $('#tglAcara').value;
    if (!tgl) return recalc();
    availTimer = setTimeout(async () => {
      try {
        const a = await api('getAvailability', { tglAcara: tgl, lang: window.LANG });
        if ($('#tglAcara').value === tgl) { S.avail = a; recalc(); }
      } catch (e) { /* ketersediaan tetap dicek server saat booking */ }
    }, 250);
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

    const slots = (S.avail && S.avail.tanggal === tgl) ? S.avail.slots : [];
    document.querySelectorAll('[data-busy]').forEach(el => {
      const mine = slots.filter(s => s.lokasiId === el.dataset.busy);
      el.textContent = mine.length ? t('busy', { x: mine.map(s => s.jam + '–' + s.jamSelesai).join(', ') }) : (S.avail && tgl ? t('free') : '');
      el.style.color = mine.length ? '' : 'var(--leaf)';
    });

    const lok = form.querySelector('input[name="lokasiId"]:checked');
    const start = toMin($('#jam').value);
    S.clash = false;
    if (lok && !isNaN(start)) {
      const end = start + Math.round((p.durasiJam || 3) * 60);
      const c = slots.find(s => s.lokasiId === lok.value && start < toMin(s.jamSelesai) && toMin(s.jam) < end);
      if (c) S.clash = true;
      $('#clashBox').innerHTML = c
        ? `<div class="warn-box">${escapeHtml(t('clash', { a: c.jam, b: c.jamSelesai }))}</div>`
        : `<div class="hint" style="margin-top:8px">${escapeHtml(t('reserved', { a: fromMin(start), b: fromMin(end) }))}</div>`;
    } else {
      $('#clashBox').innerHTML = '';
    }
    document.querySelectorAll('.spot').forEach(el => el.classList.toggle('selected', !!lok && el.dataset.id === lok.value));
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

  // ---------------- Submit ----------------
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!form.querySelector('input[name="lokasiId"]:checked')) { toast(t('err_spot'), 'error'); $('#spotPick').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!form.reportValidity()) return;
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
    payload.setuju = $('#setuju').checked;
    payload.menu = Array.from(S.menu);
    payload.addOns = Array.from(S.addons.entries()).filter(([id]) => (cakeById(id) || {}).kategori !== 'Cake')
      .map(([id, st]) => ({ id: id, qty: st.qty || '', pilihan: st.pilihan || '' }))
      .concat(cakeItems().map(({ a, st }) => ({ id: a.id, qty: st.qty || '', pilihan: st.pilihan || '' })));
    payload.kue = {
      jenis: S.cake.jenis, tulisan: $('#cakeWriting').value.trim(), lain: $('#cakeOther').value.trim(),
      layered: $('#cakeLayered').value, nonlayered: $('#cakeNonLayered').value, filling: $('#cakeFilling').value, finishing: $('#cakeFinishing').value,
    };
    if (S.cake.jenis === 'custom' && S.design) payload.desainKue = S.design;

    const btn = $('#submitBtn');
    setLoading(btn, true, t('sending'));
    try {
      const r = await api('createBooking', payload);
      $('#sBookingId').textContent = r.bookingId;
      $('#sDetail').innerHTML = `
        <p>${t('m_thanks', { n: escapeHtml(r.nama), d: escapeHtml(dateL(r.tglAcara)), t: escapeHtml(r.jam), s: escapeHtml(r.lokasi) })}</p>
        <div class="summary" style="position:static">
          <div class="line"><span>${escapeHtml(t('m_total'))}</span><span>${rupiah(r.total)}</span></div>
          <div class="line"><span>${escapeHtml(t('m_dp'))}</span><span>${rupiah(r.dp)}</span></div>
        </div>
        <p class="small muted" style="margin-top:14px">${r.emailKonfirmasi ? t(r.proforma ? 'm_sent2' : 'm_sent1', { e: escapeHtml(r.email) }) : escapeHtml(t('m_fail'))}</p>`;
      const sWa = $('#sWa');
      if (WA) sWa.href = waUrl(t('wa_booked', { id: r.bookingId, d: dateL(r.tglAcara), t: r.jam }));
      else sWa.classList.add('hidden');
      $('#successModal').showModal();
      form.reset();
      S.addons.clear(); S.menu.clear(); S.avail = null; S.design = null;
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

  $('#sClose').addEventListener('click', () => $('#successModal').close());

  init();
})();
