// modules/gameSupport.js
import { db, collection, onSnapshot, deleteDoc, doc, setDoc, getDoc, addDoc } from './firebase.js';

// ==================================================================
// DATA & STATE KHUSUS GAME SUPPORT
// ==================================================================
export const valorantAgents = [
    // Duelist
    { name: 'Jett', url: 'Agent-Profile/Jett.png', role: 'Duelist' },
    { name: 'Phoenix', url: 'Agent-Profile/Phoenix.png', role: 'Duelist' },
    { name: 'Raze', url: 'Agent-Profile/Raze.png', role: 'Duelist' },
    { name: 'Reyna', url: 'Agent-Profile/Reyna.png', role: 'Duelist' },
    { name: 'Yoru', url: 'Agent-Profile/Yoru.png', role: 'Duelist' },
    { name: 'Neon', url: 'Agent-Profile/Neon.png', role: 'Duelist' },
    { name: 'Iso', url: 'Agent-Profile/Iso.png', role: 'Duelist' },
    { name: 'Waylay', url: 'Agent-Profile/Waylay.png', role: 'Duelist' },
    // Initiator
    { name: 'Sova', url: 'Agent-Profile/Sova.png', role: 'Initiator' },
    { name: 'Breach', url: 'Agent-Profile/Breach.png', role: 'Initiator' },
    { name: 'Skye', url: 'Agent-Profile/Skye.png', role: 'Initiator' },
    { name: 'Fade', url: 'Agent-Profile/Fade.png', role: 'Initiator' },
    { name: 'KAY/O', url: 'Agent-Profile/KAYO.png', role: 'Initiator' },
    { name: 'Gekko', url: 'Agent-Profile/Gekko.png', role: 'Initiator' },
    { name: 'Tejo', url: 'Agent-Profile/Tejo.png', role: 'Initiator' },
    // Controller
    { name: 'Brimstone', url: 'Agent-Profile/Brimstone.png', role: 'Controller' },
    { name: 'Omen', url: 'Agent-Profile/Omen.png', role: 'Controller' },
    { name: 'Viper', url: 'Agent-Profile/Viper.png', role: 'Controller' },
    { name: 'Astra', url: 'Agent-Profile/Astra.png', role: 'Controller' },
    { name: 'Harbor', url: 'Agent-Profile/Harbor.png', role: 'Controller' },
    { name: 'Clove', url: 'Agent-Profile/Clove.png', role: 'Controller' },
    { name: 'Miks', url: 'Agent-Profile/Miks.png', role: 'Controller' },
    // Sentinel
    { name: 'Cypher', url: 'Agent-Profile/Cypher.png', role: 'Sentinel' },
    { name: 'Killjoy', url: 'Agent-Profile/Killjoy.png', role: 'Sentinel' },
    { name: 'Sage', url: 'Agent-Profile/Sage.png', role: 'Sentinel' },
    { name: 'Chamber', url: 'Agent-Profile/Chamber.png', role: 'Sentinel' },
    { name: 'Deadlock', url: 'Agent-Profile/Deadlock.png', role: 'Sentinel' },
    { name: 'Vyse', url: 'Agent-Profile/Vyse.png', role: 'Sentinel' },
    { name: 'Veto', url: 'Agent-Profile/Veto.png', role: 'Sentinel' }
];
// ==================================================================
// ATURAN PROPORSI ROLE (VERSI UPDATE: NO DUPLICATE & 3 MODES)
// ==================================================================
const compositionRules = {
    "Normal Line Up": {
        "Duelist": 2,
        "Sentinel": 1,
        "Controller": 1,
        "Initiator": 1
    }
};

function getProportionalComposition(filterName) {
    let poolTeam = [];
    // Buat salinan daftar agen agar proses pengacakan tidak merusak data utama
    let dynamicAgents = [...valorantAgents];

    // MENCARI TAHU MODE JIKA FILTER BUKAN 'normal'
    // 1. MODE: 5 PLAYER DENGAN ROLE YANG SAMA (TAPI VALUENE ACAK)
    if (filterName === 'same-role') {
        const allRoles = ["Duelist", "Sentinel", "Controller", "Initiator"];
        // Pilih 1 role acak untuk dipakai oleh kelima player
        const chosenSharedRole = allRoles[Math.floor(Math.random() * allRoles.length)];
        
        // Ambil semua agen yang rolenya sama, acak, lalu ambil 5 biji (tanpa duplikat)
        const availableByRole = dynamicAgents.filter(a => a.role === chosenSharedRole);
        const shuffled = availableByRole.sort(() => 0.5 - Math.random());
        poolTeam = shuffled.slice(0, 5);
        
        return poolTeam; // Langsung kembalikan hasil tim 5 role kembar
    }

    // 2. MODE: BENER-BENER ACAK APA PUN ITU (PURE RANDOM DAN NO DUPLICATE)
    // 2. MODE: BENER-BENER ACAK APA PUN ITU (DENGAN BATAS MAKSIMAL 2 DUELIST)
    if (filterName === 'pure-random') {
        // Acak urutan seluruh agen secara total terlebih dahulu
        const shuffledAll = dynamicAgents.sort(() => 0.5 - Math.random());
        let duelistCount = 0;

        for (let i = 0; i < shuffledAll.length; i++) {
            const currentAgent = shuffledAll[i];

            // Jika agen yang terambil adalah Duelist, cek apakah kuota duelist sudah penuh (maks 2)
            if (currentAgent.role === 'Duelist') {
                if (duelistCount < 2) {
                    poolTeam.push(currentAgent);
                    duelistCount++; // Tambah hitungan duelist yang masuk tim
                }
                // Jika sudah ada 2 duelist di tim, agen duelist ini akan di-skip/dilewati
            } else {
                // Jika rolenya Sentinel/Controller/Initiator, langsung masukkan tanpa batas
                poolTeam.push(currentAgent);
            }

            // Jika sudah terkumpul 5 agen yang pas dan memenuhi syarat, hentikan pencarian
            if (poolTeam.length === 5) {
                break;
            }
        }

        // Acak ulang susunan tim finalnya agar posisinya tidak ketahuan
        return poolTeam.sort(() => 0.5 - Math.random());
    }

    // 3. MODE BAWAAN: NORMAL LINE UP (2 Duel, 1 Sen, 1 Con, 1 Init) + LOCK NO DUPLICATE
    const rule = compositionRules["Normal Line Up"];
    for (const [role, count] of Object.entries(rule)) {
        // Ambil agen berdasarkan role dari sisa agen yang belum terpakai player lain
        const availableByRole = dynamicAgents.filter(a => a.role === role);
        const shuffled = availableByRole.sort(() => 0.5 - Math.random());
        
        // Ambil sebanyak kuota role
        const selected = shuffled.slice(0, count);
        poolTeam.push(...selected);
        
        // KUNCI: Hapus agen yang sudah terpilih dari daftar agar tidak kembar di slot berikutnya
        selected.forEach(chosen => {
            dynamicAgents = dynamicAgents.filter(a => a.name !== chosen.name);
        });
    }
    
    // Acak urutan hasil gabungan role agar posisi slotnya bervariasi
    return poolTeam.sort(() => 0.5 - Math.random());
}
let cachedPlayersList = []; 
let activeTargetSlotIndex = null; 
let selectedTeamSlots = [null, null, null, null, null]; 
let isLocalSpinning = false;

const HENRIK_API_KEY = "HDEV-0281ca11-9515-436e-9407-30bc7be2b227"; 
const REGION = "ap"; 

let activePlayerId = null;
let activePlayerName = "";
let activePlayerTag = "";
let selectedAvatarUrl = "";

// ==================================================================
// SELEKTOR DOM ELEMEN GAME SUPPORT
// ==================================================================
const gameMainSelection = document.querySelector('.game-main-selection'); 
const valorantDetailView = document.getElementById('valorant-detail-view'); 
const valorantCard = document.querySelector('.game-selection-card[data-game="valorant"]');
const backToGamesBtn = document.querySelector('.back-to-games-btn');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const playerModal = document.getElementById('player-modal');
const addPlayerForm = document.getElementById('add-player-form');
const avatarPreview = document.getElementById('avatar-preview');
const playerCardsGrid = document.getElementById('player-cards-grid');
const zeroPlaceholder = document.getElementById('zero-player-placeholder');
const customAlertModal = document.getElementById('custom-alert-modal');
const alertModalTitle = document.getElementById('alert-modal-title');
const alertModalMessage = document.getElementById('alert-modal-message');
const alertCloseBtn = document.getElementById('alert-close-btn');
const agentPhotosSelector = document.getElementById('agent-photos-selector');
const btnLockInMain = document.getElementById('btn-lock-in-main');
const backToMgmtBtn = document.getElementById('back-to-mgmt-btn');
const valorantManagementContent = document.getElementById('valorant-management-content');
const valorantRouletteContent = document.getElementById('valorant-roulette-content');
const selectPlayerModal = document.getElementById('select-player-modal');
const closeSelectPlayerBtn = document.getElementById('close-select-player-btn');
const modalPlayersListContainer = document.getElementById('modal-players-list-container');
const btnSpinRoulette = document.getElementById('btn-spin-roulette');
const rouletteContainer = document.querySelector('.team-slots-grid') || document.querySelector('.roulette-slots-container');

const statsModal = document.getElementById('stats-modal');
const closeStatsBtn = document.getElementById('close-stats-btn');
const modalDeletePlayerBtn = document.getElementById('modal-delete-player-btn');
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmPlayerName = document.getElementById('confirm-player-name');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// ==================================================================
// FUNGSI UTAMA YANG AKAN DI-RUN SAAT APP DI-LOAD
// ==================================================================
export function initGameSupport() {
    console.log("🎮 Game Support Module Active");

    // 1. Navigation / View Transitions
    if (valorantCard) {
        valorantCard.addEventListener('click', () => {
            if (gameMainSelection) gameMainSelection.classList.add('hidden');    
            if (valorantDetailView) valorantDetailView.classList.remove('hidden'); 
            showViewSection('management');
        });
    }
    if (backToGamesBtn) {
        backToGamesBtn.addEventListener('click', () => {
            if (valorantDetailView) valorantDetailView.classList.add('hidden');    
            if (gameMainSelection) gameMainSelection.classList.remove('hidden'); 
        });
    }
    // Pastikan bagian ini ada di dalam fungsi initGameSupport() kamu:
    if (btnLockInMain) {
        btnLockInMain.addEventListener('click', () => {
            // PERBAIKAN: Cek ke cachedPlayersList (data dari koleksi players di database)
            // Pastikan variabel cachedPlayersList ini yang menampung data 5 player tersebut
            const hasRegisteredPlayers = typeof cachedPlayersList !== 'undefined' && cachedPlayersList.length > 0;
            
            if (!hasRegisteredPlayers) {
                alert("Tidak ada player terdaftar di database! Tambahkan player terlebih dahulu.");
                return;
            }

            // Sembunyikan panel management, tampilkan panel roulette
            if (valorantManagementContent) valorantManagementContent.classList.add('hidden');
            if (valorantRouletteContent) valorantRouletteContent.classList.remove('hidden');
            
            // Jalankan pengecekan ulang tombol spin begitu halaman terbuka
            validateSpinButton();
        });
    }
    if (backToMgmtBtn) backToMgmtBtn.addEventListener('click', () => showViewSection('management'));

    // 2. Avatar Selection Form
    if (openModalBtn && playerModal) {
        openModalBtn.addEventListener('click', () => playerModal.classList.remove('hidden'));
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', resetPlayerModal);
    if (avatarPreview && agentPhotosSelector) {
        avatarPreview.addEventListener('click', () => {
            if(agentPhotosSelector.classList.contains('hidden')) buildAgentGrid();
            agentPhotosSelector.classList.toggle('hidden');
        });
    }

    // 3. Stats & Alert Close Buttons
    if (closeStatsBtn) closeStatsBtn.addEventListener('click', closeStatsModal);
    if (alertCloseBtn) alertCloseBtn.addEventListener('click', () => customAlertModal.classList.add('hidden'));
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => customConfirmModal.classList.add('hidden'));

    // 4. Delete Player Action
    if (modalDeletePlayerBtn) {
        modalDeletePlayerBtn.addEventListener('click', function() {
            if (!activePlayerId) return;
            if (confirmPlayerName) confirmPlayerName.innerText = `${activePlayerName}#${activePlayerTag}`;
            if (customConfirmModal) customConfirmModal.classList.remove('hidden');
        });
    }
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (!activePlayerId) return;
            const docRef = doc(db, "players", activePlayerId);
            deleteDoc(docRef).then(() => {
                if (customConfirmModal) customConfirmModal.classList.add('hidden');
                closeStatsModal();
            }).catch((err) => {
                if (customConfirmModal) customConfirmModal.classList.add('hidden');
                showCustomAlert("Gagal Menghapus", err.message);
            });
        });
    }

    // 5. Submit New Player (Henrik API + Firestore)
    if (addPlayerForm) {
        addPlayerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const usernameInput = document.getElementById('player-username').value.trim();
            let tagInput = document.getElementById('player-tag').value.trim();
            const submitBtn = document.getElementById('btn-submit-player');

            if (tagInput.startsWith('#')) tagInput = tagInput.substring(1);
            if (!selectedAvatarUrl) { showCustomAlert("Pilih Agent", "Harap tentukan foto profil Agent lokalmu!"); return; }

            const originalBtnText = submitBtn ? submitBtn.innerHTML : "Add Player";
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Checking Duplicates...`; }

            try {
                const playersCol = collection(db, 'players');
                let isDuplicate = false;
                
                await new Promise((resolve) => {
                    const unsub = onSnapshot(playersCol, (snapshot) => {
                        unsub();
                        snapshot.forEach(doc => {
                            const ep = doc.data();
                            if (ep.username.toLowerCase() === usernameInput.toLowerCase() && ep.tag.toLowerCase() === tagInput.toLowerCase()) {
                                isDuplicate = true;
                            }
                        });
                        resolve();
                    });
                });

                if (isDuplicate) throw new Error(`Riot ID ${usernameInput}#${tagInput.toUpperCase()} sudah ada di database!`);
                if (submitBtn) submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Fetching Live MMR...`;

                const headers = HENRIK_API_KEY ? { "Authorization": HENRIK_API_KEY } : {};
                const mmrUrl = `https://api.henrikdev.xyz/valorant/v1/mmr/${REGION}/${encodeURIComponent(usernameInput)}/${encodeURIComponent(tagInput)}`;
                const response = await fetch(mmrUrl, { headers });
                const mmrData = await response.json();

                if (response.status !== 200 || !mmrData.data) throw new Error(mmrData.errors?.[0]?.message || "Gagal terkoneksi ke Henrik API");

                const currentTierString = mmrData.data.currenttierpatched || "Unrated";
                const rankingInTier = mmrData.data.ranking_in_tier !== undefined ? mmrData.data.ranking_in_tier : "0";

                let winrateResult = "50%";
                try {
                    const statsUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${REGION}/${encodeURIComponent(usernameInput)}/${encodeURIComponent(tagInput)}?size=5`;
                    const statsResponse = await fetch(statsUrl, { headers });
                    const statsData = await statsResponse.json();
                    if (statsResponse.status === 200 && statsData.data) {
                        let wins = 0, validMatches = 0;
                        statsData.data.forEach(match => {
                            if (match?.players?.all_players) {
                                const pObj = match.players.all_players.find(p => p.name.toLowerCase() === usernameInput.toLowerCase());
                                if (pObj) {
                                    const pTeam = pObj.team.toLowerCase();
                                    const winningTeam = match.teams?.red?.has_won ? 'red' : (match.teams?.blue?.has_won ? 'blue' : null);
                                    if (winningTeam) { validMatches++; if (pTeam === winningTeam) wins++; }
                                }
                            }
                        });
                        if (validMatches > 0) winrateResult = Math.round((wins / validMatches) * 100) + "%";
                    }
                } catch (err) { winrateResult = "-"; }

                const playerData = { username: usernameInput, tag: tagInput, avatar: selectedAvatarUrl, rank: currentTierString, rr: rankingInTier, winrate: winrateResult, timestamp: Date.now() };
                await addDoc(playersCol, playerData);
                resetPlayerModal();
            } catch (error) {
                showCustomAlert("Gagal Menambahkan", error.message);
            } finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; } }
        });
    }

    // ==================================================================
    // FIX TOMBOL SPIN ROULETTE (MENGGUNAKAN LIVE VISUAL SPIN BAWAAN)
    // ==================================================================
    if (btnSpinRoulette) {
        btnSpinRoulette.addEventListener('click', async () => {
            if (typeof isLocalSpinning !== 'undefined' && isLocalSpinning) return;

            const hasPlayers = selectedTeamSlots.some(slot => slot !== null);
            if (!hasPlayers) return;

            // ==================================================================
            // PERBAIKAN: Membaca nilai dari 4 Kotak Radio Button Interaktif
            // ==================================================================
            const activeRadio = document.querySelector('input[name="roulette-mode"]:checked');
            const currentMode = activeRadio ? activeRadio.value : 'normal';

            // Siapkan tempat penampung hasil spin
            const spinResults = new Array(selectedTeamSlots.length).fill(null);

            // JALANKAN GENERATOR SESUAI VALUE FILTER KOTAK KAMU
            // Menyodorkan string 'normal', 'same-role', atau 'pure-random'
            const pregeneratedTeam = getProportionalComposition(currentMode);
            let assignedAgentCount = 0;

            // 2. TENTUKAN AGENT UNTUK MASING-MASING SLOT
            selectedTeamSlots.forEach((slot, index) => {
                if (slot) {
                    let chosenAgent;

                    // KODE SINKRONISASI SLOT DENGAN HASIL FILTER:
                    // Jika modenya normal, same-role, atau pure-random, semuanya mengambil dari tim ter-struktur di atas
                    if (currentMode === 'normal' || currentMode === 'same-role' || currentMode === 'pure-random') {
                        chosenAgent = pregeneratedTeam[assignedAgentCount];
                        assignedAgentCount++;
                    } else if (currentMode === 'troll') {
                        const activeTrollRole = window.currentTrollRole || 'Duelist';
                        const filtered = valorantAgents.filter(a => a.role === activeTrollRole);
                        const randIdx = Math.floor(Math.random() * filtered.length);
                        chosenAgent = filtered[randIdx] || valorantAgents[0];
                    } else {
                        // Mode Pure Random (Acak Bebas)
                        const randomAgentIndex = Math.floor(Math.random() * valorantAgents.length);
                        chosenAgent = valorantAgents[randomAgentIndex];
                    }

                    // Cari index asli untuk keperluan animasi visual rolling gacha kamu
                    const agentIndexInArray = valorantAgents.findIndex(a => a.name === chosenAgent.name);
                    
                    spinResults[index] = {
                        agentName: chosenAgent.name,
                        agentRole: chosenAgent.role,
                        agentImg: chosenAgent.url,
                        agentIndex: agentIndexInArray >= 0 ? agentIndexInArray : 0
                    };
                } else {
                    spinResults[index] = null;
                }
            });

            // 3. JALANKAN ANIMASI ROLLING DAN SIMPAN HASIL KE FIREBASE
            try {
                isLocalSpinning = true;
                validateSpinButton();

                // Sinkronisasi status berputar dan hasil mentah langsung ke database realtime live_spin
                const liveSpinDocRef = doc(db, "roulette_state", "live_spin");
                await setDoc(liveSpinDocRef, { isSpinning: true, results: spinResults }, { merge: true });

                // Menjalankan animasi gacha bergulir lokal yang sudah kamu miliki di file ini
                await executeLiveVisualSpin(spinResults);

            } catch (error) {
                console.error("Error saat melakukan spin roulette:", error);
                isLocalSpinning = false;
                validateSpinButton();
            }
        });
    }

    // 7. Grid Slot Roulette Listener (Open Modal / Remove Card)
    if (rouletteContainer) {
        rouletteContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-slot-player')) {
                const card = e.target.closest('.player-slot-card');
                let slotAttr = card.getAttribute('data-slot');
                let idx = slotAttr !== null ? parseInt(slotAttr) : parseInt(card.id.replace('slot-', '')) - 1;
                removePlayerFromSlot(idx);
                return;
            }

            const card = e.target.closest('.player-slot-card');
            if (!card || card.classList.contains('is-spinning-live')) return;
            
            let slotAttr = card.getAttribute('data-slot');
            if (slotAttr !== null) {
                activeTargetSlotIndex = parseInt(slotAttr);
            } else {
                let slotIdNum = card.id.replace('slot-', '');
                activeTargetSlotIndex = parseInt(slotIdNum) - 1;
            }
            
            if (!isNaN(activeTargetSlotIndex) && activeTargetSlotIndex >= 0 && activeTargetSlotIndex <= 4) {
                openPlayerSelectorModal(); 
            }
        });
    }

    if (closeSelectPlayerBtn) {
        closeSelectPlayerBtn.addEventListener('click', () => {
            if (selectPlayerModal) selectPlayerModal.classList.add('hidden');
        });
    }

    // 8. Remove Slot X Button Fix (Local & Manual click)
    document.querySelectorAll('.btn-remove-slot-player').forEach((btn, idx) => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            selectedTeamSlots[idx] = null; 
            const card = document.getElementById(`slot-${idx + 1}`) || document.querySelectorAll('.player-slot-card')[idx];
            if (card) {
                card.classList.remove('filled');
                card.style.backgroundImage = 'none';
                const iconArea = card.querySelector('.slot-add-icon');
                if (iconArea) iconArea.innerHTML = `<i class="fas fa-user-plus"></i><span class="slot-player-name">Kosong</span>`;
            }
        });
    });

    // 9. Jalankan Pemantauan Realtime Firebase Sync
    initFirestoreListener();
    listenToTeamUpdates();
    listenToLiveSpinUpdates();
}

// ==================================================================
// FUNGSI INTERNAL (HELPER FUNCTIONS)
// ==================================================================
function showViewSection(section) {
    if (section === 'management') {
        valorantManagementContent.classList.remove('hidden');
        valorantRouletteContent.classList.add('hidden');
    } else {
        valorantManagementContent.classList.add('hidden');
        valorantRouletteContent.classList.remove('hidden');
        resetRouletteVisuals();
    }
}

function resetPlayerModal() {
    if (playerModal) playerModal.classList.add('hidden');
    if (addPlayerForm) addPlayerForm.reset();
    if (agentPhotosSelector) agentPhotosSelector.classList.add('hidden');
    selectedAvatarUrl = ""; 
    if (avatarPreview) {
        avatarPreview.innerHTML = `
            <div id="avatar-placeholder-content" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <i class="fas fa-user-plus"></i><span>Pilih Agent</span>
            </div>
        `;
    }
}

function buildAgentGrid() {
    if (!agentPhotosSelector) return;
    agentPhotosSelector.innerHTML = ""; 
    valorantAgents.slice(0, 8).forEach(agent => {
        const img = document.createElement('img');
        img.src = agent.url;
        img.alt = agent.name;
        img.className = 'agent-photo-item';
        img.addEventListener('click', (e) => {
            e.stopPropagation(); 
            document.querySelectorAll('.agent-photo-item').forEach(el => el.classList.remove('selected-active'));
            img.classList.add('selected-active');
            selectedAvatarUrl = agent.url;
            avatarPreview.innerHTML = `<img src="${selectedAvatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:18px;" alt="${agent.name}">`;
            agentPhotosSelector.classList.add('hidden');
        });
        agentPhotosSelector.appendChild(img);
    });
}

function closeStatsModal() { if (statsModal) statsModal.classList.add('hidden'); activePlayerId = null; }

function showCustomAlert(title, message) {
    if (alertModalTitle) alertModalTitle.innerText = title;
    if (alertModalMessage) alertModalMessage.innerText = message;
    if (customAlertModal) customAlertModal.classList.remove('hidden');
}

function createPlayerCardElement(id, username, tag, avatar, rank, rr, wr) {
    const newCard = document.createElement('div');
    newCard.className = 'player-card';
    newCard.setAttribute('data-id', id); 
    newCard.innerHTML = `
        <div class="player-card-avatar"><img src="${avatar}" alt="Avatar"></div>
        <div class="player-card-info"><h4>${username}</h4><span>#${tag.toUpperCase()}</span></div>
        <div class="player-stats"><span class="data-rank">${rank}</span><span class="data-rr">${rr}</span><span class="data-wr">${wr}</span></div>
    `;
    newCard.addEventListener('click', () => {
        if (statsModal) {
            activePlayerId = id; activePlayerName = username; activePlayerTag = tag.toUpperCase();
            document.getElementById('modal-player-avatar').src = avatar;
            document.getElementById('modal-player-username').innerText = username;
            document.getElementById('modal-player-tag').innerText = `#${tag.toUpperCase()}`;
            document.getElementById('modal-player-rank').innerText = rank;
            document.getElementById('modal-player-rr').innerText = `${rr} LP`;
            document.getElementById('modal-player-wr').innerText = wr;
            statsModal.classList.remove('hidden');
        }
    });
    return newCard;
}

function renderPlayerCards() {
    if (!playerCardsGrid) return;
    playerCardsGrid.innerHTML = "";
    
    if (cachedPlayersList.length === 0) {
        if (zeroPlaceholder) zeroPlaceholder.classList.remove('hidden');
    } else {
        if (zeroPlaceholder) zeroPlaceholder.classList.add('hidden');
        cachedPlayersList.forEach(p => {
            const card = createPlayerCardElement(p.id, p.username, p.tag, p.avatar, p.rank || "Unrated", p.rr || "0", p.winrate || "50%");
            playerCardsGrid.appendChild(card);
        });
    }
}

function initFirestoreListener() {
    try {
        const playersCol = collection(db, 'players');
        onSnapshot(playersCol, (snapshot) => {
            cachedPlayersList = []; 
            snapshot.forEach((doc) => {
                const data = doc.data();
                cachedPlayersList.push({
                    id: doc.id,
                    username: data.username || "Unknown",
                    tag: data.tag || "0000",
                    avatar: data.avatar || "Agent-Profile/Jett.png",
                    role: data.role || "Duelist",
                    rank: data.rank,
                    rr: data.rr,
                    winrate: data.winrate
                });
            });
            console.log("Realtime Sync: Berhasil memuat " + cachedPlayersList.length + " player.");
            renderPlayerCards();
            syncSlotsWithDeletedPlayers();
        }, (error) => {
            console.error("Firestore snapshot error:", error);
        });
    } catch (err) {
        console.error("Fatal exception inside initFirestoreListener:", err);
    }
}

function openPlayerSelectorModal() {
    if (!selectPlayerModal || !modalPlayersListContainer) return;
    modalPlayersListContainer.innerHTML = "";
    selectPlayerModal.classList.remove('hidden');

    if (cachedPlayersList.length === 0) {
        modalPlayersListContainer.innerHTML = `<p style="padding:20px; text-align:center; color:#999;">Belum ada player di database Profile Management.</p>`;
    } else {
        cachedPlayersList.forEach(player => {
            const isAlreadyChosen = selectedTeamSlots.some(slot => slot && slot.id === player.id);
            const row = document.createElement('div');
            row.className = `modal-player-row ${isAlreadyChosen ? 'already-selected' : ''}`;
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; pointer-events:none;">
                    <img src="${player.avatar || 'Agent-Profile/Jett.png'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.2);">
                    <div style="display:flex; flex-direction:column;">
                        <h5 style="margin:0; color:#fff; font-size:14px;">${player.username}</h5>
                        <span style="color:#888; font-size:12px;">#${player.tag.toUpperCase()}</span>
                    </div>
                </div>
                ${isAlreadyChosen 
                    ? `<button class="select-this-player-btn btn-disabled-selected" disabled style="padding:6px 12px; border:none; border-radius:6px; font-size:12px;">Terpilih</button>`
                    : `<button class="select-this-player-btn" style="padding:6px 12px; background:#623697; border:none; color:#fff; border-radius:6px; cursor:pointer; font-size:12px;">Pilih</button>`
                }
            `;
            if (!isAlreadyChosen) {
                row.addEventListener('click', (e) => {
                    e.stopPropagation();
                    assignPlayerToSlot(activeTargetSlotIndex, player);
                    selectPlayerModal.classList.add('hidden'); 
                });
            }
            modalPlayersListContainer.appendChild(row);
        });
    }
}

function assignPlayerToSlot(index, player) {
    if (index === null || index === undefined || isNaN(index)) return;
    selectedTeamSlots[index] = { id: player.id, username: player.username, tag: player.tag, avatar: player.avatar };
    renderAllSlots();
    syncTeamToFirebase(selectedTeamSlots);
}

async function removePlayerFromSlot(index) {
    if (index === null || index === undefined || isNaN(index)) return;
    selectedTeamSlots[index] = null;
    renderAllSlots();
    syncTeamToFirebase(selectedTeamSlots);

    try {
        const liveSpinDocRef = doc(db, "roulette_state", "live_spin");
        const liveSpinSnap = await getDoc(liveSpinDocRef);
        if (liveSpinSnap.exists() && liveSpinSnap.data().results) {
            let currentResults = liveSpinSnap.data().results;
            if (currentResults[index]) {
                currentResults[index] = null;
                await setDoc(liveSpinDocRef, { results: currentResults }, { merge: true });
            }
        }
    } catch (error) {
        console.error("Gagal membersihkan sisa live_spin database:", error);
    }
}

function renderAllSlots() {
    const slots = document.querySelectorAll('.player-slot-card');
    slots.forEach((card) => {
        let slotAttr = card.getAttribute('data-slot');
        let index = slotAttr !== null ? parseInt(slotAttr) : parseInt(card.id.replace('slot-', '')) - 1;
        
        const slotData = selectedTeamSlots[index];
        const nameEl = card.querySelector('.slot-player-name');
        const iconArea = card.querySelector('.slot-add-icon');
        
        const oldRemoveBtn = card.querySelector('.btn-remove-slot-player');
        if (oldRemoveBtn) oldRemoveBtn.remove();
        if (card.classList.contains('is-spinning-live')) return;

        card.style.backgroundImage = "none";
        card.style.backgroundSize = "cover";

        if (slotData && slotData.username) {
            if (nameEl) nameEl.innerText = slotData.username;
            card.classList.add('filled');
            if (iconArea) iconArea.innerHTML = `<span class="status-ready-text">READY</span>`;
            
            const removeBtn = document.createElement('div');
            removeBtn.className = 'btn-remove-slot-player';
            removeBtn.innerHTML = '×';
            card.appendChild(removeBtn);
        } else {
            if (nameEl) nameEl.innerText = "Pilih Player";
            card.classList.remove('filled');
            if (iconArea) iconArea.innerHTML = `<i class="fas fa-plus-circle"></i>`;
        }
    });
    validateSpinButton();
}

async function syncTeamToFirebase(slotsData) {
    try {
        const docRef = doc(db, "roulette_state", "current_team");
        await setDoc(docRef, { slots: slotsData });
    } catch (e) {
        console.error("Gagal sinkronisasi data tim ke Firebase:", e);
    }
}

function listenToTeamUpdates() {
    const docRef = doc(db, "roulette_state", "current_team");
    onSnapshot(docRef, (docSnap) => {
        if (typeof isLocalSpinning !== 'undefined' && isLocalSpinning) return;
        
        if (docSnap.exists() && docSnap.data().slots) {
            // Perbaikan logika map agar tidak crash saat membaca slot null
            selectedTeamSlots = docSnap.data().slots.map(slot => {
                if (!slot || typeof slot !== 'object' || Object.keys(slot).length === 0) {
                    return null;
                }
                return slot;
            });
        } else {
            selectedTeamSlots = [null, null, null, null, null];
        }
        
        console.log("🔄 Team slots updated from Firebase:", selectedTeamSlots);
        renderAllSlots(); 
        validateSpinButton(); 
    });
}

function listenToLiveSpinUpdates() {
    const docRef = doc(db, "roulette_state", "live_spin");
    onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists()) return;
        
        const data = docSnap.data();
        
        // 1. Jika ada hasil sebelumnya, tampilkan langsung tanpa animasi
        if (data.results) {
            renderFinalResultsInstantly(data.results);
        }

        // 2. Jika Firebase bilang "isSpinning: true", jalankan animasi
        if (data.isSpinning) {
            isLocalSpinning = true;
            executeLiveVisualSpin(data.results);
        } 
    });
}
async function executeLiveVisualSpin(results) {
    const slots = document.querySelectorAll('.player-slot-card');
    const duration = 3000;      
    const intervalTime = 100;   

    // Kita buat daftar janji (promises) untuk melacak kapan semua selesai
    const spinPromises = Array.from(slots).map(card => {
        return new Promise((resolve) => {
            let slotAttr = card.getAttribute('data-slot');
            let index = slotAttr !== null ? parseInt(slotAttr) : parseInt(card.id.replace('slot-', '')) - 1;
            
            const resultData = results[index];
            if (!resultData || !card.classList.contains('filled')) {
                resolve(); return;
            }

            const iconArea = card.querySelector('.slot-add-icon');
            card.classList.add('is-spinning-live');

            if (iconArea) iconArea.innerHTML = `<span class="slot-rolling-agent-name">ROLLING...</span>`;
            const rollingTextEl = card.querySelector('.slot-rolling-agent-name');

            let spinInterval = setInterval(() => {
                const temporaryAgent = valorantAgents[Math.floor(Math.random() * valorantAgents.length)];
                if (rollingTextEl) rollingTextEl.innerText = temporaryAgent.name.toUpperCase();
                card.style.backgroundImage = `linear-gradient(rgba(20, 17, 28, 0.7), rgba(20, 17, 28, 0.9)), url('${temporaryAgent.url}')`;
                card.style.backgroundSize = "cover";
                card.style.backgroundPosition = "center top";
            }, intervalTime);

            setTimeout(() => {
                clearInterval(spinInterval);
                card.classList.remove('is-spinning-live');
                const finalAgent = valorantAgents[resultData.agentIndex];
                
                if (finalAgent && iconArea) {
                    iconArea.innerHTML = `
                        <div class="final-agent-container">
                            <div class="final-agent-name">${finalAgent.name}</div>
                            <div class="final-agent-role">${finalAgent.role}</div>
                        </div>
                    `;
                    card.style.backgroundImage = `linear-gradient(rgba(15, 12, 22, 0.4), rgba(15, 12, 22, 0.85)), url('${finalAgent.url}')`;
                }

                const flashOverlay = card.querySelector('.flash-bang-overlay');
                if (flashOverlay) {
                    flashOverlay.classList.remove('active-flash');
                    void flashOverlay.offsetWidth; 
                    flashOverlay.classList.add('active-flash');
                }
                resolve(); // Selesai satu slot
            }, duration);
        });
    });

    // Tunggu SEMUA slot selesai animasi
    await Promise.all(spinPromises);

    // Sekarang, setelah semuanya selesai, baru update Firebase SEKALI SAJA
    isLocalSpinning = false;
    validateSpinButton();
    
    try {
        const docRef = doc(db, "roulette_state", "live_spin");
        await setDoc(docRef, { isSpinning: false, results: results }, { merge: true });
        console.log("✅ Animasi selesai, status Firebase di-reset.");
    } catch (e) {
        console.error("Gagal reset status Firebase:", e);
    }
}

function renderFinalResultsInstantly(results) {
    if (!results) return;
    const slots = document.querySelectorAll('.player-slot-card');
    slots.forEach((card) => {
        let slotAttr = card.getAttribute('data-slot');
        let index = slotAttr !== null ? parseInt(slotAttr) : parseInt(card.id.replace('slot-', '')) - 1;
        
        const resultData = results[index];
        if (!resultData) return;

        const iconArea = card.querySelector('.slot-add-icon');
        const finalAgent = valorantAgents[resultData.agentIndex];

        if (finalAgent && iconArea && card.classList.contains('filled')) {
            iconArea.innerHTML = `
                <div class="final-agent-container">
                    <div class="final-agent-name">${finalAgent.name}</div>
                    <div class="final-agent-role">${finalAgent.role}</div>
                </div>
            `;
            card.style.backgroundImage = `linear-gradient(rgba(15, 12, 22, 0.4), rgba(15, 12, 22, 0.85)), url('${finalAgent.url}')`;
            card.style.backgroundSize = "cover";
            card.style.backgroundPosition = "center top";
        }
    });
}

function resetRouletteVisuals() {
    const slots = document.querySelectorAll('.player-slot-card');
    slots.forEach(card => {
        card.classList.remove('is-spinning-live');
        const flashOverlay = card.querySelector('.flash-bang-overlay');
        if (flashOverlay) flashOverlay.classList.remove('active-flash');
        card.style.backgroundImage = "none";
    });
    renderAllSlots();
}

// Cari fungsi ini di gameSupport.js dan ganti isinya dengan versi aman ini:
function validateSpinButton() {
    const currentBtnSpin = document.getElementById('btn-spin-roulette');
    if (!currentBtnSpin) return;

    // Cek apakah ada minimal 1 slot player yang terisi
    const hasPlayers = selectedTeamSlots.some(slot => slot !== null);
    
    // Gunakan isLocalSpinning untuk menahan tombol saat sedang berputar
    if (hasPlayers && !isLocalSpinning) {
        currentBtnSpin.disabled = false;
        currentBtnSpin.style.opacity = "1";
        currentBtnSpin.style.cursor = "pointer";
    } else {
        currentBtnSpin.disabled = true;
        currentBtnSpin.style.opacity = "0.4";
        currentBtnSpin.style.cursor = "not-allowed";
    }
}
window.validateSpinButton = validateSpinButton;

function syncSlotsWithDeletedPlayers() {
    let changed = false;
    selectedTeamSlots.forEach((slot, index) => {
        if (slot) {
            const stillExists = cachedPlayersList.some(p => p.id === slot.id);
            if (!stillExists) {
                selectedTeamSlots[index] = null;
                changed = true;
            }
        }
    });
    if (changed) {
        renderAllSlots();
        syncTeamToFirebase(selectedTeamSlots);
    }
}