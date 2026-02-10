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
                // Slate scale (graphite + yale)
                slate: {
                    950: '#171717',
                    900: '#1F2127',
                    850: '#12212C',
                    800: '#1C3445',
                    700: '#284B63',
                    600: '#2A5D63',
                    500: '#738A99',
                    400: '#9EAEB8',
                    300: '#BEC9D0',
                    200: '#D9D9D9',
                    100: '#F5F7F8',
                    50: '#FFFFFF',
                },
                // Poker palette
                poker: {
                    hero: '#35968C',
                    bet: '#18A572',
                    'bet-hover': '#1DBB83',
                    fold: '#E5484D',
                    'fold-hover': '#F05B61',
                    pot: '#C9A86A',
                    allin: '#C9A86A',
                    check: '#1C3445',
                    'check-hover': '#284B63',
                },
                // Surfaces & borders
                'border-subtle': 'var(--border-subtle)',
                'border-subtle-soft': 'var(--border-subtle-soft)',
                'border-hero': 'var(--border-hero)',
                'border-hero-soft': 'var(--border-hero-soft)',
                'border-hero-faint': 'var(--border-hero-faint)',
                'surface-glass': 'var(--surface-glass)',
                'surface-glass-light': 'var(--surface-glass-light)',
                'surface-sunken': 'var(--surface-sunken)',
                'surface-overlay': 'var(--surface-overlay)',
                // Table tokens
                'table-rail': '#1C3445',
                'table-board': '#12212C',
                // Card tokens
                'card-back': '#12212C',
            },
            boxShadow: {
                'glow-hero': '0 0 15px -3px rgba(53,150,140,0.35)',
                'elevated': '0 6px 16px rgba(0,0,0,0.4)',
                'table': '0 18px 60px rgba(0,0,0,0.65)',
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
