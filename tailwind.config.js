/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border      : 'hsl(var(--border))',
        input       : 'hsl(var(--input))',
        ring        : 'hsl(var(--ring))',
        background  : 'hsl(var(--background))',
        foreground  : 'hsl(var(--foreground))',
        primary     : { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary   : { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive : { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted       : { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent      : { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover     : { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card        : { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        // OTA custom
        brand       : { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8', 800:'#1e3a8a', 900:'#1e3a5f', DEFAULT:'#1d4ed8' },
        gold        : { light:'#fde68a', DEFAULT:'#f59e0b', dark:'#b45309' },
      },
      borderRadius: {
        lg : 'var(--radius)',
        md : 'calc(var(--radius) - 2px)',
        sm : 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans    : ['"Plus Jakarta Sans"', 'sans-serif'],
        display : ['"Playfair Display"', 'serif'],
        mono    : ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'accordion-down'    : { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up'      : { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in'           : { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right'    : { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in-checkout'  : { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up-checkout' : { from: { transform: 'translateY(100%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer             : { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        wiggle              : { '0%,100%': { transform: 'rotate(0deg)' }, '20%': { transform: 'rotate(-15deg)' }, '40%': { transform: 'rotate(15deg)' }, '60%': { transform: 'rotate(-10deg)' }, '80%': { transform: 'rotate(10deg)' } },
      },
      animation: {
        'accordion-down'    : 'accordion-down 0.2s ease-out',
        'accordion-up'      : 'accordion-up 0.2s ease-out',
        'fade-in'           : 'fade-in 0.4s ease-out',
        'slide-in-right'    : 'slide-in-right 0.3s ease-out',
        'fade-in-checkout'  : 'fade-in-checkout 0.2s ease-out',
        'slide-up-checkout' : 'slide-up-checkout 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        shimmer             : 'shimmer 1.5s infinite linear',
        wiggle              : 'wiggle 1s ease-in-out',
      },
      boxShadow: {
        'card'  : '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.1)',
        'brand' : '0 4px 20px rgba(29,78,216,.25)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
