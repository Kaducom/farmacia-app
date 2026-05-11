import { initializeApp } from "firebase/app";

import {
  getAuth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArB1gwLMrtSVv88wUXEiutrO4ggoWYRs0",
  authDomain: "farmacia-app-d2121.firebaseapp.com",
  projectId: "farmacia-app-d2121",
  storageBucket: "farmacia-app-d2121.firebasestorage.app",
  messagingSenderId: "106560458564",
  appId: "1:106560458564:web:058dec73a8d56de1fcd111",
  measurementId: "G-40P7VC1134",
};

const app = initializeApp(firebaseConfig);

const secondaryApp = initializeApp(
  firebaseConfig,
  "Secondary"
);

export const auth = getAuth(app);

export const secondaryAuth = getAuth(secondaryApp);

export const firestore = getFirestore(app);