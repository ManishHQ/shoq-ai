# Deployment Checklist

## Before Deploying to Render.com

### 1. Update API URLs in Frontend

The following files need to be updated to use the new API configuration:

#### Files to Update:

- [ ] `app/chat/page.tsx` - Line 40, 233
- [ ] `app/chat/components/ProductCard.tsx` - Line 21
- [ ] `app/shop/components/ProductCard.tsx` - Line 17
- [ ] `app/admin/page.tsx` - Line 23
- [ ] `app/admin/components/EditItemForm.tsx` - Line 60
- [ ] `app/admin/components/CreateItemForm.tsx` - Line 50
- [ ] `app/admin/components/ItemsList.tsx` - Line 23
- [ ] `app/chat/components/MessageInput.tsx` - Line 23

#### Update Pattern:

Replace:

```typescript
fetch('http://localhost:8000/...');
```

With:

```typescript
import { API_ENDPOINTS } from '../lib/config';
// or appropriate relative path

fetch(`${API_ENDPOINTS.SHOP}/...`);
// or
fetch(`${API_ENDPOINTS.CHAT}/...`);
```

### 2. Environment Variables Setup

#### Backend Environment Variables:

- [ ] `MONGO_URL` - MongoDB connection string
- [ ] `TELEGRAM_BOT_TOKEN` - Telegram bot token
- [ ] `OPERATOR_ID` - Hedera operator account ID
- [ ] `OPERATOR_KEY` - Hedera operator private key
- [ ] `HEDERA_USDC_TOKEN_ID` - USDC token ID on Hedera
- [ ] `SHOP_OWNER_ADDRESS` - Shop owner's Hedera account address
- [ ] `EMAIL_USERNAME` - Gmail username (optional)
- [ ] `EMAIL_PASSWORD` - Gmail app password (optional)

#### Frontend Environment Variables:

- [ ] `NEXT_PUBLIC_API_URL` - Will be set automatically by render.yaml

### 3. Database Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user with read/write permissions
- [ ] Network access configured (0.0.0.0/0 for Render)
- [ ] Connection string ready

### 4. Telegram Bot Setup

- [ ] Bot token obtained from @BotFather
- [ ] Bot permissions configured
- [ ] Webhook URL ready (will be set after deployment)

### 5. Hedera Setup

- [ ] Operator account created
- [ ] USDC token ID obtained
- [ ] Shop owner account address ready
- [ ] Testnet/Mainnet configuration decided

### 6. Git Repository

- [ ] All changes committed
- [ ] Repository pushed to GitHub
- [ ] Repository is public or Render has access

### 7. Render.com Deployment

#### Option 1: Blueprint Deployment (Recommended)

- [ ] Connect GitHub repository to Render
- [ ] Create new Blueprint
- [ ] Configure environment variables
- [ ] Deploy both services

#### Option 2: Manual Deployment

- [ ] Create backend web service
- [ ] Create frontend web service
- [ ] Configure environment variables for both
- [ ] Deploy services

### 8. Post-Deployment Verification

- [ ] Backend service is running
- [ ] Frontend service is running
- [ ] Database connection working
- [ ] Telegram bot responding
- [ ] API endpoints accessible
- [ ] Frontend can communicate with backend

### 9. Testing

- [ ] Product listing works
- [ ] Product search works
- [ ] Purchase flow works
- [ ] Telegram bot commands work
- [ ] Order creation works
- [ ] USDC transfers work

### 10. Monitoring

- [ ] Set up log monitoring
- [ ] Configure error alerts
- [ ] Monitor service health
- [ ] Track Telegram bot usage

## Quick Commands

### Update API URLs (Run in project root):

```bash
# Find all localhost:8000 references
grep -r "localhost:8000" app/

# Replace with new config (manual process)
# Use the config.ts file and update each file individually
```

### Test Local Build:

```bash
# Test backend build
cd server && npm run build

# Test frontend build
npm run build
```

### Environment Variables Template:

```bash
# Backend (.env)
MONGO_URL=mongodb+srv://...
TELEGRAM_BOT_TOKEN=...
OPERATOR_ID=...
OPERATOR_KEY=...
HEDERA_USDC_TOKEN_ID=...
SHOP_OWNER_ADDRESS=...

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```
