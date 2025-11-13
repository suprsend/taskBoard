import { useState, useEffect, useCallback, useMemo } from "react";
import Switch from "react-switch";
import {
  ChannelLevelPreferenceOptions,
  PreferenceOptions,
  useSuprSendClient,
  useAuthenticateUser,
} from "@suprsend/react";
import toast from "react-hot-toast";
import "../styles/NotificationPreferences.css";
import logger from "../utils/logger";

// Utility functions
const updateCategoryPreference = async (suprSendClient, category, preference) => {
  const resp = await suprSendClient.user.preferences.updateCategoryPreference(
    category,
    preference
  );
  
  if (resp.status === "error") {
    throw new Error(resp.error.message);
  }
  
  return resp.body;
};

const updateChannelPreferenceInCategory = async (suprSendClient, channel, preference, category) => {
  const resp = await suprSendClient.user.preferences.updateChannelPreferenceInCategory(
    channel,
    preference,
    category
  );
  
  if (resp.status === "error") {
    throw new Error(resp.error.message);
  }
  
  return resp.body;
};

const updateOverallChannelPreference = async (suprSendClient, channel, status) => {
  const resp = await suprSendClient.user.preferences.updateOverallChannelPreference(
    channel,
    status
  );
  
  if (resp.status === "error") {
    throw new Error(resp.error.message);
  }
  
  return resp.body;
};

// Custom Checkbox Component
const Checkbox = ({ title, value, onClick, disabled }) => {
  const selected = value === PreferenceOptions.OPT_IN;

  const handleKeyDown = useCallback((e) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  }, [disabled, onClick]);

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={`${title} notifications`}
      tabIndex={disabled ? -1 : 0}
      className="checkbox-container"
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
    >
      <Circle selected={selected} disabled={disabled} />
      <span className="checkbox-label">{title}</span>
    </div>
  );
};

const Circle = ({ selected, disabled }) => {
  const bgColor = selected
    ? disabled ? "#BDCFF8" : "#2463EB"
    : disabled ? "#D0CFCF" : "#FFF";

  return (
    <div
      className="checkbox-circle"
      style={{ backgroundColor: bgColor }}
    />
  );
};

// Category Preferences Component
const NotificationCategoryPreferences = ({ preferenceData, setPreferenceData }) => {
  const suprSendClient = useSuprSendClient();
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = useCallback(async (data, subcategory) => {
    try {
      setLoading(true);
      const preference = data ? PreferenceOptions.OPT_IN : PreferenceOptions.OPT_OUT;
      const updatedData = await updateCategoryPreference(
        suprSendClient,
        subcategory.category,
        preference
      );
      setPreferenceData(updatedData);
      toast.success(`${subcategory.name} preference updated successfully`);
    } catch (error) {
      logger.error('Failed to update category preference:', error);
      toast.error(`Failed to update ${subcategory.name} preference: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [suprSendClient, setPreferenceData]);

  const handleChannelChange = useCallback(async (channel, subcategory) => {
    if (!channel.is_editable) return;

    try {
      setLoading(true);
      const newPreference = channel.preference === PreferenceOptions.OPT_IN
        ? PreferenceOptions.OPT_OUT
        : PreferenceOptions.OPT_IN;
      
      const updatedData = await updateChannelPreferenceInCategory(
        suprSendClient,
        channel.channel,
        newPreference,
        subcategory.category
      );
      setPreferenceData(updatedData);
      toast.success(`${channel.channel} preference updated successfully`);
    } catch (error) {
      logger.error('Failed to update channel preference:', error);
      toast.error(`Failed to update ${channel.channel} preference: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [suprSendClient, setPreferenceData]);

  const sections = useMemo(() => {
    return preferenceData?.sections || [];
  }, [preferenceData?.sections]);

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section, index) => (
        <div key={index} className="section-container">
          {section?.name && (
            <div className="section-header">
              <h3 className="section-title">{section.name}</h3>
              <p className="section-description">{section.description}</p>
            </div>
          )}

          {section?.subcategories?.map((subcategory, subIndex) => (
            <div key={subIndex} className="subcategory-container">
              <div className="subcategory-header">
                <div>
                  <h4 className="subcategory-title">{subcategory.name}</h4>
                  <p 
                    id={`${subcategory.category}-description`}
                    className="subcategory-description"
                  >
                    {subcategory.description}
                  </p>
                </div>
                <Switch
                  disabled={!subcategory.is_editable || loading}
                  onChange={(data) => handleCategoryChange(data, subcategory)}
                  uncheckedIcon={false}
                  checkedIcon={false}
                  height={20}
                  width={40}
                  onColor="#2563EB"
                  checked={subcategory.preference === PreferenceOptions.OPT_IN}
                  aria-label={`Toggle ${subcategory.name} notifications`}
                  aria-describedby={`${subcategory.category}-description`}
                />
              </div>

              <div className="channels-container">
                {subcategory?.channels?.map((channel, channelIndex) => (
                  <Checkbox
                    key={channelIndex}
                    value={channel.preference}
                    title={channel.channel}
                    disabled={!channel.is_editable || loading}
                    onClick={() => handleChannelChange(channel, subcategory)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

// Channel Level Preference Item Component
const ChannelLevelPreferenceItem = ({ channel, setPreferenceData }) => {
  const suprSendClient = useSuprSendClient();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePreferenceChange = useCallback(async (status) => {
    try {
      setLoading(true);
      const updatedData = await updateOverallChannelPreference(
        suprSendClient,
        channel.channel,
        status
      );
      setPreferenceData(updatedData);
      toast.success(`${channel.channel} preference updated successfully`);
    } catch (error) {
      logger.error('Failed to update overall channel preference:', error);
      toast.error(`Failed to update ${channel.channel} preference: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [suprSendClient, channel.channel, setPreferenceData]);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  return (
    <div className="channel-preference-item">
      <div className="channel-preference-header" onClick={toggleActive}>
        <h3 className="channel-title">{channel.channel}</h3>
        <p className="channel-description">
          {channel.is_restricted
            ? "Allow required notifications only"
            : "Allow all notifications"}
        </p>
      </div>
      
      {isActive && (
        <div className="channel-preference-options">
          <h4 className="options-title">{channel.channel} Preferences</h4>
          
          <div className="radio-options">
            <div className="radio-option">
              <div className="radio-input-group">
                <input
                  type="radio"
                  name={`all-${channel.channel}`}
                  id={`all-${channel.channel}`}
                  checked={!channel.is_restricted}
                  disabled={loading}
                  onChange={() => handlePreferenceChange(ChannelLevelPreferenceOptions.ALL)}
                />
                <label htmlFor={`all-${channel.channel}`}>All</label>
              </div>
              <p className="radio-description">
                Allow All Notifications, except the ones that I have turned off
              </p>
            </div>
            
            <div className="radio-option">
              <div className="radio-input-group">
                <input
                  type="radio"
                  name={`required-${channel.channel}`}
                  id={`required-${channel.channel}`}
                  checked={channel.is_restricted}
                  disabled={loading}
                  onChange={() => handlePreferenceChange(ChannelLevelPreferenceOptions.REQUIRED)}
                />
                <label htmlFor={`required-${channel.channel}`}>Required</label>
              </div>
              <p className="radio-description">
                Allow only important notifications related to account and security settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Channel Level Preferences Component
const ChannelLevelPreferences = ({ preferenceData, setPreferenceData }) => {
  const channels = useMemo(() => {
    return preferenceData?.channel_preferences || [];
  }, [preferenceData?.channel_preferences]);

  return (
    <div>
      <div className="section-header">
        <h3 className="section-title">What notifications to allow for channel?</h3>
      </div>
      
      <div>
        {channels.length > 0 ? (
          channels.map((channel, index) => (
            <ChannelLevelPreferenceItem
              key={index}
              channel={channel}
              setPreferenceData={setPreferenceData}
            />
          ))
        ) : (
          <p className="no-data-message">No channel preferences available</p>
        )}
      </div>
    </div>
  );
};

// Loading Component
const LoadingState = () => (
  <div className="notification-preferences-container">
    <div className="preferences-header">
      <div className="header-content">
        <div className="header-inner">
          <div>
            <h1 className="preferences-title">Notification Preferences</h1>
            <p className="preferences-subtitle">Loading your preferences...</p>
          </div>
        </div>
      </div>
    </div>
    <div className="preferences-content">
      <div className="preferences-card">
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Loading preferences...</p>
        </div>
      </div>
    </div>
  </div>
);

// Error Component
const ErrorState = ({ error, onRetry }) => (
  <div className="notification-preferences-container">
    <div className="preferences-header">
      <div className="header-content">
        <div className="header-inner">
          <div>
            <h1 className="preferences-title">Notification Preferences</h1>
            <p className="preferences-subtitle">Error loading preferences</p>
          </div>
        </div>
      </div>
    </div>
    <div className="preferences-content">
      <div className="preferences-card">
        <div className="error-container">
          <div className="error-icon">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="error-message">{error}</p>
          <button onClick={onRetry} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="notification-preferences-container">
    <div className="preferences-header">
      <div className="header-content">
        <div className="header-inner">
          <div>
            <h1 className="preferences-title">Notification Preferences</h1>
            <p className="preferences-subtitle">No preferences available</p>
          </div>
        </div>
      </div>
    </div>
    <div className="preferences-content">
      <div className="preferences-card">
        <div className="empty-container">
          <p className="empty-message">No notification preferences are currently available.</p>
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const NotificationPreferences = () => {
  const suprSendClient = useSuprSendClient();
  const { authenticatedUser } = useAuthenticateUser();
  const [preferenceData, setPreferenceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const resp = await suprSendClient.user.preferences.getPreferences();
      
      if (resp.status === "error") {
        throw new Error(resp.error.message);
      }
      
      setPreferenceData(resp.body);
    } catch (error) {
      logger.error('Failed to load preferences:', error);
      setError(error.message);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  }, [suprSendClient]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!authenticatedUser || !suprSendClient) return;

    loadPreferences();

    const handlePreferencesUpdated = (preferenceData) => {
      setPreferenceData(preferenceData.body);
    };

    const handlePreferencesError = (response) => {
      logger.error('Preferences error:', response?.error?.message);
    };

    suprSendClient.emitter.on("preferences_updated", handlePreferencesUpdated);
    suprSendClient.emitter.on("preferences_error", handlePreferencesError);

    return () => {
      if (suprSendClient?.emitter) {
        suprSendClient.emitter.off("preferences_updated", handlePreferencesUpdated);
        suprSendClient.emitter.off("preferences_error", handlePreferencesError);
      }
    };
  }, [authenticatedUser, suprSendClient, loadPreferences]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={handleRetry} />;
  if (!preferenceData) return <EmptyState />;
  
  return (
    <div className="notification-preferences-container">
      <div className="preferences-header">
        <div className="header-content">
          <div className="header-inner">
            <div>
              <h1 className="preferences-title">Notification Preferences</h1>
              <p className="preferences-subtitle">Manage your notification settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="preferences-content">
        <div className="preferences-card">
          <div className="card-header">
            <h2 className="card-title">Category Preferences</h2>
            <p className="card-description">Choose which types of notifications you want to receive</p>
          </div>
          <div className="card-content">
            <NotificationCategoryPreferences
              preferenceData={preferenceData}
              setPreferenceData={setPreferenceData}
            />
          </div>
        </div>

        <div className="preferences-card">
          <div className="card-header">
            <h2 className="card-title">Channel Preferences</h2>
            <p className="card-description">Configure notification delivery channels</p>
          </div>
          <div className="card-content">
            <ChannelLevelPreferences
              preferenceData={preferenceData}
              setPreferenceData={setPreferenceData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;