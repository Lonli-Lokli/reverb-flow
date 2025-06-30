interface ExportModalProps {
  isOpen: boolean;
}
export const ExportModal = ({ isOpen }: ExportModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Export Audio</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Export options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="content"
                  className="text-blue-600"
                  defaultChecked
                />
                <span className="ml-2 text-sm">Window Only (0:36)</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="content" className="text-blue-600" />
                <span className="ml-2 text-sm">Full Track (2:15)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="text-blue-600" />
                <span className="ml-2 text-sm">Original</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="text-blue-600"
                  defaultChecked
                />
                <span className="ml-2 text-sm">Reversed</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>MP3</option>
                <option>WAV</option>
                <option>FLAC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality
              </label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>320kbps</option>
                <option>192kbps</option>
                <option>128kbps</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex space-x-3">
          <button className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
