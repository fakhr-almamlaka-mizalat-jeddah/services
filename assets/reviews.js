/* ===== reviews (shared, real — stored in Cloudflare D1 via Worker API) =====
   يتيح للزائر نشر وتعديل تقييمه الشخصي، ويتيح للمشرف حذف أي تقييم فوراً من الرئيسية. */

var API_BASE = "https://fakhr-almamlaka-api.alsiyadamazallatjeddah.workers.dev";

var currentRating = 0;
var reviewsAdminMode = false;
var editingReviewId = null; // لتتبع التقييم الجاري تعديله من قبل الزائر

// جلب التوكن الخاص بالمشرف
function getAdminToken(){
  try{ return localStorage.getItem('adminToken') || null; }catch(e){ return null; }
}

function authHeaders(){
  var t = getAdminToken();
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}

// حفظ واسترجاع معرفات التقييمات الخاصة بهذا الزائر محلياً
function getMyReviewIds(){
  try { return JSON.parse(localStorage.getItem('my_reviews') || '[]'); } catch(e){ return []; }
}
function saveMyReviewId(id){
  var ids = getMyReviewIds();
  if(ids.indexOf(id) === -1){
    ids.push(id);
    try { localStorage.setItem('my_reviews', JSON.stringify(ids)); } catch(e){}
  }
}

function initReviews(key, seed){
  reviewsAdminMode = !!getAdminToken();
  loadReviews(key);

  var starEls = document.querySelectorAll('#starInput span');
  starEls.forEach(function(el){
    el.addEventListener('click', function(){
      currentRating = parseInt(el.dataset.v, 10);
      starEls.forEach(function(s){
        s.classList.toggle('active', parseInt(s.dataset.v, 10) <= currentRating);
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
      if(note) note.textContent = 'تعذر تحميل التقييمات حالياً (تحقق من الاتصال).';
      console.warn('reviews fetch error:', err);
    });
}

function renderReviews(key, list){
  var listEl = document.getElementById('reviewList-' + key);
  var summaryEl = document.getElementById('reviewSummary-' + key);
  if(!listEl) return;
  listEl.innerHTML = '';
  
  var myIds = getMyReviewIds();
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
    var isMyReview = myIds.indexOf(r.id) !== -1;
    
    // إزرار التحكم: زر حذف للمشرف + زر تعديل للزائر صاحب التقييم
    var actionsHtml = '<div class="review-actions">';
    if(reviewsAdminMode){
      actionsHtml += '<button class="del-btn" style="background:#b04a3a;color:#fff;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:0.8rem;margin-left:5px;" onclick="deleteReview(\'' + r.id + '\',\'' + key + '\')">حذف</button>';
    }
    if(isMyReview){
      actionsHtml += '<button class="edit-btn" style="background:#d97706;color:#fff;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:0.8rem;" onclick="prepareEditReview(\'' + r.id + '\',\'' + r.rating + '\',\'' + escapeJsStr(r.name) + '\',\'' + escapeJsStr(r.text) + '\')">تعديل</button>';
    }
    actionsHtml += '</div>';

    var div = document.createElement('div');
    div.className = 'review-item';
    div.style.cssText = "position:relative; margin-bottom:15px; padding:12px; border:1px solid #e5e7eb; border-radius:6px;";
    div.innerHTML =
      actionsHtml +
      '<div class="stars" style="color:#f59e0b;font-size:1.1rem;">' + stars + '</div>' +
      '<div class="who" style="font-weight:bold;margin:4px 0;">' + escapeHtml(r.name || 'زائر') + '</div>' +
      '<p class="txt" style="margin:0;color:#374151;">' + escapeHtml(r.text) + '</p>';
    listEl.appendChild(div);
  });
}

function escapeHtml(str){
  var d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function escapeJsStr(str){
  return (str || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// تجهيز التقييم للتعليق/التعديل
function prepareEditReview(id, rating, name, text){
  editingReviewId = id;
  currentRating = parseInt(rating, 10);
  
  var nameEl = document.getElementById('reviewName');
  var textEl = document.getElementById('reviewText');
  var submitBtn = document.querySelector('.review-form button');
  var note = document.getElementById('reviewNote');

  if(nameEl) nameEl.value = name;
  if(textEl) textEl.value = text;
  
  document.querySelectorAll('#starInput span').forEach(function(s){
    s.classList.toggle('active', parseInt(s.dataset.v, 10) <= currentRating);
  });

  if(submitBtn) submitBtn.textContent = 'حفظ التعديل';
  if(note){
    note.style.color = '#d97706';
    note.textContent = 'أنت الآن تقوم بتعديل تقييمك السابق.';
  }

  // التمرير الناعم لنشاط التعديل
  document.getElementById('starInput').scrollIntoView({ behavior: 'smooth' });
}

function submitReview(key){
  var note = document.getElementById('reviewNote');
  var textEl = document.getElementById('reviewText');
  var nameEl = document.getElementById('reviewName');
  var submitBtn = document.querySelector('.review-form button');

  var text = textEl.value.trim();
  var name = nameEl.value.trim();

  if(currentRating === 0){ note.style.color='#b04a3a'; note.textContent = 'الرجاء اختيار عدد النجوم أولاً.'; return; }
  if(name.length > 40){ note.style.color='#b04a3a'; note.textContent = 'الاسم طويل جداً (40 حرفاً كحد أقصى).'; return; }
  if(text.length < 3){ note.style.color='#b04a3a'; note.textContent = 'الرجاء كتابة تعليق أوضح.'; return; }

  note.style.color = '';
  note.textContent = 'جارٍ الحفظ...';

  // إذا كان تعديل نقوم بالحذف القديم وإرسال الجديد للحفاظ على أمان البيانات في الـ Worker
  var isEdit = !!editingReviewId;
  var targetId = editingReviewId;

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

    // إذا كان تعديل، نحذف القديم بعد نجاح إضافة التعديل
    if(isEdit && targetId){
      fetch(API_BASE + '/api/reviews/' + encodeURIComponent(targetId), {
        method: 'DELETE',
        headers: authHeaders()
      }).catch(function(){});
    }

    saveMyReviewId(result.data.id);
    editingReviewId = null;

    textEl.value = '';
    nameEl.value = '';
    currentRating = 0;
    if(submitBtn) submitBtn.textContent = 'نشر التقييم';
    
    document.querySelectorAll('#starInput span').forEach(function(s){ s.classList.remove('active'); });
    note.style.color = '#3a7d44';
    note.textContent = isEdit ? 'تم تحديث تقييمك بنجاح!' : 'شكراً لك! تم نشر تقييمك للجميع.';
    
    setTimeout(function(){ note.textContent = ''; note.style.color = ''; }, 3500);
    loadReviews(key);
  })
  .catch(function(err){
    note.style.color = '#b04a3a';
    note.textContent = 'تعذر الحفظ: مشكلة اتصال. حاول لاحقاً.';
    console.warn('submitReview error:', err);
  });
}

function deleteReview(id, key){
  if(!reviewsAdminMode) return;
  if(!confirm('هل أنت تأكد من رغبتك في حذف هذا التقييم نهائياً؟')) return;

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
