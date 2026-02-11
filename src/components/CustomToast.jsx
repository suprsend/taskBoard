/**
 * Toast styled like Task Board: white card, gray border, blue accent, progress line.
 */

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DURATION_MS = 4000;

const styles = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-blue-600',
    iconColor: 'text-blue-600',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-500',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    bar: 'bg-amber-500',
    iconColor: 'text-amber-600',
  },
};

function ToastWithProgress({ message, type, duration }) {
  const s = styles[type] || styles.success;
  const Icon = s.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden min-w-[300px] max-w-[400px]">
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full ${s.bar} rounded-r-full`}
          style={{
            animation: `toast-shrink ${duration}ms linear forwards`,
            transformOrigin: 'right',
          }}
        />
      </div>
      <div className="p-4 flex gap-3 items-start">
        <div className={`${s.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <p className="text-gray-900 text-sm font-medium leading-snug flex-1">{message}</p>
      </div>
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export const showCustomToast = (message, type = 'success', duration = DURATION_MS) => {
  if (type === 'error') {
    return toast.custom((t) => (
      <div style={{ opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateX(0)' : 'translateX(100%)', transition: 'all 0.25s ease-out' }}>
        <ToastWithProgress message={message} type="error" duration={duration} />
      </div>
    ), { duration, position: 'bottom-right' });
  }
  if (type === 'warning') {
    return toast.custom((t) => (
      <div style={{ opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateX(0)' : 'translateX(100%)', transition: 'all 0.25s ease-out' }}>
        <ToastWithProgress message={message} type="warning" duration={duration} />
      </div>
    ), { duration, position: 'bottom-right' });
  }
  return toast.custom((t) => (
    <div style={{ opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateX(0)' : 'translateX(100%)', transition: 'all 0.25s ease-out' }}>
      <ToastWithProgress message={message} type="success" duration={duration} />
    </div>
  ), { duration, position: 'bottom-right' });
};

export default showCustomToast;
