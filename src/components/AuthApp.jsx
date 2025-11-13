import React, { useState, useEffect, useCallback } from 'react';
import { SuprSendProvider, SuprSendFeedProvider } from '@suprsend/react';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';
import MainLayout from './MainLayout';
import ToastNotification from './ToastNotification';
import { suprsendTools } from '../hooks/useMcpTool';
import logger from '../utils/logger';

// Constants
const DEFAULT_WORKSPACE = 'task-management-example-app';

// Main Authentication App Component
const AuthApp = () => {
  const [currentView, setCurrentView] = useState('signin');
  const [currentUser, setCurrentUser] = useState(null);
  const workspace = process.env.REACT_APP_SUPRSEND_WORKSPACE || DEFAULT_WORKSPACE;

  // Initialize window.suprsend if not available
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.suprsend) {
      window.suprsend = {
        identify: (distinctId) => Promise.resolve(),
        reset: () => Promise.resolve()
      };
    }
  }, []);

  // Authentication handlers
  const handleSignUpSuccess = useCallback(async (userResult, distinctId) => {
    try {
      await suprsendTools.identifyUser(distinctId);
      setCurrentUser({
        distinctId,
        profile: userResult
      });
    } catch (error) {
      logger.error('Error identifying user after signup:', error);
      setCurrentUser({
        distinctId,
        profile: userResult
      });
    }
  }, []);

  const handleSignInSuccess = useCallback((userResult, distinctId) => {
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
    setCurrentView('signin');
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // Render authenticated app
  if (currentUser) {
    const publicApiKey = process.env.REACT_APP_SUPRSEND_PUBLIC_KEY;
    if (!publicApiKey) {
      logger.error('REACT_APP_SUPRSEND_PUBLIC_KEY environment variable is required');
      return (
        <div className="auth-app">
          <div className="auth-container">
            <div className="error-message">
              Configuration error: REACT_APP_SUPRSEND_PUBLIC_KEY is missing. Please check your environment variables.
            </div>
          </div>
        </div>
      );
    }

    return (
      <SuprSendProvider 
        publicApiKey={publicApiKey} 
        distinctId={currentUser.distinctId}
      >
        <SuprSendFeedProvider>
          <ToastNotification />
          <MainLayout 
            user={currentUser} 
            onSignOut={handleSignOut}
          />
        </SuprSendFeedProvider>
      </SuprSendProvider>
    );
  }

  // Render authentication forms
  return (
    <div className="auth-app">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Task Management App</h1>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={`tab ${currentView === 'signin' ? 'active' : ''}`}
            onClick={() => handleViewChange('signin')}
          >
            Sign In
          </button>
          <button 
            className={`tab ${currentView === 'signup' ? 'active' : ''}`}
            onClick={() => handleViewChange('signup')}
          >
            Sign Up
          </button>
        </div>
        
        <div className="auth-content">
          {currentView === 'signin' ? (
            <SignInForm 
              onSuccess={handleSignInSuccess}
              workspace={workspace}
            />
          ) : (
            <SignUpForm 
              onSuccess={handleSignUpSuccess}
              workspace={workspace}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthApp;