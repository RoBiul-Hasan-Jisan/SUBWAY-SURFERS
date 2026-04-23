<template>
  <div class="score-container">
    <div class="score-panel">
      <div class="score-item">
        <span class="label">Score:</span>
        <span class="value">{{ formattedScore }}</span>
      </div>
      <div class="score-item">
        <span class="label">Coins:</span>
        <span class="value coin-value" :class="{ 'coin-pop': coinPopping }">
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
import { computed, ref, watch } from 'vue';

interface Props {
  score?: number;
  mistake?: number;
  coins?: number;  // ✅ Add coins prop
}

const props = withDefaults(defineProps<Props>(), {
  score: 0,
  mistake: 0,
  coins: 0
});

// Only for animation - NOT for storing state
const coinPopping = ref(false);

// Watch for coin changes to trigger animation
watch(() => props.coins, (newVal, oldVal) => {
  if (newVal > oldVal) {
    coinPopping.value = true;
    setTimeout(() => {
      coinPopping.value = false;
    }, 300);
  }
});

// Computed formatting - using props directly
const formattedScore = computed(() => Math.floor(props.score).toLocaleString());
const formattedCoins = computed(() => props.coins.toLocaleString());
const formattedMistakes = computed(() => props.mistake.toLocaleString());
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