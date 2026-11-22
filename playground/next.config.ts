import type { NextConfig } from 'next'

// Allow importing the package `src/` from this playground subfolder.
const nextConfig: NextConfig = {
	experimental: {
		externalDir: true,
	},
}

export default nextConfig
