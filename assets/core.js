function toggleMore(btn){
  const extra = btn.previousElementSibling;
  extra.classList.toggle('open');
  btn.textContent = extra.classList.contains('open') ? 'عرض أقل ↑' : 'اقرأ المزيد ←';
}
function toggleFaq(item){
  item.classList.toggle('open');
}
function toggleRead(btn){
  const box = document.getElementById(btn.dataset.target);
  box.classList.toggle('open');
  btn.textContent = box.classList.contains('open') ? 'إخفاء ↑' : (btn.dataset.label || 'قراءة المزيد ←');
}

function scrollCarousel(trackId, dirRTL){
  const track = document.getElementById(trackId);
  if(!track) return;
  const firstCard = track.querySelector('img');
  const gap = 14;
  const amount = firstCard ? (firstCard.getBoundingClientRect().width + gap) * 2 : track.clientWidth * 0.7;
  // المسارات صارت LTR: السهم › يحرّك لليمين و ‹ لليسار
  const delta = dirRTL === 1 ? amount : -amount;
  track.scrollBy({left: delta, behavior: 'smooth'});
  if(track._mq) track._mq.pauseUntil = performance.now() + 3500;
}

/* ===== mobile menu ===== */
function toggleMobileMenu(){
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('menuToggle').classList.toggle('open');
}
function toggleServicesMenu(e){
  e.stopPropagation();
  document.getElementById('servicesMenu').classList.toggle('open');
}
document.addEventListener('click', function(e){
  var menu = document.getElementById('servicesMenu');
  if(menu && menu.classList.contains('open') && !menu.contains(e.target) && !e.target.classList.contains('nav-drop-btn')){
    menu.classList.remove('open');
  }
});
document.addEventListener('click', function(e){
  var nav = document.getElementById('navLinks');
  var btn = document.getElementById('menuToggle');
  if(!nav || !nav.classList.contains('open')) return;
  var tappedLink = e.target.matches('nav.links a');
  var tappedInsideMenu = nav.contains(e.target);
  var tappedToggleBtn = btn.contains(e.target);
  if(tappedLink || (!tappedInsideMenu && !tappedToggleBtn)){
    nav.classList.remove('open');
    btn.classList.remove('open');
  }
});

/* ============================================================
   ===== عارض الصور: شاشة كاملة + أسهم + سحب جانبي + تكبير/تصغير
   =====            + نقر مزدوج + قرص بإصبعين + زر «⬇ حفظ»
   ============================================================ */
var lbGalleryImgs = [];
var lbIndex = -1;
var lbS = 1, lbX = 0, lbY = 0;
var lbUI = false;

function lbFindGallery(clickedImg){
  var box = clickedImg.closest('.carousel, .portfolio-wrap, .gallery-grid');
  var list = box ? Array.prototype.slice.call(box.querySelectorAll('img:not(.mq-clone)')) : [clickedImg];
  list.sort(function(a, b){ return (+a.getAttribute('data-i') || 0) - (+b.getAttribute('data-i') || 0); });
  return list;
}

function lbApply(){
  var im = document.getElementById('lightboxImg');
  if(im) im.style.transform = 'translate(' + lbX + 'px,' + lbY + 'px) scale(' + lbS + ')';
}
function lbReset(){ lbS = 1; lbX = 0; lbY = 0; lbApply(); }
function lbZoom(factor, cx, cy){
  var im = document.getElementById('lightboxImg');
  var ns = Math.max(1, Math.min(6, lbS * factor));
  if(im && cx != null){
    var r = im.getBoundingClientRect();
    var ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    var k = ns / lbS;
    lbX = lbX - ox * (k - 1); lbY = lbY - oy * (k - 1);
  }
  lbS = ns;
  if(lbS === 1){ lbX = 0; lbY = 0; }
  lbApply();
}

function lbOpen(clickedImg){
  lbInitUI();
  lbGalleryImgs = lbFindGallery(clickedImg);
  lbIndex = lbGalleryImgs.indexOf(clickedImg);
  if(lbIndex === -1) lbIndex = 0;
  lbReset();
  lbRender();
  var lb = document.getElementById('lightbox');
  if(lb){
    lb.classList.add('open');
    document.body.classList.add('lb-scroll-lock');
  }
}

function lbRender(){
  var img = lbGalleryImgs[lbIndex];
  if(!img) return;
  var lbImg = document.getElementById('lightboxImg');
  var lbDl = document.getElementById('lightboxDownload');
  var counter = document.getElementById('lightboxCounter');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');
  var full = img.getAttribute('src');
  if(lbImg){ lbImg.src = full; lbImg.alt = img.alt; }
  if(lbDl){
    lbDl.href = full;
    var base = decodeURIComponent((full.split('/').pop() || 'fakhr-almamlaka.webp').split('?')[0]);
    lbDl.setAttribute('download', base);
  }
  if(counter){
    var multi = lbGalleryImgs.length > 1;
    counter.textContent = multi ? (lbIndex + 1) + ' / ' + lbGalleryImgs.length : '';
    counter.style.display = multi ? '' : 'none';
  }
  var showNav = lbGalleryImgs.length > 1;
  if(prevBtn) prevBtn.style.display = showNav ? '' : 'none';
  if(nextBtn) nextBtn.style.display = showNav ? '' : 'none';
}

function lightboxStep(e, dir){
  if(e) e.stopPropagation();
  if(!lbGalleryImgs.length) return;
  lbIndex = (lbIndex + dir + lbGalleryImgs.length) % lbGalleryImgs.length;
  lbReset();
  lbRender();
}

function lbClose(){
  var lb = document.getElementById('lightbox');
  if(lb) lb.classList.remove('open');
  document.body.classList.remove('lb-scroll-lock');
  lbReset();
}
function closeLightbox(e){
  if(e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) lbClose();
}

function downloadLightboxImage(e){
  e.preventDefault();
  e.stopPropagation();
  var lbImg = document.getElementById('lightboxImg');
  var lbDl = document.getElementById('lightboxDownload');
  if(!lbImg || !lbImg.src) return;
  var fname = (lbDl && lbDl.getAttribute('download')) || 'fakhr-almamlaka.webp';
  fetch(lbImg.src)
    .then(function(res){ return res.blob(); })
    .then(function(blob){
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(function(){ window.open(lbImg.src, '_blank'); });
}

/* يضيف أزرار التكبير ويربط اللمس/الماوس مرة واحدة */
function lbInitUI(){
  if(lbUI) return;
  var lb = document.getElementById('lightbox'), im = document.getElementById('lightboxImg');
  if(!lb || !im) return;
  lbUI = true;

  var dl = document.getElementById('lightboxDownload');
  if(dl) dl.innerHTML = '<span>⬇ حفظ</span>';

  var tools = document.createElement('div');
  tools.className = 'lb-tools';
  tools.innerHTML = '<button type="button" data-z="in" aria-label="تكبير">＋</button>' +
                    '<button type="button" data-z="out" aria-label="تصغير">－</button>' +
                    '<button type="button" data-z="reset" aria-label="الحجم الأصلي">⟲</button>';
  lb.appendChild(tools);
  tools.addEventListener('click', function(e){
    e.stopPropagation();
    var b = e.target.closest('button'); if(!b) return;
    var z = b.getAttribute('data-z');
    if(z === 'in') lbZoom(1.5); else if(z === 'out') lbZoom(1 / 1.5); else lbReset();
  });

  /* عجلة الماوس */
  lb.addEventListener('wheel', function(e){
    e.preventDefault();
    lbZoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY);
  }, {passive:false});

  /* نقر مزدوج بالماوس */
  im.addEventListener('dblclick', function(e){
    e.preventDefault();
    if(lbS > 1) lbReset(); else lbZoom(2.6, e.clientX, e.clientY);
  });

  /* سحب الصورة المكبّرة بالماوس */
  var drag = null;
  im.addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'mouse' || lbS <= 1) return;
    drag = {x: e.clientX, y: e.clientY, bx: lbX, by: lbY};
    im.setPointerCapture(e.pointerId);
  });
  im.addEventListener('pointermove', function(e){
    if(!drag) return;
    lbX = drag.bx + (e.clientX - drag.x); lbY = drag.by + (e.clientY - drag.y); lbApply();
  });
  im.addEventListener('pointerup', function(){ drag = null; });
  im.addEventListener('pointercancel', function(){ drag = null; });

  /* اللمس: سحب جانبي للتنقل / تحريك المكبّرة / قرص بإصبعين / نقر مزدوج */
  var t0 = null, pinch = null, lastTap = 0, lastTapX = 0, lastTapY = 0;
  function dist(a, b){ return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  lb.addEventListener('touchstart', function(e){
    if(e.touches.length === 2){
      pinch = {d: dist(e.touches[0], e.touches[1]), s: lbS};
      t0 = null;
    } else if(e.touches.length === 1){
      var t = e.touches[0];
      t0 = {x: t.clientX, y: t.clientY, bx: lbX, by: lbY, moved: false};
    }
  }, {passive:true});
  lb.addEventListener('touchmove', function(e){
    if(pinch && e.touches.length === 2){
      var d = dist(e.touches[0], e.touches[1]);
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      var target = Math.max(1, Math.min(6, pinch.s * d / pinch.d));
      lbZoom(target / lbS, cx, cy);
    } else if(t0 && e.touches.length === 1 && lbS > 1){
      var t = e.touches[0];
      lbX = t0.bx + (t.clientX - t0.x); lbY = t0.by + (t.clientY - t0.y);
      t0.moved = true; lbApply();
    }
  }, {passive:true});
  lb.addEventListener('touchend', function(e){
    if(pinch){ if(e.touches.length < 2) pinch = null; return; }
    if(!t0) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    var now = Date.now();
    if(Math.abs(dx) < 12 && Math.abs(dy) < 12){
      if(now - lastTap < 320 && Math.abs(t.clientX - lastTapX) < 40){
        if(lbS > 1) lbReset(); else lbZoom(2.6, t.clientX, t.clientY);
        lastTap = 0;
      } else { lastTap = now; lastTapX = t.clientX; lastTapY = t.clientY; }
    } else if(lbS === 1 && Math.abs(dx) > 50 && Math.abs(dy) < 90){
      lightboxStep(null, dx > 0 ? -1 : 1);
    }
    t0 = null;
  }, {passive:true});
}

document.addEventListener('click', function(e){
  var img = e.target.closest('.carousel-track img, .gallery-grid img, .lb-src');
  if(img && !img.classList.contains('mq-clone')) lbOpen(img);
  else if(img && img.classList.contains('mq-clone')){
    var orig = img.closest('.carousel').querySelector('img[data-i="' + img.getAttribute('data-i') + '"]:not(.mq-clone)');
    if(orig) lbOpen(orig);
  }
});

document.addEventListener('keydown', function(e){
  var lb = document.getElementById('lightbox');
  if(!lb || !lb.classList.contains('open')) return;
  if(e.key === 'Escape') lbClose();
  else if(e.key === 'ArrowLeft') lightboxStep(null, 1);
  else if(e.key === 'ArrowRight') lightboxStep(null, -1);
  else if(e.key === '+' || e.key === '=') lbZoom(1.4);
  else if(e.key === '-') lbZoom(1 / 1.4);
  else if(e.key === '0') lbReset();
});

/* ===== share customer location ===== */
function shareMyLocation(e){
  var btn = e.currentTarget || e.target.closest('button');
  if(!navigator.geolocation){
    alert('متصفحك لا يدعم مشاركة الموقع. تواصل معنا مباشرة عبر واتساب وأرسل العنوان نصياً.');
    return;
  }
  var original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'جارٍ تحديد موقعك...';

  navigator.geolocation.getCurrentPosition(function(pos){
    var lat = pos.coords.latitude.toFixed(6);
    var lng = pos.coords.longitude.toFixed(6);
    var mapsUrl = 'https://www.google.com/maps?q=' + lat + ',' + lng;
    var msg = 'مرحباً مؤسسة فخر المملكة، هذا موقعي لمعاينة المشروع: ' + mapsUrl;
    window.open('https://wa.me/966553511013?text=' + encodeURIComponent(msg), '_blank');
    btn.disabled = false;
    btn.innerHTML = original;
  }, function(err){
    btn.disabled = false;
    btn.innerHTML = original;
    var messages = {
      1: 'تم رفض إذن الوصول للموقع من إعدادات المتصفح. من إعدادات الموقع بالمتصفح فعّل صلاحية "الموقع الجغرافي" لهذا الموقع، أو أرسل العنوان نصياً عبر واتساب مباشرة.',
      2: 'تعذر الحصول على إحداثيات دقيقة حالياً (قد يكون بسبب ضعف الإشارة داخل مبنى). حاول قرب نافذة أو بمكان مفتوح، أو أرسل العنوان نصياً عبر واتساب مباشرة.',
      3: 'استغرق تحديد الموقع وقتاً أطول من المتوقع. حاول مرة أخرى، أو أرسل العنوان نصياً عبر واتساب مباشرة.'
    };
    alert(messages[err && err.code] || 'تعذر تحديد موقعك. أرسل العنوان نصياً عبر واتساب مباشرة.');
  }, { timeout: 20000, maximumAge: 60000, enableHighAccuracy: false });
}

/* ===== share the website itself ===== */
function shareWebsite(e){
  var btn = e.currentTarget || e.target.closest('button');
  var url = window.location.href;
  var title = document.title;
  var text = 'أفضل مؤسسة لتركيب المظلات والسواتر بجدة — فخر المملكة';

  if (navigator.share) {
    navigator.share({ title: title, text: text, url: url }).catch(function(){});
    return;
  }

  var original = btn.innerHTML;
  var restore = function(){ setTimeout(function(){ btn.innerHTML = original; }, 2000); };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function(){
      btn.textContent = 'تم نسخ الرابط ✓';
      restore();
    }).catch(function(){
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank');
    });
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank');
  }
}

/* ============================================================
   ===== مسارات الصور المتحركة (اتجاهان متعاكسان + سحب بالإصبع)
   ============================================================ */
(function(){
  var lanes = [], raf = 0, last = 0, suppress = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tracks = document.querySelectorAll('.mq-track');
  if(!tracks.length) return;

  /* ترقيم الصور بترتيبها الأصلي لكل معرض (يحفظ ترتيب التنقل في عارض الصور) */
  var groups = document.querySelectorAll('.carousel, .portfolio-wrap');
  Array.prototype.forEach.call(groups, function(g){
    Array.prototype.forEach.call(g.querySelectorAll('img'), function(im, i){ im.setAttribute('data-i', i); });
  });

  function itemW(L){ var c = L.el.firstElementChild; return c ? c.offsetWidth + L.gap : 0; }

  function prep(L){
    var el = L.el, w = itemW(L);
    if(!w) return false;
    var kids = Array.prototype.slice.call(el.children), guard = 0;
    while(el.scrollWidth < el.clientWidth + w * 4 && guard++ < 6){   // تعبئة المسارات القصيرة بنسخ
      kids.forEach(function(k){
        var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true');
        if(c.tagName === 'IMG') c.classList.add('mq-clone');
        Array.prototype.forEach.call(c.querySelectorAll('img'), function(i){ i.classList.add('mq-clone'); });
        el.appendChild(c);
      });
    }
    el.insertBefore(el.lastElementChild, el.firstElementChild);       // هامش يسار بمقدار عنصر
    el.scrollLeft = itemW(L);
    L.ready = true; return true;
  }

  function recycle(L){
    var el = L.el, w = itemW(L); if(!w) return;
    var n = 0;
    while(el.scrollLeft >= w * 2 && n++ < 40){ el.appendChild(el.firstElementChild); el.scrollLeft -= w; }
    while(el.scrollLeft < w && n++ < 40){ el.insertBefore(el.lastElementChild, el.firstElementChild); el.scrollLeft += w; }
  }

  function tick(t){
    var dt = Math.min(64, t - last) / 1000; last = t; var any = false;
    lanes.forEach(function(L){
      if(!L.vis) return; any = true;
      if(!L.ready && !prep(L)) return;
      var idle = !L.down && t >= L.pauseUntil;
      if(idle){
        if(!reduce){
          L.acc += L.dir * L.speed * dt;
          var s = L.acc > 0 ? Math.floor(L.acc) : Math.ceil(L.acc);
          if(s){ L.el.scrollLeft += s; L.acc -= s; }
        }
        recycle(L);
      }
    });
    raf = any ? requestAnimationFrame(tick) : 0;
  }
  function wake(){ if(!raf){ last = performance.now(); raf = requestAnimationFrame(tick); } }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){ e.target._mq.vis = e.isIntersecting; });
    wake();
  }, {rootMargin: '120px 0px'}) : null;

  Array.prototype.forEach.call(tracks, function(el, n){
    var dirAttr = el.getAttribute('data-dir');
    var L = {el: el, dir: dirAttr ? +dirAttr : (n % 2 === 0 ? 1 : -1), speed: +el.getAttribute('data-speed') || 34,
             acc: 0, pauseUntil: 0, vis: !io, down: false, ready: false, gap: 14, moved: 0};
    el._mq = L; lanes.push(L);
    L.gap = parseFloat(getComputedStyle(el).columnGap) || 14;
    if(io) io.observe(el);

    el.addEventListener('dragstart', function(e){ e.preventDefault(); });
    el.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'mouse') return;
      L.down = true; L.sx = e.clientX; L.sl = el.scrollLeft; L.moved = 0; el.classList.add('dragging');
      try{ el.setPointerCapture(e.pointerId); }catch(_){}
    });
    el.addEventListener('pointermove', function(e){
      if(!L.down || e.pointerType !== 'mouse') return;
      var dx = e.clientX - L.sx; L.moved = Math.max(L.moved, Math.abs(dx)); el.scrollLeft = L.sl - dx;
    });
    function up(e){
      if(!L.down) return;
      L.down = false; el.classList.remove('dragging'); L.pauseUntil = performance.now() + 2200;
      if(L.moved > 6){ suppress = true; setTimeout(function(){ suppress = false; }, 0); }
    }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse') L.pauseUntil = Infinity; });
    el.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse' && !L.down) L.pauseUntil = performance.now() + 300; });
    el.addEventListener('touchstart', function(){ L.pauseUntil = Infinity; }, {passive:true});
    var tEnd = function(){ L.pauseUntil = performance.now() + 2600; };
    el.addEventListener('touchend', tEnd, {passive:true}); el.addEventListener('touchcancel', tEnd, {passive:true});
    el.addEventListener('wheel', function(){ L.pauseUntil = performance.now() + 2000; }, {passive:true});
  });

  /* بعد سحب الماوس لا نعتبرها نقرة (لا يفتح العارض ولا الروابط) */
  document.addEventListener('click', function(e){
    if(suppress && e.target.closest && e.target.closest('.mq-track')){ e.preventDefault(); e.stopPropagation(); suppress = false; }
  }, true);
})();

/* ===== سلايدر خلفية الهيرو ===== */
(function(){
  var box = document.getElementById('heroBg'); if(!box) return;
  var s = box.querySelectorAll('.hero-slide'); if(s.length < 2) return;
  var i = 0;
  setInterval(function(){
    if(document.hidden) return;
    s[i].classList.remove('is-active'); i = (i + 1) % s.length; s[i].classList.add('is-active');
  }, 6500);
})();

/* ===== شاشة عرض أفضل الصور ===== */
(function(){
  var scr = document.getElementById('tvScreen'); if(!scr) return;
  var slides = scr.querySelectorAll('.tv-slide'), dotsBox = document.getElementById('tvDots');
  var fx = ['fx-fade', 'fx-zoom', 'fx-slide'], i = 0, timer = null, dots = [];
  Array.prototype.forEach.call(slides, function(sl, n){
    sl.classList.add(fx[n % 3]);
    if(dotsBox){
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'الصورة ' + (n + 1));
      b.addEventListener('click', function(){ go(n); restart(); }); dotsBox.appendChild(b); dots.push(b);
    }
  });
  function go(n){
    slides[i].classList.remove('is-active'); if(dots[i]) dots[i].classList.remove('on');
    i = n; slides[i].classList.add('is-active'); if(dots[i]) dots[i].classList.add('on');
  }
  function restart(){ clearInterval(timer); timer = setInterval(function(){ if(!document.hidden) go((i + 1) % slides.length); }, 4600); }
  slides[0].classList.add('is-active'); if(dots[0]) dots[0].classList.add('on'); restart();
})();

/* ===== الفيديوهات: تحميل كسول + تشغيل عند الظهور + زر الصوت ===== */
(function(){
  var vs = document.querySelectorAll('video[data-src]'); if(!vs.length) return;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){
      var v = e.target;
      if(e.isIntersecting){
        if(!v.getAttribute('src')){ v.src = v.getAttribute('data-src'); v.load(); }
        var p = v.play(); if(p && p.catch) p.catch(function(){});
      } else { v.pause(); }
    });
  }, {rootMargin: '250px 0px', threshold: 0.2}) : null;
  Array.prototype.forEach.call(vs, function(v){
    var fig = v.closest('.vid'), box = v.closest('.vid-box');
    v.addEventListener('loadedmetadata', function(){
      if(v.videoWidth && v.videoHeight){
        box.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight;
        if(v.videoHeight > v.videoWidth) box.classList.add('portrait');
      }
      box.classList.add('ready');
    });
    v.addEventListener('error', function(){ if(fig) fig.style.display = 'none'; });
    v.addEventListener('click', function(){ if(v.paused) v.play(); else v.pause(); });
    var sb = fig && fig.querySelector('.vid-sound');
    if(sb) sb.addEventListener('click', function(e){
      e.stopPropagation(); v.muted = !v.muted; sb.textContent = v.muted ? '🔇' : '🔊';
      sb.setAttribute('aria-label', v.muted ? 'تشغيل الصوت' : 'كتم الصوت');
      if(v.paused) v.play();
    });
    if(io) io.observe(v); else { v.src = v.getAttribute('data-src'); }
  });
})();

/* ===== احتياط: إن لم تُرفع نسخة مصغّرة، تُحمَّل الصورة الأصلية بدلاً منها ===== */
document.addEventListener('error', function(e){
  var t = e.target;
  if(t && t.tagName === 'IMG' && t.hasAttribute('srcset') && !t.__fb){
    t.__fb = 1; var src = t.getAttribute('src');
    t.removeAttribute('srcset'); t.removeAttribute('sizes'); t.src = ''; t.src = src;
  }
}, true);

/* ============================================================
   ===== نموذج طلب عرض السعر (خطوتان) → رسالة واتساب منسّقة
   ============================================================ */
(function(){
  var WA = '966553511013', CONV = 'AW-18515125109/gGmRCISw_bUdEPXG2fxE';
  var SERVICES = [['🚗','مظلات سيارات'],['🏊','مظلات مسابح وحدائق'],['🏡','سواتر خصوصية'],['🌿','برجولات'],['🏕️','بيوت شعر'],
                  ['🏢','هناجر ومستودعات'],['🧱','قرميد وتركيب أسقف'],['🏠','ساندوتش بانل'],['🔧','صيانة وتغيير أقمشة'],['✨','أخرى / لا أعرف بعد']];
  var PAGE_SVC = {'mizalats':0,'sawaters':2,'pergolas':3,'byout-shaar':4,'hangars':5,'qarmids':6,'sandwich-panel':7};
  var root = null, step = 1, picked = {}, loc = '';

  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); }catch(e){ return ''; } }

  function build(){
    root = document.createElement('div');
    root.className = 'qm'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'qmTitle');
    var chips = SERVICES.map(function(s, i){ return '<button type="button" class="qm-chip" data-i="' + i + '"><b>' + s[0] + '</b>' + s[1] + '</button>'; }).join('');
    root.innerHTML =
    '<div class="qm-card"><div class="qm-in">' +
      '<div class="qm-head"><button type="button" class="qm-x" aria-label="إغلاق">×</button>' +
        '<h3 id="qmTitle">📝 طلب عرض سعر مجاني</h3><p>أخبرنا بما تحتاجه ونرد عليك بعرض واضح خلال دقائق</p>' +
        '<div class="qm-badges"><span>⚡ رد سريع</span><span>🆓 معاينة مجانية</span><span>🛡️ ضمان حتى 10 سنوات</span></div></div>' +
      '<div class="qm-steps"><i class="on"></i><i></i></div>' +
      '<div class="qm-body">' +
        '<div data-s="1"><h4>1️⃣ ما الخدمة التي تحتاجها؟ <small style="font-weight:400;color:#7a756b">(يمكن اختيار أكثر من خدمة)</small></h4><div class="qm-chips">' + chips + '</div></div>' +
        '<div data-s="2" hidden><h4>2️⃣ بياناتك للتواصل</h4><div class="qm-f">' +
          '<div class="qm-row"><label>الاسم الكريم<input id="qmName" type="text" autocomplete="name" placeholder="مثال: أبو محمد"></label>' +
          '<label>رقم الجوال<input id="qmPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="05xxxxxxxx" dir="ltr" style="text-align:right"></label></div>' +
          '<div class="qm-row"><label>المدينة<select id="qmCity"><option>جدة</option><option>مكة المكرمة</option><option>الطائف</option><option>رابغ</option><option>المدينة المنورة</option><option>مدينة أخرى</option></select></label>' +
          '<label>الحي<input id="qmDist" type="text" placeholder="مثال: الشاطئ"></label></div>' +
          '<div class="qm-row"><label>المساحة التقريبية (اختياري)<input id="qmArea" type="text" placeholder="مثال: 40 م²"></label>' +
          '<label>موعد التنفيذ<select id="qmWhen"><option>في أقرب وقت</option><option>خلال أسبوعين</option><option>خلال شهر</option><option>للاستفسار فقط</option></select></label></div>' +
          '<label>ملاحظات (اختياري)<textarea id="qmNote" placeholder="اكتب أي تفاصيل تساعدنا: نوع الخامة، اللون، عدد السيارات…"></textarea></label>' +
          '<button type="button" class="qm-loc" id="qmLoc">📍 إرفاق موقعي لتسريع المعاينة (اختياري)</button>' +
        '</div></div>' +
        '<p class="qm-err" id="qmErr" role="alert"></p>' +
      '</div>' +
      '<div class="qm-foot"><button type="button" class="qm-back" hidden>رجوع</button><button type="button" class="qm-next">التالي ←</button><button type="button" class="qm-send" hidden>📲 إرسال الطلب عبر واتساب</button></div>' +
    '</div></div>';
    document.body.appendChild(root);

    root.addEventListener('click', function(e){
      if(e.target === root || e.target.closest('.qm-x')) return close();
      var chip = e.target.closest('.qm-chip');
      if(chip){ var i = chip.getAttribute('data-i'); if(picked[i]) delete picked[i]; else picked[i] = 1; chip.classList.toggle('on'); err(''); return; }
      if(e.target.closest('.qm-next')) return next();
      if(e.target.closest('.qm-back')) return go(1);
      if(e.target.closest('.qm-send')) return send();
      if(e.target.closest('#qmLoc')) return getLoc(e.target.closest('#qmLoc'));
    });
    root.querySelector('#qmName').value = store('qm_name'); root.querySelector('#qmPhone').value = store('qm_phone');
  }

  function err(m){ var el = root.querySelector('#qmErr'); if(el) el.textContent = m || ''; }
  function go(n){
    step = n;
    root.querySelector('[data-s="1"]').hidden = n !== 1; root.querySelector('[data-s="2"]').hidden = n !== 2;
    root.querySelector('.qm-back').hidden = n === 1; root.querySelector('.qm-next').hidden = n !== 1; root.querySelector('.qm-send').hidden = n !== 2;
    var bars = root.querySelectorAll('.qm-steps i'); bars[1].classList.toggle('on', n === 2);
    err(''); root.querySelector('.qm-body').scrollTop = 0;
    if(n === 2) setTimeout(function(){ var f = root.querySelector(store('qm_name') ? '#qmPhone' : '#qmName'); if(f) f.focus(); }, 60);
  }
  function next(){ if(!Object.keys(picked).length) return err('اختر خدمة واحدة على الأقل للمتابعة'); go(2); }

  function getLoc(btn){
    if(!navigator.geolocation){ err('متصفحك لا يدعم تحديد الموقع، يمكنك كتابة الحي في الحقل.'); return; }
    btn.textContent = '⏳ جارٍ تحديد موقعك…';
    navigator.geolocation.getCurrentPosition(function(pos){
      loc = 'https://www.google.com/maps?q=' + pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6);
      btn.textContent = '✅ تم إرفاق موقعك'; btn.classList.add('ok');
    }, function(){ btn.textContent = '📍 إرفاق موقعي لتسريع المعاينة (اختياري)'; err('تعذر تحديد الموقع، يمكنك كتابة الحي في الحقل.'); },
    {timeout: 15000, maximumAge: 60000});
  }

  function send(){
    var name = root.querySelector('#qmName'), phone = root.querySelector('#qmPhone');
    name.classList.remove('bad'); phone.classList.remove('bad');
    var digits = phone.value.replace(/[^\d]/g, '').replace(/^(00)/, '');
    if(name.value.trim().length < 2){ name.classList.add('bad'); name.focus(); return err('من فضلك اكتب اسمك'); }
    if(digits.length < 9 || digits.length > 15){ phone.classList.add('bad'); phone.focus(); return err('رقم الجوال غير صحيح — مثال: 05xxxxxxxx'); }
    store('qm_name', name.value.trim()); store('qm_phone', phone.value.trim());
    var v = function(id){ return (root.querySelector(id).value || '').trim(); };
    var svc = Object.keys(picked).map(function(i){ return SERVICES[i][1]; }).join('، ');
    var lines = ['📋 *طلب عرض سعر جديد* — مؤسسة فخر المملكة', '',
      '👤 الاسم: ' + name.value.trim(), '📱 الجوال: ' + phone.value.trim(), '🛠️ الخدمة: ' + svc,
      '📍 المدينة/الحي: ' + v('#qmCity') + (v('#qmDist') ? ' - ' + v('#qmDist') : '')];
    if(v('#qmArea')) lines.push('📐 المساحة التقريبية: ' + v('#qmArea'));
    lines.push('⏰ موعد التنفيذ: ' + v('#qmWhen'));
    if(v('#qmNote')) lines.push('📝 ملاحظات: ' + v('#qmNote'));
    if(loc) lines.push('🗺️ موقعي: ' + loc);
    var leadId = ('L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase();
    lines.push('🆔 رقم الطلب: ' + leadId);
    lines.push('', '🌐 من صفحة: ' + location.href.split('#')[0]);
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
    /* تحويل «طلب عرض سعر»: يُرسل هنا فور الإرسال، وتُعيد صفحة الشكر إرساله بنفس transaction_id
       فتتجاهل Google التكرار — وهذا يضمن عدم ضياع التحويل لو انتقل الزائر لتطبيق واتساب مباشرة. */
    try{ if(typeof gtag === 'function') gtag('event', 'conversion', {'send_to': CONV, 'transaction_id': leadId}); }catch(e){}
    try{ sessionStorage.setItem('fk_lead', JSON.stringify({id: leadId, t: Date.now(), svc: svc, city: v('#qmCity')})); }catch(e){}
    var w = window.open(url, '_blank');
    var body = root.querySelector('.qm-body');
    root.querySelector('.qm-foot').hidden = true; root.querySelector('.qm-steps').hidden = true;
    body.innerHTML = '<div class="qm-ok"><div class="big">✅</div><h4>تم تجهيز طلبك بنجاح</h4>' +
      '<p>سيُفتح واتساب لإرسال الطلب لفريقنا. إن لم يُفتح تلقائياً اضغط الزر أدناه.</p>' +
      '<a href="' + url + '" target="_blank" rel="noopener">📲 فتح واتساب وإرسال الطلب</a></div>';
    var thanks = '/thank-you?lead_id=' + encodeURIComponent(leadId);
    if(w){ setTimeout(function(){ location.href = thanks; }, 700); }
    else {
      var lk = body.querySelector('.qm-ok a');
      if(lk) lk.addEventListener('click', function(ev){ ev.stopPropagation(); setTimeout(function(){ location.href = thanks; }, 700); });
    }
  }

  function open(){
    if(!root) build();
    var m = location.pathname.replace(/\.html$/, '').split('/').pop();
    if(!Object.keys(picked).length && PAGE_SVC[m] !== undefined){
      picked[PAGE_SVC[m]] = 1; root.querySelector('.qm-chip[data-i="' + PAGE_SVC[m] + '"]').classList.add('on');
    }
    root.classList.add('open'); document.body.classList.add('lb-scroll-lock'); go(1);
  }
  function close(){ if(root) root.classList.remove('open'); document.body.classList.remove('lb-scroll-lock'); }

  /* التقاط النقر قبل أي معالج آخر (حتى لا يُحتسب تحويل إعلان قبل الإرسال الفعلي) */
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-quote]');
    if(!t) return;
    e.preventDefault(); e.stopPropagation(); open();
  }, true);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && root && root.classList.contains('open')) close(); });
})();

/* ============================================================
   ===== أحداث Analytics: click_to_call / click_to_whatsapp
   =====  (مع اسم الصفحة والخدمة) — لمعرفة أي صفحة تجلب الاتصالات
   ============================================================ */
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('a[href]');
  if(!a || typeof gtag !== 'function') return;
  if(a.hasAttribute('data-quote') || a.closest('.designer-credit') || a.closest('.qm')) return;
  var href = (a.getAttribute('href') || '').toLowerCase();
  var name = href.indexOf('tel:') === 0 ? 'click_to_call'
           : (href.indexOf('wa.me/966553511013') > -1) ? 'click_to_whatsapp' : '';
  if(!name) return;
  var page = location.pathname.replace(/^\/|\.html$/g, '') || 'home';
  var where = a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : a.closest('.promo-ticker') ? 'promo_ticker'
            : a.closest('.hero') ? 'hero' : a.closest('.cta') ? 'cta' : 'content';
  gtag('event', name, {
    'event_category': 'contact',
    'event_label': page + ':' + where,
    'page_path': location.pathname,
    'link_location': where,
    'transport_type': 'beacon'
  });
}, true);
