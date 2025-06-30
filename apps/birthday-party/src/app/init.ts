import { createEvent, createEffect, createStore, sample, combine } from 'effector';

// --- Types ---
export interface AudioData {
  originalBuffer: ArrayBuffer;
  reversedBuffer: ArrayBuffer;
  duration: number;
  sampleRate: number;
  fileName: string;
}

export interface WaveformWindow {
  startTime: number;
  endTime: number;
  duration: number;
}

// --- Events ---
export const audioFileChanged = createEvent<File>();
export const windowSelectionChanged = createEvent<WaveformWindow>();
export const playbackStarted = createEvent<{ isReversed: boolean }>();
export const playbackStopped = createEvent<void>();
export const playbackPositionChanged = createEvent<number>();

// --- Effects ---
export const processAudioFx = createEffect<File, AudioData, Error>();
export const playAudioFx = createEffect<{ buffer: ArrayBuffer; startTime: number; endTime: number }, void, Error>();
export const stopAudioFx = createEffect<void, void, Error>();

// --- Stores ---
export const $audioData = createStore<AudioData | null>(null);
export const $waveformWindow = createStore<WaveformWindow>({
  startTime: 0,
  endTime: 30,
  duration: 30,
});
export const $isPlaying = createStore<boolean>(false);
export const $playbackPosition = createStore<number>(0);
export const $currentlyPlayingReversed = createStore<boolean>(false);

// --- Derived Stores ---
export const $hasAudio = $audioData.map(data => !!data);
export const $totalDuration = $audioData.map(data => data?.duration || 0);

// --- Logic ---

// When audio file changes, process it
sample({
  clock: audioFileChanged,
  target: processAudioFx,
});

// Update audio data when processing is complete
sample({
  clock: processAudioFx.doneData,
  target: $audioData,
});

// Update window selection
sample({
  clock: windowSelectionChanged,
  target: $waveformWindow,
});

// Auto-adjust window when new audio is loaded
sample({
  clock: processAudioFx.doneData,
  fn: (audioData): WaveformWindow => ({
    startTime: 0,
    endTime: Math.min(30, audioData.duration),
    duration: Math.min(30, audioData.duration),
  }),
  target: $waveformWindow,
});

// Handle playback
sample({
  clock: playbackStarted,
  fn: ({ isReversed }) => isReversed,
  target: $currentlyPlayingReversed,
});

sample({
  clock: playbackStarted,
  fn: () => true,
  target: $isPlaying,
});

sample({
  clock: [playbackStopped, stopAudioFx.done],
  fn: () => false,
  target: $isPlaying,
});

sample({
  clock: playbackPositionChanged,
  target: $playbackPosition,
});

// --- Audio Processing Implementation ---

processAudioFx.use(async (file: File): Promise<AudioData> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create reversed buffer
    const reversedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Reverse each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const reversedData = reversedBuffer.getChannelData(channel);
      
      for (let i = 0; i < originalData.length; i++) {
        reversedData[i] = originalData[originalData.length - 1 - i];
      }
    }
    
    // Convert buffers back to ArrayBuffer for storage
    const originalArrayBuffer = await audioBufferToArrayBuffer(audioBuffer);
    const reversedArrayBuffer = await audioBufferToArrayBuffer(reversedBuffer);
    
    return {
      originalBuffer: originalArrayBuffer,
      reversedBuffer: reversedArrayBuffer,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      fileName: file.name,
    };
  } finally {
    audioContext.close();
  }
});

// Helper function to convert AudioBuffer to ArrayBuffer
async function audioBufferToArrayBuffer(audioBuffer: AudioBuffer): Promise<ArrayBuffer> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create a simple WAV file ArrayBuffer
  const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert float32 samples to int16
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return buffer;
}

// Playback implementation
playAudioFx.use(async ({ buffer, startTime, endTime }) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
  const source = audioContext.createBufferSource();
  
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  
  const duration = endTime - startTime;
  source.start(0, startTime, duration);
  
  // Auto-stop after duration
  setTimeout(() => {
    stopAudioFx();
  }, duration * 1000);
});

stopAudioFx.use(async () => {
  // Implementation for stopping audio
  // This would typically involve stopping the current audio source
}); 