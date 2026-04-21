<template>
  <div class="score-container">
    <div class="score-panel">
      <div class="score-item">
        <span class="label">Score:</span>
        <span class="value">{{ formattedScore }}</span>
      </div>
      <div class="score-item">
        <span class="label">Coins:</span>
        <span class="value coin-value">
          🪙 {{ formattedCoins }}
        </span>
      </div>
      <div class="score-item">
        <span class="label">Mistakes:</span>
        <span class="value mistake-value">{{ formattedMistakes }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';

interface Props {
  score?: number;
  mistake?: number;
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  mistake: 0
});

// Internal coin state with random generation
const coinCount = ref(0);
let coinInterval: number | null = null;
let lastCoinTime = Date.now();

// Random coin generation settings
const COIN_CONFIG = {
  BASE_INTERVAL: 2000,      // Base interval 2 seconds
  RANDOM_RANGE: 3000,       // Random extra time up to 3 seconds
  MIN_COINS: 1,             // Minimum coins per drop
  MAX_COINS: 5,             // Maximum coins per drop
  COLLECT_PROBABILITY: 0.7  // 70% chance to actually collect coins
};

// Generate random coins
const generateRandomCoins = () => {
  // Random chance to spawn coins (70% of the time)
  if (Math.random() < COIN_CONFIG.COLLECT_PROBABILITY) {
    const coinsEarned = Math.floor(
      Math.random() * (COIN_CONFIG.MAX_COINS - COIN_CONFIG.MIN_COINS + 1) + COIN_CONFIG.MIN_COINS
    );
    
    coinCount.value += coinsEarned;
    
    // Visual feedback animation
    animateCoinCollection(coinsEarned);
    
    console.log(`🎉 Earned ${coinsEarned} coins! Total: ${coinCount.value}`);
  } else {
    console.log('😢 No coins this time...');
  }
};

// Animation for coin collection
const animateCoinCollection = (amount: number) => {
  const coinElement = document.querySelector('.coin-value');
  if (coinElement) {
    coinElement.classList.add('coin-pop');
    setTimeout(() => {
      coinElement.classList.remove('coin-pop');
    }, 300);
  }
};

// Start random coin generation
const startCoinGeneration = () => {
  if (coinInterval) clearInterval(coinInterval);
  
  const scheduleNextCoin = () => {
    const randomDelay = COIN_CONFIG.BASE_INTERVAL + Math.random() * COIN_CONFIG.RANDOM_RANGE;
    coinInterval = setTimeout(() => {
      generateRandomCoins();
      scheduleNextCoin();
    }, randomDelay) as unknown as number;
  };
  
  scheduleNextCoin();
};

// Manual coin collection (can be called from parent component)
const collectCoins = (amount: number = 1) => {
  coinCount.value += amount;
  animateCoinCollection(amount);
  console.log(`💰 Manually collected ${amount} coins!`);
};

// Bonus coins for special events
const bonusCoins = (multiplier: number = 1) => {
  const bonusAmount = Math.floor(Math.random() * 50) + 10 * multiplier;
  coinCount.value += bonusAmount;
  console.log(`🎁 BONUS! +${bonusAmount} coins!`);
};

// Reset coins (if needed)
const resetCoins = () => {
  coinCount.value = 0;
  console.log('Coins reset to 0');
};

// Expose methods to parent component
defineExpose({
  collectCoins,
  bonusCoins,
  resetCoins,
  getCoinCount: () => coinCount.value
});

// Computed properties for formatting
const formattedScore = computed(() => props.score.toLocaleString());
const formattedCoins = computed(() => Math.floor(coinCount.value).toLocaleString());
const formattedMistakes = computed(() => props.mistake.toLocaleString());

// Watch for game score to give bonus coins
watch(() => props.score, (newScore, oldScore) => {
  if (newScore > oldScore && newScore % 100 === 0) {
    // Give bonus coins every 100 points
    const bonusAmount = Math.floor(newScore / 100) * 5;
    coinCount.value += bonusAmount;
    console.log(`🎯 Score milestone! +${bonusAmount} bonus coins!`);
  }
});

// Watch for mistakes to penalize coins
watch(() => props.mistake, (newMistake, oldMistake) => {
  if (newMistake > oldMistake && newMistake % 3 === 0) {
    // Penalty every 3 mistakes
    const penalty = Math.floor(coinCount.value * 0.1);
    coinCount.value = Math.max(0, coinCount.value - penalty);
    console.log(`⚠️ Penalty! Lost ${penalty} coins!`);
  }
});

// Lifecycle hooks
onMounted(() => {
  startCoinGeneration();
  console.log('💰 Coin generator started!');
});

onUnmounted(() => {
  if (coinInterval) {
    clearTimeout(coinInterval);
    clearInterval(coinInterval);
  }
  console.log('Coin generator stopped');
});
</script>

<style scoped>
.score-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none;
}

.score-panel {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 20px;
  min-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Arial', sans-serif;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
  color: white;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.score-item:first-child {
  margin-top: 0;
}

.score-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  opacity: 0.8;
  margin-right: 20px;
}

.value {
  font-weight: 700;
  color: #ffd700;
  font-size: 18px;
  transition: all 0.3s ease;
}

.coin-value {
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.coin-pop {
  animation: coinPop 0.3s ease-out;
}

.mistake-value {
  color: #ff4444;
}

@keyframes coinPop {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    color: #ffaa00;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .score-container {
    top: 10px;
    right: 10px;
  }
  
  .score-panel {
    padding: 8px 15px;
    min-width: 140px;
  }
  
  .score-item {
    font-size: 14px;
    margin: 5px 0;
  }
  
  .value {
    font-size: 16px;
  }
}

/* Hover effect for desktop */
@media (min-width: 769px) {
  .score-panel:hover {
    transform: scale(1.05);
    transition: transform 0.3s ease;
    background: rgba(0, 0, 0, 0.95);
  }
}
</style>