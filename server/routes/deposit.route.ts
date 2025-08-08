import express, { Request, Response } from 'express';
import { depositService } from '../services/depositService.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// POST /api/deposits/verify
router.post('/verify', catchAsync(async (req: Request, res: Response) => {
    const { chatId, walletAddress, email, txHash, expectedAmount } = req.body;

    // Validate required fields
    if (!txHash) {
        return res.status(400).json({
            success: false,
            message: '❌ Transaction hash is required'
        });
    }

    if (!chatId && !walletAddress && !email) {
        return res.status(400).json({
            success: false,
            message: '❌ At least one identifier (chatId, walletAddress, or email) is required'
        });
    }

    // Verify the deposit
    const result = await depositService.verifyDeposit({
        chatId: chatId ? parseInt(chatId) : undefined,
        walletAddress,
        email,
        txHash,
        expectedAmount: expectedAmount ? parseFloat(expectedAmount) : undefined
    });

    res.status(result.success ? 200 : 400).json(result);
}));

// GET /api/deposits/history/:chatId
router.get('/history/:chatId', catchAsync(async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.chatId);

    if (isNaN(chatId)) {
        return res.status(400).json({
            success: false,
            message: '❌ Invalid chat ID'
        });
    }

    const deposits = await depositService.getDepositHistory(chatId);
    const totalDeposits = await depositService.getTotalDeposits(chatId);

    res.json({
        success: true,
        deposits,
        totalDeposits
    });
}));

// GET /api/deposits/status/:txHash
router.get('/status/:txHash', catchAsync(async (req: Request, res: Response) => {
    const { txHash } = req.params;
    
    const { hederaVerificationService } = await import('../services/hederaVerificationService.js');
    const status = await hederaVerificationService.getTransactionStatus(txHash);
    
    res.json(status);
}));

export default router;