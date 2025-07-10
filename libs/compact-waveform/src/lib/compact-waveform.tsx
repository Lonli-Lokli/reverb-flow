import { Play, Pause } from 'lucide-react';
import { FC } from 'react';
import { playButtonClicked, $playingState, $dataState } from './model';
import { useStoreMap } from 'effector-react';

export interface CompactWaveformProps {
  title: string;
  id: string;
}

export const CompactWaveform: FC<CompactWaveformProps> = ({
  title,
  id,
}) => {
  const isPlaying = useStoreMap({
    store: $playingState,
    keys: [id],
    fn: (state) => state[id] ?? false,
  });

  const isLoaded = useStoreMap({
    store: $dataState,
    keys: [id],
    fn: (state) => state[id] ?? false,
  });
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <button
        disabled={!isLoaded}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            playButtonClicked({
              action: isPlaying ? 'pause' : 'play',
              waveformId: id,
            });
          }}
        >
         {
          isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16}  />
          )}
          {isPlaying ? 'Stop' : 'Play'}
         
        </button>
      </div>

      <div className="relative">        
        <div id={id} />
        {isLoaded ? null : <LoadingIndicator />}
      </div>
    </div>
  );
};

const LoadingIndicator: FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
    </div>
  );
};