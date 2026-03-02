# Baggo Web App

Baggo is a modern, P2P shipping platform that connects travelers with people who need to send packages. This web application is built with a mobile-first approach, featuring a premium glassmorphism design and real-time messaging.

## 🚀 Features

- **Authentication**: Secure login and multi-step signup integrated with the Baggo backend.
- **Trip Discovery**: Search for travelers by city and filter by preferences.
- **Trip Management**: Travelers can post their upcoming trips, specify capacity, and manage their listings.
- **Real-time Messaging**: Full chat interface integrated with Socket.io for instant communication between senders and travelers.
- **Profile Dashboard**: Comprehensive user stats, trip history, and wallet management.
- **Mobile-First Design**: Optimized for a seamless experience on all devices with a premium aesthetic.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **API Client**: Axios
- **Real-time**: Socket.io Client
- **Charts**: Recharts (for profile stats)

## 📦 Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Backend Connection**:
    Ensure the Baggo backend is running on `http://localhost:3000`. The API base URL is configured in `src/services/api.ts`.

## 🎨 Design System

The application uses a custom design system built on top of Tailwind CSS, featuring:
- **Glassmorphism**: Blurred backgrounds and subtle borders for a modern feel.
- **Typography**: Bold, heavy fonts for a premium look.
- **Color Palette**: Custom primary blues and vibrant accents.
- **Micro-animations**: Smooth transitions and hover effects for enhanced UX.
