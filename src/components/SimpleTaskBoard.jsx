import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Calendar } from 'lucide-react';
import { Inbox } from '@suprsend/react';
import TaskModal from './TaskModal';
import { useSuprSendClient } from '../hooks/useSuprSendClient';
import { showCustomToast } from './CustomToast';
import logger from '../utils/logger';
import { sanitizeTitle, sanitizeDescription } from '../utils/sanitize';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'in-review', title: 'In Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100' }
];

const getStatusLabel = (statusId) => COLUMNS.find((c) => c.id === statusId)?.title ?? statusId;


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
const SimpleTaskBoard = ({ user, onSignOut, tasks, setTasks, headerHeightPx: headerHeightPxProp }) => {
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
    const sanitizedTitle = sanitizeTitle(taskData.title || '');
    if (!sanitizedTitle) {
      logger.error('Task creation failed: title is required');
      return;
    }
    
    const newTask = {
      id: Date.now().toString(),
      title: sanitizedTitle,
      description: sanitizeDescription(taskData.description || ''),
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || '',
      status: 'todo'
    };
    
    logger.log('Creating new task', { taskId: newTask.id });
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    try {
      await trackTaskCreated(newTask);
      const title = newTask.title ? `"${newTask.title}"` : 'Task';
      showCustomToast(`${title} has been created.`, 'success');
    } catch (error) {
      logger.error('Failed to track task creation', { error: error.message });
      showCustomToast('Task created but notification could not be sent.', 'warning');
    }
  }, [setTasks, trackTaskCreated]);

  const handleUpdateTask = useCallback((taskData) => {
    const sanitizedData = {
      ...taskData,
      title: sanitizeTitle(taskData.title || ''),
      description: sanitizeDescription(taskData.description || '')
    };
    
    if (!sanitizedData.title) {
      logger.error('Task update failed: title is required');
      return;
    }
    
    logger.log('Updating task', { taskId: taskData.id });
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskData.id 
          ? { ...task, ...sanitizedData }
          : task
      )
    );
  }, [setTasks]);

  const handleDeleteTask = useCallback(async (taskId) => {
    logger.log('Deleting task', { taskId });
    
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    if (taskToDelete) {
      try {
        await trackTaskDeleted(taskToDelete);
        const title = taskToDelete.title ? `"${taskToDelete.title}"` : 'Task';
        showCustomToast(`${title} has been deleted.`, 'success');
      } catch (error) {
        logger.error('Failed to track task deletion', { error: error.message });
        showCustomToast('Task deleted but notification could not be sent.', 'warning');
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
      
      logger.log('Task status change', { taskId: draggedTask.id, oldStatus, newStatus });
      
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
        const title = draggedTask.title ? `"${draggedTask.title}"` : 'Task';
        const fromLabel = getStatusLabel(oldStatus);
        const toLabel = getStatusLabel(newStatus);
        showCustomToast(`${title} has been moved from ${fromLabel} to ${toLabel}.`, 'success');
      } catch (error) {
        logger.error('Failed to track task status change', { error: error.message });
        showCustomToast('Task updated but notification could not be sent.', 'warning');
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

  const headerHeightPx = headerHeightPxProp ?? 72;

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Page header - same height as sidebar user block for alignment */}
      <div
        className="bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0"
        style={{ minHeight: headerHeightPx }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#3D3D3D", margin: 0 }}>
            TaskBoard
          </h1>
          <p style={{ fontSize: 14, color: "#6C727F", margin: "2px 0 0 0" }}>
            Welcome, {userName}!
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Inbox pageSize={20} popperPosition="bottom-end" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium"
            aria-label="Create new task"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

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
