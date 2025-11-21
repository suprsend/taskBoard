import React, { useState } from 'react';
import { suprsendTools } from '../hooks/useMcpTool';

// Bypass email - allows quick login without OTP verification
const BYPASS_EMAIL = 'johndoes@example.com';

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SuprSend workflow
const sendOTPEmail = async (email, otp, userName = 'User') => {
  const apiKey = process.env.REACT_APP_SUPRSEND_API_KEY;
  if (!apiKey) {
    throw new Error('REACT_APP_SUPRSEND_API_KEY is not configured');
  }
  const workflowSlug = process.env.REACT_APP_OTP_WORKFLOW_SLUG || 'otp_verification';
  
  const workflowPayload = {
    workflow: workflowSlug,
    recipients: [
      {
        distinct_id: email,
        $email: [email],
        name: userName,
        $channels: ['email'],
        $skip_create: false
      }
    ],
    data: {
      otp: otp,
      user_name: userName
    }
  };
  
  const response = await fetch('https://hub.suprsend.com/trigger/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit',
    body: JSON.stringify(workflowPayload)
  });
  
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to send OTP: ${response.status} - ${responseText}`);
  }
  
  return await response.json();
};

const UserForm = ({ onSuccess, workspace = "task-management-example-app" }) => {
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({
    name: '',
    email: BYPASS_EMAIL, // Pre-fill with bypass email for quick login
    otp: ''
  });
  const [otpCode, setOtpCode] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    const errors = {};
    
    if (step === 'email') {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    } else if (step === 'otp') {
      if (!formData.otp.trim()) {
        errors.otp = 'OTP is required';
      } else if (!/^\d{6}$/.test(formData.otp.trim())) {
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

    const email = formData.email.trim().toLowerCase();
    
    if (email === BYPASS_EMAIL.toLowerCase()) {
      try {
        setLoading(true);
        const distinctId = email;
        const userData = {
          $email: [email]
        };
        
        if (formData.name.trim()) {
          userData.name = formData.name.trim();
        }

        await suprsendTools.upsertUser(distinctId, userData, workspace);
        await suprsendTools.identifyUser(distinctId);
        
        const userProfile = {
          distinct_id: distinctId,
          properties: {
            name: formData.name.trim() || null,
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
        setError(err.message || 'Failed to create user. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const otp = generateOTP();
      setOtpCode(otp);
      
      const userName = formData.name.trim() || 'User';
      await sendOTPEmail(email, otp, userName);
      
      setStep('otp');
      setError(null);
    } catch (err) {
      let errorMessage = err.message || 'Failed to send OTP. Please try again.';
      
      if (err.message.includes('Network error') || err.message.includes('Load failed')) {
        errorMessage = 'Network error: Unable to send OTP. Please check your internet connection.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error: Please configure CORS settings or use a backend proxy.';
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

    if (formData.otp.trim() !== otpCode) {
      setError('Invalid OTP. Please check your email and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const distinctId = formData.email.trim().toLowerCase();
      const email = formData.email.trim().toLowerCase();
      
      const userData = {
        $email: [email]
      };
      
      if (formData.name.trim()) {
        userData.name = formData.name.trim();
      }

      await suprsendTools.upsertUser(distinctId, userData, workspace);
      await suprsendTools.identifyUser(distinctId);
      
      const userProfile = {
        distinct_id: distinctId,
        properties: {
          name: formData.name.trim() || null,
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
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
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
      const otp = generateOTP();
      setOtpCode(otp);
      
      const email = formData.email.trim().toLowerCase();
      const userName = formData.name.trim() || 'User';
      await sendOTPEmail(email, otp, userName);
      
      setError(null);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
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
          {formData.email.trim().toLowerCase() === BYPASS_EMAIL.toLowerCase() && (
            <p className="text-xs text-gray-500 mt-1">
              Using test email - OTP verification will be skipped
            </p>
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

