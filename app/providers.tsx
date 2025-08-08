'use client';

import * as React from 'react';
import {
	RainbowKitProvider,
	darkTheme,
	lightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { config } from '../lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider
					initialChain={296}
					theme={lightTheme({
						accentColor: '#8B5CF6',
						accentColorForeground: 'white',
						borderRadius: 'large',
						fontStack: 'system',
						overlayBlur: 'small',
					})}
					modalSize='compact'
				>
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
