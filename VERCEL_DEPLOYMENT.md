# Vercel Deployment Guide

This guide will help you deploy TaskBoard to Vercel.

## Prerequisites

- GitHub account with the code pushed to `https://github.com/suprsend/taskBoard.git`
- Vercel account (sign up at https://vercel.com)
- SuprSend account with API keys

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository: `suprsend/taskBoard`
4. Vercel will auto-detect it as a Create React App project

### 2. Configure Build Settings

Vercel should auto-detect these settings:
- **Framework Preset:** Create React App
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### 3. Set Environment Variables

In the Vercel project settings, add these environment variables:

#### Required Frontend Variables:
```
REACT_APP_SUPRSEND_WORKSPACE=your-workspace-name
REACT_APP_SUPRSEND_PUBLIC_KEY=your-public-key
```

#### Required Backend Variables (for API functions):
```
SUPRSEND_API_KEY=your-api-key
SUPRSEND_WORKSPACE=your-workspace-name
OTP_WORKFLOW_SLUG=otp_verification
NODE_ENV=production
```

#### Optional Variables:
```
REACT_APP_TASK_CREATED_WORKFLOW_SLUG=task_created
REACT_APP_TASK_STATUS_WORKFLOW_SLUG=task_status_changed
FRONTEND_URL=https://your-app.vercel.app
```

**Note:** Do NOT set `REACT_APP_API_URL` - the frontend will automatically use relative paths to call the API on the same domain.

### 4. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## How It Works

### Architecture

- **Frontend:** React app deployed as static site
- **Backend API:** Express routes converted to Vercel serverless functions in `/api` directory
- **Same Domain:** Both frontend and API run on the same Vercel domain

### API Endpoints

All API endpoints are available at:
- `https://your-app.vercel.app/api/otp/send`
- `https://your-app.vercel.app/api/user/upsert`
- `https://your-app.vercel.app/api/workflow/trigger`
- `https://your-app.vercel.app/api/health`

The frontend automatically uses relative paths (`/api/...`) to call these endpoints.

## Post-Deployment

### 1. Test the Deployment

1. Visit your Vercel URL
2. Try signing up with your email
3. Check that OTP email is received
4. Verify task creation and notifications work

### 2. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Monitor Deployments

- Check Vercel dashboard for deployment logs
- Monitor function logs in the Functions tab
- Set up error tracking if needed

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct dependencies

### API Functions Not Working

- Check function logs in Vercel dashboard
- Verify `SUPRSEND_API_KEY` and `SUPRSEND_WORKSPACE` are set
- Ensure CORS is configured correctly

### OTP Not Sending

- Verify `OTP_WORKFLOW_SLUG` matches your SuprSend workflow
- Check SuprSend dashboard for workflow status
- Review function logs for errors

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_SUPRSEND_WORKSPACE` | ✅ | SuprSend workspace name |
| `REACT_APP_SUPRSEND_PUBLIC_KEY` | ✅ | SuprSend public key |
| `SUPRSEND_API_KEY` | ✅ | SuprSend API key (for serverless functions) |
| `SUPRSEND_WORKSPACE` | ✅ | SuprSend workspace (for serverless functions) |
| `OTP_WORKFLOW_SLUG` | ⚠️ | OTP workflow slug (default: `otp_verification`) |
| `NODE_ENV` | ⚠️ | Set to `production` |
| `FRONTEND_URL` | ⚠️ | Your Vercel app URL (auto-set by Vercel) |

## Support

For issues:
1. Check Vercel deployment logs
2. Review function logs
3. Verify SuprSend configuration
4. Check GitHub repository for latest code

---

**Your app is now live on Vercel! 🚀**
