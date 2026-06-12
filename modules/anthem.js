/**
 * Anthem Module - ThroveXyra Activity
 * Mengatur jalannya audio player untuk halaman Anthem dengan sistem playlist dinamis
 * & Sinkronisasi Lirik Pop-Up ala Spotify
 */

export function initAnthem() {
    const audio = document.getElementById('main-audio-element');
    const playBtn = document.getElementById('btn-music-play');
    const progressContainer = document.getElementById('audio-progress-container');
    const currentTimeDisplay = document.getElementById('audio-time-current');
    const totalTimeDisplay = document.getElementById('audio-time-total');
    const playlistTracksWrapper = document.getElementById('playlist-tracks-wrapper');

    // Referensi Elemen Pop-up Lirik
    const lyricsModal = document.getElementById('lyrics-modal');
    const closeLyricsBtn = document.getElementById('close-lyrics-btn');
    const lyricsContainer = document.getElementById('lyrics-container');
    const lyricsTitle = document.getElementById('lyrics-song-title');
    const lyricsArtist = document.getElementById('lyrics-song-artist');

    if (!audio || !playBtn) return;

    // State Internal Lirik
    let currentLyricsData = [];

    // 1. Jalankan klon elemen tombol kontrol agar event listener tidak menumpuk double
    playBtn.replaceWith(playBtn.cloneNode(true));
    progressContainer.replaceWith(progressContainer.cloneNode(true));

    // 2. Ambil referensi baru dari DOM setelah klon selesai dimasukkan
    const newPlayBtn = document.getElementById('btn-music-play');
    const newProgressContainer = document.getElementById('audio-progress-container');
    const progressFill = document.getElementById('audio-progress-fill'); 
    
    // Referensi tombol navigasi baru
    const nextBtn = document.getElementById('btn-music-next');
    const prevBtn = document.getElementById('btn-music-prev');
    const shuffleBtn = document.getElementById('btn-music-shuffle');
    const lyricsBtn = document.getElementById('btn-music-lyrics');
    
    const playerTitle = document.getElementById('current-player-title');
    const playerStatus = document.getElementById('current-player-status');

    let currentTrackIndex = 0; 
    let isShuffleActive = false;

    // DATA PLAYLIST LAGU DI FOLDER TRACKS
    const songsList = [
        { name: "ThroveXyra Gate", file: "ThroveXyra Gate.mp3", meta: "Official Track", duration: "3:15" },
        { name: "Our Cozy Corner", file: "Our Cozy Corner.mp3", meta: "Background Music", duration: "2:45" },
        { name: "The Guild of ThroveXyra", file: "The Guild of ThroveXyra.mp3", meta: "Background Music", duration: "3:02" },
        { name: "To the Friends We Used to Know", file: "To the Friends We Used to Know.mp3", meta: "Background Music", duration: "4:10" },
        { name: "Worry Free", file: "Worry Free.mp3", meta: "Background Music", duration: "2:50" },
        { name: "Until Tomorrow", file: "Until Tomorrow.mp3", meta: "Lobby Theme", duration: "3:35" }
    ];

    // ==================================================================
    // SISTEM MANAGEMEN LIRIK SINKRONISASI (SPOTIFY STYLE)
    // ==================================================================
    
    // Ambil data lirik dari file JSON eksternal
    // Ambil data lirik dari file JSON eksternal berdasarkan nama file lagu
    async function loadLyricsForCurrentTrack() {
        if (!lyricsContainer) return;
        
        const currentSong = songsList[currentTrackIndex];
        if (lyricsTitle) lyricsTitle.textContent = currentSong.name;
        if (lyricsArtist) lyricsArtist.textContent = currentSong.meta;

        try {
            // Mengambil nama file asli mp3 (misal "ThroveXyra Gate.mp3") 
            // lalu kita potong ".mp3"-nya dan ganti jadi ".json"
            const lyricFileName = currentSong.file.replace('.mp3', '.json');
            
            // Sekarang sistem akan menembak folder: ./lyrics/ThroveXyra Gate.json
            const response = await fetch(`./lyrics/${lyricFileName}`);
            if (!response.ok) throw new Error("Lirik tidak tersedia");
            
            currentLyricsData = await response.json();
            renderLyricsHTML();
        } catch (error) {
            console.warn("Gagal memuat lirik:", error);
            lyricsContainer.innerHTML = `<p class="lyrics-empty">Coming Soon..<3</p>`;
            currentLyricsData = [];
        }
    }

    // Tampilkan lirik ke dalam Modal HTML
    function renderLyricsHTML() {
        lyricsContainer.innerHTML = '';
        if (currentLyricsData.length === 0) return;

        currentLyricsData.forEach((line, index) => {
            const p = document.createElement('p');
            p.classList.add('lyric-line');
            p.setAttribute('data-index', index);
            p.textContent = line.text;
            
            // Pengalaman Interaktif: Klik baris lirik untuk melompat ke durasi lagu tersebut
            p.addEventListener('click', () => {
                audio.currentTime = line.time;
            });

            lyricsContainer.appendChild(p);
        });
    }

    // Cocokkan putaran lagu dengan highlight lirik + Auto Scroll ke tengah
    function updateLyricsSync() {
        if (currentLyricsData.length === 0 || !lyricsContainer || !lyricsModal.classList.contains('show')) return;

        const currentTime = audio.currentTime;
        let activeIndex = -1;

        for (let i = 0; i < currentLyricsData.length; i++) {
            if (currentTime >= currentLyricsData[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        if (activeIndex !== -1) {
            const lines = lyricsContainer.querySelectorAll('.lyric-line');
            lines.forEach((line, idx) => {
                if (idx === activeIndex) {
                    if (!line.classList.contains('active')) {
                        line.classList.add('active');
                        line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else if (idx < activeIndex) {
                    line.classList.remove('active');
                    line.classList.add('passed');
                } else {
                    line.classList.remove('active', 'passed');
                }
            });
        }
    }

    // FUNGSI LOAD PLAYLIST SECARA DINAMIS
    function renderPlaylist() {
        if (!playlistTracksWrapper) return;
        playlistTracksWrapper.innerHTML = "";
        
        songsList.forEach((song, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = `track-item ${index === currentTrackIndex ? 'active' : ''}`;
            
            trackItem.innerHTML = `
                <div class="track-left">
                    <div class="track-icon"><i class="fas ${index === currentTrackIndex ? 'fa-music' : 'fa-play'}"></i></div>
                    <div class="track-details">
                        <span class="track-name">${song.name}</span>
                        <span class="track-meta">${song.meta}</span>
                    </div>
                </div>
                <span class="track-duration">${song.duration || '--:--'}</span>
            `;
            
            trackItem.addEventListener('click', () => {
                changeTrack(index);
            });
            
            playlistTracksWrapper.appendChild(trackItem);
        });
    }

    // FUNGSI PROSES PINDAH TRACK LAGU
    function changeTrack(index) {
        currentTrackIndex = index;
        const currentSong = songsList[currentTrackIndex];
        
        audio.src = `tracks/${currentSong.file}`;
        audio.load();
        
        if (playerTitle) playerTitle.textContent = currentSong.name;
        renderPlaylist();
        
        // Tarik lirik lagu baru setiap kali ganti track
        loadLyricsForCurrentTrack();
        
        audio.play().then(() => {
            newPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
            if (playerStatus) playerStatus.textContent = "Now Playing";
        }).catch(err => console.log("Menunggu aksi interaksi pertama user:", err));
    }

    function playNextTrack() {
        if (isShuffleActive) {
            let randomIndex = Math.floor(Math.random() * songsList.length);
            changeTrack(randomIndex);
        } else {
            let nextIndex = (currentTrackIndex + 1) % songsList.length;
            changeTrack(nextIndex);
        }
    }

    function playPrevTrack() {
        let prevIndex = (currentTrackIndex - 1 + songsList.length) % songsList.length;
        changeTrack(prevIndex);
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // SETUP EVENT LISTENERS PADA TOMBOL DOCK BAR
    newPlayBtn.addEventListener('click', togglePlay);
    
    if (nextBtn) {
        nextBtn.replaceWith(nextBtn.cloneNode(true));
        document.getElementById('btn-music-next').addEventListener('click', playNextTrack);
    }
    
    if (prevBtn) {
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        document.getElementById('btn-music-prev').addEventListener('click', playPrevTrack);
    }
    
    if (shuffleBtn) {
        shuffleBtn.replaceWith(shuffleBtn.cloneNode(true));
        const newShuffleBtn = document.getElementById('btn-music-shuffle');
        newShuffleBtn.addEventListener('click', () => {
            isShuffleActive = !isShuffleActive;
            newShuffleBtn.classList.toggle('active-shuffle', isShuffleActive);
        });
    }

    // EVENT LISTENER KLIK POP-UP MODAL LIRIK
    if (lyricsBtn) {
        lyricsBtn.replaceWith(lyricsBtn.cloneNode(true));
        const activeLyricsBtn = document.getElementById('btn-music-lyrics');
        
        activeLyricsBtn.addEventListener('click', () => {
            if (lyricsModal) {
                loadLyricsForCurrentTrack();
                lyricsModal.classList.add('show');
            }
        });
    }

    if (closeLyricsBtn && lyricsModal) {
        closeLyricsBtn.addEventListener('click', () => {
            lyricsModal.classList.remove('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === lyricsModal) {
            lyricsModal.classList.remove('show');
        }
    });

    // UPDATE TIMELINE BAR & HANDLER KLIK PROGRESS + TRIGGER UPDATE LIRIK
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime);
        
        // Jalankan sinkronisasi lirik mengikuti lagu
        updateLyricsSync();
    });

    audio.onloadedmetadata = () => {
        if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(audio.duration);
    };

    newProgressContainer.addEventListener('click', (e) => {
        const rect = newProgressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (audio.duration) {
            audio.currentTime = (clickX / rect.width) * audio.duration;
        }
    });

    audio.onended = () => {
        playNextTrack();
    };

    // ==================================================================
    // LOGIKA FITUR VOLUME SLIDER (DOCK PLAYER + BUBBLE INTERACTION)
    // ==================================================================
    const volumeContainer = document.getElementById('volume-slider-container');
    const volumeFill = document.getElementById('volume-slider-fill');
    const volumeBtn = document.getElementById('btn-music-volume');
    
    const bubbleVolContainer = document.getElementById('bubble-volume-container');
    const bubbleVolFill = document.getElementById('bubble-volume-fill');
    const bubbleVolIcon = document.getElementById('bubble-volume-icon');

    let lastVolume = 0.35; 
    let isDraggingVolume = false; 

    audio.volume = lastVolume;
    if (volumeFill) volumeFill.style.width = `${lastVolume * 100}%`;
    if (bubbleVolFill) bubbleVolFill.style.width = `${lastVolume * 100}%`;

    function updateVolumeIcon(vol) {
        const activeVolumeBtn = document.getElementById('btn-music-volume');
        const icon = activeVolumeBtn ? activeVolumeBtn.querySelector('i') : null;
        
        const changeIcons = (targetIcon) => {
            if (!targetIcon) return;
            targetIcon.className = '';
            if (vol === 0) { targetIcon.className = 'fas fa-volume-xmark'; }
            else if (vol < 0.4) { targetIcon.className = 'fas fa-volume-down'; }
            else { targetIcon.className = 'fas fa-volume-up'; }
        };

        changeIcons(icon);
        changeIcons(bubbleVolIcon);
        if (activeVolumeBtn) activeVolumeBtn.style.color = vol === 0 ? '#ff4655' : '#b5bac1';
    }

    function syncVolumeEverywhere(newVolume) {
        if (newVolume < 0) newVolume = 0;
        if (newVolume > 1) newVolume = 1;

        audio.volume = newVolume;
        if (newVolume > 0) lastVolume = newVolume;

        if (volumeFill) volumeFill.style.width = `${newVolume * 100}%`;
        if (bubbleVolFill) bubbleVolFill.style.width = `${newVolume * 100}%`;
        updateVolumeIcon(newVolume);
    }

    if (volumeContainer) {
        volumeContainer.addEventListener('mousedown', (e) => { isDraggingVolume = true; handleVolMove(e, volumeContainer); });
    }
    if (bubbleVolContainer) {
        bubbleVolContainer.addEventListener('mousedown', (e) => { isDraggingVolume = true; handleVolMove(e, bubbleVolContainer); });
    }

    function handleVolMove(e, container) {
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        syncVolumeEverywhere(clickX / rect.width);
    }

    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            const dockRect = volumeContainer ? volumeContainer.getBoundingClientRect() : null;
            if (dockRect && e.clientX >= dockRect.left - 200 && e.clientX <= dockRect.right + 200) {
                handleVolMove(e, volumeContainer);
            } else if (bubbleVolContainer) {
                handleVolMove(e, bubbleVolContainer);
            }
        }
    });

    document.addEventListener('mouseup', () => { isDraggingVolume = false; });

    if (volumeBtn) {
        volumeBtn.replaceWith(volumeBtn.cloneNode(true));
        document.getElementById('btn-music-volume').addEventListener('click', () => {
            syncVolumeEverywhere(audio.volume > 0 ? 0 : lastVolume);
        });
    }

    // ==================================================================
    // INTEGRASI DAN KONTROL SINKRONISASI FLOATING BUBBLE PLAYER
    // ==================================================================
    const bubblePlayer = document.getElementById('floating-bubble-player');
    const bubbleToggleExpand = document.getElementById('bubble-toggle-expand');
    const bubbleMinimizeBtn = document.getElementById('btn-bubble-minimize');
    const cassetteDisk = document.getElementById('bubble-cassette-disk');
    
    const bubblePlayBtn = document.getElementById('btn-bubble-play');
    const bubblePrevBtn = document.getElementById('btn-bubble-prev');
    const bubbleNextBtn = document.getElementById('btn-bubble-next');
    const bubbleTitleText = document.getElementById('bubble-title');

    function updateCassetteAnimation() {
        if (!audio.paused && cassetteDisk) {
            cassetteDisk.classList.add('disk-spinning');
        } else if (cassetteDisk) {
            cassetteDisk.classList.remove('disk-spinning');
        }
    }

    if (bubbleToggleExpand) {
        bubbleToggleExpand.addEventListener('click', () => {
            if (bubblePlayer) bubblePlayer.classList.add('expanded');
        });
    }

    if (bubbleMinimizeBtn) {
        bubbleMinimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bubblePlayer) bubblePlayer.classList.remove('expanded');
        });
    }

    if (bubblePlayBtn) bubblePlayBtn.addEventListener('click', togglePlay);
    if (bubblePrevBtn) bubblePrevBtn.addEventListener('click', playPrevTrack);
    if (bubbleNextBtn) bubbleNextBtn.addEventListener('click', playNextTrack);

    function checkPageTrackingForBubble() {
        const anthemPage = document.getElementById('page-anthem');
        if (!anthemPage || !bubblePlayer) return;

        setInterval(() => {
            const isAnthemActive = anthemPage.classList.contains('active-page') || anthemPage.style.display === 'block';
            if (isAnthemActive) {
                bubblePlayer.classList.add('hidden-bubble');
                bubblePlayer.classList.remove('expanded');
            } else {
                bubblePlayer.classList.remove('hidden-bubble');
            }
            updateCassetteAnimation();
        }, 300);
    }

    // ==================================================================
    // PREMIUM WELCOME SCREEN AUTOPLAY TRIGGER
    // ==================================================================
    function initFirstTrackOnLoad() {
        const firstSong = songsList[0]; 
        if (firstSong) {
            audio.src = `tracks/${firstSong.file}`;
            audio.load(); 
            
            if (playerTitle) playerTitle.textContent = firstSong.name;
            if (bubbleTitleText) bubbleTitleText.textContent = firstSong.name;
            
            loadLyricsForCurrentTrack(); // Ambil lirik lagu pertama awal-awal
            
            const welcomeOverlay = document.getElementById('welcome-overlay');
            const enterBtn = document.getElementById('btn-enter-app');

            const applyPlayUIUpdates = () => {
                newPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (bubblePlayBtn) bubblePlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (playerStatus) playerStatus.textContent = "Now Playing";
                if (bubbleTitleText) bubbleTitleText.textContent = songsList[currentTrackIndex].name;
                updateCassetteAnimation();
            };

            if (enterBtn && welcomeOverlay) {
                enterBtn.addEventListener('click', () => {
                    welcomeOverlay.classList.add('hide-overlay');
                    audio.play().then(applyPlayUIUpdates).catch(err => console.error(err));
                });
            } else {
                audio.play().then(applyPlayUIUpdates).catch(() => {
                    if (playerStatus) playerStatus.textContent = "Ready to Play";
                });
            }
        }
    }

    // ==================================================================
    // SINKRONISASI PLAY / PAUSE DI SELURUH PLAYER (FUNGSI UTAMA)
    // ==================================================================
    function togglePlay() {
        const activeBubblePlayBtn = document.getElementById('btn-bubble-play');

        if (audio.paused) {
            audio.play().then(() => {
                if (newPlayBtn) newPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (activeBubblePlayBtn) activeBubblePlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (playerStatus) playerStatus.textContent = "Now Playing";
                updateCassetteAnimation();
            }).catch(err => console.log("Playback diblokir:", err));
        } else {
            audio.pause();
            if (newPlayBtn) newPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (activeBubblePlayBtn) activeBubblePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (playerStatus) playerStatus.textContent = "Paused";
            updateCassetteAnimation();
        }
    }

    const originalChangeTrack = changeTrack;
    changeTrack = function(index) {
        originalChangeTrack(index);
        setTimeout(() => {
            if (bubbleTitleText) bubbleTitleText.textContent = songsList[currentTrackIndex].name;
            updateCassetteAnimation();
        }, 50);
    };

    initFirstTrackOnLoad();
    renderPlaylist();
    checkPageTrackingForBubble();
}