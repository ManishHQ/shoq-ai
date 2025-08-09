#!/bin/bash

# Shoq Heroku Deployment Script
# This script helps deploy both server and frontend to Heroku with custom domains

echo "🚀 Shoq Heroku Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️ Please log in to Heroku first.${NC}"
    heroku login
fi

echo -e "${GREEN}✅ Heroku CLI is ready${NC}"

# Function to create and deploy server
deploy_server() {
    echo -e "\n${YELLOW}🔧 Deploying Server (api.shoq.live)...${NC}"
    
    # Create server app if it doesn't exist
    if ! heroku apps:info shoq-api &> /dev/null; then
        echo "Creating Heroku app for server..."
        heroku create shoq-api --region us
    fi
    
    # Add buildpacks
    heroku buildpacks:clear --app shoq-api
    heroku buildpacks:add heroku/nodejs --app shoq-api
    
    # Set environment variables (you'll need to set these manually)
    echo -e "${YELLOW}⚠️ Remember to set environment variables for shoq-api:${NC}"
    echo "heroku config:set NODE_ENV=production --app shoq-api"
    echo "heroku config:set MONGO_URL='your-mongodb-url' --app shoq-api"
    echo "heroku config:set JWT_SECRET='your-jwt-secret' --app shoq-api"
    echo "heroku config:set OPERATOR_ADDRESS='your-hedera-account' --app shoq-api"
    echo "heroku config:set OPERATOR_KEY='your-hedera-key' --app shoq-api"
    echo "heroku config:set SHOP_OWNER_ADDRESS='your-shop-owner-account' --app shoq-api"
    echo "heroku config:set HEDERA_USDC_TOKEN_ID='0.0.6528760' --app shoq-api"
    echo "heroku config:set TELEGRAM_BOT_TOKEN='your-bot-token' --app shoq-api"
    echo "heroku config:set GEMINI_API_KEY='your-gemini-key' --app shoq-api"
    echo "heroku config:set SMTP_HOST='smtp.gmail.com' --app shoq-api"
    echo "heroku config:set EMAIL_USERNAME='your-email@gmail.com' --app shoq-api"
    echo "heroku config:set EMAIL_PASSWORD='your-app-password' --app shoq-api"
    echo "heroku config:set FULFILLMENT_EMAIL='orders@shoq.live' --app shoq-api"
    echo "heroku config:set FRONTEND_URL='https://shoq.live' --app shoq-api"
    echo "heroku config:set SERVER_URL='https://api.shoq.live' --app shoq-api"
    
    # Deploy server
    echo "Deploying server code..."
    git subtree push --prefix=server heroku-api main || git subtree push --prefix=server heroku-api main --force
    
    # Add custom domain
    echo "Adding custom domain api.shoq.live..."
    heroku domains:add api.shoq.live --app shoq-api
    
    echo -e "${GREEN}✅ Server deployed to https://shoq-api.herokuapp.com${NC}"
    echo -e "${GREEN}📝 Configure DNS: api.shoq.live CNAME shoq-api.herokuapp.com${NC}"
}

# Function to create and deploy frontend
deploy_frontend() {
    echo -e "\n${YELLOW}🔧 Deploying Frontend (shoq.live)...${NC}"
    
    # Create frontend app if it doesn't exist
    if ! heroku apps:info shoq-frontend &> /dev/null; then
        echo "Creating Heroku app for frontend..."
        heroku create shoq-frontend --region us
    fi
    
    # Add buildpacks
    heroku buildpacks:clear --app shoq-frontend
    heroku buildpacks:add heroku/nodejs --app shoq-frontend
    
    # Set environment variables
    heroku config:set NODE_ENV=production --app shoq-frontend
    heroku config:set NEXT_PUBLIC_API_URL=https://api.shoq.live --app shoq-frontend
    
    # Deploy frontend
    echo "Deploying frontend code..."
    git push heroku-frontend main || git push heroku-frontend main --force
    
    # Add custom domain
    echo "Adding custom domain shoq.live..."
    heroku domains:add shoq.live --app shoq-frontend
    heroku domains:add www.shoq.live --app shoq-frontend
    
    echo -e "${GREEN}✅ Frontend deployed to https://shoq-frontend.herokuapp.com${NC}"
    echo -e "${GREEN}📝 Configure DNS: shoq.live CNAME shoq-frontend.herokuapp.com${NC}"
    echo -e "${GREEN}📝 Configure DNS: www.shoq.live CNAME shoq-frontend.herokuapp.com${NC}"
}

# Function to setup git remotes
setup_git_remotes() {
    echo -e "\n${YELLOW}🔧 Setting up Git remotes...${NC}"
    
    # Add Heroku remotes
    if ! git remote | grep -q heroku-api; then
        heroku git:remote -a shoq-api -r heroku-api
    fi
    
    if ! git remote | grep -q heroku-frontend; then
        heroku git:remote -a shoq-frontend -r heroku-frontend
    fi
    
    echo -e "${GREEN}✅ Git remotes configured${NC}"
}

# Main deployment flow
echo "What would you like to deploy?"
echo "1) Server only (api.shoq.live)"
echo "2) Frontend only (shoq.live)"
echo "3) Both server and frontend"
echo "4) Setup git remotes only"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        setup_git_remotes
        deploy_server
        ;;
    2)
        setup_git_remotes
        deploy_frontend
        ;;
    3)
        setup_git_remotes
        deploy_server
        deploy_frontend
        ;;
    4)
        setup_git_remotes
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deployment process completed!${NC}"
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Configure DNS records for your domains"
echo "2. Set up SSL certificates (Heroku handles this automatically)"
echo "3. Configure environment variables if not done already"
echo "4. Test your applications"
echo ""
echo -e "${YELLOW}📝 DNS Configuration:${NC}"
echo "api.shoq.live    CNAME    shoq-api.herokuapp.com"
echo "shoq.live        CNAME    shoq-frontend.herokuapp.com"
echo "www.shoq.live    CNAME    shoq-frontend.herokuapp.com"
echo ""
echo -e "${YELLOW}🔗 Application URLs:${NC}"
echo "Server:   https://api.shoq.live"
echo "Frontend: https://shoq.live"
