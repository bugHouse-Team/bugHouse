// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAV3BbZNLezxLCWV1V4KF8eQb_Fy1FjHus",
  authDomain: "student-sucess-center-web-app.firebaseapp.com",
  projectId: "student-sucess-center-web-app",
  storageBucket: "student-sucess-center-web-app.firebasestorage.app",
  messagingSenderId: "1065403959029",
  appId: "1:1065403959029:web:0aa0fe173f4f12a1a2a7bc",
  measurementId: "G-629W0BX08Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
