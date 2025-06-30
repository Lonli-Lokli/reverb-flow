import { Upload, Play, Pause, Download, RotateCcw, Move } from 'lucide-react';

export const WindowController = () => {
  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <h4 className="font-medium text-gray-900 text-sm mb-3">Window Size</h4>
      
      {/* Quick presets */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50">10s</button>
        <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50">15s</button>
        <button className="px-2 py-1 text-xs border rounded bg-blue-100 border-blue-300">30s</button>
        <button className="px-2 py-1 text-xs border rounded hover:bg-gray-50">Full</button>
      </div>
      
      {/* Size slider */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Duration: 36s</label>
        <input 
          type="range" 
          min="5" 
          max="180" 
          defaultValue="36"
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
