import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, Bell, User, LogOut } from 'lucide-react';
import SimpleTaskBoard from './SimpleTaskBoard';
import NotificationPreferences from './NotificationPreferences';
import ToastNotification from './ToastNotification';

// Constants
const TABS = [
  {
    id: 'taskboard',
    label: 'Task Board',
    icon: LayoutDashboard,
    component: SimpleTaskBoard
  },
  {
    id: 'notifications',
    label: 'Notification Preferences',
    icon: Bell,
    component: NotificationPreferences
  }
];

// Utility functions
const getUserDisplayInfo = (user) => {
  const name = user.profile?.properties?.name || 'User';
  const email = user.profile?.$email?.[0]?.value || user.distinctId || 'user@example.com';
  return { name, email };
};

// Tab Button Component
const TabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      aria-label={`Navigate to ${tab.label}`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
      <span className="font-medium">{tab.label}</span>
    </button>
  );
};

// Unified header height so sidebar user block and main content header align on both pages
const HEADER_HEIGHT_PX = 72;

const UserInfo = ({ user }) => {
  const { name, email } = getUserDisplayInfo(user);
  return (
    <div
      className="border-b border-gray-200 bg-white flex items-center px-6 flex-shrink-0"
      style={{ minHeight: HEADER_HEIGHT_PX }}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 truncate">{email}</p>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ tabs, activeTab, onTabChange }) => (
  <nav className="flex-1 p-4">
    <div className="space-y-2">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  </nav>
);

// Sign Out Button Component
const SignOutButton = ({ onSignOut }) => (
  <div className="p-4 border-t border-gray-200">
    <button
      onClick={onSignOut}
      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
      aria-label="Sign out"
    >
      <LogOut className="w-5 h-5" />
      <span className="font-medium">Sign Out</span>
    </button>
  </div>
);

// Main Component
const MainLayout = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('taskboard');
  const [tasks, setTasks] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load tasks from localStorage when user is available
  useEffect(() => {
    if (!user?.distinctId) {
      setTasks([]);
      setIsInitialLoad(false);
      return;
    }

    try {
      const userTasksKey = `tasks_${user.distinctId}`;
      const savedTasks = localStorage.getItem(userTasksKey);
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      setTasks([]);
    } finally {
      setIsInitialLoad(false);
    }
  }, [user?.distinctId]);

  // Save tasks to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (!user?.distinctId || isInitialLoad) return;

    try {
      const userTasksKey = `tasks_${user.distinctId}`;
      localStorage.setItem(userTasksKey, JSON.stringify(tasks));
    } catch (error) {
      // Silent fail
    }
  }, [tasks, user?.distinctId, isInitialLoad]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const ActiveComponent = useMemo(() => {
    return TABS.find(tab => tab.id === activeTab)?.component;
  }, [activeTab]);

  const componentProps = useMemo(() => ({
    user,
    onSignOut,
    activeTab,
    setActiveTab: handleTabChange,
    tasks,
    setTasks,
    headerHeightPx: HEADER_HEIGHT_PX,
  }), [user, onSignOut, activeTab, handleTabChange, tasks]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <UserInfo user={user} />
        <Navigation 
          tabs={TABS} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        <SignOutButton onSignOut={onSignOut} />
      </div>

      {/* Main Content Area - same header height as sidebar for alignment */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {ActiveComponent && (
          <ActiveComponent {...componentProps} />
        )}
      </div>

      {/* Global toasts (preferences success, feed notifications) - mounted here so they show on all tabs */}
      <ToastNotification />
    </div>
  );
};

export default MainLayout;