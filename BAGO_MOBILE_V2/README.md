# Bago Mobile V2

A completely rebuilt mobile application for the Bago peer-to-peer international package delivery platform. Built with the latest stable technologies and improved UX.

## 🎯 Features

- **Modern UI/UX**: Clean, intuitive design with smooth animations
- **Latest Technologies**: Expo SDK 55, React Native 0.83, React 19
- **Type-Safe Routing**: File-based routing with Expo Router and TypeScript
- **Styled with NativeWind**: Tailwind CSS for React Native
- **Authentication**: Ready-to-use auth screens (Sign In, Sign Up)
- **Tab Navigation**: Home, Packages, Tracking, and Profile screens
- **No Dependency Conflicts**: All packages properly versioned and compatible

## 🛠️ Tech Stack

- **Framework**: Expo SDK 55
- **React**: 19.2.0
- **React Native**: 0.83.2
- **Navigation**: Expo Router 55
- **Styling**: NativeWind 4.2 + Tailwind CSS 3.4
- **Icons**: Lucide React Native + Expo Vector Icons
- **Backend Ready**: Supabase integration ready
- **TypeScript**: Full type safety

## 📁 Project Structure

```
BAGO_MOBILE_V2/
├── app/
│   ├── (tabs)/          # Main tab screens
│   │   ├── index.tsx    # Home screen
│   │   ├── packages.tsx # Packages screen
│   │   ├── tracking.tsx # Tracking screen
│   │   └── profile.tsx  # Profile screen
│   ├── auth/            # Authentication screens
│   │   ├── signin.tsx
│   │   └── signup.tsx
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Welcome screen
├── assets/              # Images, fonts, etc.
├── components/          # Reusable components
├── lib/                 # Libraries and utilities
├── utils/               # Helper functions
└── types/               # TypeScript types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## 🎨 Design System

### Colors
- **Primary**: #5845D8 (Purple)
- **Secondary**: #6366F1 (Indigo)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)

### Typography
- Font: Plus Jakarta Sans
- Weights: Regular, Medium, SemiBold, Bold

## 📱 Screens

### Public Screens
- Welcome/Onboarding
- Sign In
- Sign Up

### Authenticated Screens
- Home Dashboard
- My Packages
- Package Tracking
- User Profile

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### App Configuration
Edit `app.json` to customize:
- App name and slug
- Bundle identifiers
- Splash screen and icon
- Permissions

## 📦 Building for Production

### iOS
```bash
npx eas-cli build -p ios
```

### Android
```bash
npx eas-cli build -p android
```

## ✅ Improvements Over V1

1. **No Dependency Conflicts**: All packages are compatible
2. **Latest Stable Versions**: Using Expo SDK 55 with React Native 0.83
3. **Better Code Organization**: Clear folder structure
4. **Improved UX**: Cleaner, more intuitive design
5. **Type Safety**: Full TypeScript support
6. **Performance**: Optimized for smooth animations and fast load times

## 📝 Next Steps

- [ ] Implement Supabase authentication
- [ ] Add package creation flow
- [ ] Add trip creation flow
- [ ] Implement real-time tracking
- [ ] Add payment integration
- [ ] Add push notifications
- [ ] Implement chat/messaging
- [ ] Add image upload for packages

## 🤝 Contributing

This is a fresh start - ready for new features and improvements!

## 📄 License

MIT
