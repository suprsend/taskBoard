# TaskBoard

A modern, production-ready task management application with real-time notifications, secure OTP email verification, and customizable notification preferences. Built with React and powered by SuprSend.

## ✨ Features

- 📋 **Kanban Board** - Drag & drop task management with multiple status columns
- 🔔 **Real-time Notifications** - In-app feed and email notifications for task updates
- 🔐 **Secure OTP Verification** - Mandatory email-based authentication with OTP verification
- ⚙️ **Notification Preferences** - Granular control over notification channels and categories
- 📱 **Responsive Design** - Beautiful, modern UI that works on all devices
- 🎯 **Task Management** - Create, edit, delete, and track tasks with priorities and due dates
- 🔔 **Toast Notifications** - Custom styled toast notifications matching TaskBoard design

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- SuprSend account and workspace
- Email vendor configured in SuprSend dashboard

### Installation

1. **Clone the repository**

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**

   **Frontend `.env` (root directory):**
   ```env
   REACT_APP_SUPRSEND_WORKSPACE=your-workspace-name
   REACT_APP_SUPRSEND_PUBLIC_KEY=your-public-key
   REACT_APP_API_URL=http://localhost:3002
   ```

   **Backend `.env` (backend directory):**
   ```env
   SUPRSEND_API_KEY=your-api-key
   SUPRSEND_WORKSPACE=your-workspace-name
   PORT=3002
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

5. **Start backend server**
   ```bash
   cd backend
   npm start
   ```

6. **Start frontend server** (in a new terminal)
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## 📦 Building for Production

**Build frontend:**
```bash
npm run build
```

**Start backend in production:**
```bash
cd backend
NODE_ENV=production npm start
```

## 🔧 Configuration

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPRSEND_WORKSPACE` | Your SuprSend workspace name | ✅ Yes |
| `REACT_APP_SUPRSEND_PUBLIC_KEY` | SuprSend public key for frontend SDK | ✅ Yes |
| `REACT_APP_API_URL` | Backend API URL | ✅ Yes |

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPRSEND_API_KEY` | SuprSend API key (server-side only) | ✅ Yes |
| `SUPRSEND_WORKSPACE` | Your SuprSend workspace name | ✅ Yes |
| `PORT` | Backend server port | No (default: 3002) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTP_WORKFLOW_SLUG` | OTP verification workflow slug | `otp_verification` |
| `REACT_APP_TASK_CREATED_WORKFLOW_SLUG` | Task creation workflow slug | `task_created` |
| `REACT_APP_TASK_STATUS_WORKFLOW_SLUG` | Task status change workflow slug | `task_status_changed` |

## 🏗️ Project Structure

```
task-mgmt-app/
├── backend/                  # Backend API server
│   ├── server.js            # Express server
│   ├── package.json         # Backend dependencies
│   └── .env                 # Backend environment variables
├── src/
│   ├── components/          # React components
│   │   ├── AuthApp.jsx      # Authentication wrapper
│   │   ├── UserForm.jsx     # Login/signup with OTP
│   │   ├── SimpleTaskBoard.jsx  # Main Kanban board
│   │   ├── TaskModal.jsx    # Task creation/editing
│   │   ├── ToastNotification.jsx  # Toast notifications
│   │   ├── NotificationPreferences.jsx  # User preferences
│   │   ├── CustomToast.jsx  # Custom toast component
│   │   └── ErrorBoundary.jsx  # Error boundary
│   ├── hooks/               # Custom React hooks
│   │   ├── useMcpTool.js    # SuprSend MCP integration
│   │   └── useSuprSendClient.js  # Notification tracking
│   ├── utils/               # Utility functions
│   │   ├── api.js           # Backend API client
│   │   ├── logger.js        # Production-safe logging
│   │   ├── sanitize.js      # Input sanitization
│   │   └── security.js      # Security utilities
│   └── styles/              # CSS files
├── public/                   # Static assets
└── build/                    # Production build output
```

## 🔐 Authentication

The app uses secure email-based authentication with mandatory OTP verification:

1. **User enters email** - User provides their email address
2. **OTP sent** - 6-digit OTP is sent to the provided email via backend
3. **Verification** - User must enter OTP to complete authentication
4. **User created** - User profile is created in SuprSend after OTP verification

**Note:** OTP verification is mandatory for all users. There is no bypass mechanism.

## 📋 Task Management

### Creating Tasks

- Click "New Task" button
- Fill in task details:
  - **Title** (required)
  - **Description** (optional)
  - **Priority** - Low, Medium, or High
  - **Due Date** - Select a due date
- Click "Create Task"

### Managing Tasks

- **Drag & Drop** - Move tasks between columns (To Do, In Progress, In Review, Completed)
- **Edit** - Click edit icon on a task to modify details
- **Delete** - Click delete icon to remove tasks
- **Status Tracking** - Automatic notifications on status changes

## 🔔 Notifications

### Notification Types

- **Task Created** - Notified when a new task is created
- **Task Status Changed** - Notified when task moves between columns
- **Task Deleted** - Notified when a task is deleted

### Notification Channels

- **In-App Feed** - Bell icon with badge showing unread count
- **Email** - Email notifications sent to your registered email
- **Toast Notifications** - Real-time toast popups in bottom-right corner

### Managing Preferences

1. Navigate to "Notification Preferences"
2. Toggle notification categories on/off
3. Control channel preferences (email, inbox) per category
4. Changes are saved automatically

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **SuprSend** - Notification infrastructure
- **Express** - Backend API server
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icons
- **React Switch** - Toggle components

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start frontend development server |
| `npm run build` | Build frontend for production |
| `npm test` | Run tests |
| `npm run backend` | Start backend server |
| `npm run frontend` | Start frontend server |

## 🔒 Security

- ✅ API keys stored server-side only
- ✅ Cryptographically secure OTP generation
- ✅ Input sanitization and validation
- ✅ XSS protection
- ✅ Error boundaries for crash prevention
- ✅ Production-safe logging
- ✅ Environment variables properly ignored in Git

## 🚀 Deployment

### Frontend Deployment

Deploy the `build/` folder to your hosting platform (Vercel, Netlify, etc.)

### Backend Deployment

Deploy the `backend/` folder to your hosting platform (Heroku, Railway, Render, etc.)

**Important:** Update `REACT_APP_API_URL` in frontend to point to your deployed backend URL.

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using React and SuprSend**
