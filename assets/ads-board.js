// ============================================================
// لوحة الإعلانات والباقات — تُعرض للجميع، تُدار فقط من admin.html
// يعتمد هذا الملف على Cloudflare Worker API (استبدل Firebase بالكامل).
//
// ملاحظة صادقة: D1/Workers ما عندها تحديث لحظي مثل Firestore
// (onSnapshot) — هذا الملف يجلب البيانات عند تحميل الصفحة، ويعيد
// الجلب كل 60 ثانية تلقائياً بدل التحديث الفوري. فرق عملي بسيط
// جداً لموقع إعلانات/باقات (مو محادثة لحظية)، وتبسيط حقيقي بالمقابل.
// ============================================================

var ADS_API_BASE = "https://fakhr-almamlaka-api.YOUR-SUBDOMAIN.workers.dev"; // ⚠ نفس رابط reviews.js

function renderAdsBoard(items){
  var wrap = document.getElementById('adsBoardList');
  var section = document.getElementById('adsBoardSection');
  if(!wrap || !section) return;

  if(!items || !items.length){ section.style.display = 'none'; return; }
  section.style.display = '';
  wrap.innerHTML = items.map(function(i){
    var imgHtml = '';
    if (i.image && i.image.trim()) {
      imgHtml = '<div class="ad-card-img">' +
        '<img src="' + escapeAdAttr(i.image) + '" alt="' + escapeAdAttr(i.title || 'إعلان فخر المملكة') + '" ' +
        'loading="lazy" onerror="this.parentElement.style.display=\'none\'">' +
        '</div>';
    }
    return '<div class="ad-card' + (imgHtml ? ' has-img' : '') + '">' +
      imgHtml +
      '<div class="ad-card-body">' +
      (i.badge ? '<span class="ad-badge">' + escapeAdText(i.badge) + '</span>' : '') +
      '<h3>' + escapeAdText(i.title || '') + '</h3>' +
      '<p>' + escapeAdText(i.desc || '') + '</p>' +
      (i.price ? '<div class="ad-price">' + escapeAdText(i.price) + '</div>' : '') +
      '</div>' +
      '</div>';
  }).join('');
}

function escapeAdText(str){
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function escapeAdAttr(str){
  return escapeAdText(str).replace(/"/g, '&quot;');
}

function loadAdsBoard(){
  fetch(ADS_API_BASE + '/api/ads')
    .then(function(res){ return res.json(); })
    .then(function(data){ renderAdsBoard(data.ads || []); })
    .catch(function(err){ console.warn('لوحة الإعلانات: فشل الجلب —', err); });
}

document.addEventListener('DOMContentLoaded', function(){
  loadAdsBoard();
  setInterval(loadAdsBoard, 60000); // إعادة جلب كل دقيقة بدل التحديث اللحظي
});
