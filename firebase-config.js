// ============================================================
// إعدادات Firebase — القيم الحقيقية لمشروع فخر المملكة
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCDEjNbAttYirR-ieXQQrPK4HMTkzlgIWs",
  authDomain: "fakhr-al-mamlaka.firebaseapp.com",
  projectId: "fakhr-al-mamlaka",
  storageBucket: "fakhr-al-mamlaka.firebasestorage.app",
  messagingSenderId: "782142837955",
  appId: "1:782142837955:web:b92e8bc629a61e001a3e76"
};

// لا تُغيّر ما تحت هذا السطر
if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
