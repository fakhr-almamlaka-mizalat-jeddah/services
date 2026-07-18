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
