"use client";

interface TestingControlsProps {
  onForceStep2: () => void;
}

export function TestingControls({ onForceStep2 }: TestingControlsProps) {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="text-xs font-bold mb-2">DEV TESTING</div>
      <button
        onClick={onForceStep2}
        className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-purple-50"
      >
        Preview Step 2
      </button>
    </div>
  );
}

