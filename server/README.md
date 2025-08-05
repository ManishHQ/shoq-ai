# Shoq Server - Telegram Bot & API

This server provides a Telegram bot for booking tickets and shopping items, along with REST API endpoints.

## Features

### Telegram Bot

- 🎫 Book tickets for events
- 🛍️ Purchase shop items
- Interactive buttons and menus
- Real-time responses

### REST API

- `/tickets` - Ticket booking endpoints
- `/shop` - Shopping endpoints
- `/auth` - Authentication endpoints

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGO_URL=mongodb://localhost:27017/shoq

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Telegram Bot Setup

1. Create a new bot with [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Add the token to your `.env` file as `TELEGRAM_BOT_TOKEN`

### 4. Run the Server

```bash
# Development
yarn dev

# Production
yarn build
yarn start
```

## API Endpoints

### Tickets

- `GET /tickets` - Get all tickets
- `GET /tickets/:id` - Get ticket by ID
- `POST /tickets/:id/book` - Book a ticket
- `GET /tickets/search/:query` - Search tickets
- `GET /tickets/categories` - Get ticket categories

### Shop

- `GET /shop` - Get all shop items
- `GET /shop/:id` - Get item by ID
- `POST /shop/:id/purchase` - Purchase an item
- `GET /shop/search/:query` - Search items
- `GET /shop/categories` - Get shop categories
- `GET /shop/featured` - Get featured items
- `GET /shop/category/:category` - Get items by category

## Telegram Bot Commands

- `/start` - Start the bot
- `/help` - Get help
- `/tickets` - Browse and book tickets
- `/shop` - Browse and buy items

## Hardcoded Data

The current implementation uses hardcoded data for demonstration:

### Tickets

- Movie Ticket - Avengers ($15)
- Concert - Rock Band ($50)
- Theater - Hamlet ($30) - Not available
- Sports - Football Match ($25)
- Comedy Show ($20)
- Opera - La Traviata ($75)

### Shop Items

- T-Shirt ($20)
- Coffee Mug ($8)
- Phone Case ($15)
- Book - Programming Guide ($25) - Not available
- Headphones ($80)
- Laptop Stand ($35)
- Water Bottle ($12)
- Notebook ($5)
- Wireless Mouse ($25)
- Desk Lamp ($45)

## Next Steps

1. Integrate with a real database
2. Add payment processing
3. Implement user authentication
4. Add order tracking
5. Create admin panel
6. Add inventory management
7. Implement email notifications
8. Add analytics and reporting

## Development

The server is built with:

- Node.js
- Express.js
- TypeScript
- node-telegram-bot-api
- MongoDB (for future use)
