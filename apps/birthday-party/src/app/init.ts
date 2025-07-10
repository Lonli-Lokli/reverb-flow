import * as audioUploader from '@birthday-party/audio-uploader';
import * as compactWaveform from '@birthday-party/compact-waveform';
import * as windowController from '@birthday-party/window-controller';
import * as app from './model';
import { sample } from 'effector';

sample({
  clock: audioUploader.fileSelected,
  fn: (file) => ({
    file: file.file,
    originalId: 'original',
    reversedId: 'reversed',
  }),
  target: compactWaveform.audioSelected,
});

sample({
  clock: audioUploader.clearFile,
  target: [compactWaveform.audioRemoved, app.audioRemoved],
})
sample({
  clock: app.exportClicked,
  target: compactWaveform.exportClicked,
})

sample({
  clock: compactWaveform.durationChangedByMove,
  target: windowController.durationChangedByMove,
})

sample({
  clock: windowController.durationChangedBySlider,
  target: compactWaveform.durationChangedBySlider
})

sample({
  clock: compactWaveform.audioLoaded,
  target: app.audioLoaded
})
sample({
  clock: compactWaveform.errorOccurred,
  target: app.$error,
})

