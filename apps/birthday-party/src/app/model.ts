import { createEvent, createStore, sample } from 'effector';

export const $audioDuration = createStore<number>(0);
export const exportClicked = createEvent();
export const audioDurationChanged = createEvent<number>();

sample({
  clock: audioDurationChanged,
  target: $audioDuration,
});
