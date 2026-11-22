import type { ReactNode } from 'react'

export const metadata = {
	title: 'use-url-query playground',
}

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{props.children}</body>
		</html>
	)
}
