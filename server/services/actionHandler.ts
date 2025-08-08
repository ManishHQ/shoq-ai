interface ActionRequest {
	action: string;
	parameters: any;
	confidence: number;
}

interface ActionResult {
	success: boolean;
	message: string;
	data?: any;
}

class ActionHandler {
	private tickets = [
		{ id: 1, name: 'Movie Ticket - Avengers', price: 15, available: true },
		{ id: 2, name: 'Concert - Rock Band', price: 50, available: true },
		{ id: 3, name: 'Theater - Hamlet', price: 30, available: false },
		{ id: 4, name: 'Sports - Football Match', price: 25, available: true },
		{ id: 5, name: 'Comedy Show', price: 20, available: true },
		{ id: 6, name: 'Opera - La Traviata', price: 75, available: true },
	];

	// Import product service for dynamic product management
	private async getProductService() {
		return (await import('./productService.js')).default;
	}

	public async executeAction(
		actionRequest: ActionRequest,
		userId: number
	): Promise<ActionResult> {
		// Get user information including email for AI context
		const User = (await import('../models/user.model.js')).default;
		const user = await User.findOne({ chatId: userId });

		if (!user) {
			return {
				success: false,
				message: 'User not found. Please start the bot with /start',
			};
		}

		// Add user context to action request for AI processing
		const enhancedRequest = {
			...actionRequest,
			userContext: {
				userId: user._id,
				chatId: user.chatId,
				email: user.email,
				name: user.name,
				balance: user.balance,
				onboardingMethod: user.onboardingMethod,
			},
		};
		const { action, parameters } = actionRequest;

		switch (action) {
			case 'BOOK_TICKET':
				return this.bookTicket(parameters, userId);

			case 'PURCHASE_ITEM':
				return this.purchaseItem(parameters, userId);

			case 'CONFIRM_PURCHASE':
				return this.confirmPurchase(parameters, userId);

			case 'CONFIRM_BOOKING':
				return this.confirmBooking(parameters, userId);

			case 'SEARCH_TICKETS':
				return this.searchTickets(parameters);

			case 'SEARCH_ITEMS':
				return this.searchItems(parameters);

			case 'GET_PRICES':
				return this.getPrices(parameters);

			case 'GET_RECOMMENDATIONS':
				return this.getRecommendations(parameters);

			default:
				return {
					success: false,
					message: "I don't understand that action yet.",
				};
		}
	}

	private async bookTicket(
		parameters: any,
		userId: number
	): Promise<ActionResult> {
		const { item, quantity = 1 } = parameters;

		// Find the ticket
		const ticket = this.tickets.find(
			(t) =>
				t.name.toLowerCase().includes(item.toLowerCase()) ||
				item.toLowerCase().includes(t.name.toLowerCase())
		);

		if (!ticket) {
			return {
				success: false,
				message: `Hmm, I don't see "${item}" in our tickets right now 😕 But we've got lots of other great events! Check out: ${this.tickets.map((t) => t.name).join(', ')}`,
			};
		}

		if (!ticket.available) {
			return {
				success: false,
				message: `Bummer! 😔 "${ticket.name}" is not available right now. But we've got plenty of other awesome events!`,
			};
		}

		// Import User model to check balance
		const User = (await import('../models/user.model.js')).default;
		const user = await User.findOne({ chatId: userId });

		if (!user) {
			return {
				success: false,
				message: '❌ User not found. Please use /start to register.',
			};
		}

		const totalPrice = ticket.price * quantity;
		const canAfford = user.balance >= totalPrice;
		const balanceAfter = user.balance - totalPrice;

		// Show ticket details and ask for confirmation
		const message = `🎫 **Ticket Details**

**${ticket.name}**
💰 Price: $${ticket.price}
📦 Quantity: ${quantity}
💳 **Total: $${totalPrice}**

💰 **Your Balance:** $${user.balance}
${canAfford ? `✅ **After Purchase:** $${balanceAfter}` : `❌ **Insufficient Balance** - Need $${totalPrice - user.balance} more`}

${canAfford ? 'Ready to confirm your booking?' : 'Please make a deposit to book this ticket.'}`;

		return {
			success: true,
			message: message,
			data: {
				ticketId: ticket.id,
				ticket: ticket.name,
				quantity,
				totalPrice,
				userId,
				canAfford,
				// UI Action suggestions
				uiActions: canAfford
					? [
							{
								type: 'button',
								text: '✅ Confirm Booking',
								action: 'confirm_booking',
								ticketId: ticket.id,
								quantity: quantity,
							},
							{
								type: 'button',
								text: '❌ Cancel',
								action: 'cancel_booking',
							},
						]
					: [
							{
								type: 'button',
								text: '💰 Make Deposit',
								action: 'deposit',
							},
							{
								type: 'button',
								text: '🎫 Browse Other Tickets',
								action: 'browse_tickets',
							},
						],
			},
		};
	}

	private async purchaseItem(
		parameters: any,
		userId: number
	): Promise<ActionResult> {
		const { item, quantity = 1, category } = parameters;

		// Get product service
		const productService = await this.getProductService();

		// Search for the item using product service
		const searchResult = await productService.searchProducts(item);
		if (!searchResult.success || !searchResult.products) {
			return {
				success: false,
				message: 'Sorry, there was an error searching for products.',
			};
		}

		let foundItem = searchResult.products.find(
			(i: any) =>
				i.name.toLowerCase().includes(item.toLowerCase()) ||
				item.toLowerCase().includes(i.name.toLowerCase())
		);

		// If category is specified, filter by category
		if (category && !foundItem) {
			foundItem = searchResult.products.find(
				(i: any) =>
					i.category.toLowerCase() === category.toLowerCase() &&
					(i.name.toLowerCase().includes(item.toLowerCase()) ||
						item.toLowerCase().includes(i.name.toLowerCase()))
			);
		}

		if (!foundItem) {
			// Get available products for alternatives
			const availableResult = await productService.getAvailableProducts();
			const alternatives =
				availableResult.success && availableResult.products
					? availableResult.products
							.slice(0, 5)
							.map((p: any) => p.name)
							.join(', ')
					: 'various products';

			return {
				success: false,
				message: `Oops! 😅 I couldn't find "${item}" in our shop. But we've got some awesome alternatives: ${alternatives}`,
			};
		}

		if (!foundItem.inStock) {
			return {
				success: false,
				message: `Bummer! 😔 "${foundItem.name}" is out of stock right now. But don't worry, we've got plenty of other great items!`,
			};
		}

		// Import User model to check balance
		const User = (await import('../models/user.model.js')).default;
		const user = await User.findOne({ chatId: userId });

		if (!user) {
			return {
				success: false,
				message: '❌ User not found. Please use /start to register.',
			};
		}

		const totalPrice = foundItem.price * quantity;
		const finalTotal = totalPrice;

		// Check if user has sufficient balance
		const canAfford = user.balance >= finalTotal;
		const balanceAfter = user.balance - finalTotal;

		// Show item details and ask for confirmation
		const message = `🛍️ **Item Details**

**${foundItem.name}**
💰 Price: $${foundItem.price}
📦 Quantity: ${quantity}
💳 **Total: $${finalTotal}**

📂 Category: ${foundItem.category}
📝 ${foundItem.description}
⭐ Rating: ${foundItem.rating}/5 (${foundItem.reviewCount} reviews)

💰 **Your Balance:** $${user.balance}
${canAfford ? `✅ **After Purchase:** $${balanceAfter}` : `❌ **Insufficient Balance** - Need $${finalTotal - user.balance} more`}

${canAfford ? 'Ready to confirm your purchase?' : 'Please make a deposit to purchase this item.'}`;

		return {
			success: true,
			message: message,
			data: {
				itemId: foundItem.productId,
				item: foundItem.name,
				quantity,
				totalPrice,
				finalTotal,
				userId,
				canAfford,
				// Rich data for UI building
				itemDetails: {
					id: foundItem.productId,
					name: foundItem.name,
					price: foundItem.price,
					category: foundItem.category,
					description: foundItem.description,
					imageUrl:
						foundItem.images && foundItem.images.length > 0
							? foundItem.images[0]
							: this.getDefaultImageForCategory(foundItem.category),
					colors: foundItem.colors,
					rating: foundItem.rating,
					reviewCount: foundItem.reviewCount,
					// Additional properties if they exist
					...(foundItem.sizes && { sizes: foundItem.sizes }),
					...(foundItem.features && { features: foundItem.features }),
					...(foundItem.compatibility && {
						compatibility: foundItem.compatibility,
					}),
					...(foundItem.material && { material: foundItem.material }),
					...(foundItem.capacity && { capacity: foundItem.capacity }),
					...(foundItem.pages && { pages: foundItem.pages }),
					...(foundItem.author && { author: foundItem.author }),
					...(foundItem.connectivity && {
						connectivity: foundItem.connectivity,
					}),
				},
				// UI Action suggestions
				uiActions: canAfford
					? [
							{
								type: 'button',
								text: '✅ Confirm Purchase',
								action: 'confirm_purchase',
								itemId: foundItem.productId,
								quantity: quantity,
							},
							{
								type: 'button',
								text: '❌ Cancel',
								action: 'cancel_purchase',
							},
						]
					: [
							{
								type: 'button',
								text: '💰 Make Deposit',
								action: 'deposit',
							},
							{
								type: 'button',
								text: '🛍️ Browse Other Items',
								action: 'browse_items',
							},
						],
			},
		};
	}

	private async searchTickets(parameters: any): Promise<ActionResult> {
		const { query } = parameters;

		const results = this.tickets.filter(
			(ticket) =>
				ticket.name.toLowerCase().includes(query.toLowerCase()) ||
				query.toLowerCase().includes(ticket.name.toLowerCase())
		);

		if (results.length === 0) {
			return {
				success: false,
				message: `Hmm, I don't see "${query}" in our tickets right now 😕 But we've got lots of other great events! Check out: ${this.tickets.map((t) => t.name).join(', ')}`,
			};
		}

		const ticketList = results
			.map(
				(t) =>
					`• ${t.name} - $${t.price}${!t.available ? ' (Not available)' : ''}`
			)
			.join('\n');

		return {
			success: true,
			message: `Great! 🎉 I found ${results.length} ticket(s) for "${query}":\n\n${ticketList}\n\nWhich one would you like to check out?`,
			data: { tickets: results },
		};
	}

	private async searchItems(parameters: any): Promise<ActionResult> {
		const { query, category } = parameters;

		// Get product service
		const productService = await this.getProductService();

		// Search products
		const searchResult = await productService.searchProducts(query);

		if (
			!searchResult.success ||
			!searchResult.products ||
			searchResult.products.length === 0
		) {
			// Get some available products as fallback
			const availableResult = await productService.getAvailableProducts();
			const fallbackItems = availableResult.products?.slice(0, 5) || [];
			const fallbackNames = fallbackItems.map((i: any) => i.name).join(', ');

			return {
				success: false,
				message: `Hmm, I don't see "${query}" in our shop right now 😕 But we've got lots of other cool stuff! Check out: ${fallbackNames}`,
			};
		}

		let results = searchResult.products;

		// Filter by category if specified
		if (category) {
			results = results.filter(
				(item: any) => item.category.toLowerCase() === category.toLowerCase()
			);
		}

		if (results.length === 0) {
			return {
				success: false,
				message: `No items found in category "${category}" for "${query}". Try searching without a category filter.`,
			};
		}

		const itemList = results
			.map(
				(i: any) =>
					`• ${i.name} - $${i.price} (${i.category})${!i.inStock ? ' (Out of stock)' : ''}`
			)
			.join('\n');

		return {
			success: true,
			message: `Great! 🎉 I found ${results.length} item(s) for "${query}":\n\n${itemList}\n\nWhich one would you like to check out?`,
			data: { items: results },
		};
	}

	private async getPrices(parameters: any): Promise<ActionResult> {
		const { type } = parameters;

		if (type === 'tickets' || type === 'ticket') {
			const ticketPrices = this.tickets
				.map((t) => `• ${t.name}: $${t.price}`)
				.join('\n');
			return {
				success: true,
				message: `🎫 Ticket Prices:\n\n${ticketPrices}`,
			};
		}

		if (type === 'items' || type === 'shop') {
			// Get product service
			const productService = await this.getProductService();
			const availableResult = await productService.getAvailableProducts();

			if (availableResult.success && availableResult.products) {
				const itemPrices = availableResult.products
					.map((i: any) => `• ${i.name}: $${i.price} (${i.category})`)
					.join('\n');
				return {
					success: true,
					message: `🛍️ Shop Item Prices:\n\n${itemPrices}`,
				};
			} else {
				return {
					success: false,
					message: '❌ Unable to fetch shop item prices at the moment.',
				};
			}
		}

		// Get product service for all items
		const productService = await this.getProductService();
		const availableResult = await productService.getAvailableProducts();

		let itemPrices = 'No items available';
		if (availableResult.success && availableResult.products) {
			itemPrices = availableResult.products
				.map((i: any) => `• ${i.name}: $${i.price} (${i.category})`)
				.join('\n');
		}

		const allPrices = `🎫 Tickets:\n${this.tickets.map((t) => `• ${t.name}: $${t.price}`).join('\n')}\n\n🛍️ Shop Items:\n${itemPrices}`;

		return {
			success: true,
			message: `💰 All Prices:\n\n${allPrices}`,
		};
	}

	private async getRecommendations(parameters: any): Promise<ActionResult> {
		const { preference } = parameters;

		// Get product service
		const productService = await this.getProductService();
		const availableResult = await productService.getAvailableProducts();

		if (!availableResult.success || !availableResult.products) {
			return {
				success: false,
				message: '❌ Unable to fetch recommendations at the moment.',
			};
		}

		const availableProducts = availableResult.products;
		const recommendations = [];

		// Simple recommendation logic based on available products
		if (
			preference.toLowerCase().includes('movie') ||
			preference.toLowerCase().includes('film')
		) {
			recommendations.push(
				'🎬 Movie Ticket - Avengers ($15) - Perfect for movie lovers!'
			);
		}

		if (
			preference.toLowerCase().includes('music') ||
			preference.toLowerCase().includes('concert')
		) {
			recommendations.push(
				'🎵 Concert - Rock Band ($50) - Amazing live music experience!'
			);
		}

		if (
			preference.toLowerCase().includes('sport') ||
			preference.toLowerCase().includes('football')
		) {
			recommendations.push(
				'⚽ Sports - Football Match ($25) - Great for sports fans!'
			);
		}

		// Dynamic recommendations based on available products
		if (
			preference.toLowerCase().includes('electronic') ||
			preference.toLowerCase().includes('tech')
		) {
			const electronics = availableProducts.filter(
				(p: any) => p.category.toLowerCase() === 'electronics'
			);
			electronics.slice(0, 2).forEach((p: any) => {
				recommendations.push(`🎧 ${p.name} ($${p.price}) - ${p.description}`);
			});
		}

		if (
			preference.toLowerCase().includes('home') ||
			preference.toLowerCase().includes('decor')
		) {
			const homeItems = availableProducts.filter(
				(p: any) => p.category.toLowerCase() === 'home'
			);
			homeItems.slice(0, 2).forEach((p: any) => {
				recommendations.push(`🏠 ${p.name} ($${p.price}) - ${p.description}`);
			});
		}

		if (recommendations.length === 0) {
			// Fallback to popular items
			const popularItems = availableProducts
				.sort((a: any, b: any) => b.rating - a.rating)
				.slice(0, 4);

			popularItems.forEach((p: any) => {
				recommendations.push(`⭐ ${p.name} ($${p.price}) - ${p.description}`);
			});
		}

		return {
			success: true,
			message: `✨ Recommendations for you:\n\n${recommendations.join('\n')}`,
			data: { recommendations },
		};
	}

	private async confirmPurchase(
		parameters: any,
		userId: number
	): Promise<ActionResult> {
		const { itemId, quantity = 1 } = parameters;

		// Get product service
		const productService = await this.getProductService();

		// Find the item by productId (itemId is actually productId in this context)
		const productResult = await productService.getProductById(itemId);

		if (!productResult.success || !productResult.product) {
			return {
				success: false,
				message: '❌ Item is no longer available.',
			};
		}

		const foundItem = productResult.product;

		if (!foundItem.inStock || foundItem.stockQuantity < quantity) {
			return {
				success: false,
				message: '❌ Item is out of stock or insufficient quantity.',
			};
		}

		// Import orderService dynamically to avoid circular dependencies
		const { orderService } = await import('./orderService.js');

		const totalPrice = foundItem.price * quantity;
		const finalTotal = totalPrice;

		// Create actual order in database
		const orderResult = await orderService.createOrder({
			chatId: userId,
			productId: foundItem.productId,
			quantity,
			totalPrice: finalTotal,
		});

		if (!orderResult.success) {
			return {
				success: false,
				message: orderResult.message,
			};
		}

		return {
			success: true,
			message: `🎉 Woo-hoo! Your order is confirmed!\n\n✅ ${quantity}x "${foundItem.name}"\n💰 Total: $${finalTotal}\n🛍️ Order ID: #${orderResult.order.orderId}\n💳 Transaction Hash: ${orderResult.transactionHash}\n\nThanks for shopping with us! 🛍️`,
			data: {
				orderId: orderResult.order.orderId,
				item: foundItem.name,
				quantity,
				totalPrice,
				finalTotal,
				userId,
				transactionHash: orderResult.transactionHash,
				// Rich data for UI building
				itemDetails: {
					id: foundItem.productId,
					name: foundItem.name,
					price: foundItem.price,
					category: foundItem.category,
					description: foundItem.description,
					imageUrl: foundItem.images?.[0] || '',
					rating: foundItem.rating,
					reviewCount: foundItem.reviewCount,
					stock: foundItem.stockQuantity,
				},
				// UI Action suggestions
				uiActions: [
					{
						type: 'button',
						text: 'View Order Details',
						action: 'view_order',
						orderId: orderResult.order._id,
					},
					{
						type: 'button',
						text: 'Track Order',
						action: 'track_order',
						orderId: orderResult.order._id,
					},
					{
						type: 'button',
						text: 'Buy Similar Items',
						action: 'recommend_similar',
						category: foundItem.category,
					},
				],
			},
		};
	}

	private async confirmBooking(
		parameters: any,
		userId: number
	): Promise<ActionResult> {
		const { ticketId, quantity = 1 } = parameters;

		// Find the ticket
		const ticket = this.tickets.find((t) => t.id === parseInt(ticketId));

		if (!ticket || !ticket.available) {
			return {
				success: false,
				message: '❌ Ticket is no longer available.',
			};
		}

		// Import orderService dynamically to avoid circular dependencies
		const { orderService } = await import('./orderService.js');

		const totalPrice = ticket.price * quantity;

		// Create actual order in database
		const orderResult = await orderService.createOrder({
			chatId: userId,
			productId: `TICKET_${ticket.id}`,
			quantity,
			totalPrice,
		});

		if (!orderResult.success) {
			return {
				success: false,
				message: orderResult.message,
			};
		}

		return {
			success: true,
			message: `🎉 Woo-hoo! Your booking is confirmed!\n\n✅ ${quantity}x "${ticket.name}"\n💰 Total: $${totalPrice}\n🎫 Order ID: #${orderResult.order.orderId}\n\nThanks for choosing us! 🎊`,
			data: {
				orderId: orderResult.order.orderId,
				ticket: ticket.name,
				quantity,
				totalPrice,
				userId,
				// UI Action suggestions for tickets
				uiActions: [
					{
						type: 'button',
						text: 'View Order Details',
						action: 'view_order',
						orderId: orderResult.order._id,
					},
					{
						type: 'button',
						text: 'Track Order',
						action: 'track_order',
						orderId: orderResult.order._id,
					},
				],
			},
		};
	}

	private getDefaultImageForCategory(category: string): string {
		switch (category.toLowerCase()) {
			case 'electronics':
				return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop';
			case 'home':
				return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
			case 'clothing':
				return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
			case 'books':
				return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop';
			case 'grocery':
				return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop';
			case 'food':
				return 'https://images.unsplash.com/photo-1504674900244-1b47f22f8f54?w=400&h=300&fit=crop';
			case 'drinks':
				return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop';
			case 'toys':
				return 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop';
			case 'sports':
				return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop';
			case 'automotive':
				return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop';
			case 'pets':
				return 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop';
			case 'office':
				return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop';
			case 'garden':
				return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';
			case 'tools':
				return 'https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?w=400&h=300&fit=crop';
			case 'jewelry':
				return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop';
			case 'beauty':
				return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop';
			case 'health':
				return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop';
			case 'music':
				return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
			case 'movies':
				return 'https://images.unsplash.com/photo-1489599835382-957593cb2371?w=400&h=300&fit=crop';
			case 'travel':
				return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
			case 'education':
				return 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=400&h=300&fit=crop';
			case 'finance':
				return 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop';
			case 'gaming':
				return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop';
			case 'entertainment':
				return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop';
			default:
				return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop';
		}
	}
}

export default ActionHandler;
