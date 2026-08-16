// ============================================================
// لوحة الإعلانات والباقات — تُعرض للجميع، تُدار فقط من admin.html
// يعتمد هذا الملف على firebase-config.js — إن لم تُعبَّأ إعدادات
// Firebase، هذه اللوحة تبقى مخفية بصمت ولا تكسر باقي الموقع.
//
// الحماية الحقيقية لمن يقدر يضيف/يعدّل/يحذف إعلاناً هي في
// firestore.rules (isAdmin() على مجموعة content) — هذا الملف
// للعرض فقط، لا يكتب أي شيء في القاعدة إطلاقاً.
// ============================================================

function renderAdsBoard(items){
  var wrap = document.getElementById('adsBoardList');
  var section = document.getElementById('adsBoardSection');
  if(!wrap || !section) return;

  var now = Date.now();
  var active = (items || []).filter(function(i){
    if(i.active === false) return false;
    // إخفاء تلقائي لأي إعلان انتهت صلاحيته (حقل expiresAt اختياري
    // بصيغة تاريخ YYYY-MM-DD يُضبط من لوحة التحكم) — بدون حاجة
    // للمشرف يرجع يعطّله يدوياً بعد انتهاء العرض.
    if(i.expiresAt){
      var expiry = new Date(i.expiresAt + 'T23:59:59').getTime();
      if(!isNaN(expiry) && expiry < now) return false;
    }
    return true;
  });

  // ترتيب العرض حسب حقل order اختياري (رقم أصغر = يظهر أولاً)،
  // والإعلانات بدون ترتيب محدد تُعرض بعده بترتيبها الأصلي.
  active = active.map(function(item, idx){ return {item: item, idx: idx}; })
    .sort(function(a, b){
      var oa = (typeof a.item.order === 'number') ? a.item.order : 999;
      var ob = (typeof b.item.order === 'number') ? b.item.order : 999;
      return oa - ob || a.idx - b.idx;
    })
    .map(function(x){ return x.item; });

  if(!active.length){ section.style.display = 'none'; return; }
  section.style.display = '';
  wrap.innerHTML = active.map(function(i){
    var imgHtml = '';
    if (i.image && i.image.trim()) {
      // onerror يخفي الصورة تلقائياً لو الرابط خطأ أو الملف مو موجود،
      // بدل ما تظهر أيقونة "صورة مكسورة" غير احترافية للزوار.
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

// نفس التنظيف لكن آمن للاستخدام داخل خاصية HTML (attribute) أيضاً
function escapeAdAttr(str){
  return escapeAdText(str).replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', function(){
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    console.warn('لوحة الإعلانات: Firebase غير مهيّأ — تأكد من تعبئة firebase-config.js بالقيم الحقيقية.');
    return;
  }
  try{
    var db = firebase.firestore();
    db.collection('content').doc('ads').onSnapshot(function(doc){
      if(doc.exists){
        renderAdsBoard(doc.data().items || []);
      }
    }, function(err){
      console.warn('لوحة الإعلانات: فشل القراءة من Firestore —', err.message);
    });
  }catch(e){
    console.warn('لوحة الإعلانات: خطأ غير متوقع —', e);
  }
});
