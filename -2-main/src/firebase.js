// src/firebase.js
//
// Firebase 초기화 파일
// - 웹 설정값(firebaseConfig)만 사용합니다. (서비스 계정 키 사용 안 함)
// - Firestore 인스턴스를 만들어서 다른 컴포넌트에서 가져다 쓸 수 있게 export 합니다.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCH3Qahn2rPtFsrla4e5bbpiRR-smKZjQ",
  authDomain: "project-6745945850324870739.firebaseapp.com",
  projectId: "project-6745945850324870739",
  storageBucket: "project-6745945850324870739.firebasestorage.app",
  messagingSenderId: "1017060582171",
  appId: "1:1017060582171:web:67ec650599fac0ab6de9be",
  measurementId: "G-GK8N826GH6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
