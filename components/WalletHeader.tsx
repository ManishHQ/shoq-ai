'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { 
	ShoppingCart, 
	Package, 
	User, 
	Home,
	Wallet,
	LogIn
} from 'lucide-react';

// Configuration object
const WALLET_HEADER_CONFIG = {
	brand: {
		name: 'Shoq',
		tagline: 'Shop with Crypto',
	},
	navigation: [
		{ name: 'Home', href: '/', icon: Home },
		{ name: 'Shop', href: '/shop', icon: ShoppingCart },
		{ name: 'Orders', href: '/app/orders', icon: Package },
		{ name: 'Profile', href: '/profile', icon: User },
	],
};

export default function WalletHeader() {
	const { address, isConnected } = useAccount();

	return (
		<motion.header
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className='bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-lg bg-white/80'
		>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					{/* Brand */}
					<Link href='/'>
						<motion.div
							whileHover={{ scale: 1.05 }}
							className='flex items-center space-x-2'
						>
							<div className='w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center'>
								<Wallet size={20} className='text-white' />
							</div>
							<div>
								<div className='text-xl font-bold text-slate-900'>
									{WALLET_HEADER_CONFIG.brand.name}
								</div>
								<div className='text-xs text-slate-600 -mt-1'>
									{WALLET_HEADER_CONFIG.brand.tagline}
								</div>
							</div>
						</motion.div>
					</Link>

					{/* Navigation */}
					<nav className='hidden md:flex items-center space-x-6'>
						{WALLET_HEADER_CONFIG.navigation.map((item) => {
							const Icon = item.icon;
							return (
								<Link key={item.name} href={item.href}>
									<motion.div
										whileHover={{ y: -1 }}
										className='flex items-center space-x-2 text-slate-600 hover:text-purple-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-purple-50'
									>
										<Icon size={16} />
										<span className='font-medium'>{item.name}</span>
									</motion.div>
								</Link>
							);
						})}
					</nav>

					{/* Wallet Connection */}
					<div className='flex items-center space-x-4'>
						{!isConnected && (
							<Link href='/onboard'>
								<motion.button
									whileHover={{ scale: 1.02, y: -1 }}
									whileTap={{ scale: 0.98 }}
									className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300'
								>
									<LogIn size={16} />
									<span>Get Started</span>
								</motion.button>
							</Link>
						)}
						
						<ConnectButton.Custom>
							{({
								account,
								chain,
								openAccountModal,
								openChainModal,
								openConnectModal,
								authenticationStatus,
								mounted,
							}) => {
								const ready = mounted && authenticationStatus !== 'loading';
								const connected =
									ready &&
									account &&
									chain &&
									(!authenticationStatus ||
										authenticationStatus === 'authenticated');

								return (
									<div
										{...(!ready && {
											'aria-hidden': true,
											'style': {
												opacity: 0,
												pointerEvents: 'none',
												userSelect: 'none',
											},
										})}
									>
										{(() => {
											if (!connected) {
												return (
													<motion.button
														whileHover={{ scale: 1.02, y: -1 }}
														whileTap={{ scale: 0.98 }}
														onClick={openConnectModal}
														className='bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2'
													>
														<Wallet size={16} />
														<span>Connect</span>
													</motion.button>
												);
											}

											if (chain.unsupported) {
												return (
													<motion.button
														whileHover={{ scale: 1.02, y: -1 }}
														whileTap={{ scale: 0.98 }}
														onClick={openChainModal}
														className='bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300'
													>
														Wrong network
													</motion.button>
												);
											}

											return (
												<div className='flex items-center space-x-2'>
													<motion.button
														whileHover={{ scale: 1.02, y: -1 }}
														whileTap={{ scale: 0.98 }}
														onClick={openChainModal}
														className='flex items-center space-x-1 bg-slate-100 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-200 transition-all duration-200'
													>
														{chain.hasIcon && (
															<div
																style={{
																	background: chain.iconBackground,
																	width: 16,
																	height: 16,
																	borderRadius: 999,
																	overflow: 'hidden',
																	marginRight: 4,
																}}
															>
																{chain.iconUrl && (
																	<img
																		alt={chain.name ?? 'Chain icon'}
																		src={chain.iconUrl}
																		style={{ width: 16, height: 16 }}
																	/>
																)}
															</div>
														)}
														<span className='text-sm'>{chain.name}</span>
													</motion.button>

													<motion.button
														whileHover={{ scale: 1.02, y: -1 }}
														whileTap={{ scale: 0.98 }}
														onClick={openAccountModal}
														className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300'
													>
														<div className='w-4 h-4 bg-white/20 rounded-full' />
														<span className='font-mono text-sm'>
															{account.displayName}
														</span>
													</motion.button>
												</div>
											);
										})()}
									</div>
								);
							}}
						</ConnectButton.Custom>
					</div>

					{/* Mobile Menu Button */}
					<div className='md:hidden'>
						<motion.button
							whileTap={{ scale: 0.95 }}
							className='text-slate-600 hover:text-slate-900 p-2'
						>
							<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
							</svg>
						</motion.button>
					</div>
				</div>
			</div>
		</motion.header>
	);
}