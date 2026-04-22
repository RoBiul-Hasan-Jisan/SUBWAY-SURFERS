<template>
  <div>
    <div v-if="!isReady" class="loading">
      <div class="loading-anima aaa">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div>Loading resources: {{ loadingData.url }}</div>
      <div>Loaded {{ loadingData.itemsLoaded || 0 }}/{{ loadingData.itemsTotal || 0 }}</div>
      <div v-if="loadingData.type === 'successLoad'">Loading successful, please wait a moment</div>
    </div>
    <GameGuide :show-mask="isReady && showGuide" :game-status="gameStatus" @action="handleGameAction" />
    <ScorePanel
      ref="scorePanelRef"
      :score="score"
      :mistake="mistake"
    />
    <div class="experience">
      <canvas ref="exp_canvas" class="experience__canvas"></canvas>
    </div>

    <!-- Mobile touch controls overlay -->
    <div v-if="isReady && gameStatus === GAME_STATUS.START" class="mobile-controls-overlay">
      <div class="touch-zone touch-left" @touchstart="handleTouchStart('left')" @touchend="handleTouchEnd"></div>
      <div class="touch-zone touch-right" @touchstart="handleTouchStart('right')" @touchend="handleTouchEnd"></div>
      <div class="touch-zone touch-up" @touchstart="handleTouchStart('up')" @touchend="handleTouchEnd"></div>
      <div class="touch-zone touch-down" @touchstart="handleTouchStart('down')" @touchend="handleTouchEnd"></div>
    </div>
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
// Game status
const gameStatus = ref(GAME_STATUS.READY);
// ScorePanel ref — used to call resetAll() and getCoinCount()
const scorePanelRef = ref();

let loadingData: any = ref({});
let gameInstance: Game | null = null;
const exp_canvas = ref<HTMLElement>();

const showGuide = computed(() => {
  return gameStatus.value !== GAME_STATUS.START;
});

// ── Reset all score displays ──────────────────────────────────────────────────
const resetScores = () => {
  console.log('🔄 resetScores called');
  score.value = 0;
  mistake.value = 0;
  // ScorePanel manages its own internal coin count; tell it to reset
  if (scorePanelRef.value) {
    console.log('📢 Calling scorePanelRef.resetAll()');
    scorePanelRef.value.resetAll();
  } else {
    console.warn('⚠️ scorePanelRef.value is null in resetScores');
  }
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

// Mobile touch controls
const handleTouchStart = (direction: string) => {
  console.log('👆 Touch direction:', direction);
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

  const mappedKey = map[e.key];
  if (mappedKey) {
    e.preventDefault();
    console.log('⌨️ Key pressed:', e.key, '→ mapped to:', mappedKey);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: mappedKey }));
  }
};

onMounted(() => {
  console.log('🚀 App mounted, initializing game...');
  console.log('📦 exp_canvas.value:', exp_canvas.value);
  console.log('📦 scorePanelRef.value:', scorePanelRef.value);
  
  // Pass ScorePanel ref to Game so it can call addCoin() / resetAll()
  gameInstance = new Game(exp_canvas.value, scorePanelRef.value);

  window.addEventListener('keydown', handleKeyDown);

  const canvas = exp_canvas.value;
  if (canvas) {
    canvas.addEventListener('touchstart', handleTouchStartSwipe);
    canvas.addEventListener('touchend', handleTouchEndSwipe);
    console.log('✅ Swipe listeners added to canvas');
  } else {
    console.error('❌ Canvas element not found!');
  }

  // Resource loading progress
  if (gameInstance) {
    gameInstance.on('progress', (data: any) => {
      console.log('📊 Loading progress:', data);
      if (data.type === 'successLoad') {
        loadingData.value.type = 'successLoad';
        isReady.value = true;
        console.log('✅ Game ready!');
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
      }
    });

    // ── Live score/mistake updates from game loop ──────────────────────────────
    gameInstance.on('gameData', (data: any) => {
      score.value = data.score;
      mistake.value = data.mistake;
      // coin is NOT synced here — ScorePanel.addCoin() handles it directly
    });
  } else {
    console.error('❌ Failed to create game instance!');
  }
});

onUnmounted(() => {
  console.log('🛑 App unmounting, cleaning up...');
  window.removeEventListener('keydown', handleKeyDown);

  const canvas = exp_canvas.value;
  if (canvas) {
    canvas.removeEventListener('touchstart', handleTouchStartSwipe);
    canvas.removeEventListener('touchend', handleTouchEndSwipe);
  }

  gameInstance?.disposeGame();
});
</script>

<style scoped>
.loading {
  position: fixed;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 999;
  background-color: #fff;
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

.loading-anima.la-dark {
  color: #333;
}

.loading-anima > div {
  display: inline-block;
  float: none;
  background-color: black;
  border: 0 solid black;
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

/* Mobile touch controls */
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
}
</style>