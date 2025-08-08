import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status');
		const search = searchParams.get('search');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') || 'desc';

		// Build query parameters
		const queryParams = new URLSearchParams();
		if (status && status !== 'all') queryParams.append('status', status);
		if (search) queryParams.append('search', search);
		if (sortBy) queryParams.append('sortBy', sortBy);
		if (sortOrder) queryParams.append('sortOrder', sortOrder);

		// Fetch orders from the server
		const serverUrl = process.env.SERVER_URL || 'http://localhost:8000';
		const response = await fetch(
			`${serverUrl}/api/orders?${queryParams.toString()}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Server responded with ${response.status}`);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching orders:', error);
		return NextResponse.json(
			{
				success: false,
				message: 'Failed to fetch orders',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
