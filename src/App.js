import React from 'react';
import AuthApp from './components/AuthApp';
import './styles/AuthStyles.css';
import './index.css';

/**
 * Main App Component
 * 
 * Entry point for the Task Management App with SuprSend notifications.
 * Provides user authentication and a Kanban board with real-time notifications.
 */
function App() {
  return (
    <div className="App">
      <AuthApp />
    </div>
  );
}

export default App;