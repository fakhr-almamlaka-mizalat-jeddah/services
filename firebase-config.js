// ============================================================
// إعدادات Firebase — تعبئة إلزامية قبل أن تعمل لوحة الإعلانات
// ============================================================
// من Firebase Console → إعدادات المشروع (⚙️) → عام → "تطبيقاتك" →
// انسخ القيم بالضبط من هناك والصقها هنا مكان النقاط.
//
// إن لم تُعبَّأ هذه القيم، لوحة الإعلانات وصفحة الإدارة لن تعملا،
// وباقي الموقع سيستمر بالعمل بشكل طبيعي (هذا الملف لا يؤثر على أي
// شيء آخر في الموقع).

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// لا تُغيّر ما تحت هذا السطر
if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
