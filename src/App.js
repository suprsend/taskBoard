import React from 'react';
import AuthApp from './components/AuthApp';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/AuthStyles.css';
import './index.css';

/**
 * Main App Component
 * 
 * Entry point for TaskBoard with SuprSend notifications.
 * Provides user authentication and a Kanban board with real-time notifications.
 */
function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <AuthApp />
      </div>
    </ErrorBoundary>
  );
}

export default App;