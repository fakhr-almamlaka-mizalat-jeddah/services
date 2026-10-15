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

// الـ API يرجع اسم الملف فقط (مثل bait-shaar-....webp) — نحوّله لمسار محلي نسبي
// داخل images/main/ ليخدمه Cloudflare Pages مباشرة. أي رابط كامل أو مسار فيه / يُترك كما هو.
function resolveAdImage(src){
  src = String(src || '').trim();
  if(!src) return '';
  if(/^(https?:)?\/\//i.test(src) || src.charAt(0) === '/' || /^data:/i.test(src)) return src;
  if(src.indexOf('/') !== -1) return src;
  return 'images/main/' + encodeURIComponent(src).replace(/%2F/g, '/');
}

var lastAdsSignature = '';

function renderAdsBoard(items){
  var wrap = document.getElementById('adsBoardList');
  var section = document.getElementById('adsBoardSection');
  if(!wrap || !section) return;

  // لا نعيد بناء الـ DOM إذا لم تتغير البيانات (يمنع وميض الصور وإعادة تشغيل الماركيه كل دقيقة)
  var signature = JSON.stringify(items || []);
  if(signature === lastAdsSignature) return;
  lastAdsSignature = signature;

  if(!items || !items.length){ section.style.display = 'none'; return; }
  section.style.display = '';
  wrap.innerHTML = items.map(function(i){
    var imgHtml = '';
    if (i.image && i.image.trim()) {
      imgHtml = '<div class="ad-card-img">' +
        '<img src="' + escapeAdAttr(resolveAdImage(i.image)) + '" alt="' + escapeAdAttr(i.title || 'إعلان فخر المملكة') + '" ' +
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
    .then(function(res){
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data){ renderAdsBoard(data.ads || []); })
    .catch(function(err){ console.warn('لوحة الإعلانات: فشل الجلب —', err); });
}

// نداء مباشر فوري — بدون أي اعتماد على DOMContentLoaded
loadAdsBoard();
setInterval(loadAdsBoard, 60000);
