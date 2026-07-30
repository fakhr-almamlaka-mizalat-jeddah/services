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
  // dirRTL: 1 means "السابق" (previous, moves right-to-left content backward -> scrollLeft decreases in RTL... )
  const track = document.getElementById(trackId);
  if(!track) return;
  const firstCard = track.querySelector('img');
  const gap = 14; // matches .carousel-track { gap:14px } in style.css
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
// close mobile menu after tapping a link, OR tapping anywhere outside it
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

/* ===== lightbox (zoom + save/download) ===== */
document.addEventListener('click', function(e){
  var img = e.target.closest('.carousel-track img, .gallery-grid img, .portfolio-item img');
  if(img){
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    var lbDl = document.getElementById('lightboxDownload');
    if(lb && lbImg){
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      if(lbDl){
        lbDl.href = img.src;
        var fname = img.src.split('/').pop().split('?')[0] || 'fakhr-almamlaka.webp';
        lbDl.setAttribute('download', fname);
      }
      lb.classList.add('open');
    }
  }
});
function closeLightbox(e){
  if(e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')){
    document.getElementById('lightbox').classList.remove('open');
  }
}
function downloadLightboxImage(e){
  e.preventDefault();
  var lbImg = document.getElementById('lightboxImg');
  var lbDl = document.getElementById('lightboxDownload');
  if(!lbImg || !lbImg.src) return;
  var fname = lbImg.src.split('/').pop().split('?')[0] || 'fakhr-almamlaka.webp';
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
      // fallback: open the image directly if fetch/CORS fails
      window.open(lbImg.src, '_blank');
    });
}
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    var lb = document.getElementById('lightbox');
    if(lb) lb.classList.remove('open');
  }
});

/* ===== share customer location (service-area business — no fixed
   office to "share", so this works the more useful direction: let
   the visitor share THEIR location so we can plan a site visit) ===== */
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
  }, function(){
    btn.disabled = false;
    btn.innerHTML = original;
    alert('تعذر تحديد موقعك — تأكد من تفعيل خدمة الموقع (GPS) بالمتصفح، أو أرسل العنوان نصياً عبر واتساب مباشرة.');
  }, { timeout: 10000 });
}

/* ===== share the website itself (distinct from shareMyLocation above) =====
   Uses the native Web Share API where available (most mobile browsers),
   with a copy-link + WhatsApp fallback for desktop browsers that don't
   support navigator.share. */
function shareWebsite(e){
  var btn = e.currentTarget || e.target.closest('button');
  var url = window.location.href;
  var title = document.title;
  var text = 'أفضل مؤسسة لتركيب المظلات والسواتر بجدة — فخر المملكة';

  if (navigator.share) {
    navigator.share({ title: title, text: text, url: url }).catch(function(){ /* user cancelled — no-op */ });
    return;
  }

  // fallback: copy link, then offer a WhatsApp share as a bonus
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
