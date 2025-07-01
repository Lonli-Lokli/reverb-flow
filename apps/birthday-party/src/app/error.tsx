import { useUnit } from "effector-react";
import { $error, errorDismissed } from "./model";
import { AlertTriangle, X } from "lucide-react";

export const ErrorDisplay: React.FC = () => {
  const error = useUnit($error);

  if (!error) {
    return null; // Don't render anything if there's no error
  }

  return (
    // You can style this as a toast, a banner, etc.
    // Position it fixed to appear over the content.
    <div
      className="fixed bottom-4 right-4 z-50 max-w-md p-4 bg-red-100 border-l-4 border-red-500 rounded-r-lg shadow-lg"
      role="alert"
    >
      <div className="flex">
        <div className="py-1">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-4" />
        </div>
        <div>
          <p className="font-bold text-red-800">Operation Failed</p>
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => errorDismissed()}
            className="-mx-1.5 -my-1.5 bg-red-100 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex h-8 w-8"
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};