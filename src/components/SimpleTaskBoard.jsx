import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Calendar, Mail } from 'lucide-react';
import TaskModal from './TaskModal';
import { Inbox } from '@suprsend/react';
import { useSuprSendClient } from '../hooks/useSuprSendClient';
import logger from '../utils/logger';
import { cleanMarkdown, getUserInfo } from '../utils/helpers';

// Constants
const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'in-review', title: 'In Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100' }
];

const SAMPLE_TASKS = [
  {
    id: '1',
    title: 'Welcome to your task board!',
    description: 'This is your first task. You can edit, delete, or move it around.',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: ''
  }
];

// Utility functions
const getPriorityColor = (priority) => {
  const colors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500'
  };
  return colors[priority] || 'border-l-gray-500';
};

// Custom Notification Component
const CustomNotificationCard = ({ notificationData, markAsRead, userEmail }) => {
  const avatarLetter = (userEmail || 'U').charAt(0).toUpperCase();
  
  const title = cleanMarkdown(notificationData?.message?.header || 'Notification');
  const message = cleanMarkdown(notificationData?.message?.text || '');
  const timestamp = notificationData?.created_on 
    ? new Date(notificationData.created_on * 1000).toLocaleTimeString() 
    : '';

  return (
    <div 
      className="custom-notification-card"
      onClick={() => markAsRead(notificationData.n_id)}
    >
      <div className="notification-avatar">
        {avatarLetter}
      </div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
        <div className="notification-timestamp">{timestamp}</div>
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = React.memo(({ task, onEdit, onDelete, onDragStart, onDragEnd, isDragging = false }) => {
  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(task.id);
  }, [onDelete, task.id]);

  const handleDragStart = useCallback((e) => {
    onDragStart(e, task);
  }, [onDragStart, task]);

  if (!task) return null;

  const safeTask = {
    title: task.title || 'Untitled Task',
    description: task.description || '',
    priority: task.priority || 'medium',
    assignee: task.assignee || '',
    dueDate: task.dueDate || '',
    ...task
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white border-l-4 ${getPriorityColor(safeTask.priority)} border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'rotate-2 shadow-xl opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{safeTask.title}</h4>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-gray-400 hover:text-blue-600 p-1"
            aria-label="Edit task"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 p-1"
            aria-label="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {safeTask.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{safeTask.description}</p>
      )}
      
      <div className="space-y-2">
        {safeTask.assignee && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Mail className="w-3 h-3" />
            <span>{safeTask.assignee}</span>
          </div>
        )}
        
        {safeTask.dueDate && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>{new Date(safeTask.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Main Component
const SimpleTaskBoard = ({ user, onSignOut, tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const { trackTaskStatusChange, trackTaskCreated } = useSuprSendClient();

  // Get user info for notifications
  const { userEmail, userName } = useMemo(() => getUserInfo(user), [user]);

  // Load tasks from localStorage
  useEffect(() => {
    if (!user?.distinctId) return;

    const loadTasks = () => {
      try {
        const userTasksKey = `tasks_${user.distinctId}`;
        const savedTasks = localStorage.getItem(userTasksKey);
        
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          setTasks(tasks);
        } else {
          setTasks(SAMPLE_TASKS);
          localStorage.setItem(userTasksKey, JSON.stringify(SAMPLE_TASKS));
        }
      } catch (error) {
        logger.error('Error loading tasks:', error);
        setTasks([]);
      }
    };

    loadTasks();
  }, [user?.distinctId, setTasks]);

  // Save tasks to localStorage
  useEffect(() => {
    if (!user?.distinctId || tasks.length === 0) return;

    try {
      const userTasksKey = `tasks_${user.distinctId}`;
      localStorage.setItem(userTasksKey, JSON.stringify(tasks));
    } catch (error) {
      logger.error('Error saving tasks:', error);
    }
  }, [tasks, user?.distinctId]);

  // Task handlers
  const handleCreateTask = useCallback(async (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee || '',
      dueDate: taskData.dueDate || '',
      status: 'todo'
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    try {
      await trackTaskCreated(newTask);
    } catch (error) {
      logger.error('Failed to track task creation:', error);
    }
  }, [setTasks, trackTaskCreated]);

  const handleUpdateTask = useCallback((taskData) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskData.id ? taskData : task
      )
    );
  }, [setTasks]);

  const handleDeleteTask = useCallback((taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, [setTasks]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', task.id);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e, targetStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== targetStatus) {
      const oldStatus = draggedTask.status;
      const newStatus = targetStatus;
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggedTask.id ? { ...task, status: targetStatus } : task
        )
      );
      
      try {
        await trackTaskStatusChange(
          draggedTask.title,
          oldStatus,
          newStatus,
          draggedTask.id,
          draggedTask.assignee
        );
      } catch (error) {
        logger.error('Failed to track task status change:', error);
      }
    }
    setDraggedTask(null);
  }, [draggedTask, setTasks, trackTaskStatusChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  // Modal handlers
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleModalSubmit = useCallback((taskData) => {
    if (editingTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
  }, [editingTask, handleUpdateTask, handleCreateTask]);

  // Optimize task filtering - memoize tasks by status to avoid recalculations
  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => task.status === column.id);
      return acc;
    }, {});
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-gray-600">Welcome, {userName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Inbox 
                pageSize={20} 
                notificationComponent={(props) => (
                  <CustomNotificationCard {...props} userEmail={userEmail} />
                )}
              />
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                aria-label="Create new task"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COLUMNS.map(column => {
              const columnTasks = tasksByStatus[column.id] || [];
              return (
                <div key={column.id} className="bg-white rounded-lg shadow-sm border">
                  <div className={`p-4 rounded-t-lg ${column.color}`}>
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <p className="text-sm text-gray-600">
                      {columnTasks.length} tasks
                    </p>
                  </div>
                  
                  <div 
                    className="p-4 space-y-3 min-h-[400px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {columnTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={setEditingTask}
                        onDelete={handleDeleteTask}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedTask?.id === task.id}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-gray-400 text-center py-8">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen || !!editingTask}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        task={editingTask}
      />
    </div>
  );
};

export default SimpleTaskBoard;