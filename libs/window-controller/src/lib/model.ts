import { createEvent, createStore, sample } from 'effector';
import { createAction } from 'effector-action';

type ViewModel = {
  start: number;
  end: number;
  totalDuration: number;
  sampleDuration: number;
};

export const durationChangedByMove = createEvent<{
  start: number;
  end: number;
  totalDuration: number;
}>();
export const durationChangedBySlider = createEvent<{
  start: number;
  end: number;
}>();
export const durationChanged = createEvent<number>();
export const updateTime = createEvent<{
  type: 'start' | 'end';
  value: number;
}>();
export const $viewModel = createStore<ViewModel>({
  end: 0,
  start: 0,
  totalDuration: 0,
  sampleDuration: 0,
});

sample({
  clock: durationChangedByMove,
  fn: (sample) => ({
    start: sample.start,
    end: sample.end,
    totalDuration: sample.totalDuration,
    sampleDuration: sample.end - sample.start,
  }),
  target: $viewModel,
});

createAction({
  clock: updateTime,
  source: { $viewModel },
  target: { $viewModel, durationChangedBySlider },
  fn: (target, { viewModel }, { type, value }) => {
    const newValue = type === 'start' ? value : viewModel.start;
    const endValue = type === 'end' ? value : viewModel.end;

    target.$viewModel({
      start: newValue,
      end: endValue,
      sampleDuration: endValue - newValue,
      totalDuration: viewModel.totalDuration,
    });
    target.durationChangedBySlider({
      start: newValue,
      end: endValue,
    })
  },
});

sample({
  clock: durationChanged,
  source: $viewModel,
  fn: (viewModel, duration) => ({
    start: viewModel.start,
    end: viewModel.start + duration,
    sampleDuration: duration,
    totalDuration: viewModel.totalDuration,
  }),
  target: $viewModel,
});
