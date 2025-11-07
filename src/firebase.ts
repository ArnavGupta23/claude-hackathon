// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBF8kWOX5y3_I6EfOjZuL1SZ0rh3Q7kBpg",
  authDomain: "claudehackathon-6ecb1.firebaseapp.com",
  projectId: "claudehackathon-6ecb1",
  storageBucket: "claudehackathon-6ecb1.firebasestorage.app",
  messagingSenderId: "445317203861",
  appId: "1:445317203861:web:c65aa4c1328b9913ac189c",
  measurementId: "G-11V33QCSJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics errors in unsupported environments
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };
