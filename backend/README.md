# TaskBoard Backend API

Secure Express server to handle API operations for TaskBoard. All API keys and sensitive operations are handled server-side.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp env.example .env
   ```

3. **Configure environment variables:**
   ```env
   SUPRSEND_API_KEY=your-api-key-here
   SUPRSEND_WORKSPACE=your-workspace-name
   PORT=3002
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=production
   ```

4. **Start server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3002` (or the port specified in `.env`)

## API Endpoints

### POST `/api/otp/send`
Send OTP email to user.

**Request:**
```json
{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123",
  "otp": "123456"  // Only in development mode
}
```

### POST `/api/user/upsert`
Create or update user in SuprSend.

**Request:**
```json
{
  "distinctId": "user@example.com",
  "userData": {
    "$email": ["user@example.com"],
    "name": "John Doe"
  },
  "workspace": "task-management-example-app"
}
```

**Response:**
```json
{
  "distinct_id": "user@example.com",
  "properties": {},
  "created_at": "2025-01-22T...",
  "updated_at": "2025-01-22T...",
  "$email": [...]
}
```

### POST `/api/workflow/trigger`
Trigger SuprSend workflow.

**Request:**
```json
{
  "workflowSlug": "task_created",
  "userEmail": "user@example.com",
  "distinctId": "user@example.com",
  "userName": "John Doe",
  "eventData": {
    "task_title": "New Task",
    "task_id": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-22T10:00:00.000Z"
}
```

## Security

- ✅ API keys stored server-side only
- ✅ Cryptographically secure OTP generation
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Use environment variables for all secrets
4. Deploy to your hosting platform (Heroku, Railway, Render, etc.)
