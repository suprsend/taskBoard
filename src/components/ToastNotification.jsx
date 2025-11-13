import { useEffect, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useFeedClient } from '@suprsend/react';
import { X, Bell } from 'lucide-react';
import '../styles/ToastNotification.css';
import { cleanMarkdown } from '../utils/helpers';

// Constants
const TOAST_DURATION = 5000; // 5 seconds
const PROGRESS_UPDATE_INTERVAL = 50; // Update every 50ms
const FADE_OUT_DELAY = 300; // Wait for fade out animation

// Utility functions
const getTextContent = (content) => {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    if (content.text) return content.text;
    if (content.header) return content.header;
    if (content.schema) return content.schema;
    if (Array.isArray(content)) {
      return content.map(item => getTextContent(item)).join(' ');
    }
    const stringValues = Object.values(content).filter(val => typeof val === 'string');
    return stringValues.length > 0 ? stringValues[0] : 'Notification';
  }
  return 'Notification';
};

// Custom Toast Component
const CustomToast = ({ notificationData, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, FADE_OUT_DELAY);
  }, [onClose]);

  useEffect(() => {
    const decrement = (100 / TOAST_DURATION) * PROGRESS_UPDATE_INTERVAL;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsVisible(false);
          setTimeout(onClose, FADE_OUT_DELAY);
          return 0;
        }
        return prev - decrement;
      });
    }, PROGRESS_UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const title = cleanMarkdown(getTextContent(notificationData?.title)) || 'Notification';
  const message = cleanMarkdown(getTextContent(notificationData?.message || notificationData?.body)) || 'You have a new notification';
  const timestamp = notificationData?.created_at ? new Date(notificationData.created_at).toLocaleTimeString() : '';

  return (
    <div className="custom-toast-container">
      <div className="custom-toast">
        {/* Progress bar */}
        <div className="toast-progress-bar">
          <div 
            className="toast-progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Close button */}
        <button 
          className="toast-close-btn"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>

        {/* Notification content */}
        <div className="toast-content">
          <div className="toast-icon">
            <Bell size={20} />
          </div>
          <div className="toast-body">
            <div className="toast-title">{String(title)}</div>
            <div className="toast-message">{String(message)}</div>
            {timestamp && <div className="toast-timestamp">{String(timestamp)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const ToastNotification = () => {
  const feedClient = useFeedClient();

  const handleNewNotification = useCallback((data) => {
    toast.custom(
      (t) => (
        <CustomToast 
          notificationData={data} 
          onClose={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: TOAST_DURATION,
        position: 'bottom-right',
      }
    );
  }, []);

  useEffect(() => {
    if (!feedClient) return;

    feedClient.emitter.on('feed.new_notification', handleNewNotification);

    return () => {
      feedClient.emitter.off('feed.new_notification', handleNewNotification);
    };
  }, [feedClient, handleNewNotification]);

  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        bottom: 20,
        right: 20,
      }}
      toastOptions={{
        duration: TOAST_DURATION,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
          border: 'none',
          maxWidth: '400px',
          width: 'auto',
        },
        className: 'custom-toast-wrapper',
      }}
    />
  );
};

export default ToastNotification;