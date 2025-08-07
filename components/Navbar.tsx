'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

// Navbar Configuration for Shoq.io
const NAVBAR_CONFIG = {
	brand: {
		name: 'Shoq',
		logo: '/shoq-logo.png', // Can be replaced with a logo image path if needed
	},
	navigation: [
		{ name: 'How It Works', href: '#how-it-works' },
		{ name: 'Features', href: '#features' },
		{ name: 'Testimonials', href: '#testimonials' },
		{ name: 'For Businesses', href: '#b2b' }, // Optional, can remove if B2C only
	],
	cta: {
		text: 'Open in Telegram',
		href: 'https://t.me/HeyShoqBot',
	},
};

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<motion.nav
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			className='w-full z-50 fixed flex items-center justify-center top-6'
		>
			<div className='transform bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-full px-8 py-4 shadow-lg flex items-center justify-between max-w-5xl w-full mx-6'>
				{/* Logo - Left side */}
				<div className='flex items-center space-x-3'>
					<div className='w-20 h-10 rounded-xl flex items-center justify-center'>
						<Image
							src={NAVBAR_CONFIG.brand.logo}
							alt='Shoq Logo'
							width={1000}
							height={500}
						/>
					</div>
				</div>

				{/* Navigation Menu - Center */}
				<div className='hidden md:flex items-center space-x-10'>
					{NAVBAR_CONFIG.navigation.map((item) => (
						<a
							key={item.name}
							href={item.href}
							className='text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium whitespace-nowrap'
						>
							{item.name}
						</a>
					))}
				</div>

				{/* Download button - Right side */}
				<div className='hidden md:flex items-center'>
					<motion.a
						href={NAVBAR_CONFIG.cta.href}
						whileHover={{ scale: 1.05, y: -2 }}
						whileTap={{ scale: 0.95 }}
						className='relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-8 py-3 rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 whitespace-nowrap group'
					>
						<div className='absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
						<div className='relative flex items-center space-x-2'>
							<span>🚀</span>
							<span>{NAVBAR_CONFIG.cta.text}</span>
						</div>
					</motion.a>
				</div>

				{/* Mobile menu button */}
				<button
					className='md:hidden text-slate-900'
					onClick={() => setIsOpen(!isOpen)}
				>
					{isOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</div>
		</motion.nav>
	);
};

export default Navbar;
