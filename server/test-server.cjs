// Simple test script to verify server endpoints
const http = require('http');

const testEndpoints = async () => {
	const baseUrl = 'http://localhost:8000';

	console.log('🧪 Testing server endpoints...\n');

	// Test root endpoint
	try {
		const response = await makeRequest(`${baseUrl}/`);
		console.log('✅ Root endpoint:', response.message);
	} catch (error) {
		console.log('❌ Root endpoint failed:', error.message);
	}

	// Test tickets endpoint
	try {
		const response = await makeRequest(`${baseUrl}/tickets`);
		console.log('✅ Tickets endpoint:', `${response.data.total} tickets found`);
	} catch (error) {
		console.log('❌ Tickets endpoint failed:', error.message);
	}

	// Test shop endpoint
	try {
		const response = await makeRequest(`${baseUrl}/shop`);
		console.log('✅ Shop endpoint:', `${response.data.total} items found`);
	} catch (error) {
		console.log('❌ Shop endpoint failed:', error.message);
	}

	// Test ticket categories
	try {
		const response = await makeRequest(`${baseUrl}/tickets/categories`);
		console.log(
			'✅ Ticket categories:',
			`${response.data.categories.length} categories found`
		);
	} catch (error) {
		console.log('❌ Ticket categories failed:', error.message);
	}

	// Test shop categories
	try {
		const response = await makeRequest(`${baseUrl}/shop/categories`);
		console.log(
			'✅ Shop categories:',
			`${response.data.categories.length} categories found`
		);
	} catch (error) {
		console.log('❌ Shop categories failed:', error.message);
	}

	// Test featured items
	try {
		const response = await makeRequest(`${baseUrl}/shop/featured`);
		console.log(
			'✅ Featured items:',
			`${response.data.total} featured items found`
		);
	} catch (error) {
		console.log('❌ Featured items failed:', error.message);
	}

	console.log('\n🎉 Server test completed!');
};

const makeRequest = (url) => {
	return new Promise((resolve, reject) => {
		const req = http.get(url, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				try {
					const jsonData = JSON.parse(data);
					resolve(jsonData);
				} catch (error) {
					reject(new Error('Invalid JSON response'));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.setTimeout(5000, () => {
			req.destroy();
			reject(new Error('Request timeout'));
		});
	});
};

// Run tests if this file is executed directly
if (require.main === module) {
	testEndpoints();
}

module.exports = { testEndpoints };
