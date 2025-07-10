import { createEvent, createStore, sample } from 'effector';

export const exportClicked = createEvent();
export const errorDismissed = createEvent();
export const audioLoaded = createEvent();
export const audioRemoved = createEvent();

export const $error = createStore<Error | null>(null);
const $loadedAudio = createStore(0);
export const $isLoaded = $loadedAudio.map((count) => count === 2);

sample({
  clock: errorDismissed,
  fn: () => null,
  target: $error,
})


sample({
  clock: audioLoaded,
  source: $loadedAudio,
  fn: (count) => count + 1,
  target: $loadedAudio,
})

sample({
  clock: audioRemoved,
  target: $loadedAudio.reinit
})