<template>
  <Transition name="mask">
    <div v-if="showMask" class="overlay" @keydown.stop>

      <div class="panel">

        <!-- START screen -->
        <template v-if="gameStatus === 'ready'">
          <div class="panel-title">🏃 Ready to run</div>
          <div class="panel-subtitle">Dodge obstacles, collect coins, survive</div>

          <div class="divider" />

          <div class="controls-section">
            <div class="controls-label">🎮 Controls</div>
            <div class="controls-grid">
              <div class="ctrl"><span class="key">W</span><span class="key arrow">↑</span><span>Jump</span></div>
              <div class="ctrl"><span class="key">S</span><span class="key arrow">↓</span><span>Roll</span></div>
              <div class="ctrl"><span class="key">A</span><span class="key arrow">←</span><span>Left</span></div>
              <div class="ctrl"><span class="key">D</span><span class="key arrow">→</span><span>Right</span></div>
              <div class="ctrl"><span class="key wide">Space</span><span>Jump</span></div>
              <div class="ctrl"><span class="key">P</span><span>Start/Pause</span></div>
            </div>
          </div>

          <div class="mobile-hint">
            📱 Touch: swipe ↑ ↓ ← →
          </div>

          <button class="btn btn-primary" @click="handleAction">
            🎮 Press <kbd>P</kbd> to start
          </button>
        </template>

        <!-- GAME OVER screen -->
        <template v-else-if="gameStatus === 'end'">
          <div class="panel-title">💀 Game over</div>

          <div class="stats-grid">
            <div class="stat">
              <div class="stat-label">🏆 Score</div>
              <div class="stat-value">{{ score.toLocaleString() }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">🪙 Coins</div>
              <div class="stat-value gold">{{ coins.toLocaleString() }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">⚠️ Mistakes</div>
              <div class="stat-value danger">{{ mistakes }}</div>
            </div>
          </div>

          <div class="stats-grid two-col">
            <div class="stat">
              <div class="stat-label">⚡ Level</div>
              <div class="stat-value info">{{ difficulty }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">🏅 Best score</div>
              <div class="stat-value">{{ bestScore.toLocaleString() }}</div>
            </div>
          </div>

          <div class="divider" />

          <button class="btn btn-danger" @click="handleAction">
            🔄 Press <kbd>R</kbd> to restart
          </button>
        </template>

        <!-- PAUSE screen (optional) -->
        <template v-else-if="gameStatus === 'pause'">
          <div class="panel-title">⏸️ Game paused</div>
          
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-label">Current score</div>
              <div class="stat-value">{{ score.toLocaleString() }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Coins collected</div>
              <div class="stat-value gold">{{ coins.toLocaleString() }}</div>
            </div>
          </div>

          <div class="divider" />

          <button class="btn btn-primary" @click="handleAction">
            ▶️ Press <kbd>P</kbd> to resume
          </button>
        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue';

const props = defineProps({
  showMask:   { type: Boolean, default: false },
  gameStatus: { type: String,  default: 'ready' },
  score:      { type: Number,  default: 0 },
  coins:      { type: Number,  default: 0 },
  mistakes:   { type: Number,  default: 0 },
  difficulty: { type: Number,  default: 1 },
  bestScore:  { type: Number,  default: 0 },
});

const emit = defineEmits(['action']);

// Keyboard shortcuts: P = start/pause, R = restart
const onKey = (e: KeyboardEvent) => {
  if (!props.showMask) return;
  
  const key = e.key.toLowerCase();
  
  if (props.gameStatus === 'ready' && key === 'p') {
    e.preventDefault();
    emit('action');
  } else if (props.gameStatus === 'end' && key === 'r') {
    e.preventDefault();
    emit('action');
  } else if (props.gameStatus === 'pause' && key === 'p') {
    e.preventDefault();
    emit('action');
  }
};

watch(() => props.showMask, (visible) => {
  if (visible) {
    window.addEventListener('keydown', onKey);
  } else {
    window.removeEventListener('keydown', onKey);
  }
}, { immediate: true });

// Clean up event listener on component unmount
onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
});

const handleAction = () => {
  emit('action');
};
</script>

<style scoped>
/* ── overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

/* ── panel ── */
.panel {
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.08);
  padding: 2rem 2.25rem;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  box-shadow: 0 20px 35px -8px rgba(0,0,0,0.2);
}

@media (prefers-color-scheme: dark) {
  .panel { 
    background: #1c1c1e; 
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 20px 35px -8px rgba(0,0,0,0.4);
  }
}

/* ── headings ── */
.panel-title {
  font-size: 28px;
  font-weight: 700;
  color: #111;
  text-align: center;
}

.panel-subtitle {
  font-size: 14px;
  color: #888;
  text-align: center;
  margin-top: -0.5rem;
}

@media (prefers-color-scheme: dark) {
  .panel-title { color: #f5f5f7; }
}

/* ── divider ── */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
}
@media (prefers-color-scheme: dark) {
  .divider { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); }
}

/* ── controls ── */
.controls-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 10px;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
}

@media (prefers-color-scheme: dark) {
  .ctrl { color: #bbb; }
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #333;
  padding: 4px 8px;
  min-width: 32px;
  line-height: 1.4;
  font-family: monospace;
}

.key.wide  { min-width: 60px; }
.key.arrow { font-size: 14px; }

@media (prefers-color-scheme: dark) {
  .key { 
    background: #2c2c2e; 
    border-color: #444; 
    color: #e5e5ea; 
  }
}

/* ── mobile hint ── */
.mobile-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
  background: #f8f8f8;
  border-radius: 10px;
  padding: 10px 12px;
}

@media (prefers-color-scheme: dark) {
  .mobile-hint { background: #2c2c2e; color: #888; }
}

/* ── stat cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stats-grid.two-col {
  grid-template-columns: repeat(2, 1fr);
}

.stat {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  transition: transform 0.2s ease;
}

.stat:hover {
  transform: translateY(-2px);
}

@media (prefers-color-scheme: dark) {
  .stat { background: #2c2c2e; }
}

.stat-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  font-weight: 600;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111;
}

.stat-value.gold    { color: #f5a623; }
.stat-value.danger  { color: #e74c3c; }
.stat-value.info    { color: #3498db; }

@media (prefers-color-scheme: dark) {
  .stat-value        { color: #f5f5f7; }
  .stat-value.gold   { color: #f5a623; }
  .stat-value.danger { color: #ff6b6b; }
  .stat-value.info   { color: #5dade2; }
}

/* ── buttons ── */
.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.btn:active { transform: scale(0.97); }

.btn kbd {
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 13px;
  font-family: monospace;
  font-weight: 600;
  margin-left: 4px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

@media (prefers-color-scheme: dark) {
  .btn-primary {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%);
  }
  .btn-danger {
    background: linear-gradient(135deg, #d53f8c 0%, #c53030 100%);
  }
}

/* ── transition ── */
.mask-enter-active { animation: maskIn 0.3s ease-out; }
.mask-leave-active { animation: maskIn 0.2s ease-in reverse; }

@keyframes maskIn {
  from { opacity: 0; backdrop-filter: blur(0); }
  to   { opacity: 1; backdrop-filter: blur(4px); }
}

.mask-enter-active .panel { animation: panelIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.mask-leave-active .panel { animation: panelIn 0.2s ease-in reverse; }

@keyframes panelIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>