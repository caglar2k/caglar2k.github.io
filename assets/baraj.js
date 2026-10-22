/* Tahtalı Barajı etkileşimli grafiği (Plotly). Veri: data/tahtali_veri.json
   Su yılı (WY) = 1 Ekim – 30 Eylül. Bir su yılı, bittiği takvim yılıyla adlandırılır (WY2026 = Ekim 2025 – Eylül 2026). */
(function () {
  'use strict';
  var AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var ILK = 2010, SON = 2026;
  var $ = function (id) { return document.getElementById(id); };
  var veri = null;

  function fmt(x, n) { return Number(x).toLocaleString('tr-TR', { minimumFractionDigits: n || 0, maximumFractionDigits: n || 0 }); }

  function renkler() {
    var koyu = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var root = document.documentElement.getAttribute('data-theme');
    if (root === 'dark') koyu = true; else if (root === 'light') koyu = false;
    var cs = getComputedStyle(document.body);
    return {
      fg: cs.color,
      muted: koyu ? '#9bb0b9' : '#4a5f68',
      grid: koyu ? '#26414b' : '#c5d4d9',
      doluluk: koyu ? '#56B4E9' : '#0072B2',
      cekim: koyu ? '#F0883E' : '#D55E00',
      yagis: koyu ? 'rgba(155,176,185,0.42)' : 'rgba(122,143,166,0.45)',
      yagisAks: koyu ? '#b7c7ce' : '#3b4f66',
      tepe: koyu ? '#e5eef1' : '#111111',
      dip: koyu ? '#ff8a80' : '#8B0000',
      bg: 'rgba(0,0,0,0)'
    };
  }

  function secim() {
    var b = +$('bas').value, e = +$('bit').value;
    if (b > e) { var t = b; b = e; e = t; }
    return { bas: b, bit: e };
  }

  // Seçilen su yılı aralığındaki günlük serinin uç değer etiketleri (en yüksek ve en düşük doluluk)
  function ucNoktalar(gt, gd, bas, bit) {
    var adaylar = [];
    for (var y = bas; y <= bit; y++) {
      var a = (y - 1) + '-10-01', b = y + '-09-30', mx = -1, mn = 1e9, imx = -1, imn = -1;
      for (var i = 0; i < gt.length; i++) {
        if (gt[i] < a) continue;
        if (gt[i] > b) break;
        if (gd[i] > mx) { mx = gd[i]; imx = i; }
        if (gd[i] < mn) { mn = gd[i]; imn = i; }
      }
      if (imx >= 0) { adaylar.push({ t: gt[imx], v: mx, tepe: true }); adaylar.push({ t: gt[imn], v: mn, tepe: false }); }
    }
    adaylar.sort(function (p, q) { return p.t < q.t ? -1 : p.t > q.t ? 1 : 0; });
    var son = { true: null, false: null }, cikti = [];
    adaylar.forEach(function (c) {
      var d = new Date(c.t + 'T00:00:00');
      var onceki = son[c.tepe];
      if (onceki && (d - onceki) / 864e5 <= 120) return;
      cikti.push(c); son[c.tepe] = d;
    });
    return cikti;
  }

  function kay(t, gun) { var d = new Date(t + 'T00:00:00'); d.setDate(d.getDate() + gun); return d.toISOString().slice(0, 10); }

  function ciz() {
    if (!veri) return;
    var s = secim(), k = renkler();
    var bas = (s.bas - 1) + '-10-01', bit = s.bit + '-09-30';
    var dar = window.innerWidth < 640;

    // Günlük doluluk
    var gT = veri.gunluk.t, gD = veri.gunluk.doluluk, gx = [], gy = [], i;
    for (i = 0; i < gT.length; i++) { if (gT[i] >= bas && gT[i] <= bit) { gx.push(gT[i]); gy.push(gD[i]); } }
    // Aylık yağış ve çekim (ay ortasına yerleştirilir)
    var aT = veri.aylik.t, ax = [], ayg = [], acek = [], yagMaks = 1;
    var basAy = bas.slice(0, 7), bitAy = bit.slice(0, 7);
    for (i = 0; i < aT.length; i++) {
      if (aT[i] >= basAy && aT[i] <= bitAy) { ax.push(aT[i] + '-15'); ayg.push(veri.aylik.yagis[i]); acek.push(veri.aylik.cekim[i]); }
    }
    yagMaks = Math.max.apply(null, veri.aylik.yagis);

    var goster = { doluluk: $('s-doluluk').checked, cekim: $('s-cekim').checked, yagis: $('s-yagis').checked,
                   uc: $('s-uc').checked, yil: $('s-yil').checked };

    var traces = [
      { type: 'bar', x: ax, y: ayg, name: 'Aylık yağış (mm)', yaxis: 'y', xaxis: 'x', visible: goster.yagis,
        marker: { color: k.yagis }, width: 20 * 864e5, hovertemplate: '%{y:.0f} mm<extra>Aylık yağış</extra>' },
      { type: 'scatter', mode: 'lines+markers', x: ax, y: acek, name: 'Çekilen su (bin m³/gün)', yaxis: 'y2', visible: goster.cekim,
        line: { color: k.cekim, width: 2.5 }, marker: { size: dar ? 3 : 5, color: k.cekim },
        hovertemplate: '%{y:.0f} bin m³/gün<extra>Çekilen su</extra>' },
      { type: 'scatter', mode: 'lines', x: gx, y: gy, name: 'Doluluk oranı (%)', yaxis: 'y3', visible: goster.doluluk,
        line: { color: k.doluluk, width: 2.5 }, connectgaps: false,
        hovertemplate: '%{y:.1f} %<extra>Doluluk oranı</extra>' }
    ];

    var shapes = [], ann = [];
    for (var y = s.bas; y <= s.bit; y++) {
      if (goster.yil) {
        shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: (y - 1) + '-10-01', x1: (y - 1) + '-10-01', y0: 0, y1: 1,
                      line: { color: k.grid, width: 1.2, dash: 'dash' }, layer: 'below' });
        if (!dar || (s.bit - s.bas) < 8 || (s.bit - y) % 2 === 0) {
          ann.push({ xref: 'x', yref: 'paper', x: y + '-04-01', y: dar ? -0.025 : -0.07, text: '<b>' + y + '</b>', showarrow: false, yanchor: 'top',
                     font: { size: dar ? 10 : 14, color: k.fg } });
        }
      }
    }
    if (goster.uc && goster.doluluk) {
      ucNoktalar(gT, gD, s.bas, s.bit).forEach(function (c) {
        var d = new Date(c.t + 'T00:00:00');
        ann.push({ xref: 'x', yref: 'y3', x: c.t, y: c.v, ax: 0, ay: c.tepe ? -30 : 34, axref: 'pixel', ayref: 'pixel',
                   text: AY[d.getMonth()] + ' ' + d.getFullYear() + '<br>%' + fmt(c.v, 1),
                   showarrow: true, arrowhead: 2, arrowsize: 0.8, arrowwidth: 1, arrowcolor: c.tepe ? k.tepe : k.dip,
                   font: { size: dar ? 8 : 10.5, color: c.tepe ? k.tepe : k.dip }, bgcolor: 'rgba(0,0,0,0)' });
      });
    }

    var sag = dar ? 0.84 : 0.9;
    var eksen = function (o) { return Object.assign({ showgrid: false, zeroline: false, tickfont: { size: dar ? 10 : 12 }, titlefont: { size: dar ? 11 : 13 } }, o); };
    var layout = {
      margin: { l: dar ? 46 : 64, r: 10, t: 16, b: dar ? 70 : 96 },
      paper_bgcolor: k.bg, plot_bgcolor: k.bg,
      font: { family: 'Source Sans 3, system-ui, sans-serif', color: k.fg },
      hovermode: 'x unified', bargap: 0.1,
      xaxis: { domain: [0, sag], range: [kay(bas, -20), kay(bit, 8)], showticklabels: false, showgrid: false, zeroline: false, linecolor: k.grid, mirror: false, hoverformat: '%d.%m.%Y' },
      yaxis: eksen({ title: dar ? '' : 'Yağış (mm)', side: 'right', range: [0, yagMaks * 1.5], color: k.yagisAks, tickcolor: k.yagisAks }),
      yaxis2: eksen({ title: dar ? 'Çekim (bin m³/gün)' : 'Çekilen su (bin m³/gün)', overlaying: 'y', side: 'left', range: [0, 600], color: k.cekim }),
      yaxis3: eksen({ title: dar ? '' : 'Doluluk oranı (%)', overlaying: 'y', side: 'right', anchor: 'free', position: dar ? 0.93 : 0.965,
                      range: [0, 115], tickvals: [0, 20, 40, 60, 80, 100], color: k.doluluk }),
      shapes: shapes, annotations: ann,
      legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: dar ? -0.14 : -0.15, font: { size: dar ? 11 : 13 } },
      hoverlabel: { font: { family: 'Source Sans 3, system-ui, sans-serif' } }
    };
    var config = { responsive: true, displaylogo: false, scrollZoom: false,
                   modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
                   toImageButtonOptions: { filename: 'tahtali_baraji_' + s.bas + '_' + s.bit, format: 'png', width: 1800, height: 900, scale: 2 } };
    Plotly.react('grafik', traces, layout, config);
    ozet(s);
  }

  // Seçilen aralığa göre özet kartları
  function ozet(s) {
    var wy = veri.su_yili, topY = 0, topC = 0, n = 0, y;
    for (y = s.bas; y <= s.bit; y++) { var r = wy[String(y)]; if (!r) continue; topY += r.yagis_mm; topC += r.cekim_hm3; n++; }
    var bas = (s.bas - 1) + '-10-01', bit = s.bit + '-09-30', gT = veri.gunluk.t, gD = veri.gunluk.doluluk;
    var mx = -1, mn = 1e9, tmx = '', tmn = '';
    for (var i = 0; i < gT.length; i++) {
      if (gT[i] < bas) continue; if (gT[i] > bit) break;
      if (gD[i] > mx) { mx = gD[i]; tmx = gT[i]; } if (gD[i] < mn) { mn = gD[i]; tmn = gT[i]; }
    }
    var tr = function (t) { var d = new Date(t + 'T00:00:00'); return AY[d.getMonth()] + ' ' + d.getFullYear(); };
    var cards = [
      { k: 'Ortalama su yılı yağışı', v: fmt(topY / n), u: 'mm', s: n + ' su yılı ortalaması' },
      { k: 'Ortalama çekim', v: fmt(topC * 1000 / (n * 365)), u: 'bin m³/gün', s: 'İZSU aylık su üretimi' },
      { k: 'En yüksek doluluk', v: '%' + fmt(mx, 1), u: '', s: tr(tmx) },
      { k: 'En düşük doluluk', v: '%' + fmt(mn, 1), u: '', s: tr(tmn) }
    ];
    $('ozet').innerHTML = cards.map(function (c) {
      return '<div class="card"><div class="k">' + c.k + '</div><div class="v">' + c.v + (c.u ? '<small>' + c.u + '</small>' : '') + '</div><div class="s">' + c.s + '</div></div>';
    }).join('');
  }

  function hizli(n) {
    $('bit').value = SON; $('bas').value = Math.max(ILK, SON - n + 1); isaretle(); ciz();
  }
  function isaretle() {
    var s = secim(), n = s.bit - s.bas + 1;
    document.querySelectorAll('.chips button').forEach(function (b) {
      b.setAttribute('aria-pressed', (s.bit === SON && +b.getAttribute('data-n') === n) ? 'true' : 'false');
    });
  }

  function basla() {
    var opt = ''; for (var y = ILK; y <= SON; y++) opt += '<option value="' + y + '">' + y + (y === ILK ? '' : '') + '</option>';
    $('bas').innerHTML = opt; $('bit').innerHTML = opt;
    $('bas').value = ILK; $('bit').value = SON;
    document.querySelector('.chips').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) hizli(+b.getAttribute('data-n'));
    });
    $('kontrol').addEventListener('change', function () { isaretle(); ciz(); });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(ciz, 200); });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ciz);
    // ?bas=2015&bit=2026 ile doğrudan aralık açılabilir
    var q = new URLSearchParams(location.search), qb = +q.get('bas'), qe = +q.get('bit');
    if (qb >= ILK && qb <= SON) $('bas').value = qb; if (qe >= ILK && qe <= SON) $('bit').value = qe;
    if (window.innerWidth < 640) $('s-uc').checked = false;
    isaretle(); ciz();
  }

  fetch('data/tahtali_veri.json').then(function (r) { return r.json(); }).then(function (d) { veri = d; basla(); })
    .catch(function () { $('grafik').innerHTML = '<p style="padding:24px">Veri yüklenemedi. Sayfayı yenilemeyi deneyin.</p>'; });
})();
