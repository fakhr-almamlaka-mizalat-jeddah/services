// ============================================================
// لوحة الإعلانات والباقات — تُعرض للجميع، تُدار فقط من admin.html
// النص يتحرك أفقياً تلقائياً (ماركيه احترافي)، والصورة (إن وُجدت)
// تبقى ثابتة بأعلى البطاقة.
//
// ⚠️ إصلاح مهم: لا نعتمد على حدث DOMContentLoaded إطلاقاً — موقعك
// يستخدم Cloudflare Rocket Loader الذي يؤجّل تنفيذ السكربتات تلقائياً،
// فقد ينفّذ هذا الملف بعد فوات وقت الحدث فلا يُستدعى الاستماع إليه
// أبداً (وهذا هو السبب الحقيقي الأرجح لعدم ظهور الإعلانات). بما أن
// وسم السكربت موجود أصلاً بعد عناصر الإعلانات بالصفحة، نناديها فوراً
// بدون انتظار أي حدث.
// ============================================================

var ADS_API_BASE = "https://fakhr-almamlaka-api.alsiyadamazallatjeddah.workers.dev";

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
    var marqueeText = [i.title, i.desc, i.price].filter(Boolean).join('  •  ');
    return '<div class="ad-card' + (imgHtml ? ' has-img' : '') + '">' +
      imgHtml +
      '<div class="ad-card-body">' +
      (i.badge ? '<span class="ad-badge">' + escapeAdText(i.badge) + '</span>' : '') +
      '<div class="ad-marquee"><div class="ad-marquee-track">' +
        '<span>' + escapeAdText(marqueeText) + '</span>' +
        '<span>' + escapeAdText(marqueeText) + '</span>' +
      '</div></div>' +
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

// نداء مباشر فوري — بدون أي اعتماد على DOMContentLoaded
loadAdsBoard();
setInterval(loadAdsBoard, 60000);
