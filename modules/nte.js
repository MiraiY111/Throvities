// ==================================================================
// MODULE: NEVERNESS TO EVERNESS (NTE) MANAGEMENT
// ==================================================================

export function initNTE() {
    console.log("🏙️ Neverness to Everness Module Initialized...");

    const cardNte = document.querySelector('.game-selection-card[data-game="nte"]');
    const mainSelection = document.querySelector('.game-main-selection');
    const nteDetailView = document.getElementById('nte-detail-view');
    const backBtn = document.querySelector('.back-from-nte-btn');

    // 1. Masuk ke Detail View NTE
    if (cardNte && mainSelection && nteDetailView) {
        cardNte.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("🚗 Opening NTE View...");
            
            mainSelection.classList.add('hidden');       // Sembunyikan Grid Pilihan Game
            nteDetailView.classList.remove('hidden');   // Tampilkan Detail Dashboard NTE
        });
    }

    // 2. Tombol Kembali ke Grid Utama
    if (backBtn && mainSelection && nteDetailView) {
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nteDetailView.classList.add('hidden');      // Sembunyikan Detail Dashboard NTE
            mainSelection.classList.remove('hidden');   // Munculkan kembali Grid Pilihan Game
        });
    }
}