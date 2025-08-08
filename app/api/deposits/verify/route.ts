import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../server/utils/connectDB.js';
import { depositService } from '../../../../server/services/depositService.js';

export async function POST(request: NextRequest) {
	try {
		connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoq');

		const body = await request.json();
		const { chatId, walletAddress, email, txHash, expectedAmount } = body;

		// Validate required fields
		if (!txHash) {
			return NextResponse.json(
				{ success: false, message: 'Transaction hash is required' },
				{ status: 400 }
			);
		}

		if (!chatId && !walletAddress && !email) {
			return NextResponse.json(
				{ 
					success: false, 
					message: 'At least one identifier (chatId, walletAddress, or email) is required' 
				},
				{ status: 400 }
			);
		}

		// Verify the deposit
		const result = await depositService.verifyDeposit({
			chatId: chatId ? parseInt(chatId) : undefined,
			walletAddress,
			email,
			txHash,
			expectedAmount: expectedAmount ? parseFloat(expectedAmount) : undefined
		});

		if (result.success) {
			return NextResponse.json(result, { status: 200 });
		} else {
			return NextResponse.json(result, { status: 400 });
		}

	} catch (error) {
		console.error('Deposit verification API error:', error);
		return NextResponse.json(
			{ 
				success: false, 
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoq');

		const { searchParams } = new URL(request.url);
		const chatId = searchParams.get('chatId');

		if (!chatId) {
			return NextResponse.json(
				{ success: false, message: 'Chat ID is required' },
				{ status: 400 }
			);
		}

		const deposits = await depositService.getDepositHistory(parseInt(chatId));
		const totalDeposits = await depositService.getTotalDeposits(parseInt(chatId));

		return NextResponse.json({
			success: true,
			deposits,
			totalDeposits
		});

	} catch (error) {
		console.error('Deposit history API error:', error);
		return NextResponse.json(
			{ 
				success: false, 
				message: 'Internal server error',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}