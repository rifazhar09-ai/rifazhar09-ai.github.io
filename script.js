/* ===== Animasi pembuka: logo muncul, lalu halaman terbuka ===== */
(function () {
  var DURATION = 2400; // lama animasi dalam milidetik (1000 = 1 detik)
  var intro = document.getElementById('intro');
  if (!intro) { document.body.classList.add('ready'); return; }
  var root = document.documentElement, done = false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) DURATION = 600;
  try { var l = localStorage.getItem('rfa_logo'); if (l) intro.querySelector('img').src = l; } catch (e) {}
  root.classList.add('intro-lock');
  var start = Date.now();
  function finish() {
    if (done) return; done = true;
    intro.classList.add('done');
    root.classList.remove('intro-lock');
    document.body.classList.add('ready');
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1200);
  }
  function go() { setTimeout(finish, Math.max(0, DURATION - (Date.now() - start))); }
  var img = intro.querySelector('img');
  if (img.complete) go(); else { img.addEventListener('load', go); img.addEventListener('error', go); }
  setTimeout(finish, 5000); // pengaman kalau logo gagal dimuat
})();


(function () {
  /* ====== PENGATURAN ======
     true  = tombol "Edit" tampil untuk semua orang yang membuka halaman.
     false = tombol disembunyikan; untuk mengedit tambahkan #edit di akhir alamat halaman. */
  var SHOW_EDIT_BUTTON = false;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Toast & salin ===== */
  var toast = $('#toast'), tt;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); say(ok ? okMsg : 'Gagal menyalin. Salin manual ya.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say(okMsg); }, fallback);
    } else fallback();
  }

  /* ===== Pulihkan hasil edit yang tersimpan ===== */
  var main = $('main');
  function hash(str) { var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h); }
  var baseHash = hash(main.innerHTML);
  var snap = store.get('rfa_snap');
  if (snap && store.get('rfa_base') === baseHash) main.innerHTML = snap;
  else { store.del('rfa_snap'); store.set('rfa_base', baseHash); }

  var editing = false;

  /* ===== Tema ===== */
  var root = document.documentElement;
  var savedTheme = store.get('tema');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  var themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store.set('tema', next);
  });

  /* ===== Menu mobile ===== */
  var menu = $('#menu'), burger = $('#burger');
  if (menu && burger) {
    burger.addEventListener('click', function () {
      var o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
    });
    $$('#menu a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); });
    });
  }

  /* ===== Progress & nav aktif ===== */
  var bar = $('#progress'), links = $$('#menu a'), secs = $$('main section');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    if (!secs.length) return;
    var cur = secs[0].id, y = scrollY + 140;
    secs.forEach(function (s) { if (s.offsetTop <= y) cur = s.id; });
    links.forEach(function (a) { a.classList.toggle('on', a.dataset.s === cur); });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var toTopBtn = $('#toTop');
  if (toTopBtn) toTopBtn.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ===== Data turunan: nama, email, jumlah, judul halaman ===== */
  function rowValue(label) {
    var rows = $$('.data-list .row');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].querySelector('dt').textContent.trim().toLowerCase() === label) return rows[i].querySelector('dd').textContent.trim();
    }
    return '';
  }
  function setCounts(animate) {
    var targets = [$$('.exp').length, $$('.timeline > li').length, $$('.skill').length];
    $$('.stats .count').forEach(function (el, i) {
      var to = targets[i] || 0;
      if (!animate || reduceMotion || !to) { el.textContent = to; return; }
      var n = 0; el.textContent = 0;
      var t = setInterval(function () { n++; el.textContent = n; if (n >= to) clearInterval(t); }, 350);
    });
  }
  function derive() {
    var name = rowValue('nama') || 'Portofolio';
    var h1 = $('#heroName'); if (h1) h1.textContent = name;
    document.title = 'Portofolio ' + name;
    var mail = $('#mailText'), m = rowValue('email'); if (mail && m) mail.textContent = m;
    var y = $('#year'); if (y) y.textContent = '© ' + new Date().getFullYear() + ' ' + name;
    var logo = $('#logoImg'); if (logo) logo.alt = 'Logo ' + name;
  }
  derive(); setCounts(true);

  /* ===== Efek mengetik ===== */
  var roles = ['IT Staff (Magang)', 'pembuat website', 'pengelola data', 'penulis caption'];
  var storedRoles = store.get('rfa_roles');
  if (storedRoles) { var rr = storedRoles.split('|').filter(Boolean); if (rr.length) roles = rr; }
  var out = $('#typed'), ri = 0, ci = 0, del = false;
  if (out) {
    if (reduceMotion) out.textContent = roles[0];
    else (function tick() {
      var w = roles[ri % roles.length];
      out.textContent = w.slice(0, ci);
      if (!del && ci >= w.length) { del = true; return setTimeout(tick, 1400); }
      if (del && ci <= 0) { del = false; ri = (ri + 1) % roles.length; }
      ci += del ? -1 : 1;
      setTimeout(tick, del ? 35 : 75);
    })();
  }

  /* ===== Reveal saat scroll ===== */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('in'); });

  /* ===== Simpan hasil edit ===== */
  var saveTimer;
  function snapshot() {
    var c = main.cloneNode(true);
    $$('[contenteditable]', c).forEach(function (e) { e.removeAttribute('contenteditable'); });
    $$('.ed-del,.ed-add', c).forEach(function (e) { e.remove(); });
    $$('.skill.hide', c).forEach(function (e) { e.classList.remove('hide'); });
    $$('.reveal', c).forEach(function (e) { e.classList.add('in'); });
    var ph = $('#photo', c); if (ph) { ph.removeAttribute('src'); ph.hidden = true; }
    var pp = $('#photoPh', c); if (pp) pp.hidden = false;
    var pr = $('#photoReset', c); if (pr) pr.hidden = true;
    var ty = $('#typed', c); if (ty) ty.textContent = '';
    var fo = $('#formOk', c); if (fo) fo.hidden = true;
    var fe = $('#formErr', c); if (fe) fe.hidden = true;
    var ml = $('#mailLink', c); if (ml) { ml.hidden = true; ml.setAttribute('href', '#kontak'); }
    return c.innerHTML;
  }
  function saveNow() {
    clearTimeout(saveTimer);
    if (!store.set('rfa_snap', snapshot())) say('Penyimpanan browser penuh atau diblokir. Perubahan tidak tersimpan.');
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }

  /* ===== Foto profil & logo ===== */
  function showPhoto(src) {
    var img = $('#photo'), ph = $('#photoPh'), rst = $('#photoReset');
    img.src = src; img.hidden = false; ph.hidden = true; if (rst) rst.hidden = false;
  }
  function noPhoto() {
    var img = $('#photo'), ph = $('#photoPh'), rst = $('#photoReset');
    img.hidden = true; ph.hidden = false; if (rst) rst.hidden = true; img.removeAttribute('src');
  }
  function loadPhoto() {
    var s = store.get('rfa_foto') || store.get('foto');
    if (s) { showPhoto(s); return; }
    var probe = new Image();
    probe.onload = function () { showPhoto('muka.jpg'); var r = $('#photoReset'); if (r) r.hidden = true; };
    probe.src = 'muka.jpg';
  }
  loadPhoto();
  var savedLogo = store.get('rfa_logo');
  if (savedLogo && $('#logoImg')) $('#logoImg').src = savedLogo;

  function resizeImage(file, max, mime, cb) {
    var r = new FileReader();
    r.onerror = function () { say('Gagal membaca gambar.'); };
    r.onload = function () {
      var im = new Image();
      im.onerror = function () { say('File itu bukan gambar yang bisa dibuka.'); };
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL(mime, .88));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* ===== Peran (efek mengetik) ===== */
  function setRoles(text) {
    var list = text.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!list.length) return;
    roles = list; ri = 0; ci = 0; del = false;
    store.set('rfa_roles', list.join('|'));
  }

  /* ===== Mode edit ===== */
  var EDITABLE = '.eyebrow,.lead,.stats dt,#tagName,.sec-head h2,.sec-head p,.row dt,.row dd,.timeline h3,.timeline p,.yr,.chip,.exp-title strong,.exp-title em,.exp-body li,.tags span,.skill .mono,.skill h3,.skill p,.contact .label,.form label,.hint,.ok';
  var ITEMS = '.data-list > .row,.timeline > li,.exp-list > .exp,.skills > .skill';
  var ADDS = [
    ['.data-list', '+ Tambah data'], ['.timeline', '+ Tambah pendidikan'], ['.exp-list', '+ Tambah pengalaman'],
    ['.exp-body ul', '+ Tambah butir'], ['.tags', '+ Tag'], ['.skills', '+ Tambah kemampuan']
  ];
  var PLAIN = 'plaintext-only';

  function makeEditable(el) {
    try { el.contentEditable = PLAIN; } catch (e) {}
    if (el.contentEditable !== PLAIN) el.contentEditable = 'true';
    el.spellcheck = false;
  }
  function addDelButtons(scope) {
    $$(ITEMS, scope).forEach(function (it) {
      if ($('.ed-del', it) && $('.ed-del', it).parentNode === it) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ed-del'; b.textContent = '×'; b.setAttribute('aria-label', 'Hapus item ini'); b.title = 'Hapus item ini';
      it.appendChild(b);
    });
  }
  function enterEdit() {
    if (editing) return; editing = true;
    document.body.classList.add('editing');
    $$(EDITABLE, main).forEach(makeEditable);
    $$('.exp', main).forEach(function (e) { e.classList.add('open'); });
    addDelButtons(main);
    ADDS.forEach(function (a) {
      $$(a[0], main).forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ed-add'; b.textContent = a[1];
        c.appendChild(b);
      });
    });
    fab.hidden = true; bar2.hidden = false;
    say('Mode edit aktif. Klik teks untuk mengubah.');
  }
  function exitEdit() {
    if (!editing) return;
    saveNow();
    editing = false;
    document.body.classList.remove('editing');
    $$('[contenteditable]', main).forEach(function (e) { e.removeAttribute('contenteditable'); });
    $$('.ed-del,.ed-add', main).forEach(function (e) { e.remove(); });
    $$('.exp', main).forEach(function (e, i) {
      var open = i === 0; e.classList.toggle('open', open);
      var t = $('.exp-top', e); if (t) t.setAttribute('aria-expanded', open);
    });
    bar2.hidden = true; fab.hidden = !(SHOW_EDIT_BUTTON || location.hash === '#edit');
    derive(); setCounts(false);
    say('Perubahan tersimpan');
  }

  /* ----- Toolbar & tombol Edit ----- */
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'btn primary fab'; fab.textContent = 'Edit';
  fab.setAttribute('aria-label', 'Masuk mode edit');
  fab.hidden = !(SHOW_EDIT_BUTTON || location.hash === '#edit');
  document.body.appendChild(fab);

  var bar2 = document.createElement('div');
  bar2.className = 'edbar'; bar2.hidden = true;
  bar2.innerHTML =
    '<div class="ed-row"><button class="btn primary small" id="edDone" type="button">Selesai</button>' +
    '<span class="ed-note">Klik teks mana saja untuk mengubah. Kosongkan butir atau tag lalu klik di luar untuk menghapusnya. Tersimpan otomatis.</span></div>' +
    '<div class="ed-row">' +
    '<button class="btn small" id="edPhoto" type="button">Ganti foto</button>' +
    '<button class="btn small" id="edLogo" type="button">Ganti logo</button>' +
    '<button class="btn small" id="edRolesBtn" type="button">Teks mengetik</button>' +
    '<button class="btn small" id="edExport" type="button">Cadangkan</button>' +
    '<button class="btn small" id="edImport" type="button">Pulihkan</button>' +
    '<button class="btn small warn" id="edReset" type="button">Reset</button></div>' +
    '<div class="ed-roles" id="edRoles" hidden><label for="edRolesInput">Pisahkan dengan koma</label><input id="edRolesInput" type="text"></div>' +
    '<input id="logoInput" type="file" accept="image/*" hidden><input id="importInput" type="file" accept="application/json,.json" hidden>';
  document.body.appendChild(bar2);

  fab.addEventListener('click', enterEdit);
  $('#edDone').addEventListener('click', exitEdit);
  addEventListener('hashchange', function () { if (location.hash === '#edit') { fab.hidden = false; enterEdit(); } });
  if (location.hash === '#edit') enterEdit();
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && editing) exitEdit(); });

  $('#edPhoto').addEventListener('click', function () { $('#photoInput').click(); });
  $('#edLogo').addEventListener('click', function () { $('#logoInput').click(); });
  $('#logoInput').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    resizeImage(f, 400, 'image/png', function (d) {
      if (store.set('rfa_logo', d)) { $('#logoImg').src = d; say('Logo diganti'); }
      else say('Logo terlalu besar untuk disimpan. Pakai gambar yang lebih kecil.');
    });
    e.target.value = '';
  });
  var rolesBox = $('#edRoles'), rolesInput = $('#edRolesInput');
  $('#edRolesBtn').addEventListener('click', function () {
    rolesBox.hidden = !rolesBox.hidden;
    if (!rolesBox.hidden) { rolesInput.value = roles.join(', '); rolesInput.focus(); }
  });
  rolesInput.addEventListener('input', function () { setRoles(rolesInput.value); });

  $('#edExport').addEventListener('click', function () {
    saveNow();
    var data = JSON.stringify({
      v: 1, snap: store.get('rfa_snap'), roles: store.get('rfa_roles'),
      foto: store.get('rfa_foto'), logo: store.get('rfa_logo')
    });
    try {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = 'cadangan-portofolio.json';
      document.body.appendChild(a); a.click(); a.remove();
      say('Cadangan diunduh');
    } catch (err) { say('Unduhan tidak didukung di sini. Buka file index.html langsung di browser.'); }
  });
  $('#edImport').addEventListener('click', function () { $('#importInput').click(); });
  $('#importInput').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || d.v !== 1 || !d.snap) throw new Error('format');
        store.set('rfa_snap', d.snap); store.set('rfa_base', baseHash);
        if (d.roles) store.set('rfa_roles', d.roles);
        if (d.foto) store.set('rfa_foto', d.foto);
        if (d.logo) store.set('rfa_logo', d.logo);
        say('Data dipulihkan'); setTimeout(function () { location.reload(); }, 500);
      } catch (err) { say('File cadangan tidak valid.'); }
    };
    r.readAsText(f); e.target.value = '';
  });
  var resetArm = 0, resetBtn = $('#edReset');
  resetBtn.addEventListener('click', function () {
    if (!resetArm) {
      resetBtn.textContent = 'Yakin? Klik lagi'; resetArm = setTimeout(function () { resetArm = 0; resetBtn.textContent = 'Reset'; }, 3000);
      return;
    }
    ['rfa_snap', 'rfa_base', 'rfa_roles', 'rfa_foto', 'rfa_logo', 'foto'].forEach(store.del);
    location.reload();
  });

  /* ----- Penyimpanan otomatis & aturan ketik ----- */
  main.addEventListener('input', function (e) {
    if (!editing) return;
    derive(); saveSoon();
  });
  main.addEventListener('keydown', function (e) {
    if (!editing) return;
    if (e.key === 'Enter' && e.target.isContentEditable) { e.preventDefault(); e.target.blur(); }
  });
  main.addEventListener('paste', function (e) {
    if (!editing || !e.target.isContentEditable) return;
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, t);
  });
  main.addEventListener('focusout', function (e) {
    if (!editing) return;
    var el = e.target;
    if (el.matches && el.matches('.exp-body li,.tags span') && !el.textContent.trim()) { el.remove(); }
    setCounts(false); saveSoon();
  });

  /* ----- Tambah & hapus item ----- */
  main.addEventListener('click', function (e) {
    var t = e.target;
    var delBtn = t.closest && t.closest('.ed-del');
    if (delBtn && editing) {
      var item = delBtn.parentNode, parent = item.parentNode;
      var siblings = Array.prototype.slice.call(parent.children).filter(function (x) { return x.tagName === item.tagName && !x.classList.contains('ed-add'); });
      if (siblings.length <= 1) { say('Sisakan minimal satu item.'); return; }
      item.remove(); derive(); setCounts(false); saveSoon(); return;
    }
    var addBtn = t.closest && t.closest('.ed-add');
    if (addBtn && editing) {
      var cont = addBtn.parentNode;
      var kids = Array.prototype.slice.call(cont.children).filter(function (x) { return !x.classList.contains('ed-add'); });
      var last = kids[kids.length - 1];
      if (!last) { say('Tidak ada contoh untuk disalin.'); return; }
      var clone = last.cloneNode(true);
      clone.classList.add('in'); clone.classList.remove('hide');
      cont.insertBefore(clone, addBtn);
      if (clone.classList.contains('exp')) clone.classList.add('open');
      var first = clone.matches && clone.matches('[contenteditable]') ? clone : $('[contenteditable]', clone);
      if (first) {
        first.focus();
        var rg = document.createRange(); rg.selectNodeContents(first);
        var sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
      }
      setCounts(false); saveSoon();
    }
  });

  /* ===== Interaksi halaman (delegasi, tetap jalan setelah edit) ===== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var cp = t.closest && t.closest('.row .copy');
    if (cp) {
      var row = cp.closest('.row');
      copyText(row.querySelector('dd').textContent, row.querySelector('dt').textContent + ' disalin');
      return;
    }
    var top = t.closest && t.closest('.exp-top');
    if (top && !editing) {
      var card = top.parentElement, o = card.classList.toggle('open');
      top.setAttribute('aria-expanded', o); return;
    }
    var f = t.closest && t.closest('.f');
    if (f) {
      $$('.f').forEach(function (x) { x.classList.toggle('on', x === f); });
      $$('.skill').forEach(function (s) { s.classList.toggle('hide', f.dataset.f !== 'all' && s.dataset.c !== f.dataset.f); });
      return;
    }
    if (t.closest && t.closest('#copyMail')) { copyText($('#mailText').textContent.trim(), 'Email disalin'); return; }
    if (editing && t.closest && t.closest('#frame') && !t.closest('label,button')) { $('#photoInput').click(); }
  });
  document.addEventListener('keydown', function (e) {
    if (editing || !(e.key === 'Enter' || e.key === ' ')) return;
    if (e.target.classList && e.target.classList.contains('exp-top')) {
      e.preventDefault();
      var card = e.target.parentElement, o = card.classList.toggle('open');
      e.target.setAttribute('aria-expanded', o);
    }
  });

  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'photoInput') return;
    var f = e.target.files[0]; if (!f) return;
    resizeImage(f, 900, 'image/jpeg', function (d) {
      showPhoto(d);
      if (store.set('rfa_foto', d)) say('Foto terpasang dan tersimpan');
      else say('Foto terpasang, tapi terlalu besar untuk disimpan. Pakai foto yang lebih kecil.');
    });
    e.target.value = '';
  });
  document.addEventListener('click', function (e) {
    if (e.target.id === 'photoReset') { store.del('rfa_foto'); store.del('foto'); noPhoto(); loadPhoto(); say('Foto dihapus'); }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'form') return;
    e.preventDefault();
    var n = $('#fName').value.trim(), m = $('#fMsg').value.trim(), err = $('#formErr');
    if (!n || !m) { err.textContent = 'Isi nama dan pesan dulu.'; err.hidden = false; $('#formOk').hidden = true; return; }
    err.hidden = true;
    var body = 'Halo, saya ' + n + '.\n\n' + m, to = $('#mailText').textContent.trim();
    copyText(body, 'Pesan disalin');
    var ml = $('#mailLink');
    ml.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Pesan dari ' + n) + '&body=' + encodeURIComponent(body);
    ml.hidden = false; $('#formOk').hidden = false;
  });
})();
