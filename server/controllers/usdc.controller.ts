import { Request, Response } from 'express';
import { usdcService, TransferRequest } from '../services/usdcService.js';
import catchAsync from '../utils/catchAsync.js';

export const transferUSDC = catchAsync(async (req: Request, res: Response) => {
  const { fromAccountId, toAccountId, amount, tokenId, memo } = req.body;

  // Validate required fields
  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'fromAccountId, toAccountId, and amount are required'
    });
  }

  // Validate amount is positive
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  const transferRequest: TransferRequest = {
    fromAccountId,
    toAccountId,
    amount,
    tokenId,
    memo
  };

  const result = await usdcService.transferTokens(transferRequest);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: 'USDC transfer successful',
      data: {
        transactionId: result.transactionId,
        receipt: result.receipt
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'USDC transfer failed',
      error: result.error
    });
  }
});

export const getBalance = catchAsync(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { tokenId } = req.query;

  if (!accountId) {
    return res.status(400).json({
      success: false,
      message: 'Account ID is required'
    });
  }

  const balance = await usdcService.getBalance(accountId, tokenId as string);

  if (balance) {
    res.status(200).json({
      success: true,
      data: balance
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Account not found or error occurred'
    });
  }
});

export const getMultipleBalances = catchAsync(async (req: Request, res: Response) => {
  const { accountIds, tokenId } = req.body;

  if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'accountIds array is required and must not be empty'
    });
  }

  const balances = await usdcService.getMultipleBalances(accountIds, tokenId);

  res.status(200).json({
    success: true,
    data: balances
  });
});

export const checkSufficientBalance = catchAsync(async (req: Request, res: Response) => {
  const { accountId, requiredAmount, tokenId } = req.body;

  if (!accountId || !requiredAmount) {
    return res.status(400).json({
      success: false,
      message: 'accountId and requiredAmount are required'
    });
  }

  if (requiredAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'requiredAmount must be greater than 0'
    });
  }

  const hasSufficient = await usdcService.hasSufficientBalance(accountId, requiredAmount, tokenId);

  res.status(200).json({
    success: true,
    data: {
      accountId,
      requiredAmount,
      hasSufficientBalance: hasSufficient
    }
  });
});

export const getTransactionDetails = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required'
    });
  }

  try {
    const details = await usdcService.getTransactionDetails(transactionId);
    
    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found or error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}); 