// ==================================================================
// 1. IMPORT MODUL HALAMAN
// ==================================================================
import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';

// ==================================================================
// 2. SELEKTOR ELEMEN UTAMA & SIDEBAR
// ==================================================================
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-btn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page-section');

// ==================================================================
// 3. LOGIKA SIDEBAR & NAVIGASI (ROUTER UTAMA)
// ==================================================================

// Toggle Sidebar (Buka/Tutup Sidebar)
if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
        
        const icon = toggleBtn.querySelector('i');
        
        if (sidebar.classList.contains('minimized')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    });
}

// Handler Pindah Halaman Berdasarkan Atribut 'data-page'
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page'); 
        
        // 1. Ubah UI Active pada Menu Sidebar
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // 2. Sembunyikan Semua Halaman Utama
        pages.forEach(page => {
            const pageId = page.id; 
            if (pageId === targetPage || pageId === `page-${targetPage}`) {
                page.classList.add('active-page'); 
                page.style.display = 'block';     
            } else {
                page.classList.remove('active-page');
                page.style.display = 'none';       
            }
        });

        // CATATAN: Jangan masukkan perintah audio.pause() atau audio.play() di sini 
        // supaya lagunya tidak terputus/terganggu saat user menjelajahi menu lain.

        // ==================================================================
        // 3. AMANKAN ELEMEN GAME SUPPORT AGAR TIDAK BOCOR KE PAGE LAIN
        // ==================================================================
        const mainSelection = document.querySelector('.game-main-selection');
        const valorantDetail = document.getElementById('valorant-detail-view');
        const valorantRoulette = document.getElementById('valorant-roulette-content');
        const valorantMgmt = document.getElementById('valorant-management-content');

        if (targetPage === 'game-support') {
            if (mainSelection) mainSelection.classList.remove('hidden');
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (valorantMgmt) valorantMgmt.classList.remove('hidden');
        } else {
            if (mainSelection) mainSelection.classList.add('hidden');
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (valorantMgmt) valorantMgmt.classList.add('hidden');

            document.body.style.backgroundImage = '';
            document.body.style.background = '';
            
            const mainContent = document.querySelector('.main-content'); 
            if (mainContent) {
                mainContent.style.backgroundImage = '';
                mainContent.style.background = '';
            }

            document.body.classList.remove('valorant-bg', 'game-support-theme'); 

            const bgOverlay = document.querySelector('.game-support-bg-overlay');
            if (bgOverlay) {
                bgOverlay.style.display = 'none';
            }
        }
    });
});

// ==================================================================
// 4. LOAD AWAL APLIKASI (INITIALIZATION)
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 ThroveXyra App Main Controller Loaded");
    
    // Tampilkan hanya halaman home di awal, sembunyikan yang lain
    pages.forEach(page => {
        if (page.id === 'page-home' || page.id === 'home') {
            page.classList.add('active-page');
            page.style.display = 'block';
        } else {
            page.classList.remove('active-page');
            page.style.display = 'none';
        }
    });

    // Jalankan load data awal untuk masing-masing modul SEKALI SAJA di awal aplikasi
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 
});

// 1. Inisialisasi SDK Discord tetap di paling atas
const discordSdk = new window.DiscordSDK.DiscordSDK({
  client_id: '1514355349132415181' // Pastikan ini Client ID aslimu
});

// 2. Fungsi setup Discord yang aman untuk GitHub Pages
async function setupDiscordActivity() {
  try {
    // Menunggu SDK siap (Wajib agar halaman tidak di-block Discord)
    await discordSdk.ready();
    console.log("Discord Activity siap!");
    
    // Aktifkan fungsi klik tombol setelah Discord SDK siap
    aktifkanTombol();

  } catch (error) {
    console.error("Gagal terhubung ke Discord SDK:", error);
    // Jika Discord SDK gagal/error, tombol tetap diaktifkan sebagai backup
    aktifkanTombol();
  }
}

// 3. Fungsi khusus untuk mengurus tombol "Mulai Petualangan"
function aktifkanTombol() {
  const tombolMulai = document.querySelector('button'); 
  // ⚠️ CATATAN: Ganti 'button' di atas dengan class/id tombolmu jika ada, 
  // contoh: document.getElementById('id-tombol-kamu') atau document.querySelector('.class-tombol')

  if (tombolMulai) {
    tombolMulai.addEventListener('click', () => {
      console.log("Tombol berhasil diklik!");
      
      // Masukkan aksi pindah halaman atau jalankan musikmu di sini, contoh:
      // window.location.href = 'halaman_utama.html'; 
      // Atau panggil fungsi dari home.js / anthem.js kamu
    });
  }
}

// Jalankan fungsi saat halaman selesai dimuat
window.addEventListener('DOMContentLoaded', setupDiscordActivity);
