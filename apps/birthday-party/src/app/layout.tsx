import { CompactWaveform } from '@birthday-party/compact-waveform';

import { $audioDuration, exportClicked } from './model';
import { useUnit } from 'effector-react';

export const AudioWorkspace = () => {
  const audioDuration = useUnit($audioDuration);
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Sample duration: {Math.floor(audioDuration / 60)}
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
          onClick={() => exportClicked()}
        >
          Export
        </button>
      </div>

      <div className="grid gap-6">
        <CompactWaveform title="Original Audio" id="original" />
        <CompactWaveform title="Reversed Audio" id="reversed" />
      </div>

      <div className="flex justify-center mt-8">
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          Professional WaveSurfer.js waveforms • Drag region edges to resize •
          Drag center to move
        </div>
      </div>
    </div>
  );
};
