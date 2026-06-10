// ==================================================================
// 1. IMPORT MODUL HALAMAN & INITIALIZE DISCORD SDK
// ==================================================================
import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';

// Inisialisasi Discord SDK di paling atas agar aplikasi dikenali oleh Discord
const discordSdk = new window.DiscordSDK.DiscordSDK({
  client_id: '1514355349132415181' // ⚠️ GANTI PAKAI CLIENT ID DARI DEVELOPER PORTAL KAMU
});

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
// 4. LOAD AWAL APLIKASI (INITIALIZATION) + DISCORD SDK READY
// ==================================================================
document.addEventListener('DOMContentLoaded', async () => {
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

    // MASUKKAN LOGIKA DISCORD SDK DI SINI
    try {
        // Beritahu Discord bahwa aplikasi kita sudah siap dimuat
        await discordSdk.ready();
        console.log("✅ Discord SDK Is Ready! Tombol-tombol sekarang bisa diklik.");
    } catch (error) {
        console.error("❌ Gagal memuat Discord SDK (Mungkin dibuka di luar Discord):", error);
    }

    // Jalankan load data awal untuk masing-masing modul setelah SDK siap
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 
});
