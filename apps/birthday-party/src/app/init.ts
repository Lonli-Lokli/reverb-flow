import * as audioUploader from '@birthday-party/audio-uploader';
import * as compactWaveform from '@birthday-party/compact-waveform';
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
  clock: app.exportClicked,
  target: compactWaveform.exportClicked,
})

sample({
  clock: compactWaveform.durationChanged,
  target: app.audioDurationChanged,
})

sample({
  clock: compactWaveform.errorOccurred,
  target: app.$error,
})