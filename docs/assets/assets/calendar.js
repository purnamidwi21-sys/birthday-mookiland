// Kalender bulanan sederhana – dipakai di website (EN/ID) dan admin.
// renderCalendar(el, {
//   month: 'yyyy-mm', days: { 'yyyy-mm-dd': { st, free, total, ... } } | null (memuat),
//   selected: 'yyyy-mm-dd', minMonth: 'yyyy-mm', lang: 'en'|'id',
//   onPick(date), onNav(month), cellExtra(date, info) -> html, legend: [[st, label], ...]
// })
(function () {
  const NAMES = {
    en: { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], m: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
    id: { d: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], m: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] },
  };

  function shiftMonth(ym, n) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
    const d = new Date(y, m, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  window.shiftMonth = shiftMonth;

  window.renderCalendar = function (el, o) {
    const N = NAMES[o.lang === 'id' ? 'id' : 'en'];
    const y = +o.month.slice(0, 4), m = +o.month.slice(5, 7) - 1;
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const canPrev = !o.minMonth || o.month > o.minMonth;
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= last; d++) {
      const date = o.month + '-' + String(d).padStart(2, '0');
      const info = o.days ? o.days[date] : null;
      const st = info ? info.st : 'loading';
      const clickable = info && (o.allowAll || st === 'open' || st === 'few');
      const sel = date === o.selected ? ' selected' : '';
      const wk = info && info.weekend ? ' wknd' : '';
      cells += `<button type="button" class="cal-cell st-${st}${sel}${wk}" data-date="${date}" ${clickable ? '' : 'disabled'}>
        <span class="cal-d">${d}</span>${o.cellExtra && info ? o.cellExtra(date, info) : ''}</button>`;
    }
    el.innerHTML = `
      <div class="cal-head">
        <button type="button" class="cal-nav" data-nav="-1" ${canPrev ? '' : 'disabled'} aria-label="prev">‹</button>
        <b>${N.m[m]} ${y}</b>
        <button type="button" class="cal-nav" data-nav="1" aria-label="next">›</button>
      </div>
      <div class="cal-grid">${N.d.map(x => `<div class="cal-dow">${x}</div>`).join('')}${cells}</div>
      ${o.legend ? `<div class="cal-legend">${o.legend.map(([s, l]) => `<span><i class="st-${s}"></i>${l}</span>`).join('')}</div>` : ''}`;
    el.onclick = (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav && !nav.disabled) return o.onNav && o.onNav(shiftMonth(o.month, +nav.dataset.nav));
      const c = e.target.closest('[data-date]');
      if (c && !c.disabled && o.onPick) o.onPick(c.dataset.date);
    };
  };
})();
