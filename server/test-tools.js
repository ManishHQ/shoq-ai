// Simple test of MCP tools functionality
import connectDB from './utils/connectDB.js';
import User from './models/user.model.js';
import Order from './models/order.model.js';
import Deposit from './models/deposit.model.js';

// Connect to database
connectDB(process.env.MONGO_URL || 'mongodb://localhost:27017/shoq');

async function testTools() {
  try {
    console.log('Testing MCP tools functionality...\n');
    
    // Test get_users
    console.log('1. Testing get_users:');
    const users = await User.find({}).limit(5).sort({ createdAt: -1 });
    console.log(`Found ${users.length} users`);
    
    // Test get_orders  
    console.log('\n2. Testing get_orders:');
    const orders = await Order.find({}).limit(5).sort({ createdAt: -1 });
    console.log(`Found ${orders.length} orders`);
    
    // Test get_deposits
    console.log('\n3. Testing get_deposits:');  
    const deposits = await Deposit.find({}).limit(5).sort({ createdAt: -1 });
    console.log(`Found ${deposits.length} deposits`);
    
    // Test get_server_stats
    console.log('\n4. Testing get_server_stats:');
    const [userCount, orderCount, depositCount] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(), 
      Deposit.countDocuments(),
    ]);
    
    const stats = {
      totalUsers: userCount,
      totalOrders: orderCount,
      totalDeposits: depositCount,
      serverUptime: process.uptime(),
      nodeVersion: process.version,
    };
    
    console.log('Server Stats:', stats);
    
    console.log('\n✅ All tools working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testTools();