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
  const amount = track.clientWidth * 0.7;
  // In RTL, browsers differ on scrollLeft sign; detect direction based on current scrollLeft behavior
  const delta = dirRTL === 1 ? -amount : amount;
  track.scrollBy({left: delta, behavior: 'smooth'});
}

/* ===== mobile menu ===== */
function toggleMobileMenu(){
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('menuToggle').classList.toggle('open');
}
// close mobile menu after tapping a link
document.addEventListener('click', function(e){
  if(e.target.matches('nav.links a')){
    var nav = document.getElementById('navLinks');
    var btn = document.getElementById('menuToggle');
    if(nav && nav.classList.contains('open')){ nav.classList.remove('open'); btn.classList.remove('open'); }
  }
});

/* ===== lightbox ===== */
document.addEventListener('click', function(e){
  var img = e.target.closest('.carousel-track img, .gallery-grid img');
  if(img){
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    if(lb && lbImg){
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add('open');
    }
  }
});
function closeLightbox(e){
  if(e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')){
    document.getElementById('lightbox').classList.remove('open');
  }
}

/* ===== reviews (shared, real — stored in Firebase Firestore) =====
   Collection: reviews/{autoId}  { rating, name, text, ts }
   Anyone can read + create a review. Only the logged-in admin
   (same Firebase Auth session used on admin.html) can delete one —
   Firebase Auth persists per-browser, so once the owner logs in on
   admin.html, delete buttons appear for them on every page too. */

var BANNED_WORDS = ["كلب","حيوان","غبي","حقير","نصاب","سيء جدا نصب"];

function containsBannedWord(text){
  var low = (text || "").toLowerCase();
  return BANNED_WORDS.some(function(w){ return low.indexOf(w) !== -1; });
}

var currentRating = 0;
var reviewsAdminMode = false;

function firestoreReady(){
  return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length;
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
          rating: r.rating, name: r.name, text: r.text, ts: Date.now() + (r.ts || 0)
        });
      });
    }
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
    list.push({ id: doc.id, rating: d.rating, name: d.name, text: d.text, ts: d.ts });
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

function submitReview(key){
  var note = document.getElementById('reviewNote');
  var textEl = document.getElementById('reviewText');
  var nameEl = document.getElementById('reviewName');
  var text = textEl.value.trim();
  var name = nameEl.value.trim();

  if(!firestoreReady()){ note.textContent = 'التقييمات غير متاحة حالياً.'; return; }
  if(currentRating === 0){ note.textContent = 'الرجاء اختيار عدد النجوم أولاً.'; return; }
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
    textEl.value = '';
    nameEl.value = '';
    currentRating = 0;
    document.querySelectorAll('#starInput span').forEach(function(s){ s.classList.remove('active'); });
    note.style.color = '#3a7d44';
    note.textContent = 'شكراً لك! تم نشر تقييمك للجميع.';
    setTimeout(function(){ note.textContent = ''; note.style.color = ''; }, 3000);
  }).catch(function(err){
    note.style.color = '#b04a3a';
    note.textContent = 'تعذر النشر: ' + err.message;
  });
}

function deleteReview(id){
  if(!reviewsAdminMode) return;
  firebase.firestore().collection('reviews').doc(id).delete();
}
