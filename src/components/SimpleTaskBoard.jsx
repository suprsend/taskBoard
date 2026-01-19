import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Calendar } from 'lucide-react';
import { Inbox } from '@suprsend/react';
import TaskModal from './TaskModal';
import ToastNotification from './ToastNotification';
import { useSuprSendClient } from '../hooks/useSuprSendClient';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'in-review', title: 'In Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100' }
];


const getPriorityColor = (priority) => {
  const colors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500'
  };
  return colors[priority] || 'border-l-gray-500';
};

const getUserInfo = (user) => {
  const userEmail = user?.profile?.$email?.[0]?.value || 
                   user?.profile?.properties?.email || 
                   user?.distinctId || 
                   'user@example.com';
  const userName = user?.profile?.properties?.name || 'User';
  
  return { userEmail, userName };
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
    dueDate: task.dueDate || '',
    status: task.status || 'todo'
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(safeTask.priority)} p-4 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{safeTask.title}</h3>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit task"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {safeTask.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{safeTask.description}</p>
      )}
      
      {safeTask.dueDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
          <Calendar className="w-3 h-3" />
          <span>{new Date(safeTask.dueDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Main Component
const SimpleTaskBoard = ({ user, onSignOut, tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const { trackTaskStatusChange, trackTaskCreated, trackTaskDeleted } = useSuprSendClient();

  // Set user context for notifications and workflows
  useEffect(() => {
    const { userEmail, userName } = getUserInfo(user);
    window.currentUserEmail = userEmail;
    window.currentUserName = userName;
  }, [user]);

  // Tasks are now managed in MainLayout, so we don't need to load/save here

  // Task handlers
  const handleCreateTask = useCallback(async (taskData) => {
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || '',
      status: 'todo'
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    try {
      await trackTaskCreated(newTask);
    } catch (error) {
      // Silent fail
    }
  }, [setTasks, trackTaskCreated]);

  const handleUpdateTask = useCallback((taskData) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskData.id 
          ? { ...task, ...taskData } // Merge to preserve status and other fields
          : task
      )
    );
  }, [setTasks]);

  const handleDeleteTask = useCallback(async (taskId) => {
    // Find the task before deleting to track it
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    // Remove task from state
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    // Track deletion if task was found
    if (taskToDelete) {
      try {
        await trackTaskDeleted(taskToDelete);
      } catch (error) {
        // Silent fail
      }
    }
  }, [setTasks, tasks, trackTaskDeleted]);

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
          draggedTask.id
        );
      } catch (error) {
        // Silent fail
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

  // Memoized values
  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const userName = useMemo(() => {
    return user?.profile?.properties?.name || 'User';
  }, [user]);

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
              {/* Inbox component renders bell, badge, and popover here */}
              <Inbox pageSize={20} popperPosition="bottom-end">
                <ToastNotification />
              </Inbox>
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
            {COLUMNS.map(column => (
              <div key={column.id} className="bg-white rounded-lg shadow-sm border">
                <div className={`p-4 rounded-t-lg ${column.color}`}>
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <p className="text-sm text-gray-600">
                    {getTasksByStatus(column.id).length} tasks
                  </p>
                </div>
                
                <div 
                  className="p-4 space-y-3 min-h-[400px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {getTasksByStatus(column.id).map(task => (
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
                  {getTasksByStatus(column.id).length === 0 && (
                    <div className="text-gray-400 text-center py-8">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
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
