import { Router, Request, Response } from 'express';
import LoggingService from '../services/loggingService.js';

const router = Router();
const loggingService = new LoggingService();

// Get all logs
router.get('/logs', (req: Request, res: Response) => {
	try {
		const limit = parseInt(req.query.limit as string) || 100;
		const logs = loggingService.getAllLogs(limit);

		res.json({
			success: true,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs by type
router.get('/logs/:type', (req: Request, res: Response) => {
	try {
		const type = req.params.type as
			| 'message'
			| 'voice'
			| 'image'
			| 'action'
			| 'response'
			| 'error';
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getLogsByType(type, limit);

		res.json({
			success: true,
			type: type,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve logs by type',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs for a specific user
router.get('/logs/user/:userId', (req: Request, res: Response) => {
	try {
		const userId = parseInt(req.params.userId);
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getUserLogs(userId, limit);

		res.json({
			success: true,
			userId: userId,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve user logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get logs for a specific chat
router.get('/logs/chat/:chatId', (req: Request, res: Response) => {
	try {
		const chatId = parseInt(req.params.chatId);
		const limit = parseInt(req.query.limit as string) || 50;
		const logs = loggingService.getChatLogs(chatId, limit);

		res.json({
			success: true,
			chatId: chatId,
			count: logs.length,
			logs: logs,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve chat logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Export logs as JSON
router.get('/logs/export/json', (req: Request, res: Response) => {
	try {
		const logs = loggingService.exportLogs();

		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', 'attachment; filename=bot-logs.json');
		res.send(logs);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to export logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Clear logs
router.delete('/logs', (req: Request, res: Response) => {
	try {
		loggingService.clearLogs();

		res.json({
			success: true,
			message: 'Logs cleared successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to clear logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Get system status
router.get('/status', (req: Request, res: Response) => {
	try {
		const allLogs = loggingService.getAllLogs();
		const messageLogs = loggingService.getLogsByType('message', 10);
		const voiceLogs = loggingService.getLogsByType('voice', 10);
		const imageLogs = loggingService.getLogsByType('image', 10);
		const actionLogs = loggingService.getLogsByType('action', 10);
		const responseLogs = loggingService.getLogsByType('response', 10);
		const errorLogs = loggingService.getLogsByType('error', 10);

		res.json({
			success: true,
			status: 'running',
			timestamp: new Date().toISOString(),
			statistics: {
				total_logs: allLogs.length,
				message_logs: messageLogs.length,
				voice_logs: voiceLogs.length,
				image_logs: imageLogs.length,
				action_logs: actionLogs.length,
				response_logs: responseLogs.length,
				error_logs: errorLogs.length,
			},
			recent_activity: {
				messages: messageLogs.slice(-5),
				voices: voiceLogs.slice(-5),
				images: imageLogs.slice(-5),
				actions: actionLogs.slice(-5),
				responses: responseLogs.slice(-5),
				errors: errorLogs.slice(-5),
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to get system status',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export default router;
