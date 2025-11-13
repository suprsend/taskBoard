import React, { useState } from 'react';
import { useMcpTool, suprsendTools } from '../hooks/useMcpTool';
import { authenticateUser } from '../services/authService';
import logger from '../utils/logger';
import { isEmailAddress } from '../utils/helpers';

/**
 * SignInForm Component
 * 
 * This component handles user authentication by calling SuprSend's users.get tool
 * and then identifying the user for session management.
 * 
 * Tool Call Examples:
 * 1. Get user: mcp_suprsend_get_suprsend_user
 *    Args: { distinct_id: "user123", workspace: "your_workspace" }
 * 
 * 2. Identify user: suprsend.identify(distinct_id)
 *    (Frontend SDK call for session management)
 */
const SignInForm = ({ onSuccess, workspace = "task-management-example-app" }) => {
  const [formData, setFormData] = useState({
    email: '', // Email address for login
    password: '' // For demo purposes, not used in SuprSend
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  
  const { loading, error } = useMcpTool();

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isEmailAddress(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Authenticate user with proper password validation
      const authResult = await authenticateUser(formData.email, formData.password);
      
      logger.debug('User authenticated successfully');
      
      // Now fetch user profile from SuprSend for notifications
      let userResult;
      try {
        userResult = await suprsendTools.getUser(authResult.id, workspace);
        logger.debug('User profile fetched from SuprSend');
        
        // If SuprSend profile doesn't have name but authResult does, use authResult name
        if (!userResult?.properties?.name && authResult.name) {
          userResult.properties = userResult.properties || {};
          userResult.properties.name = authResult.name;
          logger.debug('Updated SuprSend profile with name from authResult');
        }
      } catch (suprsendError) {
        logger.warn('Could not fetch SuprSend profile:', suprsendError.message);
        // Create a basic profile if SuprSend user doesn't exist
        userResult = {
          distinct_id: authResult.id,
          properties: {
            name: authResult.name || null,
            email: authResult.email // Ensure email is in properties
          },
          $email: [{
            value: authResult.email
          }],
          created_at: authResult.createdAt,
          updated_at: authResult.createdAt
        };
        logger.debug('Created fallback profile');
        
        // Try to create the user in SuprSend
        try {
          const userData = {
            $email: [authResult.email],
            email: authResult.email,
            distinct_id: authResult.id
          };
          
          if (authResult.name) {
            userData.name = authResult.name;
          }
          
          logger.debug('Creating missing user in SuprSend');
          await suprsendTools.upsertUser(authResult.id, userData, workspace);
          logger.debug('User created in SuprSend during sign-in');
        } catch (createError) {
          logger.warn('Could not create user in SuprSend during sign-in:', createError.message);
        }
      }
      
      // Set user profile for display
      setUserProfile(userResult);
      
      // Identify user for session management (frontend SDK call)
      try {
        await suprsendTools.identifyUser(authResult.id);
        logger.debug('User identified for session');
      } catch (identifyError) {
        logger.warn('Could not identify user (SDK not loaded):', identifyError.message);
        // Continue with login even if identify fails
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        // Ensure userResult has the proper structure
        const userProfile = {
          distinct_id: authResult.id,
          properties: {
            name: authResult.name || null,
            email: authResult.email
          },
          $email: [{
            value: authResult.email
          }],
          created_at: authResult.createdAt,
          updated_at: authResult.createdAt
        };
        
        onSuccess(userProfile, authResult.id);
      }

    } catch (err) {
      logger.error('Authentication failed:', err);
      // Set error message for display
      setValidationErrors({ general: err.message });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignOut = () => {
    setUserProfile(null);
    setFormData({ email: '', password: '' });
    setValidationErrors({});
    
    // Call reset on frontend SDK if available
    if (window.suprsend && window.suprsend.reset) {
      window.suprsend.reset();
    }
  };

  // If user is signed in, show profile
  if (userProfile) {
    return (
      <div className="signin-form">
        <h2>Welcome Back!</h2>
        
        <div className="user-profile">
          <h3>User Profile</h3>
          <div className="profile-info">
            <p><strong>User ID:</strong> {userProfile.distinct_id}</p>
            <p><strong>Name:</strong> {userProfile.properties?.name || 'Not set'}</p>
            <p><strong>Email:</strong> {userProfile.$email?.[0]?.value || 'Not set'}</p>
            <p><strong>Created:</strong> {new Date(userProfile.created_at).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {new Date(userProfile.updated_at).toLocaleDateString()}</p>
          </div>
          
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signin-form">
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {validationErrors.general && (
        <div className="error-message">
          {validationErrors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={validationErrors.email ? 'error' : ''}
            placeholder="Enter your email address"
            disabled={loading}
          />
          {validationErrors.email && (
            <span className="error-text">{validationErrors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={validationErrors.password ? 'error' : ''}
            placeholder="Enter your password"
            disabled={loading}
          />
          {validationErrors.password && (
            <span className="error-text">{validationErrors.password}</span>
          )}
          <small className="help-text">
            Enter your email and password to sign in.
          </small>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

    </div>
  );
};

export default SignInForm;