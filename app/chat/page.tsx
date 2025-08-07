'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '../shop/page';
import ChatMessage from './components/ChatMessage';
import ProductCard from './components/ProductCard';
import MessageInput from './components/MessageInput';

export interface Message {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	products?: Product[];
}

export default function ChatPage() {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			type: 'assistant',
			content:
				"👋 Hello! I'm Shoq, your AI shopping assistant! 🛍️ I'm powered by advanced AI and can help you find products, get recommendations, and even make purchases. Try asking me things like 'show me headphones' or 'I need something for my home office'. What are you looking for today?",
			timestamp: new Date(),
		},
	]);
	const [loading, setLoading] = useState(false);
	const [products, setProducts] = useState<Product[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetchProducts();
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const fetchProducts = async () => {
		try {
			const response = await fetch('http://localhost:8000/shop');
			const data = await response.json();

			if (data.status === 'success') {
				setProducts(data.data.items);
			}
		} catch (error) {
			console.error('Error fetching products:', error);
		}
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const searchProducts = (query: string): Product[] => {
		if (!query.trim()) return [];

		const searchTerms = query.toLowerCase().split(' ');

		return products.filter((product) => {
			const searchableText =
				`${product.name} ${product.description} ${product.category}`.toLowerCase();
			return searchTerms.some((term) => searchableText.includes(term));
		});
	};

	const generateAssistantResponse = (
		userMessage: string
	): { content: string; products?: Product[] } => {
		const query = userMessage.toLowerCase();

		// Greeting responses
		if (
			query.includes('hello') ||
			query.includes('hi') ||
			query.includes('hey')
		) {
			return {
				content:
					"Hello! Welcome to our shop. I'm here to help you find the perfect products. You can ask me about specific items, browse by category, or let me know what you're looking for!",
			};
		}

		// Product search responses
		if (
			query.includes('show') ||
			query.includes('find') ||
			query.includes('search') ||
			query.includes('looking for')
		) {
			const foundProducts = searchProducts(userMessage);

			if (foundProducts.length > 0) {
				return {
					content: `I found ${foundProducts.length} product${
						foundProducts.length > 1 ? 's' : ''
					} that might interest you:`,
					products: foundProducts.slice(0, 6), // Limit to 6 products
				};
			} else {
				return {
					content:
						"I couldn't find any products matching your search. Try searching for categories like 'electronics', 'clothing', 'home', or specific items like 'headphones', 't-shirt', etc.",
				};
			}
		}

		// Category-specific responses
		if (query.includes('electronics')) {
			const electronics = products.filter(
				(p) => p.category.toLowerCase() === 'electronics'
			);
			return {
				content: 'Here are our electronics products:',
				products: electronics,
			};
		}

		if (query.includes('clothing')) {
			const clothing = products.filter(
				(p) => p.category.toLowerCase() === 'clothing'
			);
			return {
				content: 'Here are our clothing items:',
				products: clothing,
			};
		}

		if (query.includes('home')) {
			const home = products.filter((p) => p.category.toLowerCase() === 'home');
			return {
				content: 'Here are our home products:',
				products: home,
			};
		}

		if (query.includes('books')) {
			const books = products.filter(
				(p) => p.category.toLowerCase() === 'books'
			);
			return {
				content: 'Here are our books:',
				products: books,
			};
		}

		if (query.includes('office')) {
			const office = products.filter(
				(p) => p.category.toLowerCase() === 'office'
			);
			return {
				content: 'Here are our office supplies:',
				products: office,
			};
		}

		// Price-related responses
		if (
			query.includes('cheap') ||
			query.includes('affordable') ||
			query.includes('budget')
		) {
			const affordableProducts = products.filter(
				(p) => p.price <= 20 && p.available
			);
			return {
				content: 'Here are our most affordable products (under $20):',
				products: affordableProducts,
			};
		}

		if (query.includes('expensive') || query.includes('premium')) {
			const premiumProducts = products.filter(
				(p) => p.price >= 50 && p.available
			);
			return {
				content: 'Here are our premium products ($50 and above):',
				products: premiumProducts,
			};
		}

		// Show all products
		if (
			query.includes('all products') ||
			query.includes('everything') ||
			query.includes('catalog')
		) {
			return {
				content: "Here's our complete product catalog:",
				products: products.filter((p) => p.available),
			};
		}

		// Help responses
		if (query.includes('help')) {
			return {
				content:
					"I can help you with:\n• Finding specific products\n• Browsing by category (electronics, clothing, home, books, office)\n• Finding products in your budget\n• Getting product information\n• Making purchases\n\nJust ask me what you're looking for!",
			};
		}

		// Default response with product suggestions
		const matchingProducts = searchProducts(userMessage);
		if (matchingProducts.length > 0) {
			return {
				content: `Based on your message, you might be interested in these products:`,
				products: matchingProducts.slice(0, 4),
			};
		}

		return {
			content:
				"I'd be happy to help you find products! You can ask me to show you items by category (electronics, clothing, home), search for specific products, or tell me what you're looking for. What interests you today?",
		};
	};

	const handleSendMessage = async (content: string) => {
		if (!content.trim()) return;

		// Add user message
		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: content.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setLoading(true);

		try {
			// Send message to backend chat API
			const response = await fetch('http://localhost:8000/chat/message', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: content.trim(),
					sessionId: 'web-chat'
				}),
			});

			const data = await response.json();
			
			if (data.status === 'success' && data.data.message) {
				const assistantMessage: Message = {
					id: data.data.message.id || (Date.now() + 1).toString(),
					type: 'assistant',
					content: data.data.message.content,
					timestamp: new Date(data.data.message.timestamp),
					products: data.data.message.products,
				};

				setMessages((prev) => [...prev, assistantMessage]);
			} else {
				// Fallback to local response
				const fallbackResponse = generateAssistantResponse(content);
				const assistantMessage: Message = {
					id: (Date.now() + 1).toString(),
					type: 'assistant',
					content: fallbackResponse.content,
					timestamp: new Date(),
					products: fallbackResponse.products,
				};

				setMessages((prev) => [...prev, assistantMessage]);
			}
		} catch (error) {
			console.error('Error sending message to backend:', error);
			
			// Fallback to local response on network error
			const fallbackResponse = generateAssistantResponse(content);
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: 'assistant',
				content: fallbackResponse.content,
				timestamp: new Date(),
				products: fallbackResponse.products,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gray-50 flex flex-col'>
			{/* Header */}
			<div className='bg-white shadow-sm border-b'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center'>
						<div className='flex-shrink-0'>
							<div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center'>
								<span className='text-white font-bold'>🤖</span>
							</div>
						</div>
						<div className='ml-4'>
							<h1 className='text-xl font-semibold text-gray-900'>
								Shoq AI Assistant
							</h1>
							<p className='text-sm text-gray-500'>
								AI-powered shopping help • Product recommendations • Smart search
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Chat Messages */}
			<div className='flex-1 overflow-y-auto'>
				<div className='container mx-auto px-4 py-6 max-w-4xl'>
					<div className='space-y-6'>
						{messages.map((message) => (
							<div key={message.id}>
								<ChatMessage message={message} />
								{message.products && message.products.length > 0 && (
									<div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
										{message.products.map((product) => (
											<ProductCard key={product.id} product={product} />
										))}
									</div>
								)}
							</div>
						))}

						{loading && (
							<div className='flex justify-start'>
								<div className='bg-white rounded-lg px-4 py-3 shadow-sm border max-w-xs'>
									<div className='flex items-center space-x-2'>
										<div className='flex space-x-1'>
											<div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
											<div
												className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
												style={{ animationDelay: '0.1s' }}
											></div>
											<div
												className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
												style={{ animationDelay: '0.2s' }}
											></div>
										</div>
										<span className='text-sm text-gray-500'>Thinking...</span>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>
				</div>
			</div>

			{/* Message Input */}
			<MessageInput onSendMessage={handleSendMessage} disabled={loading} />
		</div>
	);
}
