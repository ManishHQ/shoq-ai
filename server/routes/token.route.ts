import express from 'express';
import {
	createUSDCToken,
	createToken,
	createNFTToken,
	associateTokenWithAccount,
	dissociateTokenFromAccount,
} from '../controllers/token.controller.js';

const router = express.Router();

// Create a mock USDC token
router.post('/create-usdc', createUSDCToken);

// Create a custom fungible token
router.post('/create', createToken);

// Create an NFT token
router.post('/create-nft', createNFTToken);

// Associate token with account
router.post('/associate', associateTokenWithAccount);

// Dissociate token from account
router.post('/dissociate', dissociateTokenFromAccount);

export default router;
