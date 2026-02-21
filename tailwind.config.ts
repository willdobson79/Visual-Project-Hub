import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                accent: {
                    1: "hsl(var(--accent-1))",
                    2: "hsl(var(--accent-2))",
                    3: "hsl(var(--accent-3))",
                }
            },
            fontFamily: {
                sans: ["var(--font-outfit)", "var(--font-inter)", "sans-serif"],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'cinematic-zoom': 'cinematicZoom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                cinematicZoom: {
                    '0%': { transform: 'scale(1.25)', filter: 'blur(12px)', opacity: '0' },
                    '100%': { transform: 'scale(1)', filter: 'blur(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
