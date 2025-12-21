import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class', '.theme-dark'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			boxShadow: {
				soft: '0 10px 30px rgba(0,0,0,.08)'
			}
		}
	},
	plugins: [typography]
};
