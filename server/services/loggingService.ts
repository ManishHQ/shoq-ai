interface LogEntry {
	timestamp: string;
	type: 'message' | 'voice' | 'image' | 'action' | 'response' | 'error';
	userId: number;
	chatId: number;
	data: any;
	metadata?: any;
}

class LoggingService {
	private logs: LogEntry[] = [];
	private maxLogs = 1000; // Keep last 1000 logs

	public logMessage(
		type: LogEntry['type'],
		userId: number,
		chatId: number,
		data: any,
		metadata?: any
	) {
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			type,
			userId,
			chatId,
			data,
			metadata,
		};

		this.logs.push(logEntry);

		// Keep only the last maxLogs entries
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Console output with emojis for easy reading
		const emoji = this.getEmojiForType(type);
		console.log(`${emoji} === ${type.toUpperCase()} LOG ===`);
		console.log(`${emoji} Timestamp:`, logEntry.timestamp);
		console.log(`${emoji} User ID:`, userId);
		console.log(`${emoji} Chat ID:`, chatId);
		console.log(`${emoji} Data:`, JSON.stringify(data, null, 2));
		if (metadata) {
			console.log(`${emoji} Metadata:`, JSON.stringify(metadata, null, 2));
		}
		console.log(`${emoji} ========================\n`);
	}

	private getEmojiForType(type: LogEntry['type']): string {
		switch (type) {
			case 'message':
				return '💬';
			case 'voice':
				return '🎤';
			case 'image':
				return '📸';
			case 'action':
				return '⚡';
			case 'response':
				return '✅';
			case 'error':
				return '❌';
			default:
				return '📝';
		}
	}

	// Get logs for a specific user
	public getUserLogs(userId: number, limit: number = 50): LogEntry[] {
		return this.logs.filter((log) => log.userId === userId).slice(-limit);
	}

	// Get logs for a specific chat
	public getChatLogs(chatId: number, limit: number = 50): LogEntry[] {
		return this.logs.filter((log) => log.chatId === chatId).slice(-limit);
	}

	// Get logs by type
	public getLogsByType(type: LogEntry['type'], limit: number = 50): LogEntry[] {
		return this.logs.filter((log) => log.type === type).slice(-limit);
	}

	// Get all logs (for debugging)
	public getAllLogs(limit: number = 100): LogEntry[] {
		return this.logs.slice(-limit);
	}

	// Clear logs
	public clearLogs(): void {
		this.logs = [];
		console.log('🧹 Logs cleared');
	}

	// Export logs for analysis
	public exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	// Voice message analysis (future feature)
	public analyzeVoiceMessage(voiceData: any, userId: number, chatId: number) {
		console.log('🎤 === VOICE MESSAGE ANALYSIS ===');
		console.log('🎤 File ID:', voiceData.file_id);
		console.log('🎤 Duration:', voiceData.duration, 'seconds');
		console.log('🎤 File Size:', voiceData.file_size, 'bytes');
		console.log('🎤 MIME Type:', voiceData.mime_type);

		// Future: Add transcription service integration here
		// Example: Google Speech-to-Text, OpenAI Whisper, etc.

		this.logMessage('voice', userId, chatId, voiceData, {
			analysis: 'voice_message_received',
			transcription_status: 'pending_implementation',
		});
	}

	// Image analysis (future feature)
	public analyzeImage(imageData: any[], userId: number, chatId: number) {
		console.log('📸 === IMAGE ANALYSIS ===');
		console.log('📸 Number of images:', imageData.length);

		imageData.forEach((photo, index) => {
			console.log(`📸 Image ${index + 1}:`);
			console.log(`📸 File ID:`, photo.file_id);
			console.log(`📸 Dimensions:`, `${photo.width}x${photo.height}`);
			console.log(`📸 File Size:`, photo.file_size, 'bytes');
		});

		// Future: Add image recognition service integration here
		// Example: Google Vision API, Azure Computer Vision, etc.

		this.logMessage('image', userId, chatId, imageData, {
			analysis: 'image_received',
			recognition_status: 'pending_implementation',
		});
	}

	// Action tracking for UI building
	public trackAction(actionData: any, userId: number, chatId: number) {
		console.log('⚡ === ACTION TRACKING ===');
		console.log('⚡ Action:', actionData.action);
		console.log('⚡ Parameters:', actionData.parameters);
		console.log('⚡ Confidence:', actionData.confidence);

		this.logMessage('action', userId, chatId, actionData, {
			tracking: 'action_executed',
			ui_ready: true,
		});
	}

	// Response tracking for UI building
	public trackResponse(responseData: any, userId: number, chatId: number) {
		console.log('✅ === RESPONSE TRACKING ===');
		console.log('✅ Success:', responseData.success);
		console.log('✅ Message:', responseData.message);
		console.log('✅ Data:', responseData.data);

		this.logMessage('response', userId, chatId, responseData, {
			tracking: 'response_sent',
			ui_ready: true,
		});
	}
}

export default LoggingService;
