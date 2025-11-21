import React, { useState, useEffect, useCallback } from 'react';
import { SuprSendProvider, useSuprSendClient } from '@suprsend/react';
import UserForm from './UserForm';
import MainLayout from './MainLayout';
import { suprsendTools } from '../hooks/useMcpTool';

const DEFAULT_WORKSPACE = process.env.REACT_APP_SUPRSEND_WORKSPACE || 'task-management-example-app';

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
          console.error('REACT_APP_SUPRSEND_API_KEY is not configured');
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
        console.error('Error setting default preferences:', error);
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
  const workspace = process.env.REACT_APP_SUPRSEND_WORKSPACE || DEFAULT_WORKSPACE;

  // Handle user creation/authentication success
  const handleUserSuccess = useCallback(async (userResult, distinctId) => {
    try {
      await suprsendTools.identifyUser(distinctId);
    } catch (error) {
      // Silent fail
    }
    setCurrentUser({
      distinctId,
      profile: userResult
    });
  }, []);

  const handleSignOut = useCallback(() => {
    if (window.suprsend?.reset) {
      window.suprsend.reset();
    }
    setCurrentUser(null);
  }, []);

  // Set user context for notification tracking
  useEffect(() => {
    if (currentUser) {
      const userEmail = currentUser.profile?.$email?.[0]?.value || currentUser.distinctId;
      const userName = currentUser.profile?.properties?.name || 'User';
      window.currentUserEmail = userEmail;
      window.currentUserName = userName;
    }
  }, [currentUser]);

  // Render authenticated app
  if (currentUser) {
    const publicApiKey = process.env.REACT_APP_SUPRSEND_PUBLIC_KEY;
    if (!publicApiKey) {
      console.error('REACT_APP_SUPRSEND_PUBLIC_KEY is not configured');
      return <div>Configuration error: Missing SuprSend public key</div>;
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
          <h1>Task Management App</h1>
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
