import express from 'express';
import {
  transferUSDC,
  getBalance,
  getMultipleBalances,
  checkSufficientBalance,
  getTransactionDetails
} from '../controllers/usdc.controller.js';

const router = express.Router();

// Transfer USDC tokens
router.post('/transfer', transferUSDC);

// Get balance for a specific account
router.get('/balance/:accountId', getBalance);

// Get balances for multiple accounts
router.post('/balances', getMultipleBalances);

// Check if account has sufficient balance
router.post('/check-balance', checkSufficientBalance);

// Get transaction details
router.get('/transaction/:transactionId', getTransactionDetails);

export default router; 