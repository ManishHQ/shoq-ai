/**
 * Extracts the platform name from a URL
 *
 * @param {string} url - URL to extract platform from
 * @returns {string} - The extracted platform name
 */
const extractPlatformFromUrl = (url: string): string => {
	try {
		// Handle case when URL is undefined or null
		if (!url) return '';

		// Ensure URL has protocol - add if missing
		const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;

		// Parse URL to get hostname
		const hostname = new URL(urlWithProtocol).hostname;

		// Remove www. prefix if present
		const cleanHostname = hostname.replace(/^www\./, '');

		// Extract the domain name (first part of hostname)
		const domainParts = cleanHostname.split('.');

		// Return the domain name (platform)
		return domainParts[0] || '';
	} catch (error) {
		console.error('Error extracting platform from URL:', error);
		return '';
	}
};

export default extractPlatformFromUrl;
