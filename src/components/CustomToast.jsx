/**
 * Custom Toast Component matching TaskBoard design
 */

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const customToastStyles = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
};

/**
 * Custom toast component matching TaskBoard style
 */
const CustomToastContent = ({ message, type = 'success' }) => {
  const style = customToastStyles[type] || customToastStyles.success;
  const Icon = style.icon;

  return (
    <div className={`${style.bgColor} ${style.borderColor} border rounded-lg shadow-md p-4 flex items-center space-x-3 min-w-[280px] max-w-md transition-all duration-200 hover:shadow-lg`}>
      <div className={`${style.iconColor} flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`${style.textColor} text-sm font-medium flex-1 leading-relaxed`}>
        {message}
      </p>
    </div>
  );
};

/**
 * Show custom toast matching TaskBoard design
 */
export const showCustomToast = (message, type = 'success') => {
  return toast.custom(
    (t) => (
      <div
        className="max-w-md w-full"
        style={{
          transform: t.visible ? 'translateX(0)' : 'translateX(100%)',
          opacity: t.visible ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <CustomToastContent message={message} type={type} />
      </div>
    ),
    {
      duration: 3000,
      position: 'bottom-right',
    }
  );
};

export default showCustomToast;
