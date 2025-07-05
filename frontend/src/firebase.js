// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqur4MRMN8VICHV5zZLVIDVqAZ92l-weE",
  authDomain: "student-success-bughouse.firebaseapp.com",
  projectId: "student-success-bughouse",
  storageBucket: "student-success-bughouse.firebasestorage.app",
  messagingSenderId: "147036435184",
  appId: "1:147036435184:web:4df344c19ac0c9b3d68835",
  measurementId: "G-N9MKTZDSET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
