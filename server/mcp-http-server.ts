import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';
import User from './models/user.model.js';
import Order from './models/order.model.js';
import Deposit from './models/deposit.model.js';

dotenv.config();

const app = express();
const PORT = process.env.MCP_PORT || 8001;

// Connect to database
connectDB(process.env.MONGO_URL || 'mongodb://localhost:27017/shoq');

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List available tools
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_users',
        description: 'Get all users from the database',
        parameters: {
          limit: { type: 'number', description: 'Maximum number of users to return', default: 50 }
        }
      },
      {
        name: 'get_user_by_id',
        description: 'Get a specific user by their ID',
        parameters: {
          userId: { type: 'string', description: 'The user ID to fetch', required: true }
        }
      },
      {
        name: 'get_orders',
        description: 'Get all orders from the database',
        parameters: {
          limit: { type: 'number', description: 'Maximum number of orders to return', default: 50 },
          userId: { type: 'string', description: 'Filter orders by user ID (optional)' }
        }
      },
      {
        name: 'get_deposits',
        description: 'Get all deposits from the database',
        parameters: {
          limit: { type: 'number', description: 'Maximum number of deposits to return', default: 50 },
          userId: { type: 'string', description: 'Filter deposits by user ID (optional)' }
        }
      },
      {
        name: 'get_server_stats',
        description: 'Get server statistics and overview',
        parameters: {}
      }
    ]
  });
});

// Execute tools
app.post('/tools/:toolName', async (req: Request, res: Response): Promise<void> => {
  const { toolName } = req.params;
  const args = req.body;

  try {
    switch (toolName) {
      case 'get_users': {
        const limit = args.limit || 50;
        const users = await User.find({})
          .limit(limit)
          .sort({ createdAt: -1 });
        
        res.json({ success: true, data: users });
        break;
      }

      case 'get_user_by_id': {
        const { userId } = args;
        if (!userId) {
          res.status(400).json({ success: false, error: 'userId is required' });
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({ success: false, error: `User with ID ${userId} not found` });
          return;
        }

        res.json({ success: true, data: user });
        break;
      }

      case 'get_orders': {
        const limit = args.limit || 50;
        const userId = args.userId;
        
        const query = userId ? { userId } : {};
        const orders = await Order.find(query)
          .limit(limit)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email telegramId');
        
        res.json({ success: true, data: orders });
        break;
      }

      case 'get_deposits': {
        const limit = args.limit || 50;
        const userId = args.userId;
        
        const query = userId ? { userId } : {};
        const deposits = await Deposit.find(query)
          .limit(limit)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email telegramId');
        
        res.json({ success: true, data: deposits });
        break;
      }

      case 'get_server_stats': {
        const [userCount, orderCount, depositCount] = await Promise.all([
          User.countDocuments(),
          Order.countDocuments(),
          Deposit.countDocuments(),
        ]);

        const recentOrders = await Order.find({})
          .limit(5)
          .sort({ createdAt: -1 })
          .populate('userId', 'name telegramId');

        const stats = {
          totalUsers: userCount,
          totalOrders: orderCount,
          totalDeposits: depositCount,
          recentOrders: recentOrders,
          serverUptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        };

        res.json({ success: true, data: stats });
        break;
      }

      default:
        res.status(404).json({ success: false, error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Error executing tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP HTTP server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Tools endpoint: http://localhost:${PORT}/tools`);
});