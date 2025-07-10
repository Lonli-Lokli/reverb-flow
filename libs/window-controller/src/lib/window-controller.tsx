import { useUnit } from 'effector-react';
import { useCallback, useRef, useState } from 'react';
import { $viewModel, durationChanged, updateTime } from './model';


export const WindowController = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  const { start, end, sampleDuration, totalDuration } = useUnit($viewModel );

  const startPercentage = totalDuration === 0 ? 0 : (start / totalDuration) * 100;
  const endPercentage = totalDuration === 0 ? 0 : (end / totalDuration) * 100;

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    durationChanged(isNaN(parseInt(e.target.value)) ? 10 : parseInt(e.target.value));

  const getPositionFromEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!trackRef.current) return 0;

      const rect = trackRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      return percentage * totalDuration;
    },
    [totalDuration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'start' | 'end') => {
      e.preventDefault();
      setIsDragging(type);
    },
    []
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, type: 'start' | 'end') => {
      e.preventDefault();
      setIsDragging(type);
    },
    []
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const newTime = getPositionFromEvent(e);
      const minDistance = 1;

      if (isDragging === 'start') {
        updateTime({
          type: 'start',
          value: Math.max(0, Math.min(newTime, end - minDistance)),
        });
      } else {
        updateTime({
          type: 'end',
          value: Math.max(
            start + minDistance,
            Math.min(newTime, totalDuration)
          ),
        });
      }
    },
    [isDragging, getPositionFromEvent, end, start, totalDuration]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto p-3 bg-white/80 rounded-xl shadow border border-gray-200">
      {/* Duration Input */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base font-semibold text-gray-700">{formatTime(sampleDuration)}</span>
        <span className="text-gray-300">|</span>
        <input
          type="number"
          value={sampleDuration}
          onChange={handleDurationChange}
          placeholder={sampleDuration.toString()}
          className="w-12 bg-transparent text-sm font-mono outline-none text-gray-700 px-1 py-0.5 border border-gray-200 rounded"
          min="1"
          max={totalDuration - start}
        />
        <span className="text-xs text-gray-400">sec</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div
          ref={trackRef}
          className="relative h-8 select-none"
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Background track */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded"></div>

          {/* Selected region */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded shadow"
            style={{
              left: `${startPercentage}%`,
              width: `${endPercentage - startPercentage}%`,
            }}
          ></div>

          {/* Start handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-pointer shadow"
            style={{
              left: `${startPercentage}%`,
              marginLeft: '-8px',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            onTouchStart={(e) => handleTouchStart(e, 'start')}
            title="Start"
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-green-500 text-white px-1 py-0.5 rounded shadow-sm">
              {formatTime(start)}
            </span>
          </div>

          {/* End handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-pointer shadow"
            style={{
              left: `${endPercentage}%`,
              marginLeft: '-8px',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            onTouchStart={(e) => handleTouchStart(e, 'end')}
            title="End"
          >
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-red-500 text-white px-1 py-0.5 rounded shadow-sm">
              {formatTime(end)}
            </span>
          </div>
        </div>

        {/* Time markers */}
        <div className="flex justify-between text-[11px] text-gray-400 mt-2">
          <span className="bg-white/70 px-1.5 py-0.5 rounded">{formatTime(0)}</span>
          <span className="bg-white/70 px-1.5 py-0.5 rounded">{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
