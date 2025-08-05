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

	private shopItems = [
		{
			id: 1,
			name: 'T-Shirt',
			price: 20,
			category: 'Clothing',
			available: true,
			description: 'Comfortable cotton T-shirt, perfect for everyday wear',
			imageUrl:
				'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
			colors: ['White', 'Black', 'Blue', 'Gray'],
			sizes: ['S', 'M', 'L', 'XL'],
			rating: 4.5,
			reviews: 128,
		},
		{
			id: 2,
			name: 'Coffee Mug',
			price: 8,
			category: 'Home',
			available: true,
			description: 'Ceramic coffee mug, perfect for your morning brew',
			imageUrl:
				'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
			colors: ['White', 'Black', 'Red'],
			rating: 4.2,
			reviews: 89,
		},
		{
			id: 3,
			name: 'Phone Case',
			price: 15,
			category: 'Electronics',
			available: true,
			description: 'Protective phone case with shock absorption',
			imageUrl:
				'https://images.unsplash.com/photo-1603313011952-0116c1a4b6c4?w=400',
			colors: ['Clear', 'Black', 'Blue', 'Pink'],
			compatibility: ['iPhone 14', 'iPhone 13', 'Samsung Galaxy'],
			rating: 4.3,
			reviews: 156,
		},
		{
			id: 4,
			name: 'Book - Programming Guide',
			price: 25,
			category: 'Books',
			available: false,
			description: 'Comprehensive programming guide for beginners',
			imageUrl:
				'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
			author: 'John Doe',
			pages: 350,
			rating: 4.7,
			reviews: 203,
		},
		{
			id: 5,
			name: 'Headphones',
			price: 80,
			category: 'Electronics',
			available: true,
			description: 'Wireless noise-canceling headphones with premium sound',
			imageUrl:
				'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
			colors: ['Black', 'White', 'Blue'],
			features: ['Bluetooth 5.0', 'Noise Canceling', '30h Battery'],
			rating: 4.8,
			reviews: 342,
		},
		{
			id: 6,
			name: 'Laptop Stand',
			price: 35,
			category: 'Electronics',
			available: true,
			description: 'Adjustable laptop stand for better ergonomics',
			imageUrl:
				'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
			colors: ['Silver', 'Black'],
			material: 'Aluminum',
			rating: 4.4,
			reviews: 67,
		},
		{
			id: 7,
			name: 'Water Bottle',
			price: 12,
			category: 'Home',
			available: true,
			description:
				'Stainless steel water bottle, keeps drinks cold for 24 hours',
			imageUrl:
				'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
			colors: ['Silver', 'Black', 'Blue', 'Pink'],
			capacity: '32oz',
			rating: 4.6,
			reviews: 178,
		},
		{
			id: 8,
			name: 'Notebook',
			price: 5,
			category: 'Office',
			available: true,
			description: 'High-quality notebook with lined pages',
			imageUrl:
				'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=400',
			colors: ['Black', 'Blue', 'Red'],
			pages: 100,
			rating: 4.1,
			reviews: 45,
		},
		{
			id: 9,
			name: 'Wireless Mouse',
			price: 25,
			category: 'Electronics',
			available: true,
			description: 'Ergonomic wireless mouse with precision tracking',
			imageUrl:
				'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
			colors: ['Black', 'White', 'Gray'],
			connectivity: 'Bluetooth/USB',
			rating: 4.3,
			reviews: 92,
		},
		{
			id: 10,
			name: 'Desk Lamp',
			price: 45,
			category: 'Home',
			available: true,
			description:
				'LED desk lamp with adjustable brightness and color temperature',
			imageUrl:
				'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
			colors: ['White', 'Black'],
			features: ['Touch Control', '3 Color Modes', 'USB Charging'],
			rating: 4.5,
			reviews: 134,
		},
	];

	public async executeAction(
		actionRequest: ActionRequest,
		userId: number
	): Promise<ActionResult> {
		const { action, parameters } = actionRequest;

		switch (action) {
			case 'BOOK_TICKET':
				return this.bookTicket(parameters, userId);

			case 'PURCHASE_ITEM':
				return this.purchaseItem(parameters, userId);

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

		const bookingId = Math.floor(Math.random() * 1000000);
		const totalPrice = ticket.price * quantity;

		return {
			success: true,
			message: `🎉 Woo-hoo! Your booking is confirmed!\n\n✅ ${quantity}x "${ticket.name}"\n💰 Total: $${totalPrice}\n🎫 Booking ID: #${bookingId}\n\nThanks for choosing us! 🎊`,
			data: {
				bookingId,
				ticket: ticket.name,
				quantity,
				totalPrice,
				userId,
			},
		};
	}

	private async purchaseItem(
		parameters: any,
		userId: number
	): Promise<ActionResult> {
		const { item, quantity = 1, category } = parameters;

		// Find the item
		let foundItem = this.shopItems.find(
			(i) =>
				i.name.toLowerCase().includes(item.toLowerCase()) ||
				item.toLowerCase().includes(i.name.toLowerCase())
		);

		// If category is specified, filter by category
		if (category && !foundItem) {
			foundItem = this.shopItems.find(
				(i) =>
					i.category.toLowerCase() === category.toLowerCase() &&
					(i.name.toLowerCase().includes(item.toLowerCase()) ||
						item.toLowerCase().includes(i.name.toLowerCase()))
			);
		}

		if (!foundItem) {
			return {
				success: false,
				message: `Oops! 😅 I couldn't find "${item}" in our shop. But we've got some awesome alternatives: ${this.shopItems.map((i) => i.name).join(', ')}`,
			};
		}

		if (!foundItem.available) {
			return {
				success: false,
				message: `Bummer! 😔 "${foundItem.name}" is out of stock right now. But don't worry, we've got plenty of other great items!`,
			};
		}

		const orderId = Math.floor(Math.random() * 1000000);
		const totalPrice = foundItem.price * quantity;
		const shippingCost = totalPrice > 50 ? 0 : 5;
		const finalTotal = totalPrice + shippingCost;

		return {
			success: true,
			message: `🎉 Woo-hoo! Your order is confirmed!\n\n✅ ${quantity}x "${foundItem.name}"\n💰 Total: $${finalTotal} (including $${shippingCost} shipping)\n🛍️ Order ID: #${orderId}\n\nThanks for shopping with us! 🛍️`,
			data: {
				orderId,
				item: foundItem.name,
				quantity,
				totalPrice,
				shippingCost,
				finalTotal,
				userId,
				// Rich data for UI building
				itemDetails: {
					id: foundItem.id,
					name: foundItem.name,
					price: foundItem.price,
					category: foundItem.category,
					description: foundItem.description,
					imageUrl: foundItem.imageUrl,
					colors: foundItem.colors,
					rating: foundItem.rating,
					reviews: foundItem.reviews,
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
				uiActions: [
					{
						type: 'button',
						text: 'View Order Details',
						action: 'view_order',
						orderId: orderId,
					},
					{
						type: 'button',
						text: 'Track Order',
						action: 'track_order',
						orderId: orderId,
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

		let results = this.shopItems.filter(
			(item) =>
				item.name.toLowerCase().includes(query.toLowerCase()) ||
				query.toLowerCase().includes(item.name.toLowerCase())
		);

		if (category) {
			results = results.filter(
				(item) => item.category.toLowerCase() === category.toLowerCase()
			);
		}

		if (results.length === 0) {
			return {
				success: false,
				message: `Hmm, I don't see "${query}" in our shop right now 😕 But we've got lots of other cool stuff! Check out: ${this.shopItems.map((i) => i.name).join(', ')}`,
			};
		}

		const itemList = results
			.map(
				(i) =>
					`• ${i.name} - $${i.price} (${i.category})${!i.available ? ' (Not available)' : ''}`
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
			const itemPrices = this.shopItems
				.map((i) => `• ${i.name}: $${i.price} (${i.category})`)
				.join('\n');
			return {
				success: true,
				message: `🛍️ Shop Item Prices:\n\n${itemPrices}`,
			};
		}

		const allPrices = `🎫 Tickets:\n${this.tickets.map((t) => `• ${t.name}: $${t.price}`).join('\n')}\n\n🛍️ Shop Items:\n${this.shopItems.map((i) => `• ${i.name}: $${i.price} (${i.category})`).join('\n')}`;

		return {
			success: true,
			message: `💰 All Prices:\n\n${allPrices}`,
		};
	}

	private async getRecommendations(parameters: any): Promise<ActionResult> {
		const { preference } = parameters;

		// Simple recommendation logic
		const recommendations = [];

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

		if (
			preference.toLowerCase().includes('electronic') ||
			preference.toLowerCase().includes('tech')
		) {
			recommendations.push(
				'🎧 Headphones ($80) - High-quality audio experience'
			);
			recommendations.push('💻 Laptop Stand ($35) - Improve your workspace');
		}

		if (
			preference.toLowerCase().includes('home') ||
			preference.toLowerCase().includes('decor')
		) {
			recommendations.push(
				'🏠 Desk Lamp ($45) - Perfect lighting for your space'
			);
			recommendations.push('☕ Coffee Mug ($8) - Start your day right');
		}

		if (recommendations.length === 0) {
			recommendations.push(
				'🎫 Movie Ticket - Avengers ($15) - Great entertainment value'
			);
			recommendations.push('👕 T-Shirt ($20) - Comfortable and stylish');
			recommendations.push('📱 Phone Case ($15) - Protect your device');
			recommendations.push('☕ Coffee Mug ($8) - Perfect for daily use');
		}

		return {
			success: true,
			message: `✨ Recommendations for you:\n\n${recommendations.join('\n')}`,
			data: { recommendations },
		};
	}
}

export default ActionHandler;
