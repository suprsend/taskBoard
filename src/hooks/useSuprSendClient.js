import { useCallback } from 'react';
import { useSuprSendClient as useSuprSendClientHook, PreferenceOptions } from '@suprsend/react';

const getCurrentUserInfo = () => {
  const userEmail = window.currentUserEmail || 'user@example.com';
  const userName = window.currentUserName || 'User';
  
  return {
    distinctId: userEmail,
    email: userEmail,
    name: userName
  };
};

const triggerWorkflow = async (workflowSlug, userEmail, distinctId, userName, eventData) => {
  const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
  if (!apiKey) {
    throw new Error('REACT_APP_SUPRSEND_API_KEY is not configured');
  }
  
  const workflowPayload = {
    workflow: workflowSlug,
    recipients: [
      {
        distinct_id: distinctId,
        $email: [userEmail],
        name: userName,
        $channels: ['email', 'inbox'],
        $skip_create: false
      }
    ],
    data: eventData
  };
  
  try {
    const response = await fetch('https://hub.suprsend.com/trigger/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(workflowPayload)
    });
  
    const responseText = await response.text();
  
    if (!response.ok) {
      throw new Error(`Workflow trigger failed: ${response.status} - ${responseText}`);
    }
    
    return responseText ? JSON.parse(responseText) : { success: true };
  } catch (error) {
    console.error('Failed to trigger workflow:', error);
    throw new Error(`Failed to trigger workflow: ${error.message}`);
  }
};

export const useSuprSendClient = () => {
  const suprSendClient = useSuprSendClientHook();

  const checkTaskNotificationPreference = useCallback(async () => {
    if (!suprSendClient) {
      return true;
    }
    
    try {
      const resp = await suprSendClient.user.preferences.getPreferences();
      
      if (resp.status === "error") {
        return true;
      }
      
      const preferences = resp.body;
      const sections = preferences?.sections || [];
      
      let foundTaskCategory = false;
      let taskCategoryPreference = null;
      
      for (const section of sections) {
        if (!section?.subcategories) continue;
        
        for (const subcategory of section.subcategories) {
          const categoryName = (subcategory.category || '').toLowerCase();
          const subcategoryName = (subcategory.name || '').toLowerCase();
          
          const isTaskRelated = 
            categoryName.includes('task') || 
            categoryName.includes('task_created') ||
            categoryName.includes('task-updates') ||
            categoryName.includes('task_updates') ||
            categoryName.includes('task_update') ||
            categoryName.includes('task_status') ||
            categoryName.includes('task-assignments') ||
            categoryName === 'task' ||
            categoryName === 'task-updates' ||
            subcategoryName.includes('task') ||
            subcategoryName.includes('update');
          
          if (isTaskRelated) {
            foundTaskCategory = true;
            taskCategoryPreference = subcategory.preference;
            
            const preference = String(subcategory.preference || '').toLowerCase();
            const isOptOut = preference === 'opt_out' || preference === String(PreferenceOptions.OPT_OUT || '').toLowerCase();
            const isOptIn = preference === 'opt_in' || preference === String(PreferenceOptions.OPT_IN || '').toLowerCase();
            
            if (isOptOut) {
              return false;
            }
            
            if (isOptIn) {
              return true;
            }
            
            if (subcategory.channels && subcategory.channels.length > 0) {
              const allChannelsOptedOut = subcategory.channels.every(channel => {
                const channelPref = String(channel.preference || '').toLowerCase();
                return channelPref === 'opt_out' || channelPref === String(PreferenceOptions.OPT_OUT || '').toLowerCase();
              });
              
              if (allChannelsOptedOut) {
                return false;
              }
            }
          }
        }
      }
      
      if (foundTaskCategory) {
        const pref = String(taskCategoryPreference || '').toLowerCase();
        if (pref === 'opt_in' || pref === String(PreferenceOptions.OPT_IN || '').toLowerCase()) {
          return true;
        } else if (pref === 'opt_out' || pref === String(PreferenceOptions.OPT_OUT || '').toLowerCase()) {
          return false;
        } else {
          return true;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking task notification preferences:', error);
      return true;
    }
  }, [suprSendClient]);

  const trackTaskStatusChange = useCallback(async (taskTitle, oldStatus, newStatus, taskId) => {
    if (!suprSendClient) return;
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) return;
      
      const userInfo = getCurrentUserInfo();
      const eventData = {
        task_title: taskTitle,
        old_status: oldStatus,
        new_status: newStatus,
        task_id: taskId,
        user_name: userInfo.name,
        timestamp: new Date().toISOString()
      };
      
      const workflowSlug = process.env.REACT_APP_TASK_STATUS_WORKFLOW_SLUG || 'task_status_changed';
      await triggerWorkflow(
        workflowSlug,
        userInfo.email,
        userInfo.distinctId,
        userInfo.name,
        eventData
      );
    } catch (error) {
      console.error('Failed to track task status change:', error);
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  const trackTaskCreated = useCallback(async (taskData) => {
    if (!suprSendClient) return;
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) return;
      
      const userInfo = getCurrentUserInfo();
      const eventProperties = {
        task_title: taskData.title,
        task_id: taskData.id,
        task_priority: taskData.priority,
        task_description: taskData.description || '',
        task_due_date: taskData.dueDate || '',
        task_status: taskData.status,
        user_name: userInfo.name,
        timestamp: new Date().toISOString()
      };

      const workflowSlug = process.env.REACT_APP_TASK_CREATED_WORKFLOW_SLUG || 'task_created';
      await triggerWorkflow(
        workflowSlug,
        userInfo.email,
        userInfo.distinctId,
        userInfo.name,
        eventProperties
      );
    } catch (error) {
      console.error('Failed to track task creation:', error);
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  const trackTaskDeleted = useCallback(async (taskData) => {
    if (!suprSendClient) return;
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) return;
      
      const userInfo = getCurrentUserInfo();
      const eventProperties = {
        task_title: taskData.title,
        task_id: taskData.id,
        task_priority: taskData.priority,
        task_status: taskData.status,
        user_name: userInfo.name,
        timestamp: new Date().toISOString()
      };

      const workflowSlug = process.env.REACT_APP_TASK_DELETED_WORKFLOW_SLUG || 'task_deleted';
      await triggerWorkflow(
        workflowSlug,
        userInfo.email,
        userInfo.distinctId,
        userInfo.name,
        eventProperties
      );
    } catch (error) {
      console.error('Failed to track task deletion:', error);
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  return {
    suprSendClient,
    trackTaskStatusChange,
    trackTaskCreated,
    trackTaskDeleted
  };
};
