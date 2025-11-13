import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, Mail } from 'lucide-react';
import { isEmailAddress } from '../utils/helpers';

// Constants
const DEFAULT_FORM_DATA = {
  title: 'Review quarterly reports',
  description: 'Analyze Q4 performance metrics and prepare executive summary',
  priority: 'medium',
  assignee: 'manager@acmecorp.com',
  dueDate: ''
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
  }
  
  if (formData.assignee && !isEmailAddress(formData.assignee)) {
    errors.assignee = 'Please enter a valid email address';
  }
  
  return errors;
};

// Form Field Components
const FormField = ({ label, required, children, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && '*'}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const TextInput = ({ value, onChange, placeholder, error, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`}
    placeholder={placeholder}
    {...props}
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    rows={rows}
    placeholder={placeholder}
  />
);

const Select = ({ value, onChange, options, ...props }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    {...props}
  >
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const DateInput = ({ value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
);

const EmailInput = ({ value, onChange, error }) => {
  const isValid = value && isEmailAddress(value);
  const hasError = value && !isValid;
  
  return (
    <div className="relative">
      <input
        type="email"
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isValid 
            ? 'border-green-300 bg-green-50' 
            : hasError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
        }`}
        placeholder="e.g., john.smith@acmecorp.com"
        required
      />
      {value && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Mail 
            className={`w-4 h-4 ${isValid ? 'text-green-600' : 'text-red-600'}`} 
            title={isValid ? 'Valid email address' : 'Invalid email address'} 
          />
        </div>
      )}
    </div>
  );
};

const EmailValidationMessage = ({ value, error }) => {
  if (error) return null;
  
  if (value && !isEmailAddress(value)) {
    return (
      <p className="text-red-600 text-xs mt-1 flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        Please enter a valid email address.
      </p>
    );
  }
  
  if (value && isEmailAddress(value)) {
    return (
      <p className="text-green-600 text-xs mt-1 flex items-center">
        <Mail className="w-3 h-3 mr-1" />
        Valid email! A notification will be sent to this address when the task is created.
      </p>
    );
  }
  
  return null;
};

// Main Component
const TaskModal = ({ isOpen, onClose, onSubmit, task }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});

  // Update form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        assignee: task.assignee || '',
        dueDate: task.dueDate || ''
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
    setErrors({});
  }, [task]);

  // Form handlers
  const handleInputChange = useCallback((field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const newErrors = validateForm(formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        id: task?.id
      });
      onClose();
    }
  }, [formData, task?.id, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <FormField label="Title" required error={errors.title}>
            <TextInput
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="e.g., Update company website"
              error={errors.title}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <TextArea
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="e.g., Add new product pages and update contact information"
            />
          </FormField>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority">
              <Select
                value={formData.priority}
                onChange={handleInputChange('priority')}
                options={PRIORITY_OPTIONS}
              />
            </FormField>

            <FormField label="Due Date">
              <DateInput
                value={formData.dueDate}
                onChange={handleInputChange('dueDate')}
              />
            </FormField>
          </div>

          {/* Assignee Email */}
          <FormField label="Assignee Email" error={errors.assignee}>
            <EmailInput
              value={formData.assignee}
              onChange={handleInputChange('assignee')}
              error={errors.assignee}
            />
            <EmailValidationMessage value={formData.assignee} error={errors.assignee} />
          </FormField>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;