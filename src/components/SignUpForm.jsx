import React, { useState } from 'react';
import { useMcpTool, suprsendTools } from '../hooks/useMcpTool';
import { registerUser } from '../services/authService';
import { Eye, EyeOff } from 'lucide-react';
import logger from '../utils/logger';
import { isEmailAddress } from '../utils/helpers';

/**
 * SignUpForm Component
 * 
 * This component handles user registration by calling SuprSend's users.upsert tool.
 * 
 * Tool Call Example:
 * - Tool: mcp_suprsend_upsert_suprsend_user
 * - Args: {
 *     distinct_id: "user123",
 *     workspace: "your_workspace",
 *     action: "upsert",
 *     object_payload: {
 *       name: "John Doe",
 *       $email: ["john@example.com"]
 *     }
 *   }
 */
const SignUpForm = ({ onSuccess, workspace = "task-management-example-app" }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
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
      // Register user with authentication service
      const authResult = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        distinctId: formData.email // Use email as distinct_id
      });

      logger.debug('User registered successfully');
      
      // Now create/update user in SuprSend for notifications
      try {
        const userData = {
          $email: [formData.email], // Set email for notifications
          email: formData.email,    // Also set as regular property
          distinct_id: authResult.id // Ensure distinct_id is set
        };
        
        // Only add name if provided
        if (formData.name.trim()) {
          userData.name = formData.name.trim();
        }

        logger.debug('Creating user in SuprSend');

        await suprsendTools.upsertUser(
          authResult.id,
          userData,
          workspace
        );

        logger.debug('User added to SuprSend successfully');
      } catch (suprsendError) {
        logger.warn('Could not add user to SuprSend:', suprsendError.message);
        // Continue even if SuprSend fails
      }
      
      setSuccessMessage('Account created successfully! You can now sign in.');
      setFormData({ name: '', email: '', password: '' });
      setValidationErrors({});
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        // Create proper user profile structure for the app
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
      logger.error('Error creating user:', err);
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

  return (
    <div className="signup-form">
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
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
          <label htmlFor="name">Full Name (Optional)</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={validationErrors.name ? 'error' : ''}
            placeholder="Enter your full name"
            disabled={loading}
          />
          {validationErrors.name && (
            <span className="error-text">{validationErrors.name}</span>
          )}
        </div>

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
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder="Enter your password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.password && (
            <span className="error-text">{validationErrors.password}</span>
          )}
          <small className="help-text">
            Password must be at least 6 characters long.
          </small>
        </div>


        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

    </div>
  );
};

export default SignUpForm;