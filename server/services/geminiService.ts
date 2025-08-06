import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

interface ActionRequest {
	action: string;
	parameters: any;
	confidence: number;
}

interface GeminiResponse {
	message: string;
	action?: ActionRequest;
}

class GeminiService {
	private genAI: GoogleGenAI;

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY is required in environment variables');
		}

		this.genAI = new GoogleGenAI({ apiKey });
		console.log('🤖 Gemini AI Service initialized');
	}

	private getSystemPrompt(): string {
		return `You are Shoq, a friendly and enthusiastic AI assistant for a platform that sells tickets and shop items. 

PERSONALITY:
- Be warm, friendly, and conversational
- Use emojis naturally and expressively
- Show enthusiasm about helping users
- Be casual and relatable, not robotic
- Ask follow-up questions to engage users
- Use contractions (I'm, you're, we've, etc.)
- Be helpful but also fun and engaging

AVAILABLE ACTIONS:
1. BOOK_TICKET - Book tickets for events
2. PURCHASE_ITEM - Buy shop items
3. SEARCH_TICKETS - Search for available tickets
4. SEARCH_ITEMS - Search for shop items
5. GET_PRICES - Get pricing information
6. GET_RECOMMENDATIONS - Get personalized recommendations
7. CHAT - General conversation

AVAILABLE TICKETS:
- Movie Ticket - Avengers ($15)
- Concert - Rock Band ($50)
- Theater - Hamlet ($30) - Not available
- Sports - Football Match ($25)
- Comedy Show ($20)
- Opera - La Traviata ($75)

AVAILABLE SHOP ITEMS:
- T-Shirt ($20, Clothing)
- Coffee Mug ($8, Home)
- Phone Case ($15, Electronics)
- Book - Programming Guide ($25, Books) - Not available
- Headphones ($80, Electronics)
- Laptop Stand ($35, Electronics)
- Water Bottle ($12, Home)
- Notebook ($5, Office)
- Wireless Mouse ($25, Electronics)
- Desk Lamp ($45, Home)

CONVERSATION STYLE:
- If someone asks about items, be excited to show them
- If they want to buy something, be helpful and encouraging
- If they're just chatting, be friendly and engaging
- Always try to understand their intent and be helpful
- Use natural language, not formal responses

EXAMPLES:
User: "do you have any tshirts"
Response: "Hey! 👕 Yes, we've got some awesome T-shirts! I have a really comfortable cotton T-shirt for $20. It's perfect for everyday wear and comes in great quality. Would you like me to show you the details or help you buy it?"

User: "I want to see a movie"
Response: "🎬 Oh, great choice! I love movies too! We've got the new Avengers movie available for $15 - it's going to be epic! 🚀 Would you like me to book that for you? It's one of our most popular tickets right now!"

User: "hi"
Response: "👋 Hey there! I'm Shoq, your friendly shopping and ticket assistant! 🎉 I can help you with tickets, shopping, or just chat. What would you like to do today?"

	RESPONSE FORMAT:
	You will respond with a structured JSON object. Always include a "message" field with your response.
	
	If the user wants to perform an action (buy, purchase, order, book, get, want, need, looking for, search, find), also include an "action" object with:
	- "action": The action type (PURCHASE_ITEM, BOOK_TICKET, SEARCH_ITEMS, SEARCH_TICKETS, GET_PRICES, GET_RECOMMENDATIONS)
	- "parameters": Object with relevant parameters (item, quantity, category, query, etc.)
	- "confidence": Number between 0 and 1 indicating confidence

	For casual conversation, greetings, or questions, only include the "message" field (action will be null).

	ACTION EXAMPLES:
	- User: "buy me a coffee cup" → Include action with PURCHASE_ITEM
	- User: "I want to order a t-shirt" → Include action with PURCHASE_ITEM  
	- User: "book me a movie ticket" → Include action with BOOK_TICKET
	- User: "search for headphones" → Include action with SEARCH_ITEMS

	CHAT EXAMPLES:
	- User: "hi" → Only message field with friendly greeting
	- User: "what can you do?" → Only message field explaining capabilities
	- User: "tell me about your items" → Only message field describing items`;
	}

	public async processMessage(
		userMessage: string,
		userId: number
	): Promise<GeminiResponse> {
		const maxRetries = 2;
		let lastError: any;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const prompt = `${this.getSystemPrompt()}

USER MESSAGE: "${userMessage}"

Please analyze the user's intent and respond appropriately. If they want to perform an action, include the action details. If they're just chatting, respond conversationally.`;

				// Use structured output with schema
				const response = await this.genAI.models.generateContent({
					model: 'gemini-2.5-flash',
					contents: prompt,
					config: {
						responseMimeType: 'application/json',
						responseSchema: {
							type: Type.OBJECT,
							properties: {
								message: {
									type: Type.STRING,
								},
								action: {
									type: Type.OBJECT,
									nullable: true,
									properties: {
										action: {
											type: Type.STRING,
										},
										parameters: {
											type: Type.OBJECT,
											properties: {
												item: { type: Type.STRING },
												quantity: { type: Type.NUMBER },
												category: { type: Type.STRING },
												query: { type: Type.STRING },
												type: { type: Type.STRING },
												preference: { type: Type.STRING },
											},
										},
										confidence: {
											type: Type.NUMBER,
										},
									},
									propertyOrdering: ['action', 'parameters', 'confidence'],
								},
							},
							propertyOrdering: ['message', 'action'],
						},
					},
				});

				const result = JSON.parse(response.text || '{}');
				console.log('🤖 Structured Response:', JSON.stringify(result, null, 2));

				// If there's an action, return it
				if (result.action) {
					console.log('🤖 Action detected:', result.action.action);
					return {
						message: result.message,
						action: result.action,
					};
				}

				// Otherwise, return just the message
				console.log('🤖 Chat response only');
				return {
					message: result.message,
				};
			} catch (error: any) {
				lastError = error;
				console.error(`Gemini API error (attempt ${attempt}):`, error);

				// If it's a service overload error and we have retries left, wait and try again
				if (
					(error.status === 503 || error.message?.includes('overloaded')) &&
					attempt < maxRetries
				) {
					console.log(`Service overloaded, retrying in ${attempt * 1000}ms...`);
					await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
					continue;
				}

				// If it's the last attempt or a different error, break and return fallback
				break;
			}
		}

		// If we get here, all retries failed
		console.error('All Gemini API attempts failed:', lastError);

		// Check if it's a service overload error
		if (
			lastError?.status === 503 ||
			lastError?.message?.includes('overloaded')
		) {
			return {
				message:
					"I'm a bit busy right now! 😅 But I can still help you with basic questions. Try asking me about tickets, shopping, or just say hello!",
			};
		}

		// Check if it's an API key or authentication error
		if (lastError?.status === 401 || lastError?.status === 403) {
			return {
				message:
					"I'm having trouble connecting to my brain right now! 🤖 But I can still help you with basic questions. What would you like to know?",
			};
		}

		// Generic error response
		return {
			message:
				"I'm having trouble understanding right now. Could you try rephrasing that or ask me something else? 😊",
		};
	}

	public generateInlineKeyboard(uiActions: any[]) {
		const rows = [];

		for (const action of uiActions) {
			rows.push([
				{
					text: action.text,
					callback_data: `${action.action}_${action.orderId || action.category || ''}`,
				},
			]);
		}

		return {
			reply_markup: {
				inline_keyboard: rows,
			},
		};
	}

	public async getRecommendations(userPreferences: string): Promise<string> {
		try {
			const prompt = `${this.getSystemPrompt()}

USER PREFERENCES: "${userPreferences}"

Based on these preferences, provide personalized recommendations for tickets and shop items. Be specific about why you're recommending each item.`;

			const response = await this.genAI.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: prompt,
			});
			return (
				response.text ||
				"I'm having trouble generating recommendations right now. Try browsing our tickets or shop items directly!"
			);
		} catch (error) {
			console.error('Gemini recommendations error:', error);
			return "I'm having trouble generating recommendations right now. Try browsing our tickets or shop items directly!";
		}
	}
}

export default GeminiService;
