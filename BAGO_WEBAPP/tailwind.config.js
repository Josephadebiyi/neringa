/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#007aff", // A clean blue color like BlaBlaCar but we can also use #5845D8
                "bago-blue": "#5845D8",
                "bg-theme": "#ffffff",
                "card-light": "#F8F9FA",
                "text-main": "#054752" // Using a dark teal/blue-black similar to BlaBlaCar
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
