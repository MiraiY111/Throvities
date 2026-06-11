// ==================================================================
// 1. IMPORT MODUL HALAMAN
// ==================================================================
// ==================================================================
// 1. IMPORT MODUL HALAMAN
// ==================================================================
import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';

// HAPUS IMPORT "@discord/embedded-app-sdk" YANG LAMA
// GANTI DENGAN ATURAN DI BAWAH INI:
const discordSdk = window.discordSdk && window.discordSdk.DiscordSDK 
    ? new window.discordSdk.DiscordSDK({ clientId: "1514355349132415181" }) 
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


    // Jalankan pemicu modul-modul halaman bawaan kamu
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 

    // Panggil mesin otentikasi lengkap Discord secara non-blocking
    aktifkanDiscordActivity();
});

// Gantilah fungsi aktifkanDiscordActivity() bawaan kamu dengan versi lengkap ini:
async function aktifkanDiscordActivity() {
    if (!discordSdk) {
        console.log("⚠️ Aplikasi tidak berjalan di dalam lingkungan Discord.");
        return;
    }

    try {
        // 1. Tunggu hingga SDK siap berkomunikasi dengan Client Discord
        await discordSdk.ready();
        console.log("✅ Discord SDK Ready");

        // 2. Lakukan otentikasi OAuth2 (Minta izin scope 'identify')
        const { code } = await discordSdk.commands.authorize({
            client_id: "1514355349132415181", // Client ID dari app.js kamu
            response_type: "code",
            state: "",
            prompt: "none",
            scope: ["identify"],
        });

        // 3. Tukarkan 'code' dengan access_token via Backend Server kamu.
        //    (Di bawah ini adalah endpoint standar jika kamu pakai template Node.js/Vercel bawaan Discord)
        const response = await fetch("/.proxy/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        });
        
        const { access_token } = await response.json();

        // 4. Authenticate menggunakan token yang didapat
        const auth = await discordSdk.commands.authenticate({
            access_token,
        });

        if (auth && auth.user) {
            console.log(`🎯 Berhasil Login sebagai: ${auth.user.username}`);
            
            // 5. Ambil data User (Nama & ID Avatar)
            const username = auth.user.username;
            const userId = auth.user.id;
            const avatarId = auth.user.avatar;

            // 6. Buat URL Foto Profil asli Discord
            // Jika user tidak punya avatar, berikan avatar default Discord
            let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
            if (avatarId) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=64`;
            }

            // 7. Tembakkan langsung ke DOM HTML (Mengisi bagian kanan atas)
            const txtUsername = document.querySelector('.top-bar-right .username');
            const imgAvatar = document.querySelector('.top-bar-right .avatar');

            if (txtUsername) txtUsername.innerText = username;
            if (imgAvatar) imgAvatar.src = avatarUrl;
        }

    } catch (error) {
        console.error("❌ Gagal menginisialisasi Discord Activity:", error);
    }
}
