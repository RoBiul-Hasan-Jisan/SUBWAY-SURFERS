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
      :coin="coin" 
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
// Game score
const score = ref(0);
// Game coins - REAL coin count from game
const coin = ref(0);
// Number of small mistakes in the game
const mistake = ref(0);
// Game status
const gameStatus = ref(GAME_STATUS.READY);
// ScorePanel reference
const scorePanelRef = ref();

let loadingData: any = ref({});
let gameInstance: Game | null = null;
const exp_canvas = ref<HTMLElement>();

const showGuide = computed(() => {
  return gameStatus.value !== GAME_STATUS.START;
});

// Handle game action button click
const handleGameAction = () => {
  if (gameStatus.value === GAME_STATUS.READY) {
    // Simulate pressing P to start
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
  } else if (gameStatus.value === GAME_STATUS.END) {
    // Simulate pressing R to restart
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  }
};

// Mobile touch controls
const handleTouchStart = (direction: string) => {
  const event = new KeyboardEvent('keydown', { key: getKeyForDirection(direction) });
  window.dispatchEvent(event);
};

const handleTouchEnd = () => {
  // Optional: handle touch end if needed
};

const getKeyForDirection = (direction: string): string => {
  switch(direction) {
    case 'left': return 'a';
    case 'right': return 'd';
    case 'up': return 'w';
    case 'down': return 's';
    default: return '';
  }
};

// Handle swipe gestures for mobile
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
    // Vertical swipe
    if (deltaY > 0) {
      // Swipe down - Roll
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    } else {
      // Swipe up - Jump
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    }
  } else if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
    // Horizontal swipe
    if (deltaX > 0) {
      // Swipe right - Move right
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    } else {
      // Swipe left - Move left
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    }
  }
  
  touchStartY = 0;
  touchStartX = 0;
};

// Handle keyboard controls with both WASD and Arrow keys
const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key;
  
  // Map arrow keys to WASD equivalents
  let mappedKey = key;
  if (key === 'ArrowUp') mappedKey = 'w';
  if (key === 'ArrowDown') mappedKey = 's';
  if (key === 'ArrowLeft') mappedKey = 'a';
  if (key === 'ArrowRight') mappedKey = 'd';
  if (key === ' ') mappedKey = 'w'; // Spacebar for jump
  
  // Create and dispatch the mapped event
  if (mappedKey !== key) {
    e.preventDefault();
    const newEvent = new KeyboardEvent('keydown', { key: mappedKey });
    window.dispatchEvent(newEvent);
  }
};

onMounted(() => {
  // Pass the ScorePanel ref to Game for real coin collection
  gameInstance = new Game(exp_canvas.value, scorePanelRef.value);
  
  // Add keyboard event listener for arrow keys
  window.addEventListener('keydown', handleKeyDown);
  
  // Add touch swipe listeners for mobile
  const canvas = exp_canvas.value;
  if (canvas) {
    canvas.addEventListener('touchstart', handleTouchStartSwipe);
    canvas.addEventListener('touchend', handleTouchEndSwipe);
  }
  
  // Resource loading
  gameInstance.on('progress', (data: any) => {
    const { type } = data;
    if (type === 'successLoad') {
      loadingData.value.type = 'successLoad';
      isReady.value = true;
    }
    else {
      loadingData.value = data;
    }
  });
  
  gameInstance.on('gameStatus', (data: GAME_STATUS) => {
    console.log('Game status:', data);
    gameStatus.value = data;
  });
  
  gameInstance.on('gameData', (data: any) => {
    score.value = data.score;
    mistake.value = data.mistake;
    // Don't update coin here - ScorePanel manages it internally
  });
  
  // Listen for coin collection events from game
  if (gameInstance) {
    gameInstance.on('coinCollected', (amount: number) => {
      // Update local coin display from ScorePanel
      if (scorePanelRef.value) {
        coin.value = scorePanelRef.value.getCoinCount();
      }
    });
  }
});

onUnmounted(() => {
  // Remove event listeners
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
.loading-anima>div {
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

.loading-anima>div {
  display: inline-block;
  float: none;
  background-color: black;
  border: 0 solid black;
}

.loading-anima {
  width: 54px;
  height: 18px;
}

.aaa>div {
  width: 10px;
  height: 10px;
  margin: 4px;
  border-radius: 100%;
  animation: ball-pulse-sync .6s infinite ease-in-out;
}

.loading-anima>div:nth-child(1) {
  animation-delay: -.14s;
}

.loading-anima>div:nth-child(2) {
  animation-delay: -.07s;
}

.loading-anima>div:nth-child(3) {
  animation-delay: 0s;
}

@keyframes ball-pulse-sync {
  33% {
    transform: translateY(100%);
  }
  66% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
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

/* Mobile touch controls overlay */
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

.touch-left {
  bottom: 20px;
  left: 20px;
}

.touch-right {
  bottom: 20px;
  right: 20px;
}

.touch-up {
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
}

.touch-down {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.touch-zone:active {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

@media (min-width: 769px) {
  .mobile-controls-overlay {
    display: none;
  }
}

@media (max-width: 768px) {
  .touch-zone {
    width: 60px;
    height: 60px;
  }
}
</style>