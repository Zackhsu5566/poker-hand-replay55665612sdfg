/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                // Premium Black Palette
                slate: {
                    950: '#050608', // App background (near-black)
                    900: '#0B0E14', // Primary surface
                    850: '#0F131B', // Felt base
                    800: '#1A2232', // Borders / secondary surface
                    700: '#243047', // Lighter borders
                    600: '#2E3B50', // Hover states
                    500: '#6B7683', // Tertiary / muted text
                    400: '#9AA6B2', // Secondary text
                    300: '#C0C8D2', // Light secondary
                    200: '#E8EEF7', // Near-white
                    100: '#F0F4FA', // Card face
                    50: '#E8EEF7',  // Primary text
                },
                poker: {
                    bet: '#18A572',       // Action / success
                    'bet-hover': '#1DBB83',
                    fold: '#E5484D',      // Danger
                    'fold-hover': '#F05B61',
                    hero: '#2BD4B6',      // Teal accent
                    allin: '#C9A86A',     // Premium gold
                    pot: '#C9A86A',       // Premium gold
                    check: '#1A2232',     // Neutral
                    'check-hover': '#243047',
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            padding: {
                'safe': 'env(safe-area-inset-bottom, 8px)',
            },
            screens: {
                'xs': '390px',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
