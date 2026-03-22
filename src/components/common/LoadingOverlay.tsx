import React from 'react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40"
      role="status"
      aria-live="polite"
      aria-label={message ?? '로딩 중'}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-blue-500" />
      {message && (
        <p className="mt-4 text-sm font-medium text-white">{message}</p>
      )}
    </div>
  );
};

export default LoadingOverlay;
