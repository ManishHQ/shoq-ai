// Simple bot token validation script
const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔍 Debugging Telegram Bot Token...');
console.log('📱 Token (first 10 chars):', token ? token.substring(0, 10) : 'NOT_FOUND');
console.log('📏 Token length:', token ? token.length : 0);

if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ Bot token is missing or using placeholder value');
    console.log('💡 Please check your .env file');
    process.exit(1);
}

// Test bot info API call
const url = `https://api.telegram.org/bot${token}/getMe`;

console.log('🌐 Testing bot token with Telegram API...');

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (response.ok) {
                console.log('✅ Bot token is valid!');
                console.log('🤖 Bot info:', {
                    id: response.result.id,
                    username: response.result.username,
                    first_name: response.result.first_name
                });
                console.log('🎉 Your bot should work fine now!');
            } else {
                console.log('❌ Bot token validation failed:', response);
                console.log('💡 Please check your bot token in BotFather');
            }
        } catch (error) {
            console.log('❌ Error parsing response:', error);
        }
    });
}).on('error', (error) => {
    console.log('❌ Network error:', error);
});