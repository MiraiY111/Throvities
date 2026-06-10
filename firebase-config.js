// Kita panggil fungsi SDK Firebase lewat CDN browser langsung
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Kunci akses project ThroveXyra-Activity milikmu
const firebaseConfig = {
  apiKey: "AIzaSyDwF3aXp9DRG_hIIsjnaiTZ88tin3jvo5A",
  authDomain: "throvexyra-activity.firebaseapp.com",
  projectId: "throvexyra-activity",
  storageBucket: "throvexyra-activity.appspot.com",
  messagingSenderId: "260479995344",
  appId: "1:260479995344:web:11e4ab4d3ed3c438b93dd5"
};

// Hubungkan aplikasi web ke Firebase dan Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Kita ekspor 'db' agar bisa dipakai di script halaman lain (seperti halaman input stats/album)
export const db = getDatabase(app); // Gunakan getDatabase