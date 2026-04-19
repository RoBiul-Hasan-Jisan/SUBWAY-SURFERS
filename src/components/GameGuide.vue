<template>
  <div v-if="showMask" class="game-mask">
    <div class="message-container">
      <div class="message">{{ textCompute.message }}</div>
      <div class="controls-info">
        <div class="control-group" v-if="textCompute.showControls">
          <h3>Controls</h3>
          <div class="control-row">
            <span class="key">↑</span>
            <span class="key">W</span>
            <span>Jump</span>
          </div>
          <div class="control-row">
            <span class="key">↓</span>
            <span class="key">S</span>
            <span>Roll/Slide</span>
          </div>
          <div class="control-row">
            <span class="key">←</span>
            <span class="key">A</span>
            <span>Move Left</span>
          </div>
          <div class="control-row">
            <span class="key">→</span>
            <span class="key">D</span>
            <span>Move Right</span>
          </div>
          <div class="control-row">
            <span class="key">Space</span>
            <span>Jump</span>
          </div>
          <div class="control-row mobile-controls">
            <span>📱 Touch:</span>
            <span>Swipe Up → Jump</span>
            <span>Swipe Down → Roll</span>
            <span>Swipe Left/Right → Move</span>
          </div>
        </div>
      </div>
      <div class="action-button" @click="handleAction">
        <span class="key">{{ textCompute.key }}</span>
        <span>{{ textCompute.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {defineProps, computed, defineEmits} from 'vue';

const props = defineProps({
  showMask: {type: Boolean, default: false},
  gameStatus: {type: String, default: 'ready'},
});

const emit = defineEmits(['action']);

const keyMap: Record<string, any> = {
  ready: {
    key: 'P',
    text: 'Start Game',
    message: 'Ready to Run!',
    showControls: true
  },
  end: {
    key: 'R',
    text: 'Restart Game',
    message: 'Game Over!',
    showControls: true
  },
};

const textCompute = computed(() => {
  return keyMap[props.gameStatus] || {
    key: 'P',
    text: 'Start',
    message: 'Press to Start',
    showControls: true
  };
});

const handleAction = () => {
  emit('action');
};
</script>

<style scoped>
.game-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(5px);
}

.message-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  animation: fadeIn 0.5s ease;
}

.message {
  font-size: 32px;
  color: white;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.controls-info {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

.controls-info h3 {
  color: white;
  margin: 0 0 15px 0;
  font-size: 20px;
}

.control-group {
  text-align: left;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
  color: white;
  font-size: 16px;
  flex-wrap: wrap;
}

.control-row .key {
  background-color: #3498db;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  min-width: 60px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.mobile-controls {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.mobile-controls span:first-child {
  font-weight: bold;
  margin-bottom: 5px;
}

.action-button {
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid white;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.action-button:active {
  transform: scale(0.95);
}

.action-button .key {
  background-color: #ff6b6b;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .message-container {
    padding: 20px;
  }
  
  .message {
    font-size: 24px;
  }
  
  .control-row {
    font-size: 14px;
  }
  
  .control-row .key {
    padding: 6px 12px;
    font-size: 14px;
    min-width: 50px;
  }
  
  .action-button {
    padding: 10px 20px;
  }
}
</style>