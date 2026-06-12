import { initHome } from './modules/home.js';
import { initGameSupport } from './modules/gameSupport.js';
import { initAnthem } from './modules/anthem.js';
import { initWutheringWaves } from './modules/wuthering.js'; // 🔥 Tambah ini
import { initNTE } from './modules/nte.js';                  // 🔥 Tambah ini

// Konfigurasi OAuth2 Discord Web Standar
const CLIENT_ID = "1514501983728304228";
// Mengambil URL asal secara otomatis (misal: http://127.0.0.1:5500/index.html)
const REDIRECT_URI = "https://throvities.vercel.app/"; 
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;

// Inisialisasi Discord SDK untuk Activity
let discordSdk = null;
if (window.discordSdk) {
    discordSdk = new window.discordSdk.DiscordSDK(CLIENT_ID);
}

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

        // ==================================================================
        // 🔥 AMANKAN ELEMEN GAME SUPPORT (VALORANT, WUWA, & NTE)
        // ==================================================================
        const mainSelection = document.querySelector('.game-main-selection');
        const valorantDetail = document.getElementById('valorant-detail-view');
        const valorantRoulette = document.getElementById('valorant-roulette-content');
        const valorantMgmt = document.getElementById('valorant-management-content');
        
        // Ambil selektor WuWa dan NTE yang tadi kelupaan:
        const wuwaDetail = document.getElementById('wuwa-detail-view');
        const nteDetail = document.getElementById('nte-detail-view');

        if (targetPage === 'game-support') {
            // Jika masuk ke menu game, kembalikan ke grid pilihan utama
            if (mainSelection) mainSelection.classList.remove('hidden');
            if (valorantMgmt) valorantMgmt.classList.remove('hidden');
            
            // Paksa sembunyikan semua sub-halaman detail agar tidak bentrok render
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (wuwaDetail) wuwaDetail.classList.add('hidden');
            if (nteDetail) nteDetail.classList.add('hidden');
        } else {
            // Jika pindah ke page lain (Library, Anthem, dll), SEMUA harus sembunyi total!
            if (mainSelection) mainSelection.classList.add('hidden');
            if (valorantDetail) valorantDetail.classList.add('hidden');
            if (valorantRoulette) valorantRoulette.classList.add('hidden');
            if (valorantMgmt) valorantMgmt.classList.add('hidden');
            if (wuwaDetail) wuwaDetail.classList.add('hidden');
            if (nteDetail) nteDetail.classList.add('hidden');

            document.body.style.overflow = 'auto'; // Mengembalikan scrollbar bawaan
        }
        resetGameSubPages();
    });
});

// Buat fungsi pembantu di bagian bawah app.js untuk membersihkan sisa page game
function resetGameSubPages() {
    const mainSelection = document.querySelector('.game-main-selection');
    const wuwaDetailView = document.getElementById('wuwa-detail-view');
    const nteDetailView = document.getElementById('nte-detail-view');

    // Kembalikan grid pilihan game utama
    if (mainSelection) {
        mainSelection.classList.remove('hidden');
    }
    // Paksa sembunyikan semua detail view game yang masih melorot terbuka
    if (wuwaDetailView) {
        wuwaDetailView.classList.add('hidden');
    }
    if (nteDetailView) {
        nteDetailView.classList.add('hidden');
    }
}

// ==================================================================
// 4. LOAD AWAL APLIKASI & CEK RESPONSE TOKEN DISCORD
// ==================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 ThroveXyra Web App Loaded");
    
    // Cek koneksi Discord Activity
    if (discordSdk) {
        try {
            await discordSdk.ready();
            console.log("🎮 [ACTIVITY] Sukses terkoneksi ke Discord Activity!");
        } catch (error) {
            console.log("🌐 [WEB] Berjalan di browser biasa.");
        }
    }
    
    // Panggil stats server Discord otomatis
    updateServerStatsOtomatis();
    
    // Cek apakah ada Token hasil redirect dari Discord di URL hash (#access_token=...)
    const accessToken = ambilTokenDariHash();

    if (accessToken) {
        if (btnEnterApp) btnEnterApp.innerHTML = `<span>Menghubungkan Akun...</span> <i class="fas fa-spinner fa-spin"></i>`;
        
        // Ambil data profil asli dari Discord menggunakan token tersebut
        const userBerhasilLogin = await loginPakeDiscordWeb(accessToken);
        if (userBerhasilLogin) {
            isLoggedIn = true;
            if (welcomeOverlay) welcomeOverlay.style.display = 'none';
            
            // 🔥 Putar lagu otomatis setelah user baru sukses login dari Discord
            pemicuAutoplayMusic();
        } else {
            if (btnEnterApp) btnEnterApp.innerHTML = `<span>Mulai Petualangan</span> <i class="fas fa-chevron-right"></i>`;
            alert("Sesi login Discord kadaluarsa atau gagal. Silakan coba lagi.");
        }
    } else if (isLoggedIn) {
        // Jika user sebelumnya sudah pernah login (tersimpan di localStorage)
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
        const savedName = localStorage.getItem('discord_username');
        const savedAvatar = localStorage.getItem('discord_avatar');
        if (savedName) document.querySelector('.top-bar-right .username').innerText = savedName;
        if (savedAvatar) document.querySelector('.top-bar-right .avatar').src = savedAvatar;
        
        // 🔥 Putar lagu otomatis jika user buka web dan kondisinya sudah auto-login
        pemicuAutoplayMusic();
    } else {
        // Belum login sama sekali, tampilkan overlay utama
        if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
    }

    // Set layout halaman awal ke Home
    pages.forEach(page => {
        if (page.id === 'page-home' || page.id === 'home') {
            page.classList.add('active-page');
            page.style.display = 'block';
        } else {
            page.classList.remove('active-page');
            page.style.display = 'none';
        }
    });

    // Aksi Tombol Mulai Petualangan -> Mendukung Web Browser & Discord Activity
    if (btnEnterApp) {
        btnEnterApp.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // 🎮 JIKA DIBUKA DI DALAM DISCORD ACTIVITY (Voice Channel)
            if (discordSdk && window.self !== window.top) {
                console.log("🎮 Memulai Autentikasi di dalam Discord Activity...");
                try {
                    btnEnterApp.innerHTML = `<span>Menghubungkan...</span> <i class="fas fa-spinner fa-spin"></i>`;
                    
                    // Minta izin login otomatis lewat pop-up internal Discord
                    const auth = await discordSdk.commands.authorize({
                        client_id: CLIENT_ID,
                        response_type: "code",
                        state: "1",
                        prompt: "none",
                        scope: ["identify", "guilds"],
                    });
                    
                    console.log("🟢 Login Activity Sukses!");
                    isLoggedIn = true;
                    if (welcomeOverlay) welcomeOverlay.style.display = 'none';
                    
                    // Putar lagu otomatis
                    pemicuAutoplayMusic();
                    
                } catch (error) {
                    console.error("❌ Gagal login di Activity:", error);
                    btnEnterApp.innerHTML = `<span>Mulai Petualangan</span> <i class="fas fa-chevron-right"></i>`;
                    alert("Gagal terhubung dengan Discord Activity.");
                }
                return;
            }

            // 🌐 JIKA DIBUKA DI WEB BROWSER BIASA
            console.log("✈️ Mengalihkan ke Halaman Autentikasi Resmi Discord...");
            window.location.href = DISCORD_AUTH_URL;
        });
    }

    // LOGIKA DROPDOWN PROFIL (Klik foto profil)
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
            console.log("🚪 User logged out.");
            
            localStorage.removeItem('discord_logged_in');
            localStorage.removeItem('discord_username');
            localStorage.removeItem('discord_avatar');
            isLoggedIn = false;

            document.querySelector('.top-bar-right .username').innerText = "Loading...";
            document.querySelector('.top-bar-right .avatar').src = "https://cdn.discordapp.com/embed/avatars/0.png";

            if (profileDropdown) profileDropdown.style.display = 'none';
            if (welcomeOverlay) {
                welcomeOverlay.style.display = 'flex';
                if (btnEnterApp) btnEnterApp.innerHTML = `<span>Mulai Petualangan</span> <i class="fas fa-chevron-right"></i>`;
            }
        });
    }
    if (typeof initHome === 'function') initHome();
    if (typeof initGameSupport === 'function') initGameSupport();
    if (typeof initAnthem === 'function') initAnthem(); 
    if (typeof initWutheringWaves === 'function') initWutheringWaves(); // 🔥 Jalankan WuWa
    if (typeof initNTE === 'function') initNTE();                       // 🔥 Jalankan NTE
});

// ==================================================================
// 5. HELPER FUNCTIONS UNTUK OAUTH2 DISCORD WEB
// ==================================================================

// Ekstrak token dari URL belakang hash (#access_token=xxxx)
function ambilTokenDariHash() {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        if (token) {
            // Bersihkan hash di address bar biar URL kembali bersih dan rapi
            window.history.replaceState({}, document.title, window.location.pathname);
            return token;
        }
    }
    return null;
}

// Tembak langsung ke API server Discord untuk ambil profil User asli
async function loginPakeDiscordWeb(token) {
    try {
        const response = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Gagal menarik data user dari API Discord");
        }

        const userData = await response.json();
        console.log("🎯 Berhasil mendapatkan data user asli:", userData);

        const username = userData.username;
        const userId = userData.id;
        const avatarId = userData.avatar;

        let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
        if (avatarId) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=64`;
        }

        // Tampilkan ke DOM Kanan Atas
        document.querySelector('.top-bar-right .username').innerText = username;
        document.querySelector('.top-bar-right .avatar').src = avatarUrl;

        // Simpan sesi ke LocalStorage
        localStorage.setItem('discord_logged_in', 'true');
        localStorage.setItem('discord_username', username);
        localStorage.setItem('discord_avatar', avatarUrl);

        return true;
    } catch (error) {
        console.error("❌ Terjadi kesalahan OAuth2:", error);
        return false;
    }
}

// ==================================================================
// 6. AUTO FETCH DATA DISCORD - SEJAJAR & HORIZONTAL STYLE
// ==================================================================
async function updateServerStatsOtomatis() {
    const KODE_INVITE_SERVER = "ckaendJ56V"; 

    try {
        const response = await fetch(`https://discord.com/api/v10/invites/${KODE_INVITE_SERVER}?with_counts=true`);
        if (!response.ok) throw new Error("Gagal fetch data dari Discord.");

        const data = await response.json();
        
        const totalMembers = data.approximate_member_count || 0; 
        const onlineNow = data.approximate_presence_count || 0; 

        // Tembak langsung ke class count masing-masing
        const txtTotalCount = document.querySelector('.stat-pill.members-total .stat-count');
        const txtOnlineCount = document.querySelector('.stat-pill.members-online .stat-count');

        if (txtTotalCount) txtTotalCount.innerText = totalMembers;
        if (txtOnlineCount) txtOnlineCount.innerText = onlineNow;

        console.log(`🟢 [UI REFRESH] Row layout terisi! Total: ${totalMembers} | Online: ${onlineNow}`);

    } catch (error) {
        console.error("❌ Gagal memperbarui data statistik:", error);
    }
}

// ==================================================================
// 7. 🔥 PEMICU AUTOPLAY MUSIC SETELAH LOGIN
// ==================================================================
function pemicuAutoplayMusic() {
    setTimeout(() => {
        // Otomatis mencari tombol putar musik di widget bubble kamu
        const tombolPlay = document.querySelector('.play-btn') || 
                           document.getElementById('btn-play') || 
                           document.querySelector('.fa-play') ||
                           document.getElementById('bubble-toggle-expand');
        
        if (tombolPlay) {
            tombolPlay.click(); // Klik otomatis lewat sistem
            console.log("🎵 [AUTOPLAY] Login aktif, lagu berhasil dipicu otomatis!");
        } else {
            console.warn("⚠️ Tombol musik tidak ditemukan, pastikan class/id tombol play kamu sesuai.");
        }
    }, 600); // Jeda 0.6 detik agar modul musik siap diputar
}
