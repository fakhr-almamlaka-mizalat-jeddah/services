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
  const amount = firstCard ? (firstCard.getBoundingClientRect().width + gap) : track.clientWidth * 0.7;
  const delta = dirRTL === 1 ? -amount : amount;
  track.scrollBy({left: delta, behavior: 'smooth'});
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
   ===== lightbox (تكبير + تنقّل سابق/تالي + عدّاد + سحب) =====
   ============================================================
   - يبني قائمة الصور من نفس الحاوية (carousel-track / gallery-grid /
     portfolio-item) عند الفتح، ويتنقّل بينها فقط — لا يخلط بين معارض
     مختلفة بنفس الصفحة.
   - يحمّل نسخة أكبر مخصصة للعرض الكبير فقط عند الفتح (مو مسبقاً
     لكل الصور) — حتى لا يؤثر على سرعة التحميل الأول للصفحة.
   - يقفل تمرير الخلفية أثناء الفتح، ويدعم أسهم لوحة المفاتيح
     والسحب باللمس على الجوال، ويعرض عداد "3 / 20".
   ============================================================ */

var lbGalleryImgs = [];
var lbIndex = -1;

function lbBuildHiResUrl(thumbSrc){
  // كل صورة مصغّرة مصدرها الأصلي محفوظ داخل معامل url= لرابط wsrv.nl
  // نفسه — نستخرجه ونطلب نسخة أكبر مخصصة للعرض الكبير فقط.
  try{
    var m = thumbSrc.match(/[?&]url=([^&]+)/);
    if(!m) return thumbSrc;
    var orig = decodeURIComponent(m[1]);
    return 'https://wsrv.nl/?url=' + encodeURIComponent(orig) + '&w=1400&h=1050&fit=inside&output=webp&q=85';
  }catch(e){
    return thumbSrc;
  }
}

function lbFindGallery(clickedImg){
  var container = clickedImg.closest('.carousel-track, .gallery-grid, .portfolio-grid');
  if(container){
    return Array.prototype.slice.call(container.querySelectorAll('img'));
  }
  return [clickedImg];
}

function lbOpen(clickedImg){
  lbGalleryImgs = lbFindGallery(clickedImg);
  lbIndex = lbGalleryImgs.indexOf(clickedImg);
  if(lbIndex === -1) lbIndex = 0;
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

  if(lbImg){
    lbImg.src = lbBuildHiResUrl(img.src);
    lbImg.alt = img.alt;
  }
  if(lbDl){
    lbDl.href = img.src;
    var fname = (img.alt || 'fakhr-almamlaka').replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g,'-') + '.webp';
    lbDl.setAttribute('download', fname);
  }
  if(counter){
    var multi = lbGalleryImgs.length > 1;
    counter.textContent = multi ? (lbIndex+1) + ' / ' + lbGalleryImgs.length : '';
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
  lbRender();
}

document.addEventListener('click', function(e){
  var img = e.target.closest('.carousel-track img, .gallery-grid img, .portfolio-item img');
  if(img) lbOpen(img);
});

function closeLightbox(e){
  if(e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')){
    document.getElementById('lightbox').classList.remove('open');
    document.body.classList.remove('lb-scroll-lock');
  }
}

function downloadLightboxImage(e){
  e.preventDefault();
  var lbImg = document.getElementById('lightboxImg');
  var lbDl = document.getElementById('lightboxDownload');
  if(!lbImg || !lbImg.src) return;
  var fname = (lbDl && lbDl.getAttribute('download')) || 'fakhr-almamlaka.webp';
  fetch(lbImg.src)
    .then(function(res){ return res.blob(); })
    .then(function(blob){
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(function(){
      window.open(lbImg.src, '_blank');
    });
}

document.addEventListener('keydown', function(e){
  var lb = document.getElementById('lightbox');
  if(!lb || !lb.classList.contains('open')) return;
  if(e.key === 'Escape'){
    lb.classList.remove('open');
    document.body.classList.remove('lb-scroll-lock');
  } else if(e.key === 'ArrowLeft'){
    // بصفحة RTL: يسار = العنصر التالي بترتيب العرض المرئي
    lightboxStep(null, 1);
  } else if(e.key === 'ArrowRight'){
    lightboxStep(null, -1);
  }
});

/* سحب باللمس للتنقل بين الصور بالجوال */
(function(){
  var touchStartX = null;
  var lbEl = null;
  document.addEventListener('touchstart', function(e){
    var lb = document.getElementById('lightbox');
    if(!lb || !lb.classList.contains('open')) return;
    lbEl = lb;
    touchStartX = e.touches[0].clientX;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if(touchStartX === null || !lbEl) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40){
      // سحب لليمين = صورة سابقة، لليسار = تالية (متوافق مع اتجاه RTL)
      lightboxStep(null, dx > 0 ? -1 : 1);
    }
    touchStartX = null;
    lbEl = null;
  }, {passive:true});
})();

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
