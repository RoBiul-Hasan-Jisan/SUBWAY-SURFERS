<template>
  <div style="display: none;">
    <audio ref="audioPlayer" loop preload="auto">
      <source :src="audioSrc" type="audio/wav">
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  isPlaying?: boolean;
  volume?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: true,
  volume: 0.5
});

const audioPlayer = ref<HTMLAudioElement | null>(null);
const audioSrc = '/assets/audio/song1.wav';

onMounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = props.volume;
    
    // Auto-play (browsers may block this - need user interaction)
    if (props.isPlaying) {
      audioPlayer.value.play().catch(e => {
        console.log('Audio autoplay blocked. Will start after user interaction.', e);
      });
    }
  }
});

// Watch for play/pause changes
watch(() => props.isPlaying, (playing) => {
  if (audioPlayer.value) {
    if (playing) {
      audioPlayer.value.play().catch(e => console.log('Play failed:', e));
    } else {
      audioPlayer.value.pause();
    }
  }
});

// Watch for volume changes
watch(() => props.volume, (vol) => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = vol;
  }
});

// Expose method to start audio (for user interaction)
const startAudio = () => {
  if (audioPlayer.value && audioPlayer.value.paused) {
    audioPlayer.value.play().catch(e => console.log('Play failed:', e));
  }
};

defineExpose({ startAudio });
</script>