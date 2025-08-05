import express, { Request, Response, RequestHandler } from 'express';

const router = express.Router();

// Hardcoded tickets data
const TICKETS = [
	{
		id: 1,
		name: 'Movie Ticket - Avengers',
		price: 15,
		available: true,
		description: 'Latest Marvel movie',
		date: '2024-01-15',
		time: '19:00',
	},
	{
		id: 2,
		name: 'Concert - Rock Band',
		price: 50,
		available: true,
		description: 'Live rock concert',
		date: '2024-01-20',
		time: '20:00',
	},
	{
		id: 3,
		name: 'Theater - Hamlet',
		price: 30,
		available: false,
		description: 'Classic Shakespeare play',
		date: '2024-01-25',
		time: '18:30',
	},
	{
		id: 4,
		name: 'Sports - Football Match',
		price: 25,
		available: true,
		description: 'Local team vs rivals',
		date: '2024-01-18',
		time: '15:00',
	},
	{
		id: 5,
		name: 'Comedy Show',
		price: 20,
		available: true,
		description: 'Stand-up comedy night',
		date: '2024-01-22',
		time: '21:00',
	},
	{
		id: 6,
		name: 'Opera - La Traviata',
		price: 75,
		available: true,
		description: 'Classical opera performance',
		date: '2024-01-28',
		time: '19:30',
	},
];

// Get all tickets
const getAllTickets: RequestHandler = (req, res) => {
	try {
		const { available, category, minPrice, maxPrice } = req.query;

		let filteredTickets = [...TICKETS];

		// Filter by availability
		if (available !== undefined) {
			const isAvailable = available === 'true';
			filteredTickets = filteredTickets.filter(
				(ticket) => ticket.available === isAvailable
			);
		}

		// Filter by price range
		if (minPrice) {
			filteredTickets = filteredTickets.filter(
				(ticket) => ticket.price >= Number(minPrice)
			);
		}

		if (maxPrice) {
			filteredTickets = filteredTickets.filter(
				(ticket) => ticket.price <= Number(maxPrice)
			);
		}

		res.json({
			status: 'success',
			data: {
				tickets: filteredTickets,
				total: filteredTickets.length,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch tickets',
		});
	}
};

// Get ticket by ID
const getTicketById: RequestHandler = (req, res) => {
	try {
		const ticketId = parseInt(req.params.id);
		const ticket = TICKETS.find((t) => t.id === ticketId);

		if (!ticket) {
			res.status(404).json({
				status: 'error',
				message: 'Ticket not found',
			});
			return;
		}

		res.json({
			status: 'success',
			data: { ticket },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch ticket',
		});
	}
};

// Book a ticket
const bookTicket: RequestHandler = (req, res) => {
	try {
		const ticketId = parseInt(req.params.id);
		const { customerName, customerEmail, quantity = 1 } = req.body;

		const ticket = TICKETS.find((t) => t.id === ticketId);

		if (!ticket) {
			res.status(404).json({
				status: 'error',
				message: 'Ticket not found',
			});
			return;
		}

		if (!ticket.available) {
			res.status(400).json({
				status: 'error',
				message: 'Ticket is not available',
			});
			return;
		}

		if (!customerName || !customerEmail) {
			res.status(400).json({
				status: 'error',
				message: 'Customer name and email are required',
			});
			return;
		}

		// Simulate booking process
		const bookingId = Math.floor(Math.random() * 1000000);
		const totalPrice = ticket.price * quantity;

		const booking = {
			id: bookingId,
			ticketId: ticket.id,
			ticketName: ticket.name,
			customerName,
			customerEmail,
			quantity,
			totalPrice,
			status: 'confirmed',
			bookingDate: new Date().toISOString(),
			eventDate: ticket.date,
			eventTime: ticket.time,
		};

		res.status(201).json({
			status: 'success',
			message: 'Ticket booked successfully',
			data: { booking },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to book ticket',
		});
	}
};

// Search tickets
const searchTickets: RequestHandler = (req, res) => {
	try {
		const query = req.params.query.toLowerCase();

		const searchResults = TICKETS.filter(
			(ticket) =>
				ticket.name.toLowerCase().includes(query) ||
				ticket.description.toLowerCase().includes(query)
		);

		res.json({
			status: 'success',
			data: {
				tickets: searchResults,
				total: searchResults.length,
				query,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to search tickets',
		});
	}
};

// Get ticket categories
const getCategories: RequestHandler = (req, res) => {
	try {
		const categories = [
			{ id: 1, name: 'Movies', count: 1 },
			{ id: 2, name: 'Concerts', count: 1 },
			{ id: 3, name: 'Theater', count: 1 },
			{ id: 4, name: 'Sports', count: 1 },
			{ id: 5, name: 'Comedy', count: 1 },
			{ id: 6, name: 'Opera', count: 1 },
		];

		res.json({
			status: 'success',
			data: { categories },
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Failed to fetch categories',
		});
	}
};

// Routes
router.get('/', getAllTickets);
router.get('/ticket/:id', getTicketById);
router.post('/ticket/:id/book', bookTicket);
router.get('/search/:query', searchTickets);
router.get('/categories', getCategories);

export default router;
