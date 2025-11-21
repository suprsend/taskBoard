# Task Management App

A modern, production-ready task management application with real-time notifications, OTP email verification, and customizable notification preferences. Built with React and powered by SuprSend for seamless communication.

## ✨ Features

- 📋 **Kanban Board** - Drag & drop task management with multiple status columns
- 🔔 **Real-time Notifications** - In-app feed and email notifications for task updates
- 🔐 **OTP Verification** - Secure email-based authentication with OTP verification
- ⚙️ **Notification Preferences** - Granular control over notification channels and categories
- 📱 **Responsive Design** - Beautiful, modern UI that works on all devices
- 🎯 **Task Management** - Create, edit, delete, and track tasks with priorities and due dates
- 🔔 **Toast Notifications** - Non-intrusive toast notifications for real-time updates

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- SuprSend account and workspace
- Email vendor configured in SuprSend dashboard

### Installation

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_SUPRSEND_WORKSPACE=your-workspace-name
   REACT_APP_SUPRSEND_API_KEY=your-api-key
   REACT_APP_SUPRSEND_PUBLIC_KEY=your-public-key
   
   # Optional: Workflow slugs (defaults provided)
   REACT_APP_OTP_WORKFLOW_SLUG=otp_verification
   REACT_APP_TASK_CREATED_WORKFLOW_SLUG=task_created
   REACT_APP_TASK_STATUS_WORKFLOW_SLUG=task_status_changed
   ```


4. **Run development server**
   ```bash
   npm start
   ```

   The app will open at `http://localhost:3000`

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder, ready for deployment.

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPRSEND_WORKSPACE` | Your SuprSend workspace name | ✅ Yes |
| `REACT_APP_SUPRSEND_API_KEY` | SuprSend API key for backend operations | ✅ Yes |
| `REACT_APP_SUPRSEND_PUBLIC_KEY` | SuprSend public key for frontend SDK | ✅ Yes |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_OTP_WORKFLOW_SLUG` | OTP verification workflow slug | `otp_verification` |
| `REACT_APP_TASK_CREATED_WORKFLOW_SLUG` | Task creation workflow slug | `task_created` |
| `REACT_APP_TASK_STATUS_WORKFLOW_SLUG` | Task status change workflow slug | `task_status_changed` |
| `REACT_APP_MCP_PROXY_URL` | Backend proxy URL for MCP tools | - |
| `REACT_APP_BYPASS_EMAIL` | Email to bypass OTP (for testing) | `johndoes@example.com` |

## 🏗️ Project Structure

```
task-mgmt-app/
├── src/
│   ├── components/          # React components
│   │   ├── AuthApp.jsx      # Authentication wrapper
│   │   ├── UserForm.jsx     # Login/signup with OTP
│   │   ├── SimpleTaskBoard.jsx  # Main Kanban board
│   │   ├── TaskModal.jsx    # Task creation/editing
│   │   ├── ToastNotification.jsx  # Toast notifications
│   │   └── NotificationPreferences.jsx  # User preferences
│   ├── hooks/               # Custom React hooks
│   │   ├── useMcpTool.js    # SuprSend MCP integration
│   │   └── useSuprSendClient.js  # Notification tracking
│   └── styles/              # CSS files
├── docs/                    # Documentation
│   ├── email-templates.md   # Email template setup
│   └── OTP_WORKFLOW_SETUP.md  # OTP workflow guide
├── public/                  # Static assets
└── build/                   # Production build output
```

## 🔐 Authentication

The app uses email-based authentication with OTP verification:

1. **User enters email** - Email field is pre-filled with `johndoes@example.com` for quick testing
2. **OTP sent** - 6-digit OTP is sent to the provided email
3. **Verification** - User enters OTP to complete authentication
4. **Quick login** - `johndoes@example.com` bypasses OTP for demo purposes

## 📋 Task Management

### Creating Tasks

- Click "New Task" button
- Fill in task details:
  - **Title** (required) - Pre-filled with "Review quarterly reports"
  - **Description** (optional)
  - **Priority** - Low, Medium, or High
  - **Due Date** - Defaults to 7 days from today
- Click "Create Task"

### Managing Tasks

- **Drag & Drop** - Move tasks between columns (To Do, In Progress, In Review, Completed)
- **Edit** - Click on a task to edit details
- **Delete** - Remove tasks you no longer need
- **Status Tracking** - Automatic notifications on status changes

## 🔔 Notifications

### Notification Types

- **Task Created** - Notified when a new task is created
- **Task Status Changed** - Notified when task moves between columns

### Notification Channels

- **In-App Feed** - Bell icon with badge showing unread count
- **Email** - Email notifications sent to your registered email
- **Toast Notifications** - Real-time toast popups in bottom-right corner

### Managing Preferences

1. Click on your profile icon → "Notification Preferences"
2. Toggle notification categories on/off
3. Control channel preferences (email, inbox) per category
4. Changes are saved automatically


## 🧪 Testing

### Quick Test Login

Use `johndoes@example.com` to bypass OTP verification for quick testing.

### Full OTP Flow

1. Enter any real email address
2. Check your email for 6-digit OTP
3. Enter OTP to complete authentication

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **SuprSend** - Notification infrastructure
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icons
- **React Switch** - Toggle components

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run eject` | Eject from Create React App |

## 🔒 Security

- ✅ No hardcoded API keys - All secrets via environment variables
- ✅ OTP verification for secure authentication
- ✅ Environment variables properly ignored in Git
- ✅ Production-ready error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and proprietary.
---

**Built with ❤️ using React and SuprSend**
