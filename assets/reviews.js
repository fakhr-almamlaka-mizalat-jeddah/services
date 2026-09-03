/* ===== reviews (shared, real — stored in Cloudflare D1 via Worker API) =====
   يستبدل Firebase بالكامل. كل زائر يقدر يقرأ وينشر تعليقاً؛ الحذف حصراً
   لمن يملك جلسة دخول صالحة (توكن من admin.html محفوظ بـ localStorage). */

// ⚠ عدّل هذا السطر بعد نشر الـ Worker فعلياً (خطوة 5 بدليل النشر) —
// ضع رابط الـ Worker الحقيقي اللي يعطيك إياه Cloudflare بعد "wrangler deploy".
var API_BASE = "https://fakhr-almamlaka-api.YOUR-SUBDOMAIN.workers.dev";

var currentRating = 0;
var reviewsAdminMode = false;

function getAdminToken(){
  try{ return localStorage.getItem('adminToken') || null; }catch(e){ return null; }
}

function authHeaders(){
  var t = getAdminToken();
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

function initReviews(key, seed){
  // seed محفوظ فقط للتوافق مع الاستدعاء القديم بالصفحات — لا يُستخدم
  // إطلاقاً هنا (لا تقييمات وهمية تُزرع تلقائياً في هذا الإصدار).
  reviewsAdminMode = !!getAdminToken();
  loadReviews(key);

  var starEls = document.querySelectorAll('#starInput span');
  starEls.forEach(function(el){
    el.addEventListener('click', function(){
      currentRating = parseInt(el.dataset.v, 10);
      starEls.forEach(function(s){
        s.classList.toggle('active', parseInt(s.dataset.v,10) <= currentRating);
      });
    });
  });
}

function loadReviews(key){
  var note = document.getElementById('reviewNote');
  fetch(API_BASE + '/api/reviews')
    .then(function(res){
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data){
      renderReviews(key, data.reviews || []);
    })
    .catch(function(err){
      if(note) note.textContent = 'تعذر تحميل التقييمات حالياً (تحقق من رابط API_BASE في reviews.js).';
      console.warn('reviews fetch error:', err);
    });
}

function renderReviews(key, list){
  var listEl = document.getElementById('reviewList-' + key);
  var summaryEl = document.getElementById('reviewSummary-' + key);
  if(!listEl) return;
  listEl.innerHTML = '';
  var total = list.length;
  var avg = total ? (list.reduce(function(a,r){return a+r.rating;},0) / total).toFixed(1) : 0;
  if(summaryEl){
    summaryEl.innerHTML = total
      ? '<b>' + avg + '</b> / 5 — بناءً على ' + total + ' تقييم من زوار الموقع'
      : 'كن أول من يقيّم خدماتنا';
  }
  updateAggregateRatingSchema(total, avg, list);
  list.forEach(function(r){
    var stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    var div = document.createElement('div');
    div.className = 'review-item';
    div.innerHTML =
      (reviewsAdminMode ? '<button class="del" onclick="deleteReview(\'' + r.id + '\',\'' + key + '\')">حذف</button>' : '') +
      '<div class="stars">' + stars + '</div>' +
      '<div class="who">' + escapeHtml(r.name || 'زائر') + '</div>' +
      '<p class="txt">' + escapeHtml(r.text) + '</p>';
    listEl.appendChild(div);
  });
}

function escapeHtml(str){
  var d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// حقن Schema.org AggregateRating حقيقي محسوب من بيانات الـ API الفعلية
// فقط — لا أرقام وهمية إطلاقاً، ولا يُنشر قبل 5 تقييمات حقيقية على الأقل.
var MIN_REVIEWS_FOR_SCHEMA = 5;
function updateAggregateRatingSchema(displayTotal, displayAvg, fullList){
  var el = document.getElementById('aggregateRatingSchema');
  if(!el) return;
  var real = (fullList || []).filter(function(r){ return !r.seeded; });
  if(real.length < MIN_REVIEWS_FOR_SCHEMA){
    el.textContent = '';
    return;
  }
  var realAvg = (real.reduce(function(a,r){return a+r.rating;},0) / real.length).toFixed(1);
  var schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "مؤسسة فخر المملكة للمظلات والسواتر",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": String(realAvg),
      "reviewCount": String(real.length),
      "bestRating": "5",
      "worstRating": "1"
    }
  };
  el.textContent = JSON.stringify(schema);
}

function submitReview(key){
  var note = document.getElementById('reviewNote');
  var textEl = document.getElementById('reviewText');
  var nameEl = document.getElementById('reviewName');
  var text = textEl.value.trim();
  var name = nameEl.value.trim();

  if(currentRating === 0){ note.textContent = 'الرجاء اختيار عدد النجوم أولاً.'; return; }
  if(name.length > 40){ note.textContent = 'الاسم طويل جداً (40 حرفاً كحد أقصى).'; return; }
  if(text.length < 3){ note.textContent = 'الرجاء كتابة تعليق أوضح.'; return; }

  note.style.color = '';
  note.textContent = 'جارٍ النشر...';

  fetch(API_BASE + '/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: currentRating, name: name || 'زائر', text: text })
  })
  .then(function(res){
    return res.json().then(function(data){ return { ok: res.ok, status: res.status, data: data }; });
  })
  .then(function(result){
    if(!result.ok){
      note.style.color = '#b04a3a';
      note.textContent = (result.data && result.data.message) || 'تعذر النشر (خطأ ' + result.status + ').';
      return;
    }
    textEl.value = '';
    nameEl.value = '';
    currentRating = 0;
    document.querySelectorAll('#starInput span').forEach(function(s){ s.classList.remove('active'); });
    note.style.color = '#3a7d44';
    note.textContent = 'شكراً لك! تم نشر تقييمك للجميع.';
    setTimeout(function(){ note.textContent = ''; note.style.color = ''; }, 3000);
    loadReviews(key);
  })
  .catch(function(err){
    note.style.color = '#b04a3a';
    note.textContent = 'تعذر النشر: مشكلة اتصال. تأكد من رابط API_BASE أو جرّب لاحقاً.';
    console.warn('submitReview error:', err);
  });
}

function deleteReview(id, key){
  if(!reviewsAdminMode) return;
  fetch(API_BASE + '/api/reviews/' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: authHeaders()
  })
  .then(function(res){
    if(res.status === 401){
      alert('جلسة الدخول انتهت — سجّل دخولك من admin.html من جديد.');
      reviewsAdminMode = false;
      try{ localStorage.removeItem('adminToken'); }catch(e){}
      return;
    }
    loadReviews(key);
  })
  .catch(function(err){ console.warn('deleteReview error:', err); });
}
