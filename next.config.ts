import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */

	// Exclude server directory from build
	pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

	// Environment variables
	env: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		SERVER_URL: process.env.SERVER_URL || process.env.NEXT_PUBLIC_API_URL,
	},

	// Optimize for production
	compress: true,
	poweredByHeader: false,

	// Handle trailing slashes
	trailingSlash: false,

	// Image optimization
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'via.placeholder.com',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'api.shoq.live',
			},
		],
		formats: ['image/webp', 'image/avif'],
	},

	// Headers for security
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'origin-when-cross-origin',
					},
				],
			},
		];
	},

	// Webpack configuration
	webpack: (config: any, { isServer }: { isServer: boolean }) => {
		// Ignore server directory during build
		config.watchOptions = {
			...config.watchOptions,
			ignored: ['**/server/**', '**/node_modules/**'],
		};

		// Exclude server files from bundle
		config.resolve.alias = {
			...config.resolve.alias,
		};

		return config;
	},
};

export default nextConfig;
