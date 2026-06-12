// ==================================================================
// MODULE: WUTHERING WAVES MANAGEMENT
// ==================================================================

export function initWutheringWaves() {
    console.log("⚔️ Wuthering Waves Module Initialized...");

    const cardWuwa = document.querySelector('.game-selection-card[data-game="wuwa"]');
    const mainSelection = document.querySelector('.game-main-selection');
    const wuwaDetailView = document.getElementById('wuwa-detail-view');
    const backBtn = document.querySelector('.back-from-wuwa-btn');

    // 1. Masuk ke Detail View WuWa
    if (cardWuwa && mainSelection && wuwaDetailView) {
        cardWuwa.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("🎮 Opening Wuthering Waves View...");
            
            mainSelection.classList.add('hidden');       // Sembunyikan Grid Pilihan Game
            wuwaDetailView.classList.remove('hidden');   // Tampilkan Detail Dashboard WuWa
        });
    }

    // 2. Tombol Kembali ke Grid Utama
    if (backBtn && mainSelection && wuwaDetailView) {
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            wuwaDetailView.classList.add('hidden');      // Sembunyikan Detail Dashboard WuWa
            mainSelection.classList.remove('hidden');   // Munculkan kembali Grid Pilihan Game
        });
    }
}