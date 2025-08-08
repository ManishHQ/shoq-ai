#!/usr/bin/env node

/**
 * MCP Server for Claude with Hedera Integration
 * Provides Claude with Hedera blockchain verification capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { HederaAITools } from '../ai-tools/hedera-tools.js';
import dotenv from 'dotenv';

dotenv.config();

class HederaMCPServer {
	private server: Server;
	private name = 'hedera-verification-server';
	private version = '0.1.0';

	constructor() {
		this.server = new Server(
			{
				name: this.name,
				version: this.version,
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.setupToolHandlers();
		this.setupErrorHandling();
	}

	private setupToolHandlers() {
		// List available tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const hederaTools = HederaAITools.getTools();
			
			return {
				tools: hederaTools.map((tool) => ({
					name: tool.name,
					description: tool.description,
					inputSchema: tool.parameters,
				})),
			};
		});

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				// Validate tool exists
				const tool = HederaAITools.getTool(name);
				if (!tool) {
					throw new McpError(
						ErrorCode.MethodNotFound,
						`Unknown tool: ${name}`
					);
				}

				// Validate parameters
				const validation = HederaAITools.validateParameters(name, args || {});
				if (!validation.valid) {
					throw new McpError(
						ErrorCode.InvalidParams,
						`Invalid parameters: ${validation.errors?.join(', ')}`
					);
				}

				// Execute the tool
				const result = await HederaAITools.execute({
					name,
					parameters: args || {},
				});

				// Format response for Claude
				if (result.success) {
					return {
						content: [
							{
								type: 'text',
								text: this.formatSuccessResponse(name, result),
							},
						],
					};
				} else {
					return {
						content: [
							{
								type: 'text',
								text: this.formatErrorResponse(name, result),
							},
						],
						isError: true,
					};
				}
			} catch (error) {
				if (error instanceof McpError) {
					throw error;
				}

				throw new McpError(
					ErrorCode.InternalError,
					`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		});
	}

	private formatSuccessResponse(toolName: string, result: any): string {
		let response = `✅ **${toolName.replace(/_/g, ' ').toUpperCase()} - SUCCESS**\n\n`;
		response += `${result.message}\n\n`;

		if (result.data) {
			response += `📊 **Details:**\n`;

			// Format specific data based on tool type
			if (toolName === 'verify_hedera_transaction') {
				response += `💰 Amount: ${result.data.amount} USDC\n`;
				response += `👤 From: ${result.data.sender}\n`;
				response += `🏛️ To: ${result.data.receiver}\n`;
				response += `⏰ Timestamp: ${result.data.timestamp}\n`;
				response += `🔗 Hashscan: ${result.data.hashscanUrl}\n`;
				response += `📅 Recent: ${result.data.isRecent ? 'Yes' : 'No'}\n`;
			} else if (toolName === 'check_hedera_balance') {
				response += `💎 HBAR: ${result.data.hbarBalance} tinybars\n`;
				response += `💰 USDC: ${result.data.usdcBalance} USDC\n`;
				response += `🪙 Total Tokens: ${result.data.totalTokens}\n`;
				response += `🔍 Account: ${result.data.accountId}\n`;
			} else if (toolName === 'get_hedera_transaction_status') {
				response += `📊 Status: ${result.data.status}\n`;
				response += `⏰ Timestamp: ${result.data.timestamp}\n`;
				response += `🔗 Hashscan: ${result.data.hashscanUrl}\n`;
				response += `✅ Success: ${result.data.isSuccess ? 'Yes' : 'No'}\n`;
			} else if (toolName === 'get_hedera_network_info') {
				response += `🌐 Network: ${result.data.network}\n`;
				response += `🔗 Mirror Node: ${result.data.mirrorNodeUrl}\n`;
				response += `🪙 USDC Token: ${result.data.expectedTokenId}\n`;
				response += `🏛️ Treasury: ${result.data.treasuryAccount}\n`;
				response += `🚀 Features: ${result.data.features.join(', ')}\n`;
			} else if (toolName === 'validate_hedera_account') {
				response += `🔍 Account: ${result.data.accountId}\n`;
				response += `✅ Valid: ${result.data.isValid ? 'Yes' : 'No'}\n`;
				response += `📝 Format: ${result.data.format}\n`;
				response += `📋 Expected: ${result.data.expectedFormat}\n`;
			} else if (toolName === 'format_hedera_amount') {
				response += `🔢 Raw Amount: ${result.data.rawAmount}\n`;
				response += `✨ Formatted: ${result.data.formattedAmount}\n`;
				response += `📊 Decimals: ${result.data.decimals}\n`;
				response += `🪙 Unit: ${result.data.unit}\n`;
			}
		}

		return response;
	}

	private formatErrorResponse(toolName: string, result: any): string {
		let response = `❌ **${toolName.replace(/_/g, ' ').toUpperCase()} - FAILED**\n\n`;
		response += `${result.message}\n\n`;

		if (result.error) {
			response += `🔍 **Error Details:**\n`;
			response += `${result.error}\n\n`;
		}

		response += `💡 **Troubleshooting:**\n`;
		
		if (toolName.includes('transaction')) {
			response += `• Check transaction ID format: 0.0.123@456.789\n`;
			response += `• Verify transaction exists on network\n`;
			response += `• Ensure transaction is confirmed\n`;
		} else if (toolName.includes('balance')) {
			response += `• Check account ID format: 0.0.123456\n`;
			response += `• Verify account exists on network\n`;
			response += `• Check network connectivity\n`;
		} else if (toolName.includes('network')) {
			response += `• Check environment variables\n`;
			response += `• Verify network connectivity\n`;
			response += `• Try again in a moment\n`;
		}

		return response;
	}

	private setupErrorHandling() {
		this.server.onerror = (error) => {
			console.error('[MCP Error]', error);
		};

		process.on('SIGINT', async () => {
			await this.server.close();
			process.exit(0);
		});
	}

	async start() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error(`Hedera MCP Server ${this.version} running`);
		console.error('Available tools:', HederaAITools.getTools().map(t => t.name).join(', '));
	}
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
	const server = new HederaMCPServer();
	server.start().catch((error) => {
		console.error('Failed to start MCP server:', error);
		process.exit(1);
	});
}

export { HederaMCPServer };