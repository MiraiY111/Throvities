// modules/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDwF3aXp9DRG_hIIsjnaiTZ88tin3jvo5A",
    authDomain: "throvexyra-activity.firebaseapp.com",
    projectId: "throvexyra-activity",
    storageBucket: "throvexyra-activity.appspot.com",
    messagingSenderId: "260479995344",
    appId: "1:260479995344:web:11e4ab4d3ed3c438b93dd5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export juga fungsi-fungsi firestore yang dibutuhkan modul lain
export { collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, getDoc };