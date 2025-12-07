import React from 'react';
import { useToast } from '../../context/ToastContext';
import './Toast.css';

const Toast = () => {
  const { toast, hideToast } = useToast();

  if (!toast.show) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        {toast.message}
      </div>
      <button className="toast-close" onClick={hideToast}>
        ×
      </button>
    </div>
  );
};

export default Toast; 