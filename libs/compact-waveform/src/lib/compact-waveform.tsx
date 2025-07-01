import { Play, Pause, RotateCcw, Move } from 'lucide-react';
import { FC, useRef, useEffect, useState, useCallback } from 'react';

interface CompactWaveformProps {
  title: string;
  isReversed?: boolean;
  // Event handlers passed from parent (app layer)
  onPlay?: () => void;
  onPause?: () => void;
  onWindowChange?: (window: { startTime: number; endTime: number; duration: number }) => void;
  // State passed from parent
  isPlaying?: boolean;
  windowSelection?: { startTime: number; endTime: number; duration: number };
  totalDuration?: number;
  playbackPosition?: number;
}

interface DragState {
  isDragging: boolean;
  dragType: 'start' | 'end' | 'window' | null;
  dragStartX: number;
  dragStartTime: number;
}

export const CompactWaveform: FC<CompactWaveformProps> = ({
  title,
  isReversed = false,
  onPlay,
  onPause,
  onWindowChange,
  isPlaying = false,
  windowSelection = { startTime: 5, endTime: 35, duration: 30 },
  totalDuration = 120,
  playbackPosition = 0,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    dragStartX: 0,
    dragStartTime: 0,
  });

  // Local state for temporary window selection during drag
  const [localWindowSelection, setLocalWindowSelection] = useState(windowSelection);

  // Update local state when props change
  useEffect(() => {
    setLocalWindowSelection(windowSelection);
  }, [windowSelection]);

  // Use local selection during drag, otherwise use props
  const currentSelection = dragState.isDragging ? localWindowSelection : windowSelection;

  // Calculate percentages for visual representation
  const windowStartPercent = (currentSelection.startTime / totalDuration) * 100;
  const windowWidthPercent = ((currentSelection.endTime - currentSelection.startTime) / totalDuration) * 100;
  const playbackPercent = (playbackPosition / totalDuration) * 100;

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle mouse/touch events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, dragType: 'start' | 'end' | 'window') => {
    e.preventDefault();
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      dragType,
      dragStartX: e.clientX - rect.left,
      dragStartTime: dragType === 'start' ? currentSelection.startTime : 
                    dragType === 'end' ? currentSelection.endTime :
                    currentSelection.startTime,
    });
  }, [currentSelection]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !waveformRef.current) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const deltaX = currentX - dragState.dragStartX;
    const deltaTime = (deltaX / rect.width) * totalDuration;

    let newStartTime = currentSelection.startTime;
    let newEndTime = currentSelection.endTime;

    switch (dragState.dragType) {
      case 'start':
        newStartTime = Math.max(0, Math.min(currentSelection.endTime - 1, dragState.dragStartTime + deltaTime));
        break;
      case 'end':
        newEndTime = Math.min(totalDuration, Math.max(currentSelection.startTime + 1, dragState.dragStartTime + deltaTime));
        break;
      case 'window': {
        const windowDuration = currentSelection.endTime - currentSelection.startTime;
        newStartTime = Math.max(0, Math.min(totalDuration - windowDuration, dragState.dragStartTime + deltaTime));
        newEndTime = newStartTime + windowDuration;
        break;
      }
    }

    const newSelection = {
      startTime: newStartTime,
      endTime: newEndTime,
      duration: newEndTime - newStartTime,
    };

    setLocalWindowSelection(newSelection);
  }, [dragState, currentSelection, totalDuration]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      // Notify parent of window change when drag ends
      onWindowChange?.(localWindowSelection);
    }
    
    setDragState({
      isDragging: false,
      dragType: null,
      dragStartX: 0,
      dragStartTime: 0,
    });
  }, [dragState.isDragging, localWindowSelection, onWindowChange]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, dragType: 'start' | 'end' | 'window') => {
    e.preventDefault();
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      dragType,
      dragStartX: touch.clientX - rect.left,
      dragStartTime: dragType === 'start' ? currentSelection.startTime : 
                    dragType === 'end' ? currentSelection.endTime :
                    currentSelection.startTime,
    });
  }, [currentSelection]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || !waveformRef.current) return;
    e.preventDefault();

    const rect = waveformRef.current.getBoundingClientRect();
    const currentX = e.touches[0].clientX - rect.left;
    const deltaX = currentX - dragState.dragStartX;
    const deltaTime = (deltaX / rect.width) * totalDuration;

    let newStartTime = currentSelection.startTime;
    let newEndTime = currentSelection.endTime;

    switch (dragState.dragType) {
      case 'start':
        newStartTime = Math.max(0, Math.min(currentSelection.endTime - 1, dragState.dragStartTime + deltaTime));
        break;
      case 'end':
        newEndTime = Math.min(totalDuration, Math.max(currentSelection.startTime + 1, dragState.dragStartTime + deltaTime));
        break;
      case 'window': {
        const windowDuration = currentSelection.endTime - currentSelection.startTime;
        newStartTime = Math.max(0, Math.min(totalDuration - windowDuration, dragState.dragStartTime + deltaTime));
        newEndTime = newStartTime + windowDuration;
        break;
      }
    }

    const newSelection = {
      startTime: newStartTime,
      endTime: newEndTime,
      duration: newEndTime - newStartTime,
    };

    setLocalWindowSelection(newSelection);
  }, [dragState, currentSelection, totalDuration]);

  const handleTouchEnd = useCallback(() => {
    if (dragState.isDragging) {
      // Notify parent of window change when drag ends
      onWindowChange?.(localWindowSelection);
    }
    
    setDragState({
      isDragging: false,
      dragType: null,
      dragStartX: 0,
      dragStartTime: 0,
    });
  }, [dragState.isDragging, localWindowSelection, onWindowChange]);

  // Set up event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Handle play/pause - now calls parent handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  // Generate mock waveform data
  const generateWaveformBars = () => {
    const bars = [];
    const totalBars = 200;
    
    for (let i = 0; i < totalBars; i++) {
      const height = Math.random() * 70 + 15; // Random height between 15% and 85%
      bars.push(
        <div
          key={i}
          className={`flex-1 mx-px transition-colors ${
            isReversed ? 'bg-red-200' : 'bg-blue-200'
          } opacity-60`}
          style={{ height: `${height}%` }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {isReversed && (
            <div className="flex items-center space-x-1 text-red-500">
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs font-medium">Reversed</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handlePlayPause}
            className={`p-2 rounded-full transition-colors ${
              isReversed 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <span className="text-sm text-gray-600 font-medium">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Waveform Container */}
      <div 
        ref={waveformRef}
        className="relative h-20 bg-gray-50 rounded-lg border-2 overflow-hidden cursor-crosshair select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Full Waveform */}
        <div className="absolute inset-0 flex items-end justify-center px-1">
          {generateWaveformBars()}
        </div>

        {/* Window Selection Overlay */}
        <div
          className={`absolute top-0 bottom-0 ${
            isReversed ? 'bg-red-400' : 'bg-blue-400'
          } opacity-40 border-l-2 border-r-2 ${
            isReversed ? 'border-red-600' : 'border-blue-600'
          } transition-all duration-150`}
          style={{
            left: `${windowStartPercent}%`,
            width: `${windowWidthPercent}%`,
          }}
        >
          {/* Start handle */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-2 ${
              isReversed ? 'bg-red-600' : 'bg-blue-600'
            } cursor-ew-resize hover:bg-opacity-80 transition-colors`}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            onTouchStart={(e) => handleTouchStart(e, 'start')}
          />

          {/* End handle */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-2 ${
              isReversed ? 'bg-red-600' : 'bg-blue-600'
            } cursor-ew-resize hover:bg-opacity-80 transition-colors`}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            onTouchStart={(e) => handleTouchStart(e, 'end')}
          />

          {/* Window move handle */}
          <div
            className="absolute inset-x-2 top-1/2 transform -translate-y-1/2 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleMouseDown(e, 'window')}
            onTouchStart={(e) => handleTouchStart(e, 'window')}
          >
            <Move className="h-4 w-4 text-white opacity-70" />
          </div>
        </div>

        {/* Playback position indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-800 z-10 pointer-events-none transition-all duration-100"
          style={{ left: `${playbackPercent}%` }}
        />
      </div>

      {/* Window Info */}
      <div className="mt-3 flex justify-between items-center text-sm">
        <div className="text-gray-600">
          <span className="font-medium">Window:</span>{' '}
          {formatTime(currentSelection.startTime)} - {formatTime(currentSelection.endTime)}
        </div>
        <div className="text-gray-600">
          <span className="font-medium">Duration:</span>{' '}
          {formatTime(currentSelection.duration)}
        </div>
      </div>
    </div>
  );
}; 