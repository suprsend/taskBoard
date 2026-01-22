import { useState, useEffect } from "react";
import Switch from "react-switch";
import {
  ChannelLevelPreferenceOptions,
  PreferenceOptions,
  useSuprSendClient,
  useAuthenticateUser,
} from "@suprsend/react";
import { showCustomToast } from "./CustomToast";

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
    showCustomToast(`Failed to update ${channel.channel} preference: ${resp.error.message}`, 'error');
  } else {
    setPreferenceData({ ...resp.body });
    showCustomToast(`${channel.channel} preference updated successfully`, 'success');
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500 text-center py-8">
          No notification categories available. Please check your SuprSend configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredSections.map((section, index) => {
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          {section?.name && (
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {section.name}
                </h3>
                {section.description && (
                  <p className="text-sm text-gray-600">{section.description}</p>
                )}
            </div>
          )}

            <div className="space-y-6">
              {section?.subcategories?.map((subcategory, subIndex) => {
                return (
                  <div
                    key={subIndex}
                    className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {subcategory.name}
                        </h4>
                        {subcategory.description && (
                          <p className="text-sm text-gray-600">
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
                        className="ml-4"
                />
              </div>

                    {subcategory?.channels && subcategory.channels.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {subcategory.channels.map((channel, channelIndex) => {
                          return (
                  <Checkbox
                    key={channelIndex}
                    value={channel.preference}
                    title={channel.channel}
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
                          );
                        })}
                      </div>
                    )}
              </div>
                );
              })}
            </div>
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
    showCustomToast(`Failed to update ${channel.channel} preference: ${resp.error.message}`, 'error');
  } else {
    setPreferenceData({ ...resp.body });
    showCustomToast(`${channel.channel} preference updated successfully`, 'success');
  }
};

function ChannelLevelPreferenceItem({ channel, setPreferenceData }) {
  const suprSendClient = useSuprSendClient();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
      <div
        className="cursor-pointer"
        onClick={() => setIsActive(!isActive)}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {channel.channel}
        </h3>
        <p className="text-sm text-gray-600">
          {channel.is_restricted
            ? "Allow required notifications only"
            : "Allow all notifications"}
        </p>
      </div>
      {isActive && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {channel.channel} Preferences
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
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
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor={`all-${channel.channel}`}
                  className="ml-3 text-sm font-medium text-gray-900"
                >
                  All
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-7">
                Allow All Notifications, except the ones that I have turned off
              </p>
            </div>
            <div>
              <div className="flex items-center mb-2">
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
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor={`required-${channel.channel}`}
                  className="ml-3 text-sm font-medium text-gray-900"
                >
                  Required
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-7">
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

  if (!channels.length) {
  return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500 text-center py-8">No channel preferences available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {channels.map((channel, index) => {
        return (
            <ChannelLevelPreferenceItem
              key={index}
              channel={channel}
              setPreferenceData={setPreferenceData}
            />
        );
      })}
    </div>
  );
}

// -------------- Custom Checkbox Component -------------- //

function Checkbox({ title, value, onClick, disabled }) {
  const selected = value === PreferenceOptions.OPT_IN;

  return (
    <div
      className={`
        inline-flex items-center px-3 py-1.5 rounded-lg border transition-colors
        ${selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'cursor-pointer'
        }
      `}
      onClick={disabled ? undefined : onClick}
    >
      <CheckboxIcon selected={selected} disabled={disabled} />
      <span className={`ml-2 text-sm font-medium ${
        selected ? 'text-blue-700' : 'text-gray-700'
      }`}>
        {title}
      </span>
  </div>
);
}

function CheckboxIcon({ selected, disabled }) {
  return (
    <div
      className={`
        w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 transition-colors
        ${selected 
          ? disabled
            ? 'border-blue-400 bg-blue-200'
            : 'border-blue-600 bg-blue-600'
          : disabled
          ? 'border-gray-300 bg-gray-100'
          : 'border-gray-400 bg-white'
        }
      `}
    >
      {selected && (
        <svg
          className={`w-3.5 h-3.5 ${disabled ? 'text-blue-600' : 'text-white'}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

// -------------- Main Component -------------- //

function NotificationPreferences() {
  const suprSendClient = useSuprSendClient();
  const { authenticatedUser } = useAuthenticateUser();
  const [preferenceData, setPreferenceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
              <p className="text-gray-600">Loading your preferences...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading preferences...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
              <p className="text-gray-600">Error loading preferences</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferenceData) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
              <p className="text-gray-600">No preferences available</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <p className="text-gray-500 text-center py-8">
                No notification preferences are currently available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
            <p className="text-gray-600">Manage your notification settings</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Category Preferences Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Category Preferences</h2>
                <p className="text-sm text-gray-600">Choose which types of notifications you want to receive</p>
              </div>
            <NotificationCategoryPreferences
              preferenceData={preferenceData}
              setPreferenceData={setPreferenceData}
            />
        </div>

            {/* Channel Preferences Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Channel Preferences</h2>
                <p className="text-sm text-gray-600">Configure notification delivery channels</p>
          </div>
            <ChannelLevelPreferences
              preferenceData={preferenceData}
              setPreferenceData={setPreferenceData}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPreferences;
