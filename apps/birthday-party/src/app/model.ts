import { createEvent, createStore, sample } from 'effector';

export const $audioDuration = createStore<number>(0);
export const exportClicked = createEvent();
export const audioDurationChanged = createEvent<number>();
export const userDurationChanged = createEvent<number>();
export const errorDismissed = createEvent();

sample({
  clock: audioDurationChanged,
  target: $audioDuration,
});

sample({
  clock: userDurationChanged,
  target: $audioDuration,
});

export const $error = createStore<Error | null>(null);

sample({
  clock: errorDismissed,
  fn: () => null,
  target: $error,
})
