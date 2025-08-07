'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
	Twitter,
	Facebook,
	Instagram,
	Linkedin,
	Mail,
	Globe,
} from 'lucide-react';
import Image from 'next/image';

// Footer Configuration for Shoq.io
const FOOTER_CONFIG = {
	brand: {
		name: 'Shoq',
		description:
			'Shoq helps small businesses sell smarter and customers shop faster — directly through chat.',
		logo: '/shoq-logo.png',
	},
	newsletter: {
		title: 'Get Early Access',
		description:
			'Join the waitlist and get exclusive access to launch updates.',
		placeholder: 'Enter your email',
		buttonText: 'Join Waitlist',
	},
	links: {
		Product: ['How it works', 'Bot Features', 'Demo Chat', 'Merchant Signup'],
		Resources: ['Help Center', 'FAQs', 'Blog'],
		Legal: ['Privacy Policy', 'Terms of Service'],
	},
	socialIcons: [Twitter, Facebook, Instagram, Linkedin, Mail],
	languages: [
		{ code: 'en', name: 'English' },
		{ code: 'hi', name: 'Hindi' },
		{ code: 'ne', name: 'Nepali' },
	],
	copyright: '© 2024 Shoq. All rights reserved.',
	legalLinks: ['Privacy', 'Terms'],
};

const Footer = () => {
	return (
		<footer className='bg-slate-900 border-t border-slate-800'>
			<div className='max-w-7xl mx-auto px-6 py-16'>
				<div className='flex justify-between mb-16'>
					{/* Brand */}
					<div>
						<div className='flex items-center space-x-3 mb-6 w-20 h-10 rounded-2xl justify-center bg-white p-2'>
							<Image
								src={FOOTER_CONFIG.brand.logo}
								alt='Shoq Logo'
								width={1000}
								height={500}
							/>
						</div>
						<p className='text-slate-400 mb-6 leading-relaxed'>
							{FOOTER_CONFIG.brand.description}
						</p>
						<div className='flex items-center space-x-4'>
							{FOOTER_CONFIG.socialIcons.map((Icon, index) => (
								<motion.a
									key={index}
									href='#'
									whileHover={{ scale: 1.1, y: -2 }}
									className='w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-purple-400 hover:bg-slate-700 transition-all duration-300'
								>
									<Icon size={18} />
								</motion.a>
							))}
						</div>
					</div>

					{/* Links */}
					{Object.entries(FOOTER_CONFIG.links).map(([category, links]) => (
						<div key={category}>
							<h3 className='text-white font-semibold mb-4'>{category}</h3>
							<ul className='space-y-3'>
								{links.map((link, index) => (
									<li key={index}>
										<a
											href='#'
											className='text-slate-400 hover:text-white transition-colors text-sm'
										>
											{link}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Newsletter */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='bg-slate-800/50 rounded-3xl p-8 mb-8'
				>
					<div className='text-center mb-6'>
						<h3 className='text-2xl font-bold text-white mb-2'>
							{FOOTER_CONFIG.newsletter.title}
						</h3>
						<p className='text-slate-400'>
							{FOOTER_CONFIG.newsletter.description}
						</p>
					</div>
					<div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
						<input
							type='email'
							placeholder={FOOTER_CONFIG.newsletter.placeholder}
							className='flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-purple-400 focus:outline-none'
						/>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300'
						>
							{FOOTER_CONFIG.newsletter.buttonText}
						</motion.button>
					</div>
				</motion.div>

				<div className='border-t border-slate-800 pt-8'>
					<div className='flex flex-col md:flex-row items-center justify-between'>
						<div className='flex items-center space-x-6 mb-4 md:mb-0'>
							<div className='flex items-center space-x-2 text-slate-400'>
								<Globe size={16} />
								<select className='bg-transparent text-slate-400 text-sm focus:outline-none'>
									{FOOTER_CONFIG.languages.map((lang) => (
										<option key={lang.code} value={lang.code}>
											{lang.name}
										</option>
									))}
								</select>
							</div>
							<div className='text-slate-400 text-sm'>
								{FOOTER_CONFIG.copyright}
							</div>
						</div>

						<div className='flex items-center space-x-6 text-slate-400 text-sm'>
							{FOOTER_CONFIG.legalLinks.map((link) => (
								<a
									key={link}
									href='#'
									className='hover:text-white transition-colors'
								>
									{link}
								</a>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
