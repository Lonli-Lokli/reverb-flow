import { Upload, Play, Pause, Download, RotateCcw, Move } from 'lucide-react';
import { useUnit } from 'effector-react';

interface WindowControllerProps {
  $audioDuration: any;
  userDurationChanged: any;
  windowPresetClicked: any;
}

export const WindowController = ({ $audioDuration, userDurationChanged, windowPresetClicked }: WindowControllerProps) => {
  const audioDuration = useUnit($audioDuration);

  const handlePresetClick = (duration: number) => {
    windowPresetClicked(duration);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value);
    userDurationChanged(duration);
  };

  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <h4 className="font-medium text-gray-900 text-sm mb-3">Window Size</h4>
      
      {/* Quick presets */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <button 
          className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${audioDuration === 10 ? 'bg-blue-100 border-blue-300' : ''}`}
          onClick={() => handlePresetClick(10)}
        >
          10s
        </button>
        <button 
          className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${audioDuration === 15 ? 'bg-blue-100 border-blue-300' : ''}`}
          onClick={() => handlePresetClick(15)}
        >
          15s
        </button>
        <button 
          className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${audioDuration === 30 ? 'bg-blue-100 border-blue-300' : ''}`}
          onClick={() => handlePresetClick(30)}
        >
          30s
        </button>
        <button 
          className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${audioDuration >= 60 ? 'bg-blue-100 border-blue-300' : ''}`}
          onClick={() => handlePresetClick(60)}
        >
          Full
        </button>
      </div>
      
      {/* Size slider */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Duration: {audioDuration}s</label>
        <input 
          type="range" 
          min="5" 
          max="180" 
          value={audioDuration}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5s</span>
          <span>3min</span>
        </div>
      </div>
    </div>
  );
};
