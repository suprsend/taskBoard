import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useFeedClient } from '@suprsend/react';

function getRelativeTime(createdOn) {
  if (!createdOn) return '';
  const ts = typeof createdOn === 'number' ? createdOn : parseInt(createdOn, 10);
  const date = new Date(ts * (ts < 1e12 ? 1000 : 1));
  const now = new Date();
  const sec = Math.floor((now - date) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return 'Earlier';
}

/** Beautiful feed notification toast - no avatar, clean card with progress */
const FeedToast = ({ notificationData, duration = 5000 }) => {
  const header = notificationData?.message?.header ?? '';
  const text = notificationData?.message?.text ?? '';
  const timeStr = getRelativeTime(notificationData?.created_on);

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-[320px]"
      style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100" style={{ pointerEvents: 'none', zIndex: 1 }}>
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{
            animation: `toast-shrink ${duration}ms linear forwards`,
            transformOrigin: 'right center',
          }}
        />
      </div>
      <div className="p-4 pt-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            {header && (
              <p className="font-semibold text-gray-900 text-[15px] leading-snug">
                {header}
              </p>
            )}
            {text && (
              <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">
                {text}
              </p>
            )}
          </div>
          {timeStr && (
            <span className="text-gray-400 text-xs font-medium flex-shrink-0">
              {timeStr}
            </span>
          )}
        </div>
      </div>
      <style>{`
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
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
        (t) => (
          <div
            style={{
              transform: t.visible ? 'translateX(0)' : 'translateX(110%)',
              opacity: t.visible ? 1 : 0,
              transition: 'all 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
            }}
          >
            <FeedToast notificationData={data} duration={5000} />
          </div>
        ),
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
      toastOptions={{
        className: '',
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
      }}
    />
  );
}

export default ToastNotification;
