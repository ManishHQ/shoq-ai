# 🚀 Heroku Deployment Guide for Shoq

This guide will help you deploy the Shoq e-commerce platform to Heroku with separate applications for the server (api.shoq.live) and frontend (shoq.live).

## 📋 Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure Git is installed and your project is in a Git repository
4. **Domain Names**: Register `shoq.live` and configure DNS
5. **External Services**: Set up MongoDB, email service, Hedera accounts, etc.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   shoq.live       │    │  api.shoq.live    │
│   (Frontend)    │────│   (Server)      │
│   Next.js       │    │   Express.js    │
│   Heroku App    │    │   Heroku App    │
└─────────────────┘    └─────────────────┘
```

## 🔧 Step-by-Step Deployment

### Step 1: Install Heroku CLI and Login

```bash
# Install Heroku CLI (if not already installed)
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login
```

### Step 2: Create Heroku Applications

```bash
# Create server application
heroku create shoq-api --region us

# Create frontend application
heroku create shoq-frontend --region us
```

### Step 3: Configure Server Environment Variables

Set all required environment variables for the server:

```bash
# Application settings
heroku config:set NODE_ENV=production --app shoq-api
heroku config:set PORT=8000 --app shoq-api

# Database
heroku config:set MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/shoq" --app shoq-api

# JWT Secret
heroku config:set JWT_SECRET="your-super-secret-jwt-key-here" --app shoq-api

# Hedera Configuration
heroku config:set OPERATOR_ADDRESS="0.0.your-hedera-account" --app shoq-api
heroku config:set OPERATOR_KEY="your-hedera-private-key" --app shoq-api
heroku config:set SHOP_OWNER_ADDRESS="0.0.shop-owner-account" --app shoq-api
heroku config:set HEDERA_USDC_TOKEN_ID="0.0.6528760" --app shoq-api

# Telegram Bot
heroku config:set TELEGRAM_BOT_TOKEN="your-telegram-bot-token" --app shoq-api

# AI Services
heroku config:set GEMINI_API_KEY="your-gemini-api-key" --app shoq-api

# Email Configuration
heroku config:set SMTP_HOST="smtp.gmail.com" --app shoq-api
heroku config:set SMTP_PORT="465" --app shoq-api
heroku config:set EMAIL_USERNAME="your-email@gmail.com" --app shoq-api
heroku config:set EMAIL_PASSWORD="your-app-password" --app shoq-api
heroku config:set FULFILLMENT_EMAIL="orders@shoq.live" --app shoq-api

# URLs
heroku config:set FRONTEND_URL="https://shoq.live" --app shoq-api
heroku config:set SERVER_URL="https://api.shoq.live" --app shoq-api
```

### Step 4: Configure Frontend Environment Variables

```bash
# API Configuration
heroku config:set NEXT_PUBLIC_API_URL="https://api.shoq.live" --app shoq-frontend
heroku config:set NODE_ENV="production" --app shoq-frontend
```

### Step 5: Set Up Git Remotes

```bash
# Add Heroku remotes
heroku git:remote -a shoq-api -r heroku-api
heroku git:remote -a shoq-frontend -r heroku-frontend

# Verify remotes
git remote -v
```

### Step 6: Deploy Applications

#### Deploy Server (api.shoq.live)

```bash
# Deploy server using git subtree (from project root)
git subtree push --prefix=server heroku-api main

# Or if you get conflicts:
git subtree push --prefix=server heroku-api main --force
```

#### Deploy Frontend (shoq.live)

```bash
# Deploy frontend (from project root)
git push heroku-frontend main

# Or if you get conflicts:
git push heroku-frontend main --force
```

### Step 7: Configure Custom Domains

#### Add Domains to Heroku Apps

```bash
# Server domain
heroku domains:add api.shoq.live --app shoq-api

# Frontend domains
heroku domains:add shoq.live --app shoq-frontend
heroku domains:add www.shoq.live --app shoq-frontend
```

#### Configure DNS Records

Add these DNS records in your domain registrar:

```
Type    Name        Value                           TTL
CNAME   api         shoq-api.herokuapp.com         3600
CNAME   @           shoq-frontend.herokuapp.com    3600
CNAME   www         shoq-frontend.herokuapp.com    3600
```

**Note**: Some DNS providers don't allow CNAME for root domain (@). In that case, use:

- A record for root domain pointing to Heroku's IP
- Or use a DNS service like Cloudflare

### Step 8: Enable SSL (Automatic)

Heroku automatically provisions SSL certificates for custom domains. This may take a few minutes.

```bash
# Check SSL status
heroku certs --app shoq-api
heroku certs --app shoq-frontend
```

## 🚀 Quick Deployment Script

Use the provided deployment script for easier deployment:

```bash
# Make script executable
chmod +x deploy-heroku.sh

# Run deployment script
./deploy-heroku.sh
```

The script will guide you through the deployment process interactively.

## 🔍 Verification and Testing

### 1. Check Application Status

```bash
# Check server status
heroku ps --app shoq-api
heroku logs --tail --app shoq-api

# Check frontend status
heroku ps --app shoq-frontend
heroku logs --tail --app shoq-frontend
```

### 2. Test Endpoints

```bash
# Test server API
curl https://api.shoq.live/

# Test frontend
curl https://shoq.live/
```

### 3. Database Connection

```bash
# Test database connection (server logs)
heroku logs --app shoq-api | grep -i mongo
```

## 🛠️ Managing Environment Variables

### View Current Config

```bash
heroku config --app shoq-api
heroku config --app shoq-frontend
```

### Update Variables

```bash
# Update a single variable
heroku config:set VARIABLE_NAME="new-value" --app shoq-api

# Update multiple variables
heroku config:set VAR1="value1" VAR2="value2" --app shoq-api
```

### Remove Variables

```bash
heroku config:unset VARIABLE_NAME --app shoq-api
```

## 📊 Monitoring and Maintenance

### Application Logs

```bash
# View recent logs
heroku logs --app shoq-api
heroku logs --app shoq-frontend

# Stream live logs
heroku logs --tail --app shoq-api
heroku logs --tail --app shoq-frontend

# Filter logs
heroku logs --source app --app shoq-api
```

### Application Metrics

```bash
# View app info
heroku ps:info --app shoq-api

# Restart application
heroku ps:restart --app shoq-api
```

### Database Management

```bash
# If using Heroku Postgres (optional)
heroku pg:info --app shoq-api
heroku pg:psql --app shoq-api
```

## 🔄 Continuous Deployment

### GitHub Integration (Optional)

1. Connect your Heroku apps to GitHub repository
2. Enable automatic deployments from main branch
3. Enable review apps for pull requests

```bash
# Connect to GitHub (via Heroku Dashboard)
# Or use Heroku CLI
heroku git:remote -a shoq-api
```

### Deployment Hooks

Add deployment hooks in `package.json`:

```json
{
	"scripts": {
		"heroku-postbuild": "npm run build",
		"heroku-prebuild": "echo 'Starting build process...'"
	}
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   heroku logs --app shoq-api | grep -i error
   ```

2. **Environment Variable Issues**

   ```bash
   heroku config --app shoq-api
   ```

3. **Domain Configuration**

   ```bash
   heroku domains --app shoq-api
   dig api.shoq.live
   ```

4. **Database Connection**

   - Verify MongoDB URL format
   - Check network access settings
   - Validate credentials

5. **CORS Issues**
   - Verify allowed origins in server configuration
   - Check environment variables

### Performance Optimization

1. **Enable Gzip Compression**
2. **Use CDN for Static Assets**
3. **Optimize Database Queries**
4. **Monitor Application Performance**

### Scaling

```bash
# Scale server dynos
heroku ps:scale web=2 --app shoq-api

# Scale frontend dynos
heroku ps:scale web=1 --app shoq-frontend
```

## 💰 Cost Optimization

1. **Use Eco Dynos** for development
2. **Optimize Database Usage**
3. **Monitor Resource Usage**
4. **Use Heroku Scheduler** for background tasks

## 📞 Support

- **Heroku Documentation**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **Heroku Support**: Available through Heroku Dashboard
- **Community**: Stack Overflow with `heroku` tag

## 🎉 Success!

Your Shoq e-commerce platform should now be running on:

- **Frontend**: https://shoq.live
- **Server API**: https://api.shoq.live
- **Admin Panel**: https://shoq.live/admin

The applications are now production-ready with:

- ✅ SSL certificates
- ✅ Custom domains
- ✅ Environment separation
- ✅ Automatic deployments
- ✅ Monitoring and logging
