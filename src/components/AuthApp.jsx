import React, { useState, useEffect, useCallback } from 'react';
import { SuprSendProvider, useSuprSendClient } from '@suprsend/react';
import UserForm from './UserForm';
import MainLayout from './MainLayout';
import { suprsendTools } from '../hooks/useMcpTool';
import logger from '../utils/logger';
import { validateProductionConfig } from '../utils/security';

const DEFAULT_WORKSPACE = process.env.REACT_APP_SUPRSEND_WORKSPACE || 'task-management-example-app';

// Validate production configuration on module load
if (process.env.NODE_ENV === 'production') {
  validateProductionConfig();
}

// Component to set default channel preferences
const SetDefaultPreferences = ({ distinctId }) => {
  const suprSendClient = useSuprSendClient();
  const [hasSetPreferences, setHasSetPreferences] = useState(false);

  useEffect(() => {
    if (!suprSendClient || !distinctId || hasSetPreferences) return;

    const setDefaultChannelPreferences = async () => {
      try {
        const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
        if (!apiKey) {
          logger.error('REACT_APP_SUPRSEND_API_KEY is not configured');
          return;
        }
        const userEmail = window.currentUserEmail || distinctId;
        
        // Ensure email is properly set in user profile
        if (userEmail && userEmail !== distinctId) {
          try {
            const updateUserUrl = `https://hub.suprsend.com/v1/user/${encodeURIComponent(distinctId)}/`;
            await fetch(updateUserUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              mode: 'cors',
              credentials: 'omit',
              body: JSON.stringify({
                $email: [userEmail]
              })
            });
          } catch (userError) {
            // Silent fail
          }
        }
        
        // Wait for profile to sync
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set channel preferences
        const prefUrl = `https://hub.suprsend.com/v1/user/${encodeURIComponent(distinctId)}/preference/channel_preference/`;
        
        const response = await fetch(prefUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({
            channel_preferences: [
              {
                channel: 'email',
                is_restricted: false
              },
              {
                channel: 'inbox',
                is_restricted: false
              }
            ]
          })
        });

        if (response.ok && suprSendClient?.emitter) {
          setTimeout(async () => {
            try {
              const resp = await suprSendClient.user.preferences.getPreferences();
              if (resp.status !== 'error' && resp.body) {
                suprSendClient.emitter.emit('preferences_updated', { body: resp.body });
              }
            } catch (e) {
              // Silent fail
            }
          }, 1000);
        }
        
        setHasSetPreferences(true);
      } catch (error) {
        logger.error('Error setting default preferences', { error: error.message });
      }
    };

    // Small delay to ensure user is fully initialized
    const timer = setTimeout(() => {
      setDefaultChannelPreferences();
    }, 2000);

    return () => clearTimeout(timer);
  }, [suprSendClient, distinctId, hasSetPreferences]);

  return null;
};

// Main Authentication App Component
const AuthApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const workspace = process.env.REACT_APP_SUPRSEND_WORKSPACE || DEFAULT_WORKSPACE;

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      }
    } catch (error) {
      // Silent fail - invalid data in localStorage
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle user creation/authentication success
  const handleUserSuccess = useCallback(async (userResult, distinctId) => {
    try {
      await suprsendTools.identifyUser(distinctId);
    } catch (error) {
      // Silent fail
    }
    const userData = {
      distinctId,
      profile: userResult
    };
    setCurrentUser(userData);
    // Persist user to localStorage
    try {
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (error) {
      // Silent fail - localStorage might be full or disabled
    }
  }, []);

  const handleSignOut = useCallback(() => {
    if (window.suprsend?.reset) {
      window.suprsend.reset();
    }
    
    // Clear tasks for this user before clearing user data
    try {
      if (currentUser?.distinctId) {
        const userTasksKey = `tasks_${currentUser.distinctId}`;
        localStorage.removeItem(userTasksKey);
      }
    } catch (error) {
      // Silent fail
    }
    
    setCurrentUser(null);
    // Remove user from localStorage
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      // Silent fail
    }
  }, [currentUser?.distinctId]);

  // Set user context for notification tracking
  useEffect(() => {
    if (currentUser) {
      const userEmail = currentUser.profile?.$email?.[0]?.value || currentUser.distinctId;
      const userName = currentUser.profile?.properties?.name || 'User';
      window.currentUserEmail = userEmail;
      window.currentUserName = userName;
    }
  }, [currentUser]);

  // Show loading state while checking for saved user
  if (isLoading) {
    return (
      <div className="auth-app">
        <div className="auth-container">
          <div className="auth-header">
            <h1>TaskBoard</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render authenticated app
  if (currentUser) {
    const publicApiKey = process.env.REACT_APP_SUPRSEND_PUBLIC_KEY;
    if (!publicApiKey) {
      logger.error('REACT_APP_SUPRSEND_PUBLIC_KEY is not configured');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Configuration Error</h2>
            <p className="text-gray-600">Missing SuprSend public key. Please check your environment variables.</p>
          </div>
        </div>
      );
    }

    return (
      <SuprSendProvider 
        publicApiKey={publicApiKey} 
        distinctId={currentUser.distinctId}
      >
        <SetDefaultPreferences distinctId={currentUser.distinctId} />
        <MainLayout 
          user={currentUser} 
          onSignOut={handleSignOut}
        />
      </SuprSendProvider>
    );
  }

  // Render authentication form
  return (
    <div className="auth-app">
      <div className="auth-container">
        <div className="auth-header">
          <h1>TaskBoard</h1>
          <p>Enter your email to get started</p>
        </div>
        
        <div className="auth-content">
          <UserForm 
            onSuccess={handleUserSuccess}
            workspace={workspace}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthApp;
