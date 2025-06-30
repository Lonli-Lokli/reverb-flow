import { CompactWaveform } from "@birthday-party/compact-waveform";
import { ExportModal } from "@birthday-party/export-modal";
import { WindowController } from "@birthday-party/window-controller";
import { RotateCcw, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useUnit } from 'effector-react';
import { 
  $audioData, 
  $hasAudio, 
  audioFileChanged,
  windowSelectionChanged,
  $waveformWindow
} from './init';
import { $selectedFile } from '@birthday-party/audio-uploader';

export const AudioWorkspace = () => {
  const [selectedFile, hasAudio, audioData, waveformWindow] = useUnit([
    $selectedFile,
    $hasAudio,
    $audioData,
    $waveformWindow
  ]);

  // Connect audio-uploader to init.ts when file is selected
  useEffect(() => {
    if (selectedFile?.file) {
      audioFileChanged(selectedFile.file);
    }
  }, [selectedFile]);

  if (!hasAudio) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-lg mb-4">
          Upload an audio file to start working
        </div>
        <div className="text-gray-400 text-sm">
          We'll automatically create the reversed version for you
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {audioData?.fileName}
        </h2>
        <p className="text-gray-600">
          Duration: {audioData ? Math.floor(audioData.duration / 60) : 0}:
          {audioData ? (Math.floor(audioData.duration % 60)).toString().padStart(2, '0') : '00'}
        </p>
      </div>
      
      <div className="grid gap-6">
        <CompactWaveform title="Original Audio" isReversed={false} />
        <CompactWaveform title="Reversed Audio" isReversed={true} />
      </div>
      
      <div className="flex justify-center mt-8">
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          Drag the window edges or center to adjust the selection range
        </div>
      </div>
      
      <WindowController />
    </div>
  );
};