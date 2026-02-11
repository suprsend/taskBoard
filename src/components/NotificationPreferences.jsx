import { useState, useEffect } from "react";
import Switch from "react-switch";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ChannelLevelPreferenceOptions,
  PreferenceOptions,
  useSuprSendClient,
  useAuthenticateUser,
} from "@suprsend/react";
import { showCustomToast } from "./CustomToast";

const ICON_GRAY = "#6C727F";

/** Filled envelope icon (SuprSend style) */
function EmailIconFilled({ size = 20, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        fill={ICON_GRAY}
      />
    </svg>
  );
}

/** Filled bell icon (SuprSend style) */
function InboxIconFilled({ size = 20, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
      <path
        d="M12 2c-1.1 0-2 .9-2 2v.58C7.94 5.34 6 7.96 6 11v4l-2 2h16l-2-2v-4c0-3.04-1.94-5.66-4-6.42V4c0-1.1-.9-2-2-2zm-2 18a2 2 0 004 0H10z"
        fill={ICON_GRAY}
      />
    </svg>
  );
}

/** Capitalize channel label for display: Email, Inbox, etc. */
function formatChannelLabel(channelKey) {
  if (!channelKey || typeof channelKey !== "string") return channelKey;
  const lower = channelKey.toLowerCase();
  if (lower === "email") return "Email";
  if (lower === "inbox") return "Inbox";
  return channelKey.charAt(0).toUpperCase() + channelKey.slice(1).toLowerCase();
}

// -------------- Category Level Preferences -------------- //

const handleCategoryPreferenceChange = async ({
  data,
  subcategory,
  setPreferenceData,
  suprSendClient,
}) => {
  const resp = await suprSendClient.user.preferences.updateCategoryPreference(
    subcategory.category,
    data ? PreferenceOptions.OPT_IN : PreferenceOptions.OPT_OUT
  );
  if (resp.status === "error") {
    showCustomToast(`Failed to update ${subcategory.name} preference: ${resp.error.message}`, 'error');
  } else {
    setPreferenceData({ ...resp.body });
    showCustomToast(`${subcategory.name} preference updated successfully`, 'success');
  }
};

const handleChannelPreferenceInCategoryChange = async ({
    channel,
  subcategory,
  setPreferenceData,
  suprSendClient,
}) => {
  if (!channel.is_editable) return;

  const resp =
    await suprSendClient.user.preferences.updateChannelPreferenceInCategory(
      channel.channel,
      channel.preference === PreferenceOptions.OPT_IN
        ? PreferenceOptions.OPT_OUT
        : PreferenceOptions.OPT_IN,
      subcategory.category
    );
  if (resp.status === "error") {
    showCustomToast(`Failed to update ${formatChannelLabel(channel.channel)} preference: ${resp.error.message}`, 'error');
  } else {
    setPreferenceData({ ...resp.body });
    showCustomToast(`${formatChannelLabel(channel.channel)} preference updated successfully`, 'success');
  }
};

function NotificationCategoryPreferences({
  preferenceData,
  setPreferenceData,
}) {
  const suprSendClient = useSuprSendClient();
  const [loading, setLoading] = useState(false);

  // Define allowed category names (section/category level) - e.g., "task-updates"
  const ALLOWED_CATEGORY_NAMES = [
    'task-updates',
    'task_updates',
    'task updates',
    'taskupdate'
  ];

  // Define allowed subcategory names (what we want to show)
  // We show: task-updates (for status changes), task-created, task-deleted
  const ALLOWED_SUBCATEGORY_NAMES = [
    'task created',
    'task-created',
    'task_created',
    'taskcreated',
    'task updates',
    'task-updates',
    'task_updates',
    'taskupdate',
    'task status changed',
    'task-status-changed',
    'task_status_changed',
    'taskstatuschanged',
    'task status',
    'task-status',
    'task_status',
    'task deleted',
    'task-deleted',
    'task_deleted',
    'taskdeleted'
  ];

  // Helper function to check if a category section should be shown (e.g., "task-updates")
  const isAllowedCategorySection = (categoryName, sectionName) => {
    const normalizedCategory = (categoryName || '').toLowerCase().trim();
    const normalizedSection = (sectionName || '').toLowerCase().trim();
    
    // Check if it's task-updates category
    return ALLOWED_CATEGORY_NAMES.some(allowed => 
      normalizedCategory === allowed || 
      normalizedCategory.includes(allowed) ||
      normalizedSection === allowed ||
      normalizedSection.includes(allowed)
    );
  };

  // Helper function to check if a subcategory should be shown
  const isAllowedSubcategory = (subcategoryName, description) => {
    const normalizedSubcategory = (subcategoryName || '').toLowerCase().trim();
    const normalizedDescription = (description || '').toLowerCase().trim();
    
    // Check if subcategory name matches our allowed list
    const subcategoryMatch = ALLOWED_SUBCATEGORY_NAMES.some(allowed => 
      normalizedSubcategory === allowed || 
      normalizedSubcategory.includes(allowed) ||
      allowed.includes(normalizedSubcategory)
    );
    
    // Check if description contains keywords for our three categories
    // task-updates (for status changes), task-created, task-deleted
    const descriptionMatch = 
      (normalizedDescription.includes('task') && normalizedDescription.includes('created')) ||
      (normalizedDescription.includes('task') && (normalizedDescription.includes('status') || normalizedDescription.includes('changed') || normalizedDescription.includes('update'))) ||
      (normalizedDescription.includes('task') && normalizedDescription.includes('deleted'));
    
    return subcategoryMatch || descriptionMatch;
  };

  // Debug logging removed for production

  // Filter to show sections that contain at least one allowed subcategory
  // Then filter subcategories to only show Task Created, Task Status Changed, Task Deleted
  const filteredSections = preferenceData?.sections?.filter(section => {
    if (!section) return false;
    
    const sectionName = section.name || '';
    const subcategories = section.subcategories || [];
    
    // Check if ANY subcategory in this section matches our allowed list
    const hasAllowedSubcategory = subcategories.some(subcategory => {
      if (!subcategory) return false;
      const categoryName = subcategory.category || '';
      const subcategoryName = subcategory.name || '';
      const description = subcategory.description || '';
      
      // Check if section category matches OR subcategory matches
      const sectionMatch = isAllowedCategorySection(categoryName, sectionName);
      const subcategoryMatch = isAllowedSubcategory(subcategoryName, description);
      
      return sectionMatch || subcategoryMatch;
    });
    
    return hasAllowedSubcategory;
  }).map(section => {
    if (!section) return section;
    
    // Filter subcategories to only show Task Created, Task Status Changed, Task Deleted
    // Exclude task-assignments
    const filteredSubcategories = section.subcategories?.filter(subcategory => {
      if (!subcategory) return false;
      
      const subcategoryName = subcategory.name || '';
      const categoryName = subcategory.category || '';
      const description = subcategory.description || '';
      
      // Explicitly exclude task-assignments
      const isTaskAssignment = 
        categoryName.toLowerCase().includes('task-assignment') ||
        categoryName.toLowerCase().includes('task_assignment') ||
        subcategoryName.toLowerCase().includes('task-assignment') ||
        subcategoryName.toLowerCase().includes('task_assignment');
      
      if (isTaskAssignment) {
        return false;
      }
      
      // Check if it matches our allowed subcategories
      const isAllowed = isAllowedSubcategory(subcategoryName, description) || 
                       isAllowedCategorySection(categoryName, '');
      
      return isAllowed;
    }) || [];
    
    return {
      ...section,
      subcategories: filteredSubcategories
    };
  }).filter(section => {
    // Remove sections that have no subcategories after filtering
    return section?.subcategories?.length > 0;
  }) || [];

  // If no filtered sections, show empty state
  if (!filteredSections.length) {
    return (
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#6C727F", textAlign: "center", padding: 24 }}>
          No notification categories available. Please check your SuprSend configuration.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {filteredSections.map((section, index) => {
        return (
          <div key={index} style={{ marginBottom: 24 }}>
            {section?.name && section.name.trim().toLowerCase() !== "task management" && (
              <div
                style={{
                  backgroundColor: "#FAFBFB",
                  paddingTop: index === 0 ? 0 : 12,
                  paddingBottom: 12,
                  marginBottom: 18,
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 500, color: "#3D3D3D" }}>
                  {section.name}
                </p>
                {section.description && (
                  <p style={{ color: "#6C727F" }}>{section.description}</p>
                )}
              </div>
            )}

            {section?.subcategories?.map((subcategory, subIndex) => {
              return (
                <div
                  key={subIndex}
                  style={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: "16px 20px",
                    marginTop: index === 0 && subIndex === 0 ? 0 : 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#3D3D3D",
                          margin: 0,
                        }}
                      >
                        {subcategory.name}
                      </p>
                      {subcategory.description && (
                        <p style={{ color: "#6C727F", fontSize: 14, margin: "4px 0 0 0" }}>
                          {subcategory.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      disabled={!subcategory.is_editable || loading}
                      onChange={(data) => {
                        setLoading(true);
                        handleCategoryPreferenceChange({
                          data,
                          subcategory,
                          setPreferenceData,
                          suprSendClient,
                        }).finally(() => setLoading(false));
                      }}
                      uncheckedIcon={false}
                      checkedIcon={false}
                      height={20}
                      width={40}
                      onColor="#2563EB"
                      checked={subcategory.preference === PreferenceOptions.OPT_IN}
                    />
                  </div>

                  {subcategory?.channels && subcategory.channels.length > 0 && (
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      {subcategory.channels.map((channel, channelIndex) => (
                        <Checkbox
                          key={channelIndex}
                          value={channel.preference}
                          title={formatChannelLabel(channel.channel)}
                          disabled={!channel.is_editable || loading}
                          onClick={() => {
                            setLoading(true);
                            handleChannelPreferenceInCategoryChange({
                              channel,
                              subcategory,
                              setPreferenceData,
                              suprSendClient,
                            }).finally(() => setLoading(false));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// -------------- Channel Level Preferences -------------- //

const handleOverallChannelPreferenceChange = async ({
  channel,
  status,
  setPreferenceData,
  suprSendClient,
}) => {
  const resp =
    await suprSendClient.user.preferences.updateOverallChannelPreference(
      channel.channel,
      status
    );
  if (resp.status === "error") {
    showCustomToast(`Failed to update ${formatChannelLabel(channel.channel)} preference: ${resp.error.message}`, 'error');
  } else {
    setPreferenceData({ ...resp.body });
    showCustomToast(`${formatChannelLabel(channel.channel)} preference updated successfully`, 'success');
  }
};

function ChannelLevelPreferenceItem({ channel, setPreferenceData }) {
  const suprSendClient = useSuprSendClient();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const channelKey = (channel.channel || "").toLowerCase();
  const ChannelIcon = channelKey === "email" ? EmailIconFilled : InboxIconFilled;

  return (
    <div
      style={{
        border: "1px solid #D9D9D9",
        borderRadius: 5,
        padding: "12px 24px",
        marginBottom: 24,
        backgroundColor: "#FFF",
      }}
    >
      <div
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
        onClick={() => setIsActive(!isActive)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
          <ChannelIcon
            size={20}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#3D3D3D", margin: 0 }}>
              {formatChannelLabel(channel.channel)}
            </p>
            <p style={{ color: "#6C727F", fontSize: 14, margin: "2px 0 0 0" }}>
              {channel.is_restricted
                ? "Allow required notifications only"
                : "Allow all notifications"}
            </p>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isActive ? (
            <ChevronUp size={20} style={{ color: "#3D3D3D" }} aria-hidden />
          ) : (
            <ChevronDown size={20} style={{ color: "#3D3D3D" }} aria-hidden />
          )}
        </div>
      </div>
      {isActive && (
        <div style={{ marginTop: 12, marginLeft: 24 }}>
          <p
            style={{
              color: "#3D3D3D",
              fontSize: 16,
              fontWeight: 500,
              marginTop: 12,
              borderBottom: "1px solid #E8E8E8",
            }}
          >
            {formatChannelLabel(channel.channel)} Preferences
          </p>
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="radio"
                  name={`all-${channel.channel}`}
                  value={true}
                  id={`all-${channel.channel}`}
                  checked={!channel.is_restricted}
                  disabled={loading}
                  onChange={() => {
                    setLoading(true);
                    handleOverallChannelPreferenceChange({
                      channel,
                      status: ChannelLevelPreferenceOptions.ALL,
                      setPreferenceData,
                      suprSendClient,
                    }).finally(() => setLoading(false));
                  }}
                />
                <label htmlFor={`all-${channel.channel}`} style={{ marginLeft: 12 }}>
                  All
                </label>
              </div>
              <p style={{ color: "#6C727F", fontSize: 14, marginLeft: 22 }}>
                Allow All Notifications, except the ones that I have turned off
              </p>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="radio"
                  name={`required-${channel.channel}`}
                  value={true}
                  id={`required-${channel.channel}`}
                  checked={channel.is_restricted}
                  disabled={loading}
                  onChange={() => {
                    setLoading(true);
                    handleOverallChannelPreferenceChange({
                      channel,
                      status: ChannelLevelPreferenceOptions.REQUIRED,
                      setPreferenceData,
                      suprSendClient,
                    }).finally(() => setLoading(false));
                  }}
                />
                <label htmlFor={`required-${channel.channel}`} style={{ marginLeft: 12 }}>
                  Required
                </label>
              </div>
              <p style={{ color: "#6C727F", fontSize: 14, marginLeft: 22 }}>
                Allow only important notifications related to account and
                security settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelLevelPreferences({ preferenceData, setPreferenceData }) {
  const channels = preferenceData?.channel_preferences || [];

  return (
    <div>
      <div
        style={{
          backgroundColor: "#FAFBFB",
          paddingTop: 12,
          paddingBottom: 12,
          marginBottom: 18,
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, color: "#3D3D3D", margin: 0 }}>
          What notifications to allow for channel?
        </p>
      </div>
      <div>
        {channels.length ? (
          channels.map((channel, index) => (
            <ChannelLevelPreferenceItem
              key={index}
              channel={channel}
              setPreferenceData={setPreferenceData}
            />
          ))
        ) : (
          <p style={{ color: "#6C727F" }}>No channel preferences available</p>
        )}
      </div>
    </div>
  );
}

// -------------- Channel pill (SuprSend preference style: pill + blue checkmark when selected) -------------- //

function Checkbox({ title, value, onClick, disabled }) {
  const selected = value === PreferenceOptions.OPT_IN;

  return (
    <div
      style={{
        border: selected ? "1px solid #2563EB" : "1px solid #D9D9D9",
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 16px 6px 8px",
        borderRadius: 30,
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: selected ? "#EFF4FF" : "#FFF",
      }}
      onClick={disabled ? undefined : onClick}
    >
      <ChannelCheckmark selected={selected} disabled={disabled} />
      <span
        style={{
          marginLeft: 8,
          color: selected ? "#3D3D3D" : "#6C727F",
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        {title}
      </span>
    </div>
  );
}

function ChannelCheckmark({ selected, disabled }) {
  const bgColor = selected
    ? disabled
      ? "#BDCFF8"
      : "#2563EB"
    : "#FFF";
  const borderColor = selected ? "#2563EB" : "#D9D9D9";

  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {selected && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ display: "block" }}>
          <path
            d="M1 5L4.5 8.5L11 1.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// -------------- Main Component -------------- //

function NotificationPreferences({ headerHeightPx: headerHeightPxProp } = {}) {
  const suprSendClient = useSuprSendClient();
  const { authenticatedUser } = useAuthenticateUser();
  const [preferenceData, setPreferenceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const headerHeightPx = headerHeightPxProp ?? 72;

  useEffect(() => {
    if (!authenticatedUser || !suprSendClient) return;

    // Load preferences
    suprSendClient.user.preferences.getPreferences().then(async (resp) => {
      if (resp.status === "error") {
        setError(resp.error.message);
        showCustomToast('Failed to load notification preferences', 'error');
      } else {
        // Check if email channel is missing from channel_preferences
        const channels = resp.body?.channel_preferences || [];
        const hasEmail = channels.some(ch => ch.channel === 'email');
        const hasInbox = channels.some(ch => ch.channel === 'inbox');
        
        // If email is missing but inbox exists, try to add email channel
        if (!hasEmail && hasInbox) {
          try {
            await suprSendClient.user.preferences.updateOverallChannelPreference(
              'email',
              ChannelLevelPreferenceOptions.ALL
            );
            
            // Reload preferences after adding email
            const updatedResp = await suprSendClient.user.preferences.getPreferences();
            if (updatedResp.status !== 'error') {
              setPreferenceData({ ...updatedResp.body });
              setIsLoading(false);
              return;
            }
          } catch (emailError) {
            // Silent fail
          }
        }
        
        setPreferenceData({ ...resp.body });
      }
      setIsLoading(false);
    });

    // Listen for update in preferences data
    const handlePreferencesUpdated = (preferenceData) => {
      setPreferenceData({ ...preferenceData.body });
    };

    // Listen for errors
    const handlePreferencesError = (response) => {
      // Silent fail
    };

    suprSendClient.emitter.on("preferences_updated", handlePreferencesUpdated);
    suprSendClient.emitter.on("preferences_error", handlePreferencesError);

    return () => {
      if (suprSendClient?.emitter) {
        suprSendClient.emitter.off("preferences_updated", handlePreferencesUpdated);
        suprSendClient.emitter.off("preferences_error", handlePreferencesError);
      }
    };
  }, [authenticatedUser, suprSendClient]);

  // Layout consistent with Task Board: same background, header bar, and content padding
  const pageHeader = (
    <div
      className="bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0"
      style={{ minHeight: headerHeightPx }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#3D3D3D", margin: 0 }}>
        Notification Preferences
      </h1>
    </div>
  );

  const contentArea = (children) => (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-full flex flex-col bg-gray-50">
        {pageHeader}
        {contentArea(<p style={{ color: "#6C727F" }}>Loading...</p>)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex flex-col bg-gray-50">
        {pageHeader}
        {contentArea(
          <>
            <p style={{ color: "#6C727F", marginBottom: 12 }}>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0"
            >
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  if (!preferenceData) {
    return (
      <div className="min-h-full flex flex-col bg-gray-50">
        {pageHeader}
        {contentArea(
          <p style={{ color: "#6C727F" }}>No notification preferences are currently available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {pageHeader}
      {contentArea(
        <>
          <NotificationCategoryPreferences
            preferenceData={preferenceData}
            setPreferenceData={setPreferenceData}
          />
          <ChannelLevelPreferences
            preferenceData={preferenceData}
            setPreferenceData={setPreferenceData}
          />
        </>
      )}
    </div>
  );
}

export default NotificationPreferences;
