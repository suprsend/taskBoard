import { useCallback } from 'react';
import { useSuprSendClient as useSuprSendClientHook } from '@suprsend/react';
import logger from '../utils/logger';
import { isEmailAddress, extractNameFromEmail } from '../utils/helpers';

// Get current user info from context or fallback
// Note: This should ideally come from a React context, but kept for backward compatibility
const getCurrentUserInfo = () => {
  const userEmail = window.currentUserEmail || 'user@example.com';
  const userName = window.currentUserName || 'User';
  
  return {
    distinctId: userEmail,
    email: userEmail,
    name: userName
  };
};

const createRecipient = (assigneeEmail, currentUserInfo) => ({
  is_transient: true,
  distinct_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  $email: [assigneeEmail],
  $channels: ["email"],
  name: extractNameFromEmail(assigneeEmail),
  assignee_email: assigneeEmail,
  assigned_by: currentUserInfo.name,
  task_assignee: true
});

const triggerWorkflow = async (workflowName, recipients, data = {}) => {
  const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
  if (!apiKey) {
    throw new Error('REACT_APP_SUPRSEND_API_KEY environment variable is required');
  }
  
  const workflowPayload = {
    workflow: workflowName,
    actor: {
      distinct_id: getCurrentUserInfo().distinctId,
      name: getCurrentUserInfo().name,
      $skip_create: true
    },
    recipients: recipients,
    data: data
  };
  
  const response = await fetch('https://hub.suprsend.com/trigger/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(workflowPayload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
  }
  
  return responseData;
};

export const useSuprSendClient = () => {
  const suprSendClient = useSuprSendClientHook();

  const trackTaskStatusChange = useCallback(async (taskTitle, oldStatus, newStatus, taskId, assigneeEmail = null) => {
    if (!suprSendClient) return;
    
    try {
      await suprSendClient.track('TASK_STATUS_CHANGED', {
        task_title: taskTitle,
        old_status: oldStatus,
        new_status: newStatus,
        task_id: taskId,
        user_name: 'User',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to track task status change:', error);
    }
  }, [suprSendClient]);

  const trackTaskCreated = useCallback(async (taskData) => {
    if (!suprSendClient) return;
    
    try {
      // Send in-app notification (inbox) when task is created
      const eventProperties = {
        task_title: taskData.title,
        task_id: taskData.id,
        task_priority: taskData.priority,
        task_description: taskData.description || '',
        task_due_date: taskData.dueDate || '',
        task_status: taskData.status,
        user_name: 'User',
        timestamp: new Date().toISOString()
      };

      await suprSendClient.track('TASK_CREATED', eventProperties);

      // Send email notification to external assignee if applicable
      if (taskData.assignee && isEmailAddress(taskData.assignee)) {
        const currentUser = getCurrentUserInfo();
        
        if (taskData.assignee !== currentUser.email) {
          const recipient = createRecipient(taskData.assignee, currentUser);
          const assigneeName = extractNameFromEmail(taskData.assignee);
          
          try {
            await triggerWorkflow('task_assigned_email', [recipient], {
              task_title: taskData.title,
              task_id: taskData.id,
              task_priority: taskData.priority,
              task_description: taskData.description || '',
              task_due_date: taskData.dueDate || '',
              assignee_email: taskData.assignee,
              assignee_name: assigneeName,
              assigned_by: currentUser.name,
              task_status: taskData.status
            });
          } catch (workflowError) {
            logger.error('Email workflow failed:', workflowError);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to trigger task creation notifications:', error);
    }
  }, [suprSendClient]);

  return {
    suprSendClient,
    trackTaskStatusChange,
    trackTaskCreated,
    triggerWorkflow,
    createRecipient
  };
};