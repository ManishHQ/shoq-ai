#!/bin/bash

# Environment Setup Script for Heroku Deployment

echo "🔧 Shoq Environment Setup for Heroku"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to set server environment variables
setup_server_env() {
    echo -e "\n${YELLOW}🔧 Setting up Server Environment Variables...${NC}"
    
    read -p "Enter your MongoDB URL: " MONGO_URL
    read -p "Enter JWT Secret: " JWT_SECRET
    read -p "Enter Hedera Operator Address (0.0.XXXXX): " OPERATOR_ADDRESS
    read -p "Enter Hedera Operator Key: " OPERATOR_KEY
    read -p "Enter Shop Owner Address (0.0.XXXXX): " SHOP_OWNER_ADDRESS
    read -p "Enter Telegram Bot Token: " TELEGRAM_BOT_TOKEN
    read -p "Enter Gemini API Key: " GEMINI_API_KEY
    read -p "Enter Email Username: " EMAIL_USERNAME
    read -p "Enter Email Password: " EMAIL_PASSWORD
    
    echo -e "\n${GREEN}Setting server environment variables...${NC}"
    
    heroku config:set \
        NODE_ENV=production \
        MONGO_URL="$MONGO_URL" \
        JWT_SECRET="$JWT_SECRET" \
        OPERATOR_ADDRESS="$OPERATOR_ADDRESS" \
        OPERATOR_KEY="$OPERATOR_KEY" \
        SHOP_OWNER_ADDRESS="$SHOP_OWNER_ADDRESS" \
        HEDERA_USDC_TOKEN_ID="0.0.6528760" \
        TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
        GEMINI_API_KEY="$GEMINI_API_KEY" \
        SMTP_HOST="smtp.gmail.com" \
        SMTP_PORT="465" \
        EMAIL_USERNAME="$EMAIL_USERNAME" \
        EMAIL_PASSWORD="$EMAIL_PASSWORD" \
        FULFILLMENT_EMAIL="orders@shoq.live" \
        FRONTEND_URL="https://shoq.live" \
        SERVER_URL="https://api.shoq.live" \
        --app shoq-api
    
    echo -e "${GREEN}✅ Server environment variables set!${NC}"
}

# Function to set frontend environment variables
setup_frontend_env() {
    echo -e "\n${YELLOW}🔧 Setting up Frontend Environment Variables...${NC}"
    
    heroku config:set \
        NODE_ENV=production \
        NEXT_PUBLIC_API_URL="https://api.shoq.live" \
        --app shoq-frontend
    
    echo -e "${GREEN}✅ Frontend environment variables set!${NC}"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Heroku first:${NC}"
    heroku login
fi

echo "What would you like to set up?"
echo "1) Server environment variables (shoq-api)"
echo "2) Frontend environment variables (shoq-frontend)"
echo "3) Both"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        setup_server_env
        ;;
    2)
        setup_frontend_env
        ;;
    3)
        setup_server_env
        setup_frontend_env
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Environment setup completed!${NC}"
echo -e "\nYou can now deploy your applications using:"
echo -e "${YELLOW}./deploy-heroku.sh${NC}"
