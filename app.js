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

const RPC = require('discord-rpc');
const clientId = 'MASUKKAN_CLIENT_ID_KAMU';
const client = new RPC.Client({ transport: 'ipc' });

client.on('ready', () => {
    console.log('Discord RPC Berhasil Terhubung!');
    client.setActivity({
        details: 'Listening to Tracks',
        state: 'ThroveXyra Gate',
        largeImageKey: 'valorant', // Harus di-upload dulu di Developer Portal Asset
        largeImageText: 'Valo Activities',
        instance: false,
    });
});

client.login({ clientId }).catch(console.error);