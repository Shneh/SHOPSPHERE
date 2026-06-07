import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8ZLuzCYOkg8Yfny1NfhaGzOb4--11VjA",
  authDomain: "shopsphere-auth.firebaseapp.com",
  projectId: "shopsphere-auth",
  storageBucket: "shopsphere-auth.appspot.com",
  messagingSenderId: "684046783153",
  appId: "1:684046783153:web:5b8f11a17e815719cf4890",
  measurementId: "G-P3F4K7PXTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Auth
export const auth = getAuth(app);
