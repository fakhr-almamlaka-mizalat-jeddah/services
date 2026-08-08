/* ===== reviews (shared, real — stored in Firebase Firestore) =====
   Collection: reviews/{autoId}  { rating, name, text, ts }
   Anyone can read + create a review. Only the logged-in admin
   (same Firebase Auth session used on admin.html) can delete one —
   Firebase Auth persists per-browser, so once the owner logs in on
   admin.html, delete buttons appear for them on every page too. */

var BANNED_WORDS = ["كلب","حيوان","غبي","حقير","نصاب","سيء جدا نصب"];

// يزيل المسافات والتشكيل والرموز بين الأحرف حتى لا يسهل تجاوز الفلتر
// بكتابة الكلمة مع مسافات أو رموز بينها (مثال: "غ.ب.ي" أو "غ ب ي").
// تنبيه صريح: هذا يبقى فلتراً من جهة المتصفح فقط ويمكن تجاوزه من مستخدم
// متمرّس عبر إرسال الطلب مباشرة لـ Firestore بدون المرور بهذا الكود.
// الحماية الحقيقية الوحيدة هي منتظمة الحذف اليدوي عبر admin.html، أو
// إضافة Cloud Function للتحقق من جهة الخادم (خطوة لاحقة تحتاج خطة Firebase Blaze).
function normalizeArabic(text){
  return (text || "")
    .replace(/[\u064B-\u0652\u0640]/g, "")   // إزالة التشكيل والتطويل
    .replace(/[\s._\-*]/g, "")               // إزالة المسافات والرموز الفاصلة
    .toLowerCase();
}
function containsBannedWord(text){
  var norm = normalizeArabic(text);
  return BANNED_WORDS.some(function(w){ return norm.indexOf(normalizeArabic(w)) !== -1; });
}

// تحديد بسيط: تعليق واحد كل دقيقتين لكل متصفح (وليس حماية خادمية حقيقية،
// أي شخص يقدر يتجاوزه بمسح بيانات المتصفح — لكنه يمنع السبام العشوائي العادي).
var REVIEW_COOLDOWN_MS = 2 * 60 * 1000;
function canSubmitReviewNow(){
  var last = parseInt(localStorage.getItem('lastReviewTs') || '0', 10);
  return (Date.now() - last) >= REVIEW_COOLDOWN_MS;
}
function markReviewSubmitted(){
  try{ localStorage.setItem('lastReviewTs', String(Date.now())); }catch(e){}
}

var currentRating = 0;
var reviewsAdminMode = false;

function firestoreReady(){
  return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length
    && typeof firebase.firestore === 'function' && typeof firebase.auth === 'function';
}

function initReviews(key, seed){
  var note = document.getElementById('reviewNote');
  if(!firestoreReady()){
    if(note) note.textContent = 'التقييمات غير متاحة حالياً (لم تُضبط إعدادات Firebase بعد).';
    return;
  }
  var db = firebase.firestore();

  // watch admin auth state so delete buttons show only for the logged-in owner
  firebase.auth().onAuthStateChanged(function(user){
    reviewsAdminMode = !!user;
    db.collection('reviews').orderBy('ts','desc').get().then(function(snap){
      renderReviews(key, snapToList(snap));
    });
  });

  // live updates for everyone
  db.collection('reviews').orderBy('ts','desc').onSnapshot(function(snap){
    renderReviews(key, snapToList(snap));
    // one-time auto-seed if the board is empty (first visitor ever)
    if(snap.empty && seed && seed.length){
      seed.forEach(function(r){
        db.collection('reviews').add({
          rating: r.rating, name: r.name, text: r.text, ts: Date.now() + (r.ts || 0), seeded: true
        });
      });
    }
  }, function(err){
    // بدون هذا، أي فشل بقراءة التقييمات (صلاحيات أو شبكة) كان يحصل
    // بصمت تامة والزائر يشوف قائمة فارغة بدون أي تفسير.
    if(note) note.textContent = 'تعذر تحميل التقييمات حالياً (' + (err.code || 'خطأ اتصال') + ').';
    console.warn('reviews onSnapshot error:', err);
  });

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

function snapToList(snap){
  var list = [];
  snap.forEach(function(doc){
    var d = doc.data();
    list.push({ id: doc.id, rating: d.rating, name: d.name, text: d.text, ts: d.ts, seeded: !!d.seeded });
  });
  return list;
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
      (reviewsAdminMode ? '<button class="del" onclick="deleteReview(\'' + r.id + '\')">حذف</button>' : '') +
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

// حقن Schema.org AggregateRating حقيقي محسوب من بيانات Firestore الفعلية
// فقط — لا أرقام وهمية إطلاقاً. نمتنع عن نشره قبل 5 تقييمات حقيقية على
// الأقل حتى لا يكون المعدل مضللاً من عيّنة صغيرة جداً (نجمة واحدة من
// تقييم واحد تعطي "5/5" وهذا غير موثوق فعلياً حتى لو كان صحيحاً حسابياً).
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

  if(!firestoreReady()){ note.textContent = 'التقييمات غير متاحة حالياً.'; return; }
  if(!canSubmitReviewNow()){ note.textContent = 'يمكنك نشر تقييم واحد كل دقيقتين تقريباً — حاول بعد قليل.'; return; }
  if(currentRating === 0){ note.textContent = 'الرجاء اختيار عدد النجوم أولاً.'; return; }
  if(name.length > 40){ note.textContent = 'الاسم طويل جداً (40 حرفاً كحد أقصى).'; return; }
  if(text.length < 3){ note.textContent = 'الرجاء كتابة تعليق أوضح.'; return; }
  if(containsBannedWord(text) || containsBannedWord(name)){
    note.textContent = 'تعذر نشر التعليق لاحتوائه على كلمات غير لائقة.';
    return;
  }

  note.style.color = '';
  note.textContent = 'جارٍ النشر...';

  firebase.firestore().collection('reviews').add({
    rating: currentRating, name: name || 'زائر', text: text, ts: Date.now()
  }).then(function(){
    markReviewSubmitted();
    textEl.value = '';
    nameEl.value = '';
    currentRating = 0;
    document.querySelectorAll('#starInput span').forEach(function(s){ s.classList.remove('active'); });
    note.style.color = '#3a7d44';
    note.textContent = 'شكراً لك! تم نشر تقييمك للجميع.';
    setTimeout(function(){ note.textContent = ''; note.style.color = ''; }, 3000);
  }).catch(function(err){
    note.style.color = '#b04a3a';
    // رسائل مخصصة حسب نوع الخطأ الفعلي بدل رسالة عامة غامضة —
    // يساعدنا هذا نكتشف السبب الحقيقي بسرعة إذا تكرر العطل.
    if (err.code === 'permission-denied') {
      note.textContent = 'تعذر النشر: قواعد الحماية بقاعدة البيانات لم تُنشر بعد (Publish) — راجع Firebase Console.';
    } else if (err.code === 'unavailable' || err.code === 'network-request-failed') {
      note.textContent = 'تعذر النشر: مشكلة اتصال بالإنترنت. جرّب فتح الرابط من متصفح مباشر (Chrome/Safari) بدل متصفح واتساب/انستقرام الداخلي، ثم أعد المحاولة.';
    } else {
      note.textContent = 'تعذر النشر: ' + err.message;
    }
  });
}

function deleteReview(id){
  if(!reviewsAdminMode) return;
  firebase.firestore().collection('reviews').doc(id).delete();
}
