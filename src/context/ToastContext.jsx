import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3800) => {
    const id = Date.now() + Math.random();
    
    // Professional auto title
    let title = 'தகவல் (Notification)';
    if (type === 'success') title = 'வெற்றிகரமானது (Success)';
    else if (type === 'error') title = 'கவனிக்கவும் (Alert)';
    else if (type === 'warning') title = 'எச்சரிக்கை (Warning)';

    setToasts(prev => [...prev.slice(-3), { id, message, type, title, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pro-toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pro-toast-card pro-toast-${toast.type}`}
            role="status"
          >
            <div className={`pro-toast-icon-box pro-toast-icon-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={18} strokeWidth={2.4} />}
              {toast.type === 'error' && <AlertCircle size={18} strokeWidth={2.4} />}
              {toast.type === 'warning' && <AlertTriangle size={18} strokeWidth={2.4} />}
              {toast.type === 'info' && <Info size={18} strokeWidth={2.4} />}
            </div>
            <div className="pro-toast-body">
              <div className="pro-toast-title">{toast.title}</div>
              <div className="pro-toast-text">{toast.message}</div>
            </div>
            <button 
              className="pro-toast-close" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
            <div 
              className={`pro-toast-progress-bar pro-toast-bar-${toast.type}`} 
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
