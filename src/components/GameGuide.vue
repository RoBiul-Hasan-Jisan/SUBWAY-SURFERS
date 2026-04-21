<template>
  <Transition name="mask">
    <div v-if="showMask" class="overlay" @keydown.stop>

      <div class="panel">

        <!-- START screen -->
        <template v-if="gameStatus === 'ready'">
          <div class="panel-title">Ready to run</div>
          <div class="panel-subtitle">Dodge obstacles, collect coins, survive</div>

          <div class="divider" />

          <div class="controls-section">
            <div class="controls-label">Controls</div>
            <div class="controls-grid">
              <div class="ctrl"><span class="key">W</span><span class="key arrow">↑</span><span>Jump</span></div>
              <div class="ctrl"><span class="key">S</span><span class="key arrow">↓</span><span>Roll</span></div>
              <div class="ctrl"><span class="key">A</span><span class="key arrow">←</span><span>Left</span></div>
              <div class="ctrl"><span class="key">D</span><span class="key arrow">→</span><span>Right</span></div>
              <div class="ctrl"><span class="key wide">Space</span><span>Jump</span></div>
              <div class="ctrl"><span class="key">P</span><span>Pause</span></div>
            </div>
          </div>

          <div class="mobile-hint">
            Touch: swipe up · down · left · right
          </div>

          <button class="btn btn-primary" @click="handleAction">
            Press <kbd>P</kbd> to start
          </button>
        </template>

        <!-- GAME OVER screen -->
        <template v-else-if="gameStatus === 'end'">
          <div class="panel-title">Game over</div>

          <div class="stats-grid">
            <div class="stat">
              <div class="stat-label">Score</div>
              <div class="stat-value">{{ score.toLocaleString() }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Coins</div>
              <div class="stat-value gold">🪙 {{ coins.toLocaleString() }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Mistakes</div>
              <div class="stat-value danger">{{ mistakes }}</div>
            </div>
          </div>

          <div class="stats-grid two-col">
            <div class="stat">
              <div class="stat-label">Level reached</div>
              <div class="stat-value info">{{ difficulty }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Best score</div>
              <div class="stat-value">{{ bestScore.toLocaleString() }}</div>
            </div>
          </div>

          <div class="divider" />

          <button class="btn btn-danger" @click="handleAction">
            Press <kbd>R</kbd> to restart
          </button>
        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from 'vue';

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

// Keyboard shortcuts: P = start, R = restart
const onKey = (e: KeyboardEvent) => {
  if (!props.showMask) return;
  if (props.gameStatus === 'ready' && e.key.toLowerCase() === 'p') emit('action');
  if (props.gameStatus === 'end'   && e.key.toLowerCase() === 'r') emit('action');
};

watch(() => props.showMask, (visible) => {
  if (visible) window.addEventListener('keydown', onKey);
  else         window.removeEventListener('keydown', onKey);
}, { immediate: true });

const handleAction = () => emit('action');
</script>

<style scoped>
/* ── overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.76);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

/* ── panel ── */
.panel {
  background: #ffffff;
  border-radius: 20px;
  border: 0.5px solid rgba(0,0,0,0.08);
  padding: 2rem 2.25rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

@media (prefers-color-scheme: dark) {
  .panel { background: #1c1c1e; border-color: rgba(255,255,255,0.08); }
}

/* ── headings ── */
.panel-title {
  font-size: 26px;
  font-weight: 600;
  color: #111;
  text-align: center;
}

.panel-subtitle {
  font-size: 14px;
  color: #888;
  text-align: center;
  margin-top: -0.75rem;
}

@media (prefers-color-scheme: dark) {
  .panel-title { color: #f5f5f7; }
}

/* ── divider ── */
.divider {
  height: 0.5px;
  background: rgba(0,0,0,0.08);
}
@media (prefers-color-scheme: dark) {
  .divider { background: rgba(255,255,255,0.1); }
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
  gap: 6px;
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
  border: 0.5px solid #d8d8d8;
  border-bottom-width: 2px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  padding: 3px 7px;
  min-width: 26px;
  line-height: 1.5;
}

.key.wide  { min-width: 52px; }
.key.arrow { font-size: 14px; }

@media (prefers-color-scheme: dark) {
  .key { background: #2c2c2e; border-color: #444; color: #e5e5ea; }
}

/* ── mobile hint ── */
.mobile-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 8px 12px;
}

@media (prefers-color-scheme: dark) {
  .mobile-hint { background: #2c2c2e; color: #888; }
}

/* ── stat cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stats-grid.two-col {
  grid-template-columns: repeat(2, 1fr);
}

.stat {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

@media (prefers-color-scheme: dark) {
  .stat { background: #2c2c2e; }
}

.stat-label {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #111;
}

.stat-value.gold    { color: #b87500; }
.stat-value.danger  { color: #cc2222; }
.stat-value.info    { color: #185fa5; }

@media (prefers-color-scheme: dark) {
  .stat-value        { color: #f5f5f7; }
  .stat-value.gold   { color: #f0a500; }
  .stat-value.danger { color: #ff6b6b; }
  .stat-value.info   { color: #4eb0ff; }
}

/* ── buttons ── */
.btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.2px;
}

.btn:active { transform: scale(0.98); }

.btn kbd {
  background: rgba(255,255,255,0.22);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 0;
}

.btn-primary {
  background: #111;
  color: #fff;
}
.btn-primary:hover { opacity: 0.85; }

.btn-danger {
  background: #fff0f0;
  color: #cc2222;
  border: 0.5px solid #ffcccc;
}
.btn-danger:hover { background: #ffe4e4; }

@media (prefers-color-scheme: dark) {
  .btn-primary { background: #f5f5f7; color: #111; }
  .btn-danger  { background: #3a1a1a; color: #ff6b6b; border-color: #5a2020; }
  .btn-danger:hover { background: #451f1f; }
}

/* ── transition ── */
.mask-enter-active { animation: maskIn 0.25s ease-out; }
.mask-leave-active { animation: maskIn 0.2s ease-in reverse; }

@keyframes maskIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.mask-enter-active .panel { animation: panelIn 0.28s cubic-bezier(0.34,1.56,0.64,1); }
.mask-leave-active .panel { animation: panelIn 0.18s ease-in reverse; }

@keyframes panelIn {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
</style>