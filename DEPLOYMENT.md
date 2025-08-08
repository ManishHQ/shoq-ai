# Shoq Application Deployment Guide

## Render.com Deployment

This guide will help you deploy the Shoq application (frontend + backend) to Render.com.

### Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Prepare all required environment variables

### Environment Variables Required

#### Backend Service (`shoq-backend`)

**Required Variables:**

- `MONGO_URL`: Your MongoDB connection string
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `OPERATOR_ID`: Hedera operator account ID
- `OPERATOR_KEY`: Hedera operator private key
- `HEDERA_USDC_TOKEN_ID`: USDC token ID on Hedera
- `SHOP_OWNER_ADDRESS`: Shop owner's Hedera account address

**Optional Variables:**

- `EMAIL_USERNAME`: Gmail username for order notifications
- `EMAIL_PASSWORD`: Gmail app password for order notifications
- `SMTP_HOST`: SMTP server (default: smtp.gmail.com)
- `FULFILLMENT_EMAIL`: Email for order fulfillment notifications

#### Frontend Service (`shoq-frontend`)

**Required Variables:**

- `NEXT_PUBLIC_API_URL`: Backend API URL (will be set automatically)

### Deployment Steps

#### Option 1: Using render.yaml (Recommended)

1. **Connect Repository**:

   - Go to Render.com dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**:

   - For each service, go to "Environment" tab
   - Add all required environment variables
   - Mark sensitive variables as "Secret"

3. **Deploy**:
   - Click "Create Blueprint Instance"
   - Render will deploy both services automatically

#### Option 2: Manual Deployment

##### Backend Service

1. **Create Web Service**:

   - Go to Render.com dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:

   - **Name**: `shoq-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: `Starter`

3. **Environment Variables**:
   - Add all backend environment variables
   - Set `NODE_ENV=production`
   - Set `PORT=8000`

##### Frontend Service

1. **Create Web Service**:

   - Go to Render.com dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:

   - **Name**: `shoq-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Starter`

3. **Environment Variables**:
   - Set `NODE_ENV=production`
   - Set `PORT=3000`
   - Set `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`

### Post-Deployment

1. **Update Telegram Bot Webhook** (if needed):

   - Set webhook URL to your backend service URL
   - Format: `https://your-backend-url.onrender.com/webhook`

2. **Test the Application**:

   - Frontend: `https://your-frontend-url.onrender.com`
   - Backend API: `https://your-backend-url.onrender.com`

3. **Monitor Logs**:
   - Check both services' logs for any errors
   - Monitor Telegram bot functionality

### Troubleshooting

#### Common Issues

1. **Build Failures**:

   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

2. **Environment Variables**:

   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify sensitive data is marked as "Secret"

3. **Database Connection**:

   - Verify MongoDB URL is correct
   - Check network access to MongoDB
   - Ensure database exists and is accessible

4. **Telegram Bot**:
   - Verify bot token is correct
   - Check bot permissions
   - Monitor bot logs for errors

#### Support

- **Render.com Documentation**: [docs.render.com](https://docs.render.com)
- **Render.com Support**: Available in dashboard
- **Application Logs**: Check service logs in Render dashboard

### Security Notes

1. **Environment Variables**: Never commit sensitive data to Git
2. **API Keys**: Use Render's secret management for sensitive keys
3. **Database**: Use MongoDB Atlas or similar for production database
4. **HTTPS**: Render provides automatic HTTPS certificates

### Cost Optimization

1. **Free Tier**: Both services can run on Render's free tier
2. **Auto-Sleep**: Free tier services sleep after 15 minutes of inactivity
3. **Scaling**: Upgrade to paid plans for better performance and uptime
