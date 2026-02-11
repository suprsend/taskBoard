import { useCallback } from 'react';
import { useSuprSendClient as useSuprSendClientHook, PreferenceOptions } from '@suprsend/react';
import logger from '../utils/logger';
import { triggerWorkflow as triggerWorkflowAPI } from '../utils/api';

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
  try {
    logger.log('Triggering workflow via backend', { 
      workflow: workflowSlug,
      email: userEmail.substring(0, 3) + '***'
    });
    
    const result = await triggerWorkflowAPI(workflowSlug, userEmail, distinctId, userName, eventData);
    
    logger.log('Workflow triggered successfully', { workflow: workflowSlug });
    return result;
  } catch (error) {
    logger.error('Failed to trigger workflow', { error: error.message, workflow: workflowSlug });
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
      logger.error('Error checking task notification preferences', { error: error.message });
      return true;
    }
  }, [suprSendClient]);

  const trackTaskStatusChange = useCallback(async (taskTitle, oldStatus, newStatus, taskId) => {
    if (!suprSendClient) {
      logger.warn('trackTaskStatusChange: suprSendClient not available');
      return;
    }
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) {
        logger.log('Notifications disabled by user preference');
        return;
      }
      
      const userInfo = getCurrentUserInfo();
      // Generate task URL (you can customize this based on your app's URL structure)
      const taskUrl = `${window.location.origin}/task/${taskId}`;
      // Generate unsubscribe URL for email preferences
      const unsubscribeUrl = `${window.location.origin}/preferences?email=${encodeURIComponent(userInfo.email)}`;
      
      const eventData = {
        task_title: taskTitle,
        old_status: oldStatus,
        new_status: newStatus,
        task_id: taskId,
        task_url: taskUrl,  // Add task_url for email template
        user_name: userInfo.name,
        actor_name: userInfo.name,  // Template expects actor_name
        unsubscribe_url: unsubscribeUrl,  // Template expects unsubscribe_url
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
      logger.error('Failed to track task status change', { error: error.message });
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  const trackTaskCreated = useCallback(async (taskData) => {
    if (!suprSendClient) {
      logger.warn('trackTaskCreated: suprSendClient not available');
      return;
    }
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) {
        logger.log('Notifications disabled by user preference');
        return;
      }
      
      const userInfo = getCurrentUserInfo();
      // Generate task URL (you can customize this based on your app's URL structure)
      const taskUrl = `${window.location.origin}/task/${taskData.id}`;
      // Generate unsubscribe URL for email preferences
      const unsubscribeUrl = `${window.location.origin}/preferences?email=${encodeURIComponent(userInfo.email)}`;
      
      const eventProperties = {
        task_title: taskData.title,
        task_id: taskData.id,
        task_priority: taskData.priority,
        task_description: taskData.description || '',
        task_due_date: taskData.dueDate || '',
        task_status: taskData.status,
        task_url: taskUrl,  // Add task_url for email template
        user_name: userInfo.name,
        actor_name: userInfo.name,  // Template might expect actor_name
        unsubscribe_url: unsubscribeUrl,  // Template expects unsubscribe_url
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
      logger.error('Failed to track task creation', { error: error.message });
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  const trackTaskDeleted = useCallback(async (taskData) => {
    if (!suprSendClient) {
      logger.warn('trackTaskDeleted: suprSendClient not available');
      return;
    }
    
    try {
      const shouldSendNotification = await checkTaskNotificationPreference();
      if (!shouldSendNotification) {
        logger.log('Notifications disabled by user preference');
        return;
      }
      
      const userInfo = getCurrentUserInfo();
      // Generate task URL (you can customize this based on your app's URL structure)
      const taskUrl = `${window.location.origin}/task/${taskData.id}`;
      // Generate unsubscribe URL for email preferences
      const unsubscribeUrl = `${window.location.origin}/preferences?email=${encodeURIComponent(userInfo.email)}`;
      
      const eventProperties = {
        task_title: taskData.title,
        task_id: taskData.id,
        task_description: taskData.description ?? '',
        task_priority: taskData.priority,
        task_status: taskData.status,
        task_url: taskUrl,  // Add task_url for email template
        user_name: userInfo.name,
        actor_name: userInfo.name,  // Template might expect actor_name
        unsubscribe_url: unsubscribeUrl,  // Template expects unsubscribe_url
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
      logger.error('Failed to track task deletion', { error: error.message });
    }
  }, [suprSendClient, checkTaskNotificationPreference]);

  return {
    suprSendClient,
    trackTaskStatusChange,
    trackTaskCreated,
    trackTaskDeleted
  };
};
