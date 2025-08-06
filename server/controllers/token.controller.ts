import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.js';
import {
	createMockUSDC,
	createCustomToken,
	createNFT,
	associateToken,
	dissociateToken,
} from '../utils/hederaToken.js';
import { Client, AccountId, TokenId } from '@hashgraph/sdk';

// Helper function to get Hedera client
const getClient = async (): Promise<Client> => {
	if (!process.env.OPERATOR_ADDRESS || !process.env.OPERATOR_KEY) {
		throw new Error(
			'OPERATOR_ADDRESS and OPERATOR_KEY must be set in environment variables'
		);
	}

	const { Client, AccountId, PrivateKey } = await import('@hashgraph/sdk');

	const client = Client.forTestnet();
	const accountId = await AccountId.fromEvmAddress(
		0,
		0,
		process.env.OPERATOR_ADDRESS
	).populateAccountNum(client);
	const privateKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

	client.setOperator(accountId, privateKey);
	return client;
};

export const createUSDCToken = catchAsync(
	async (req: Request, res: Response) => {
		try {
			const client = await getClient();
			const tokenId = await createMockUSDC(client);

			res.status(201).json({
				success: true,
				message: 'Mock USDC token created successfully',
				data: {
					tokenId: tokenId.toString(),
					name: 'Mock USDC',
					symbol: 'USDC',
					decimals: 6,
					initialSupply: 1000000,
				},
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Failed to create USDC token',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);

export const createToken = catchAsync(async (req: Request, res: Response) => {
	const { name, symbol, initialSupply, decimals, memo } = req.body;

	// Validate required fields
	if (!name || !symbol || !initialSupply) {
		return res.status(400).json({
			success: false,
			message: 'name, symbol, and initialSupply are required',
		});
	}

	if (initialSupply <= 0) {
		return res.status(400).json({
			success: false,
			message: 'initialSupply must be greater than 0',
		});
	}

	try {
		const client = await getClient();
		const tokenId = await createCustomToken(
			client,
			name,
			symbol,
			initialSupply,
			decimals || 0,
			memo
		);

		res.status(201).json({
			success: true,
			message: 'Token created successfully',
			data: {
				tokenId: tokenId.toString(),
				name,
				symbol,
				decimals: decimals || 0,
				initialSupply,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to create token',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export const createNFTToken = catchAsync(
	async (req: Request, res: Response) => {
		const { name, symbol, memo } = req.body;

		// Validate required fields
		if (!name || !symbol) {
			return res.status(400).json({
				success: false,
				message: 'name and symbol are required',
			});
		}

		try {
			const client = await getClient();
			const tokenId = await createNFT(client, name, symbol, memo);

			res.status(201).json({
				success: true,
				message: 'NFT token created successfully',
				data: {
					tokenId: tokenId.toString(),
					name,
					symbol,
					type: 'NonFungibleUnique',
				},
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Failed to create NFT token',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);

export const associateTokenWithAccount = catchAsync(
	async (req: Request, res: Response) => {
		const { tokenId, accountId } = req.body;

		// Validate required fields
		if (!tokenId || !accountId) {
			return res.status(400).json({
				success: false,
				message: 'tokenId and accountId are required',
			});
		}

		try {
			const client = await getClient();
			const { TokenId, AccountId } = await import('@hashgraph/sdk');

			await associateToken(
				client,
				TokenId.fromString(tokenId),
				AccountId.fromString(accountId)
			);

			res.status(200).json({
				success: true,
				message: 'Token associated with account successfully',
				data: {
					tokenId,
					accountId,
				},
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Failed to associate token with account',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);

export const dissociateTokenFromAccount = catchAsync(
	async (req: Request, res: Response) => {
		const { tokenId, accountId } = req.body;

		// Validate required fields
		if (!tokenId || !accountId) {
			return res.status(400).json({
				success: false,
				message: 'tokenId and accountId are required',
			});
		}

		try {
			const client = await getClient();
			const { TokenId, AccountId } = await import('@hashgraph/sdk');

			await dissociateToken(
				client,
				TokenId.fromString(tokenId),
				AccountId.fromString(accountId)
			);

			res.status(200).json({
				success: true,
				message: 'Token dissociated from account successfully',
				data: {
					tokenId,
					accountId,
				},
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Failed to dissociate token from account',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);
