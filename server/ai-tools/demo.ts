import { HederaAIAgent } from './hedera-agent.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Interactive demo of the Hedera AI Agent
 */
async function runDemo() {
	console.log('🤖 Hedera AI Agent Demo');
	console.log('=' .repeat(50));
	
	const agent = new HederaAIAgent();

	// Test queries
	const testQueries = [
		"Show me the network information",
		"Check balance of account 0.0.6494628",
		"Verify transaction 0.0.6494628@1754664574.369070408",
		"What's the status of 0.0.123456@1234567890.123456789?",
		"Is 0.0.6494628 a valid account?",
		"Format 1000000 USDC tokens",
		"Help me with Hedera operations"
	];

	console.log('🧪 Running test queries...\n');

	for (let i = 0; i < testQueries.length; i++) {
		const query = testQueries[i];
		console.log(`\n📝 Query ${i + 1}: "${query}"`);
		console.log('-'.repeat(60));

		try {
			const result = await agent.processQuery(query);
			
			console.log(`🔧 Tools Used: ${result.toolsUsed.join(', ') || 'None'}`);
			console.log(`📊 Results Count: ${result.results.length}`);
			console.log('\n📋 Response:');
			console.log(result.response);
			
			if (result.suggestions && result.suggestions.length > 0) {
				console.log('\n💡 Suggestions:');
				result.suggestions.forEach((suggestion, idx) => {
					console.log(`   ${idx + 1}. ${suggestion}`);
				});
			}

			// Show detailed tool results if any
			if (result.results.length > 0) {
				console.log('\n🔍 Detailed Tool Results:');
				result.results.forEach((toolResult, idx) => {
					console.log(`   ${idx + 1}. ${toolResult.toolName}: ${toolResult.success ? '✅' : '❌'}`);
					if (toolResult.data) {
						console.log(`      Data: ${JSON.stringify(toolResult.data, null, 6).substring(0, 100)}...`);
					}
				});
			}

		} catch (error) {
			console.error('❌ Error processing query:', error);
		}

		// Pause between queries
		if (i < testQueries.length - 1) {
			console.log('\n' + '='.repeat(50));
		}
	}

	// Show conversation history
	console.log('\n\n📚 Conversation History:');
	console.log('='.repeat(50));
	const history = agent.getHistory();
	history.forEach((entry, idx) => {
		console.log(`${idx + 1}. [${entry.role.toUpperCase()}] ${entry.content.substring(0, 80)}...`);
		if (entry.toolCall) {
			console.log(`   🔧 Tools: ${entry.toolCall.map((t: any) => t.name).join(', ')}`);
		}
	});

	// Show available tools
	console.log('\n\n🛠️ Available Tools:');
	console.log('='.repeat(50));
	const tools = agent.getAvailableTools();
	tools.forEach((tool, idx) => {
		console.log(`${idx + 1}. ${tool.name}`);
		console.log(`   Description: ${tool.description}`);
		console.log(`   Parameters: ${tool.parameters.join(', ')}`);
		console.log('');
	});

	console.log('\n🎉 Demo completed!');
	console.log('=' .repeat(50));
	console.log('💡 Key Features Demonstrated:');
	console.log('   ✅ Dynamic tool selection based on query analysis');
	console.log('   ✅ Batch tool execution');
	console.log('   ✅ Contextual response generation');
	console.log('   ✅ Conversation history tracking');
	console.log('   ✅ Smart suggestions');
	console.log('   ✅ Error handling and help responses');
}

/**
 * Interactive CLI mode
 */
async function interactiveMode() {
	console.log('🤖 Hedera AI Agent - Interactive Mode');
	console.log('Type "exit" to quit, "help" for commands, "history" for conversation history\n');

	const agent = new HederaAIAgent();
	
	// Mock readline for demo - in real implementation you'd use actual readline
	const mockQueries = [
		"Show network info",
		"Check balance 0.0.6494628",
		"help",
		"history",
		"exit"
	];

	for (const query of mockQueries) {
		console.log(`> ${query}`);
		
		if (query.toLowerCase() === 'exit') {
			console.log('👋 Goodbye!');
			break;
		}

		if (query.toLowerCase() === 'history') {
			const history = agent.getHistory();
			console.log('\n📚 Conversation History:');
			history.forEach((entry, idx) => {
				console.log(`${idx + 1}. [${entry.role.toUpperCase()}] ${entry.content.substring(0, 60)}...`);
			});
			console.log('');
			continue;
		}

		if (query.toLowerCase() === 'help') {
			const tools = agent.getAvailableTools();
			console.log('\n🛠️ Available Commands:');
			tools.forEach(tool => {
				console.log(`- ${tool.name}: ${tool.description.substring(0, 60)}...`);
			});
			console.log('- help: Show this help');
			console.log('- history: Show conversation history');
			console.log('- exit: Quit the program\n');
			continue;
		}

		try {
			const result = await agent.processQuery(query);
			console.log(result.response);
			
			if (result.suggestions && result.suggestions.length > 0) {
				console.log('\n💡 Try: ' + result.suggestions[0]);
			}
			
		} catch (error) {
			console.error('❌ Error:', error);
		}

		console.log('\n' + '-'.repeat(40) + '\n');
	}
}

// Run based on command line argument
const mode = process.argv[2] || 'demo';

if (mode === 'interactive' || mode === 'i') {
	interactiveMode()
		.then(() => process.exit(0))
		.catch(error => {
			console.error('Interactive mode failed:', error);
			process.exit(1);
		});
} else {
	runDemo()
		.then(() => {
			console.log('\n✅ Demo completed successfully!');
			console.log('💡 Run with "interactive" or "i" for interactive mode');
			process.exit(0);
		})
		.catch(error => {
			console.error('Demo failed:', error);
			process.exit(1);
		});
}