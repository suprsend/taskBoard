import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { sanitizeTitle, sanitizeDescription, MAX_LENGTHS } from '../utils/sanitize';

// Utility function to get a dummy due date (7 days from today)
const getDummyDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7); // 7 days from today
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const DEFAULT_FORM_DATA = {
  title: 'Review quarterly reports',
  description: '',
  priority: 'medium',
  dueDate: getDummyDueDate()
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

// Utility functions
const validateForm = (formData) => {
  const errors = {};
  
  const sanitizedTitle = sanitizeTitle(formData.title);
  if (!sanitizedTitle) {
    errors.title = 'Title is required';
  } else if (sanitizedTitle.length > MAX_LENGTHS.TITLE) {
    errors.title = `Title must be less than ${MAX_LENGTHS.TITLE} characters`;
  }
  
  const sanitizedDescription = sanitizeDescription(formData.description);
  if (sanitizedDescription.length > MAX_LENGTHS.DESCRIPTION) {
    errors.description = `Description must be less than ${MAX_LENGTHS.DESCRIPTION} characters`;
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

const TextInput = ({ value, onChange, placeholder, error, maxLength, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`}
    placeholder={placeholder}
    maxLength={maxLength}
    {...props}
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3, maxLength }) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    rows={rows}
    placeholder={placeholder}
    maxLength={maxLength}
  />
);

const Select = ({ value, onChange, options, ...props }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
      backgroundPosition: 'right 0.5rem center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '1.5em 1.5em',
      paddingRight: '2.5rem'
    }}
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
    
    const sanitizedData = {
      title: sanitizeTitle(formData.title),
      description: sanitizeDescription(formData.description),
      priority: formData.priority,
      dueDate: formData.dueDate
    };
    
    const newErrors = validateForm(sanitizedData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...sanitizedData,
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
              maxLength={MAX_LENGTHS.TITLE}
            />
            {formData.title.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length} / {MAX_LENGTHS.TITLE} characters
              </p>
            )}
          </FormField>

          {/* Description */}
          <FormField label="Description" error={errors.description}>
            <TextArea
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="e.g., Add new product pages and update contact information"
              maxLength={MAX_LENGTHS.DESCRIPTION}
            />
            {formData.description.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length} / {MAX_LENGTHS.DESCRIPTION} characters
              </p>
            )}
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