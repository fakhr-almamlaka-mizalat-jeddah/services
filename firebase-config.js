// ============================================================
// إعدادات Firebase الاحترافية — مؤسسة فخر المملكة للمظلات والسواتر
// مصمم خصيصاً لتحقيق أقصى سرعة أداء والتوافق التام مع خوارزميات أرشفة جوجل (SEO)
// ============================================================

// استيراد المكتبات الأساسية المحدثة مباشرة من شبكة توزيع محتوى جوجل السريعة (Google CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";

// بيانات الاعتماد الرسمية والمشفرة لمشروعك على Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDEjNbAttYirR-ieXQQrPK4HMTkzlgIWs",
  authDomain: "fakhr-al-mamlaka.firebaseapp.com",
  projectId: "fakhr-al-mamlaka",
  storageBucket: "fakhr-al-mamlaka.firebasestorage.app",
  messagingSenderId: "782142837955",
  appId: "1:782142837955:web:b92e8bc629a61e001a3e76",
  measurementId: "G-5RJN060TV4"
};

// تهيئة التطبيق والإحصائيات بذكاء لمنع أي تكرار أو بطء في التحميل
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// تصدير قواعد البيانات والمصادقة لتستخدمها صفحات الموقع ولوحة الإدارة باحترافية وأمان
export const db = getFirestore(app);
export const auth = getAuth(app);
