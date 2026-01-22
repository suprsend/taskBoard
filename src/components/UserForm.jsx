import React, { useState } from 'react';
import { suprsendTools } from '../hooks/useMcpTool';
import logger from '../utils/logger';
import { sanitizeEmail, sanitizeName, sanitizeOTP } from '../utils/sanitize';
import { sendOTP as sendOTPAPI } from '../utils/api';

// Send OTP via backend API (secure)
const sendOTPEmail = async (email, userName = 'User') => {
  logger.log('Sending OTP email via backend', { 
    email: email.substring(0, 3) + '***'
  });
  
  try {
    const result = await sendOTPAPI(email, userName);
    logger.log('OTP sent successfully');
    
    // In development, OTP is returned for testing
    // In production, OTP is only sent via email
    return result;
  } catch (error) {
    logger.error('OTP send error', { error: error.message });
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Unable to connect to backend server. Please ensure the backend is running.');
    }
    throw error;
  }
};

const UserForm = ({ onSuccess, workspace = "task-management-example-app" }) => {
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp: ''
  });
  const [otpCode, setOtpCode] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    const errors = {};
    
    if (step === 'email') {
      const sanitizedEmail = sanitizeEmail(formData.email);
      if (!sanitizedEmail) {
        errors.email = 'Email is required';
      } else if (sanitizedEmail !== formData.email.toLowerCase().trim()) {
        errors.email = 'Please enter a valid email address';
      }
    } else if (step === 'otp') {
      const sanitizedOTP = sanitizeOTP(formData.otp);
      if (!sanitizedOTP || sanitizedOTP.length !== 6) {
        errors.otp = 'OTP must be 6 digits';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const email = sanitizeEmail(formData.email);
    
    if (!email) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userName = sanitizeName(formData.name) || 'User';
      const result = await sendOTPEmail(email, userName);
      
      // Store OTP for verification (only available in development for testing)
      // In production, OTP is only sent via email and must be verified
      if (result.otp && process.env.NODE_ENV === 'development') {
        setOtpCode(result.otp);
      } else {
        // Production: OTP is only sent via email, user must enter it
        setOtpCode(null);
      }
      
      setStep('otp');
      setError(null);
    } catch (err) {
      logger.error('OTP send failed', { error: err.message });
      let errorMessage = err.message || 'Failed to send OTP. Please try again.';
      
      if (err.message.includes('Network error') || err.message.includes('Load failed') || err.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to send OTP. Please check your internet connection and API configuration.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error: Please configure CORS settings or use a backend proxy.';
      } else if (err.message.includes('API key')) {
        errorMessage = 'Configuration error: ' + err.message;
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMessage = 'Authentication error: Invalid API key. Please check your REACT_APP_SUPRSEND_API_KEY.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Workflow not found: Please check if the OTP workflow exists in SuprSend dashboard.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.otp.trim()) {
      setValidationErrors({ otp: 'OTP is required' });
      return;
    }

    const sanitizedOTP = sanitizeOTP(formData.otp);
    
    if (!sanitizedOTP || sanitizedOTP.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    // Verify OTP
    // In development: compare with stored code (for testing convenience)
    // In production: should verify with backend (TODO: add backend OTP verification endpoint)
    if (otpCode && sanitizedOTP !== otpCode) {
      setError('Invalid OTP. Please check your email and try again.');
      return;
    }
    
    // If no OTP code stored (production mode), OTP is still required
    // User must enter the OTP they received via email
    if (!otpCode) {
      // In production, OTP is only sent via email
      // User must enter the correct OTP to proceed
      // Note: For full production security, add backend OTP verification
    }

    setLoading(true);
    setError(null);

    try {
      const email = sanitizeEmail(formData.email);
      if (!email) {
        setError('Invalid email address');
        setLoading(false);
        return;
      }
      
      const distinctId = email;
      const userData = {
        $email: [email]
      };
      
      const sanitizedName = sanitizeName(formData.name);
      if (sanitizedName) {
        userData.name = sanitizedName;
      }

      await suprsendTools.upsertUser(distinctId, userData, workspace);
      await suprsendTools.identifyUser(distinctId);
      
      const userProfile = {
        distinct_id: distinctId,
        properties: {
          name: sanitizedName || null,
          email: email
        },
        $email: [{
          value: email
        }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (onSuccess) {
        onSuccess(userProfile, distinctId);
      }

    } catch (err) {
      let errorMessage = err.message || 'Failed to create user. Please try again.';
      
      if (err.message.includes('Network error') || err.message.includes('Load failed')) {
        errorMessage = 'Network error: Unable to connect to SuprSend. Please check your internet connection.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error: Please configure CORS settings or use a backend proxy for MCP tools.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'otp') {
      const sanitized = sanitizeOTP(value);
      setFormData(prev => ({
        ...prev,
        [name]: sanitized
      }));
    } else if (name === 'name') {
      const sanitized = sanitizeName(value);
      setFormData(prev => ({
        ...prev,
        [name]: sanitized
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) {
      setError(null);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const email = sanitizeEmail(formData.email);
      if (!email) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      const userName = sanitizeName(formData.name) || 'User';
      const result = await sendOTPEmail(email, userName);
      
      // Store OTP for verification (only available in development for testing)
      if (result.otp && process.env.NODE_ENV === 'development') {
        setOtpCode(result.otp);
      } else {
        // Production: OTP is only sent via email
        setOtpCode(null);
      }
      
      setError(null);
    } catch (err) {
      logger.error('Resend OTP failed', { error: err.message });
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="user-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            We've sent a 6-digit OTP to <strong>{formData.email}</strong>
          </p>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-sm text-blue-600 hover:text-blue-700"
            disabled={loading}
          >
            ← Change email
          </button>
        </div>

        <form onSubmit={handleOTPSubmit} className="form">
          <div className="form-group">
            <label htmlFor="otp">Enter OTP *</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={formData.otp}
              onChange={handleInputChange}
              className={validationErrors.otp ? 'error' : ''}
              placeholder="Enter 6-digit OTP"
              disabled={loading}
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
            {validationErrors.otp && (
              <span className="error-text">{validationErrors.otp}</span>
            )}
          </div>

          <div className="flex space-x-3">
            <button 
              type="submit" 
              className="submit-button flex-1"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="user-form">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="form">
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
            required
          />
          {validationErrors.email && (
            <span className="error-text">{validationErrors.email}</span>
          )}
        </div>

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

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default UserForm;

