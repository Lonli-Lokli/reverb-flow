import { CompactWaveform } from '@birthday-party/compact-waveform';

import { $audioDuration, exportClicked, userDurationChanged } from './model';
import { useUnit } from 'effector-react';
import { ErrorDisplay } from './error';

const handleDurationChange: React.ChangeEventHandler<HTMLInputElement> = (
  e
) => {
  const duration = parseInt(e.target.value);
  if (!isNaN(duration) && duration > 0) {
    userDurationChanged(duration);
  }
};

export const AudioWorkspace = () => {
  const audioDuration = useUnit($audioDuration);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="duration-input"
            className="text-sm font-medium text-gray-700"
          >
            Duration:
          </label>
          <input
            id="duration-input"
            type="number"
            min="1"
            max="180"
            value={audioDuration}
            onChange={handleDurationChange}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">seconds</span>
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
