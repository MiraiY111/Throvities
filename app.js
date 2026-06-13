// ==================================================================
// 1. IMPORT MODUL UTAMA & DISCORD SDK LOKAL
// ==================================================================
// 🟢 PERBAIKAN: Gunakan { DiscordSDK }
import { DiscordSDK } from 'https://cdn.jsdelivr.net/npm/@discord/embedded-app-sdk@2.5.0/+esm';
import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';
import { initWutheringWaves } from './modules/wuthering.js';
import { initNTE } from './modules/nte.js';

const CLIENT_ID = "1514501983728304228";
const REDIRECT_URI = "https://throvities.vercel.app/"; 
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;

// 🟢 PERBAIKAN: Masukkan ke dalam objek { clientId: ... }
let discordInstance = null;


// ==================================================================
// 2. SELEKTOR ELEMEN UTAMA & SIDEBAR
// ==================================================================
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-btn');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page-section');

const userProfileTrigger = document.getElementById('user-profile-trigger');
const profileDropdown = document.getElementById('profile-dropdown');
const btnLogout = document.getElementById('btn-logout');
const welcomeOverlay = document.getElementById('welcome-overlay');
const btnEnterApp = document.getElementById('btn-enter-app');

let isLoggedIn = localStorage.getItem('discord_logged_in') === 'true';

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
        if (!isLoggedIn) {
            alert("Kamu harus melakukan autentikasi Discord terlebih dahulu!");
            return;
        }

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
        
        const wuwaDetail = document.getElementById('wuwa-detail-view');
        const nteDetail = document.getElementById('nte-detail-view');

        if (targetPage === 'game-support') {
            if (mainSelection) mainSelection.classList.remove('hidden');
            if (valorantMgmt) valorantMgmt.classList.remove('hidden');
            
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (wuwaDetail) wuwaDetail.classList.add('hidden');
            if (nteDetail) nteDetail.classList.add('hidden');
        } else {
            if (mainSelection) mainSelection.classList.add('hidden');
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (valorantMgmt) valorantMgmt.classList.add('hidden');
            if (wuwaDetail) wuwaDetail.classList.add('hidden');
            if (nteDetail) nteDetail.classList.add('hidden');

            document.body.style.overflow = 'auto';
        }
        resetGameSubPages();
    });
});

function resetGameSubPages() {
    const mainSelection = document.querySelector('.game-main-selection');
    const wuwaDetailView = document.getElementById('wuwa-detail-view');
    const nteDetailView = document.getElementById('nte-detail-view');

    if (mainSelection) mainSelection.classList.remove('hidden');
    if (wuwaDetailView) wuwaDetailView.classList.add('hidden');
    if (nteDetailView) nteDetailView.classList.add('hidden');
}

// ==================================================================
// 4. LOAD AWAL APLIKASI & PEMBAGIAN JALUR LOGIN (WEB VS DISCORD SDK)
// ==================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 ThroveXyra Web App Loaded dengan integrasi Discord SDK");
    
    const params = new URLSearchParams(window.location.search);
    // Deteksi apakah web dibuka di dalam iframe Discord Activity
    const isDiscordActivity = (window.self !== window.top) || params.has('frame_id');

    // --------------------------------------------------------------
    // KONDISI A: JALUR UTAMA (DI DALAM DISCORD ACTIVITY GAME/APP)
    // --------------------------------------------------------------
    if (isDiscordActivity) {
        console.log("🎮 [AUTO-LOGIN] Menggunakan jalur Discord Embedded App SDK...");
        if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
        if (btnEnterApp) btnEnterApp.innerHTML = `<span>Memuat Profil Discord...</span> <i class="fas fa-spinner fa-spin"></i>`;
        
        await loginPakeDiscordSDK();
    } 
    // --------------------------------------------------------------
    // KONDISI B: JALUR ALTERNATIF (DI BROWSER BIASA / CHROME / SAFARI)
    // --------------------------------------------------------------
    else {
        console.log("🌐 Jalur Web Browser Standar Aktif.");
        const accessToken = ambilTokenDariHash();

        if (accessToken) {
            if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
            if (btnEnterApp) btnEnterApp.innerHTML = `<span>Menghubungkan Akun...</span> <i class="fas fa-spinner fa-spin"></i>`;
            
            const userBerhasilLogin = await loginPakeDiscordWeb(accessToken);
            if (userBerhasilLogin) {
                isLoggedIn = true;
                if (welcomeOverlay) welcomeOverlay.style.display = 'none';
                pemicuAutoplayMusic();
            } else {
                if (btnEnterApp) btnEnterApp.innerHTML = `<span>Mulai Petualangan</span> <i class="fas fa-chevron-right"></i>`;
                alert("Sesi login Discord kadaluarsa. Silakan coba lagi.");
            }
        } 
        else if (isLoggedIn) {
            if (welcomeOverlay) welcomeOverlay.style.display = 'none';
            const savedName = localStorage.getItem('discord_username');
            const savedAvatar = localStorage.getItem('discord_avatar');
            if (savedName) document.querySelector('.top-bar-right .username').innerText = savedName;
            if (savedAvatar) document.querySelector('.top-bar-right .avatar').src = savedAvatar;
            pemicuAutoplayMusic();
        } 
        else {
            if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
        }

        // Tombol manual klik hanya berfungsi di browser biasa
        if (btnEnterApp) {
            btnEnterApp.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("✈️ Mengalihkan ke Halaman Autentikasi Resmi Discord...");
                window.location.href = DISCORD_AUTH_URL;
            });
        }
    }
    
    // Sinkronisasi komponen server & layout
    updateServerStatsOtotatis();

    pages.forEach(page => {
        if (page.id === 'page-home' || page.id === 'home') {
            page.classList.add('active-page');
            page.style.display = 'block';
        } else {
            page.classList.remove('active-page');
            page.style.display = 'none';
        }
    });

    // LOGIKA DROPDOWN PROFIL
    if (userProfileTrigger && profileDropdown) {
        userProfileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.classList.contains('hidden-dropdown') || profileDropdown.style.display === 'none';
            if (isHidden) {
                profileDropdown.classList.remove('hidden-dropdown');
                profileDropdown.style.display = 'block';
            } else {
                profileDropdown.classList.add('hidden-dropdown');
                profileDropdown.style.display = 'none';
            }
        });

        document.addEventListener('click', () => {
            if (profileDropdown) {
                profileDropdown.classList.add('hidden-dropdown');
                profileDropdown.style.display = 'none';
            }
        });
    }

    // LOGIKA LOG OUT
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("🚪 User melakukan logout.");
            
            localStorage.removeItem('discord_logged_in');
            localStorage.removeItem('discord_username');
            localStorage.removeItem('discord_avatar');
            isLoggedIn = false;

            if (profileDropdown) {
                profileDropdown.classList.add('hidden-dropdown');
                profileDropdown.style.display = 'none';
            }

            window.location.reload();
        });
    }

    // Inisialisasi modul halaman lainnya
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 
    if (typeof initWutheringWaves === 'function') initWutheringWaves();
    if (typeof initNTE === 'function') initNTE();
});

// ==================================================================
// 5. HELPER FUNCTIONS UTAMA (AUTENTIKASI & SERVERSIDE STATS)
// ==================================================================

// Jalur Pengambilan Login Otomatis khusus Discord Activity (SDK)
async function loginPakeDiscordSDK() {
    // Di dalam fungsi loginPakeDiscordSDK
    try {
        discordInstance = new DiscordSDK({ clientId: CLIENT_ID }); // <-- Langsung timpa nilainya   
        
        // Baru jalankan ready()
        await discordInstance.ready();
        
        const { code } = await discordInstance.commands.authorize({
            client_id: CLIENT_ID,
            response_type: 'code',
            state: '',
            prompt: 'none',
            scope: ['identify', 'guilds']
        });

        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const { access_token } = await response.json();
        const auth = await discordInstance.commands.authenticate({ access_token });
        
        document.querySelector('.top-bar-right .username').innerText = auth.user.username;
        document.querySelector('.top-bar-right .avatar').src = auth.user.avatar 
            ? `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=64`
            : "https://cdn.discordapp.com/embed/avatars/0.png";

        isLoggedIn = true;
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
        pemicuAutoplayMusic();

    } catch (error) {
        // 🟢 KODE AMAN: Kalau kamu tes di browser biasa pakai ?frame_id=1, 
        // error "instance_id is not defined" akan lari ke sini dan tidak bikin web nge-blank!
        console.error("❌ Kegagalan fatal otentikasi Discord SDK:", error);
        
        if (btnEnterApp) {
            btnEnterApp.innerHTML = `<span>Mulai Petualangan (Web Fallback)</span> <i class="fas fa-chevron-right"></i>`;
            
            btnEnterApp.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("✈️ Mengalihkan ke Halaman Autentikasi Resmi Discord...");
                window.location.href = DISCORD_AUTH_URL;
            });
        }
    }
}

// Jalur Hash token untuk Browser biasa
function ambilTokenDariHash() {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        if (token) {
            window.history.replaceState({}, document.title, window.location.pathname);
            return token;
        }
    }
    return null;
}

// Mengambil data pengguna manual untuk Browser biasa
async function loginPakeDiscordWeb(token) {
    try {
        const response = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Gagal menarik data user dari API Discord");

        const userData = await response.json();
        console.log("🎯 Berhasil mendapatkan data user asli:", userData);

        const username = userData.username;
        const userId = userData.id;
        const avatarId = userData.avatar;

        let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
        if (avatarId) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=64`;
        }

        document.querySelector('.top-bar-right .username').innerText = username;
        document.querySelector('.top-bar-right .avatar').src = avatarUrl;

        localStorage.setItem('discord_logged_in', 'true');
        localStorage.setItem('discord_username', username);
        localStorage.setItem('discord_avatar', avatarUrl);

        return true;
    } catch (error) {
        console.error("❌ Terjadi kesalahan OAuth2:", error);
        return false;
    }
}

async function updateServerStatsOtotatis() {
    const KODE_INVITE_SERVER = "ckaendJ56V"; 

    try {
        const response = await fetch(`https://discord.com/api/v10/invites/${KODE_INVITE_SERVER}?with_counts=true`);
        if (!response.ok) throw new Error("Gagal fetch data dari Discord.");

        const data = await response.json();
        
        const totalMembers = data.approximate_member_count || 0; 
        const onlineNow = data.approximate_presence_count || 0; 

        const txtTotalCount = document.querySelector('.stat-pill.members-total .stat-count');
        const txtOnlineCount = document.querySelector('.stat-pill.members-online .stat-count');

        if (txtTotalCount) txtTotalCount.innerText = totalMembers;
        if (txtOnlineCount) txtOnlineCount.innerText = onlineNow;

        console.log(`🟢 [UI REFRESH] Row layout terisi! Total: ${totalMembers} | Online: ${onlineNow}`);

    } catch (error) {
        console.error("❌ Gagal memperbarui data statistik:", error);
    }
}

function pemicuAutoplayMusic() {
    setTimeout(() => {
        const tombolPlay = document.querySelector('.play-btn') || 
                           document.getElementById('btn-play') || 
                           document.querySelector('.fa-play') ||
                           document.getElementById('bubble-toggle-expand');
        
        if (tombolPlay) {
            tombolPlay.click(); 
            console.log("🎵 [AUTOPLAY] Musik berhasil dipicu lewat klik murni!");
        } else {
            console.warn("⚠️ Tombol musik tidak ditemukan, pastikan class/id tombol play kamu sesuai.");
        }
    }, 100);
}
