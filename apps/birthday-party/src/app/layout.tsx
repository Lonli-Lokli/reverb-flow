import { CompactWaveform } from '@birthday-party/compact-waveform';

import { $isLoaded, exportClicked } from './model';
import { ErrorDisplay } from './error';
import { useUnit } from 'effector-react';
import { WindowController } from '@birthday-party/window-controller';

export const AudioWorkspace = () => {
  const isLoaded = useUnit($isLoaded);
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => exportClicked()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
        >
          Export
        </button>
        {isLoaded && <WindowController />}
      </div>

      <div className="grid gap-6">
        <CompactWaveform title="Original Audio" id="original" />
        <CompactWaveform title="Reversed Audio" id="reversed" />
      </div>

      <ErrorDisplay />

      <div className="flex justify-center mt-8">
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          Professional WaveSurfer.js waveforms • Drag region edges to resize •
          Drag center to move • Set duration above to control window size
        </div>
      </div>
    </div>
  );
};
