<template>
  <div>
    <!-- Loading Screen with better UX -->
    <div v-if="!isReady" class="loading">
      <div class="loading-anima aaa">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div class="loading-text">Loading resources: {{ loadingData.url }}</div>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <div class="progress-text">Loaded {{ loadingData.itemsLoaded || 0 }}/{{ loadingData.itemsTotal || 0 }}</div>
      </div>
      <div v-if="loadingData.type === 'successLoad'" class="loading-success">
        ✅ Loading successful, please wait a moment
      </div>
      <div v-if="loadingData.type === 'error'" class="loading-error">
        ❌ Error loading resources, please refresh the page
      </div>
    </div>

    <GameGuide 
      :show-mask="isReady && showGuide" 
      :game-status="gameStatus"
      :score="score"
      :coins="coins"
      :mistakes="mistake"
      @action="handleGameAction" 
    />
    
    <ScorePanel
      :score="score"
      :mistake="mistake"
      :coins="coins"
      @toggle-music="toggleMusic"
    />
    
    <div class="experience">
      <canvas ref="exp_canvas" class="experience__canvas"></canvas>
    </div>

    <!-- Mobile touch controls overlay with better visual feedback -->
    <div v-if="isReady && gameStatus === GAME_STATUS.START" class="mobile-controls-overlay">
      <div class="touch-zone touch-left" @touchstart="handleTouchStart('left')" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
        <span>←</span>
      </div>
      <div class="touch-zone touch-right" @touchstart="handleTouchStart('right')" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
        <span>→</span>
      </div>
      <div class="touch-zone touch-up" @touchstart="handleTouchStart('up')" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
        <span>↑</span>
      </div>
      <div class="touch-zone touch-down" @touchstart="handleTouchStart('down')" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
        <span>↓</span>
      </div>
    </div>

    <!-- FPS Counter (optional, press F to toggle) -->
    <div v-if="showFPS" class="fps-counter">
      FPS: {{ fps }}
    </div>

    <!-- Hidden audio element for background music -->
    <audio ref="bgMusic" loop preload="auto" style="display: none;">
      <source src="/assets/audio/song1.wav" type="audio/wav">
    </audio>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';
import ScorePanel from './components/ScorePanel.vue';
import GameGuide from './components/GameGuide.vue';
import Game from './Game';
import { GAME_STATUS } from './Game/const';

// Whether the model is fully loaded
const isReady = ref(false);
// Game score (passed as prop to ScorePanel for display)
const score = ref(0);
// Number of mistakes (passed as prop to ScorePanel for display)
const mistake = ref(0);
// Coins collected (single source of truth)
const coins = ref(0);
// Game status
const gameStatus = ref(GAME_STATUS.READY);
// Music state
const isMusicPlaying = ref(true);
const bgMusic = ref<HTMLAudioElement | null>(null);
// FPS counter
const showFPS = ref(false);
const fps = ref(60);
let frameCount = 0;
let lastFPSUpdate = performance.now();

let loadingData: any = ref({});
let loadingProgress = ref(0);
let gameInstance: Game | null = null;
const exp_canvas = ref<HTMLCanvasElement>();

const showGuide = computed(() => {
  return gameStatus.value !== GAME_STATUS.START;
});

// ── Reset all score displays ──────────────────────────────────────────────────
const resetScores = () => {
  console.log('🔄 resetScores called');
  score.value = 0;
  mistake.value = 0;
  coins.value = 0;
};

// Toggle music on/off with better feedback
const toggleMusic = () => {
  if (bgMusic.value) {
    if (isMusicPlaying.value) {
      bgMusic.value.pause();
      isMusicPlaying.value = false;
      console.log('🔇 Music paused');
      // Optional: Show toast notification
      showToast('Music paused', 'info');
    } else {
      bgMusic.value.play().catch(e => {
        console.log('Play failed:', e);
        showToast('Unable to play music', 'error');
      });
      isMusicPlaying.value = true;
      console.log('🔊 Music resumed');
      showToast('Music resumed', 'info');
    }
  }
};

// Simple toast notification (optional)
const showToast = (message: string, type: string = 'info') => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeOutUp 2s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};

// Start music after user interaction (browser policy)
const startMusicOnInteraction = () => {
  if (bgMusic.value && bgMusic.value.paused && isMusicPlaying.value) {
    bgMusic.value.play().catch(e => {
      console.log('Audio autoplay blocked. User interaction required.', e);
      showToast('Click/tap to start music', 'info');
    });
  }
  // Remove listeners after first interaction
  window.removeEventListener('click', startMusicOnInteraction);
  window.removeEventListener('keydown', startMusicOnInteraction);
  window.removeEventListener('touchstart', startMusicOnInteraction);
};

// Handle game action button click (Start / Restart)
const handleGameAction = () => {
  console.log('🎮 handleGameAction called, status:', gameStatus.value);
  if (gameStatus.value === GAME_STATUS.READY) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
  } else if (gameStatus.value === GAME_STATUS.END) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  }
};

// Mobile touch controls with haptic feedback (if supported)
const handleTouchStart = (direction: string) => {
  console.log('👆 Touch direction:', direction);
  
  // Optional: Haptic feedback for mobile
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  const event = new KeyboardEvent('keydown', { key: getKeyForDirection(direction) });
  window.dispatchEvent(event);
};

const handleTouchEnd = () => {
  // Optional: handle touch end if needed
};

const getKeyForDirection = (direction: string): string => {
  switch (direction) {
    case 'left':  return 'a';
    case 'right': return 'd';
    case 'up':    return 'w';
    case 'down':  return 's';
    default:      return '';
  }
};

// Swipe gesture state
let touchStartY = 0;
let touchStartX = 0;
const SWIPE_THRESHOLD = 50;

const handleTouchStartSwipe = (e: TouchEvent) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
};

const handleTouchEndSwipe = (e: TouchEvent) => {
  if (!touchStartY) return;

  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const deltaY = touchEndY - touchStartY;
  const deltaX = touchEndX - touchStartX;

  if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: deltaY > 0 ? 's' : 'w' }));
  } else if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: deltaX > 0 ? 'd' : 'a' }));
  }

  touchStartY = 0;
  touchStartX = 0;
};

// Arrow keys + spacebar → WASD mapping
const handleKeyDown = (e: KeyboardEvent) => {
  const map: Record<string, string> = {
    ArrowUp: 'w',
    ArrowDown: 's',
    ArrowLeft: 'a',
    ArrowRight: 'd',
    ' ': 'w'
  };
  
  // Toggle FPS counter with 'F' key
  if (e.key === 'f' || e.key === 'F') {
    showFPS.value = !showFPS.value;
    e.preventDefault();
    return;
  }

  const mappedKey = map[e.key];
  if (mappedKey) {
    e.preventDefault();
    console.log('⌨️ Key pressed:', e.key, '→ mapped to:', mappedKey);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: mappedKey }));
  }
};

// Update FPS counter
const updateFPS = () => {
  if (showFPS.value) {
    frameCount++;
    const now = performance.now();
    if (now - lastFPSUpdate >= 1000) {
      fps.value = frameCount;
      frameCount = 0;
      lastFPSUpdate = now;
    }
  }
  requestAnimationFrame(updateFPS);
};

onMounted(() => {
  console.log('🚀 App mounted, initializing game...');
  console.log('📦 exp_canvas.value:', exp_canvas.value);
  
  // Initialize background music
  if (bgMusic.value) {
    bgMusic.value.volume = 0.3; // Set volume to 30%
    console.log('🎵 Background music initialized');
  }
  
  // Start FPS counter
  updateFPS();
  
  // Validate canvas element exists
  const canvas = exp_canvas.value;
  if (!canvas) {
    console.error('❌ Canvas element not found!');
    showToast('Failed to initialize game', 'error');
    return;
  }
  
  // Verify it's an HTMLCanvasElement
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error('❌ exp_canvas is not an HTMLCanvasElement!', canvas);
    showToast('Game initialization error', 'error');
    return;
  }
  
  // Create game instance with canvas only (no scorePanel ref needed)
  gameInstance = Game.getInstance(canvas);

  // Add event listeners for swipe controls
  canvas.addEventListener('touchstart', handleTouchStartSwipe);
  canvas.addEventListener('touchend', handleTouchEndSwipe);
  console.log('✅ Swipe listeners added to canvas');

  // Add keyboard listener
  window.addEventListener('keydown', handleKeyDown);
  
  // Add user interaction listeners for audio (required by browsers)
  window.addEventListener('click', startMusicOnInteraction);
  window.addEventListener('keydown', startMusicOnInteraction);
  window.addEventListener('touchstart', startMusicOnInteraction);

  // Resource loading progress
  if (gameInstance) {
    gameInstance.on('progress', (data: any) => {
      console.log('📊 Loading progress:', data);
      if (data.type === 'successLoad') {
        loadingData.value.type = 'successLoad';
        isReady.value = true;
        console.log('✅ Game ready!');
        showToast('Game ready! Press P to start', 'info');
      } else if (data.type === 'onProgress') {
        loadingData.value = data;
        loadingProgress.value = (data.itemsLoaded / data.itemsTotal) * 100;
      } else if (data.type === 'error') {
        loadingData.value = data;
        showToast('Failed to load game resources', 'error');
      } else {
        loadingData.value = data;
      }
    });

    // ── Game status changes ────────────────────────────────────────────────────
    gameInstance.on('gameStatus', (data: GAME_STATUS) => {
      console.log('🎯 Game status changed:', data);
      gameStatus.value = data;

      // Reset score display whenever a new game session starts
      if (data === GAME_STATUS.START) {
        console.log('🏁 Game STARTED - resetting scores');
        resetScores();
        
        // Resume music if it was paused
        if (bgMusic.value && isMusicPlaying.value && bgMusic.value.paused) {
          bgMusic.value.play().catch(e => console.log('Play failed:', e));
        }
      }
      
      // Pause music on game over
      if (data === GAME_STATUS.END && bgMusic.value) {
        bgMusic.value.pause();
        console.log('⏸️ Music paused - Game Over');
        showToast('Game Over! Press R to restart', 'info');
      }
    });

    // ── Live score/mistake/coin updates from game loop ─────────────────────────
    gameInstance.on('gameData', (data: any) => {
      score.value = data.score;
      mistake.value = data.mistake;
      coins.value = data.coin; // ✅ Single source of truth for coins
      console.log('💰 GameData received - coins:', data.coin);
    });
  } else {
    console.error('❌ Failed to create game instance!');
    showToast('Failed to start game', 'error');
  }
});

onUnmounted(() => {
  console.log('🛑 App unmounting, cleaning up...');
  
  // Clean up audio
  if (bgMusic.value) {
    bgMusic.value.pause();
    bgMusic.value = null;
  }
  
  // Remove keyboard listener
  window.removeEventListener('keydown', handleKeyDown);
  
  // Remove audio interaction listeners
  window.removeEventListener('click', startMusicOnInteraction);
  window.removeEventListener('keydown', startMusicOnInteraction);
  window.removeEventListener('touchstart', startMusicOnInteraction);

  // Remove swipe listeners from canvas
  const canvas = exp_canvas.value;
  if (canvas) {
    canvas.removeEventListener('touchstart', handleTouchStartSwipe);
    canvas.removeEventListener('touchend', handleTouchEndSwipe);
  }

  // Dispose game instance
  if (gameInstance) {
    gameInstance.disposeGame();
  }
});
</script>

<style scoped>
/* Loading screen improvements */
.loading {
  position: fixed;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 999;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-text {
  margin-top: 20px;
  font-size: 14px;
  opacity: 0.9;
}

.loading-progress {
  margin-top: 20px;
  width: 300px;
  max-width: 80vw;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 8px;
  font-size: 12px;
  text-align: center;
  opacity: 0.8;
}

.loading-success {
  margin-top: 20px;
  color: #4ade80;
  font-size: 14px;
}

.loading-error {
  margin-top: 20px;
  color: #f87171;
  font-size: 14px;
}

.loading-anima,
.loading-anima > div {
  position: relative;
  box-sizing: border-box;
}

.aaa {
  display: block;
  font-size: 0;
  color: white;
}

.loading-anima > div {
  display: inline-block;
  float: none;
  background-color: white;
  border: 0 solid white;
}

.loading-anima {
  width: 54px;
  height: 18px;
}

.aaa > div {
  width: 10px;
  height: 10px;
  margin: 4px;
  border-radius: 100%;
  animation: ball-pulse-sync 0.6s infinite ease-in-out;
}

.loading-anima > div:nth-child(1) { animation-delay: -0.14s; }
.loading-anima > div:nth-child(2) { animation-delay: -0.07s; }
.loading-anima > div:nth-child(3) { animation-delay: 0s; }

@keyframes ball-pulse-sync {
  33%  { transform: translateY(100%); }
  66%  { transform: translateY(-100%); }
  100% { transform: translateY(0); }
}

@keyframes fadeOutUp {
  0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

.experience {
  position: fixed;
  height: 100vh;
  width: 100vw;
}

.experience__canvas {
  height: 100%;
  width: 100%;
}

canvas {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}

/* FPS Counter */
.fps-counter {
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #4ade80;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  z-index: 1000;
  pointer-events: none;
  font-weight: bold;
}

/* Mobile touch controls with better visual feedback */
.mobile-controls-overlay {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  pointer-events: none;
  z-index: 1000;
}

.touch-zone {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
  transition: all 0.2s ease;
  user-select: none;
  touch-action: manipulation;
}

.touch-zone span {
  font-size: 40px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.touch-left  { bottom: 20px; left: 20px; }
.touch-right { bottom: 20px; right: 20px; }
.touch-up    { bottom: 120px; left: 50%; transform: translateX(-50%); }
.touch-down  { bottom: 20px;  left: 50%; transform: translateX(-50%); }

.touch-zone:active {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

@media (min-width: 769px) {
  .mobile-controls-overlay { display: none; }
}

@media (max-width: 768px) {
  .touch-zone { width: 60px; height: 60px; }
  .touch-zone span { font-size: 30px; }
}
</style>