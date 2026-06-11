// ==================================================================
// 1. IMPORT MODUL HALAMAN
// ==================================================================
import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';

const discordSdk = window.DiscordSDK
  ? new window.DiscordSDK.DiscordSDK({
      clientId: "1514355349132415181"
    })
  : null;
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

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page'); 
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
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

        // AMANKAN ELEMEN GAME SUPPORT
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
            if (bgOverlay) bgOverlay.style.display = 'none';
        }
    });
});

// ==================================================================
// 4. LOAD AWAL APLIKASI (INITIALIZATION)
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 ThroveXyra App Main Controller Loaded");
    
    // Set tampilan awal halaman utama
    pages.forEach(page => {
        if (page.id === 'page-home' || page.id === 'home') {
            page.classList.add('active-page');
            page.style.display = 'block';
        } else {
            page.classList.remove('active-page');
            page.style.display = 'none';
        }
    });

    // PENGAMAN OVERLAY: Paksa buang overlay jika tombol diklik langsung
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const btnEnterApp = document.getElementById('btn-enter-app');
    if (btnEnterApp && welcomeOverlay) {
        btnEnterApp.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("🎯 Overlay dibuka paksa lewat interaksi user.");
            welcomeOverlay.style.display = 'none';
        });
    }

    // Jalankan pemicu modul-modul halaman bawaan kamu
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 

    // Panggil mesin otentikasi lengkap Discord secara non-blocking
    aktifkanDiscordActivity();
});

// Fungsi Otentikasi Resmi Dua Tahap Discord SDK (Sangat Direkomendasikan)
async function aktifkanDiscordActivity() {
    if (!discordSdk) return;

    try {
        await discordSdk.ready();
        console.log("Discord SDK Ready");
    } catch (err) {
        console.log(err);
    }
}
