import { Upload, Play, Pause, Download, RotateCcw, Move, Plus, X } from 'lucide-react';
import { FC, PropsWithChildren, useRef, DragEvent, ChangeEvent } from 'react';
import { useUnit } from 'effector-react';
import {
  $selectedFile,
  $youtubeUrl,
  $hasFile,
  $isUploading,
  $isDownloading,
  fileInputChanged,
  filesDropped,
  youtubeUrlChanged,
  clearFile,
  clearYoutubeUrl,
  downloadFromYoutubeFx,
  fileSelected
} from './model';

export const AudioUploader: FC<PropsWithChildren> = ({ children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [
    selectedFile,
    youtubeUrl,
    hasFile,
    isUploading,
    isDownloading
  ] = useUnit([
    $selectedFile,
    $youtubeUrl,
    $hasFile,
    $isUploading,
    $isDownloading
  ]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      filesDropped(files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    fileInputChanged({ files: e.target.files });
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleYoutubeUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    youtubeUrlChanged(e.target.value);
  };

  const handleYoutubeDownload = () => {
    if (youtubeUrl.trim()) {
      downloadFromYoutubeFx(youtubeUrl.trim());
    }
  };

  const handleClearFile = () => {
    clearFile();
    clearYoutubeUrl();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (hasFile && selectedFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 truncate max-w-64">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-red-200"
              aria-label="Clear file and start again"
            >
              <Plus className="h-5 w-5 text-gray-500 group-hover:text-red-500 rotate-45 group-hover:scale-110 transition-all duration-200" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer group shadow-sm hover:shadow-md"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFile}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.m4a"
            className="hidden"
            onChange={handleFileInputChange}
          />
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 shadow-sm">
            <Upload className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Audio File</h3>
          <p className="text-gray-600 mb-6">
            Drag and drop or click to browse
          </p>
          <p className="text-sm text-gray-500 bg-gray-50/50 rounded-lg px-3 py-2 inline-block">
            MP3, WAV, FLAC, M4A • Max 50MB
          </p>
          
          {isUploading && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse w-2/3 transition-all duration-300"></div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">Uploading...</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-br from-slate-50 to-blue-50 text-gray-600 font-medium">or</span>
          </div>
        </div>

        {/* YouTube URL Input */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-semibold text-gray-800 mb-3">
                YouTube URL
              </label>
              <div className="space-y-3">
                <input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                  disabled={isDownloading}
                />
                <button
                  onClick={handleYoutubeDownload}
                  disabled={!youtubeUrl.trim() || isDownloading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Download Audio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border">
              We'll extract the audio from the YouTube video
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
