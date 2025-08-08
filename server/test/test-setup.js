import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSetup() {
	try {
		// Connect to MongoDB
		await mongoose.connect(
			process.env.MONGO_URL || 'mongodb://localhost:27017/shoq'
		);
		console.log('✅ Connected to MongoDB');

		// Test product creation
		const testProduct = new Product({
			productId: 'TEST001',
			name: 'Test Product',
			description: 'A test product for verification',
			category: 'other',
			price: 10,
			sku: 'TEST001',
			images: [],
			stockQuantity: 5,
			tags: ['test'],
			rating: 4.0,
			reviewCount: 1,
		});

		await testProduct.save();
		console.log('✅ Test product created');

		// Test product retrieval
		const products = await Product.find({ isActive: true });
		console.log(`✅ Found ${products.length} active products`);

		// Test order model
		const testUser = await User.findOne({});
		if (testUser) {
			const testOrder = new Order({
				orderId: 'TEST123',
				userId: testUser._id,
				items: [
					{
						productId: 'TEST001',
						name: 'Test Product',
						price: 10,
						quantity: 1,
					},
				],
				totalPrice: 10,
				status: 'pending',
			});

			await testOrder.save();
			console.log('✅ Test order created');

			// Clean up test data
			await Product.deleteOne({ productId: 'TEST001' });
			await Order.deleteOne({ orderId: 'TEST123' });
			console.log('✅ Test data cleaned up');
		}

		console.log('✅ All tests passed!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		await mongoose.disconnect();
		console.log('✅ Disconnected from MongoDB');
	}
}

testSetup();
