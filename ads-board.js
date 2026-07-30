// ============================================================
// لوحة الإعلانات والباقات — تُعرض للجميع، تُدار فقط من admin.html
// يعتمد هذا الملف على firebase-config.js — إن لم تُعبَّأ إعدادات
// Firebase، هذه اللوحة تبقى مخفية بصمت ولا تكسر باقي الموقع.
// ============================================================

function renderAdsBoard(items){
  var wrap = document.getElementById('adsBoardList');
  var section = document.getElementById('adsBoardSection');
  if(!wrap || !section) return;
  var active = (items || []).filter(function(i){ return i.active !== false; });
  if(!active.length){ section.style.display = 'none'; return; }
  section.style.display = '';
  wrap.innerHTML = active.map(function(i){
    return '<div class="ad-card">' +
      (i.badge ? '<span class="ad-badge">' + escapeAdText(i.badge) + '</span>' : '') +
      '<h3>' + escapeAdText(i.title || '') + '</h3>' +
      '<p>' + escapeAdText(i.desc || '') + '</p>' +
      (i.price ? '<div class="ad-price">' + escapeAdText(i.price) + '</div>' : '') +
      '</div>';
  }).join('');
}

function escapeAdText(str){
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', function(){
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
  try{
    var db = firebase.firestore();
    db.collection('content').doc('ads').onSnapshot(function(doc){
      if(doc.exists){
        renderAdsBoard(doc.data().items || []);
      }
    }, function(err){
      console.warn('ads board read failed', err);
    });
  }catch(e){
    console.warn('firebase not ready', e);
  }
});
