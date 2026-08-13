'use client';

import { useUIStore } from '@/store/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastStyles = {
  success: { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ECC71', icon: CheckCircle, color: '#2ECC71' },
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: '#EF4444', icon: AlertCircle, color: '#EF4444' },
  info: { bg: 'rgba(44, 107, 237, 0.12)', border: '#2C6BED', icon: Info, color: '#2C6BED' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', icon: AlertTriangle, color: '#F59E0B' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        const IconComponent = style.icon;
        return (
          <div
            key={toast.id}
            className="toast"
            role="alert"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: 'var(--text-primary)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <IconComponent size={16} color={style.color} className="flex-shrink-0" />
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
