// API Configuration
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
	SHOP: `${API_BASE_URL}/shop`,
	CHAT: `${API_BASE_URL}/chat`,
	ORDERS: `${API_BASE_URL}/api/orders`,
	AUTH: `${API_BASE_URL}/auth`,
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, path?: string) => {
	return path
		? `${API_BASE_URL}${endpoint}${path}`
		: `${API_BASE_URL}${endpoint}`;
};
