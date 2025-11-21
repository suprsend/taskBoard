import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useFeedClient, ToastNotificationCard } from '@suprsend/react';

// Custom Toast Wrapper with Progress Bar
const CustomToast = ({ notificationData, duration = 5000 }) => {
  return (
    <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-w-sm" style={{ width: '320px' }}>
      {/* Progress Bar - Blue line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100" style={{ pointerEvents: 'none', zIndex: 1 }}>
        <div
          className="h-full bg-blue-500"
          style={{
            width: '100%',
            animation: `toast-shrink ${duration}ms linear forwards`,
            transformOrigin: 'right center',
          }}
        />
      </div>
      
      {/* Toast Content */}
      <div className="p-3 pt-4">
        <ToastNotificationCard notificationData={notificationData} />
      </div>
      
      <style>{`
        @keyframes toast-shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Toast Notification Component - Following SuprSend docs exactly
// https://docs.suprsend.com/docs/react-toast-notifications
function ToastNotification() {
  const feedClient = useFeedClient();

  useEffect(() => {
    if (!feedClient) return;

    // event listener which return new notification data
    feedClient.emitter.on('feed.new_notification', (data) => {
      toast.custom(
        <CustomToast notificationData={data} duration={5000} />,
        {
          duration: 5000,
          position: 'bottom-right',
        }
      );
      // Note: We do NOT mark as seen here - badge will stay until inbox is opened
    });

    return () => {
      feedClient.emitter.off('feed.new_notification');
    };
  }, [feedClient]);

  return (
    <Toaster
      position="bottom-right"
      containerStyle={{
        bottom: '20px',
        right: '20px',
      }}
    />
  );
}

export default ToastNotification;
