import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const orderId = params.id;

		if (!orderId) {
			return NextResponse.json(
				{
					success: false,
					message: 'Order ID is required',
				},
				{ status: 400 }
			);
		}

		// Fetch order from the server
		const serverUrl = process.env.SERVER_URL || 'http://localhost:8000';
		const response = await fetch(`${serverUrl}/api/orders/${orderId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				return NextResponse.json(
					{
						success: false,
						message: 'Order not found',
					},
					{ status: 404 }
				);
			}
			throw new Error(`Server responded with ${response.status}`);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching order:', error);
		return NextResponse.json(
			{
				success: false,
				message: 'Failed to fetch order',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
