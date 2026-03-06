import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        // Common
        home: 'Home',
        about: 'About Us',
        howItWorks: 'How it works',
        track: 'Track',
        login: 'Login',
        signup: 'Signup',
        dashboard: 'Dashboard',
        logout: 'Sign Out',
        back: 'Back',
        save: 'Save Changes',
        loading: 'Loading...',
        optional: 'optional',

        // Home
        carpool: 'Flight',
        bus: 'Bus',
        offerRide: 'Offer luggage space',
        getApp: 'Get the app',
        heroTitle: 'Global Package Delivery.',
        heroSubtitle: 'Send packages',
        heroWith: 'with courier partners.',
        leavingFrom: 'Departure Country or City',
        goingTo: 'Arrival Country or City',
        today: 'Date',
        passengers: 'Courier Partners',
        search: 'Search',
        showStays: 'Show stays',
        promoTitle: 'Earn from your travels.',
        promoDesc: 'Help others send packages as a delivery partner. Post your route and get paid for your available luggage space.',
        shareRide: 'Post a trip',
        featureTitle1: 'Send everywhere',
        featureDesc1: 'Send packages safely to any city. Our delivery partners go everywhere you need.',
        featureTitle2: 'Earn from luggage space',
        featureDesc2: 'Turn your extra luggage space into cash. A simple way to subsidize your travel costs.',
        featureTitle3: 'Trust built-in',
        featureDesc3: 'We verify every delivery partner and sender. Your package is in safe hands, every step of the way.',
        tripTypeTitle: 'How are you shipping today?',
        byBus: 'By flight',
        busDesc: 'Fastest way to send international packages',
        byCarpool: 'By bus',
        carpoolDesc: 'Affordable way to send domestic packages',
        ratingsTitle: 'Automatic Ratings.',
        ratingsSubtitle: 'More reliable',
        ratingsSubtitle2: 'service.',
        ratingsDesc: 'We are launching Automatic Ratings to make profiles fairer and more accurate. This keeps profiles accurate so you can send with more confidence!',
        getGoing: 'Get going',
        testimonialTitle: 'Only on Bago...',
        testimonialQuote: 'Perfect for me because I can send packages with courier partners! It is faster and more affordable than traditional couriers.',
        testimonialAuthor: 'Anna, Bago member since 2024',

        // About Us
        aboutHero: 'Revolutionizing Logistics for Everyone.',
        aboutSubtitle: 'Bago connects travelers with people who need to send packages across the world. We\'re building a more connected, efficient, and human way to ship.',
        ourStory: 'Our Story',
        storyTitle: 'Born from a simple travel observation.',
        storyDesc1: 'The idea for Bago started when we noticed how much empty luggage space goes to waste every day across thousands of flights and bus routes. Meanwhile, sending a small parcel internationally remains prohibitively expensive and slow.',
        storyDesc2: 'We realized that travelers are the ultimate delivery network. By connecting these two groups, Bago creates a win-win: senders get faster, cheaper delivery, and travelers earn extra income to subsidize their journeys.',
        coreValues: 'Our Core Values',
        trustSafety: 'Trust & Safety',
        trustDesc: 'Every member is verified. We prioritize the security of your items and your personal data above all else.',
        globalCommunity: 'Global Community',
        globalDesc: 'We are building a borderless world where people help people, regardless of geography or distance.',
        innovation: 'Innovation',
        innovationDesc: 'Using technology to solve old problems in new ways. Constant improvement is in our DNA.',

        // Dashboard
        overview: 'Overview',
        myTrips: 'My Trips',
        myShipments: 'My Shipments',
        chats: 'Chats',
        earnings: 'Earnings',
        settings: 'Settings',
        verification: 'Verification',
        verifiedMember: 'Verified Member',
        unverifiedMember: 'Unverified Member',
        identityConfirmed: 'Identity fully confirmed.',
        underReview: 'Under Review',
        reviewDocs: 'Hang tight! Reviewing docs.',
        verifyNow: 'Verify Now',

        // Post Trip
        postTripTitle: 'Post Your Trip',
        postTripSubtitle: 'Share your journey and earn by delivering packages',
        route: 'Route',
        fromCountry: 'From — Country',
        fromCity: 'From — City',
        toCountry: 'To — Country',
        toCity: 'To — City',
        selectCountry: 'Select country...',
        anyCity: 'Any city in',
        travelDates: 'Travel Dates',
        departureDate: 'Departure Date',
        arrivalDate: 'Arrival Date',
        transportMode: 'Transport Mode',
        capacity: 'Capacity',
        availableWeight: 'Available Weight (kg)',
        maxWeight: 'Maximum 50 kg per trip',
        earningsWallet: 'Earnings via Bago Wallet',
        earningsDesc: 'Earnings are credited to your Bago Wallet after delivery. Withdraw via Stripe Connect (Global) or Paystack (Africa).',
        additionalNotes: 'Additional Notes',
        notesPlaceholder: 'Any special requirements or information about your trip...',
        postingTrip: 'Posting trip...',
        tripPosted: 'Trip Posted! 🎉',
        tripSuccessDesc: 'Your trip is now live. Package senders can find and book your available space.',
        redirectDashboard: 'Redirecting to your dashboard...',
        kycRequired: 'Please complete Identity Verification before posting your trip.',

        // Send Package
        sendPackageTitle: 'Send a Package',
        sendRequestTitle: 'Send Shipping Request',
        findTravelerSubtitle: 'Find a trusted traveler to deliver your package',
        requestSpaceSubtitle: 'Requesting space from',
        packageName: 'Package Name',
        packageDescription: 'Package Description',
        packageWeight: 'Package Weight (kg)',
        packageValue: 'Package Value (USD)',
        receiverName: 'Receiver Name',
        receiverPhone: 'Receiver Phone',
        deliveryDeadline: 'Delivery Deadline',
        specialInstructions: 'Special Instructions',
        fragile: 'Fragile - Handle with care',
        perishable: 'Perishable goods',
        refrigeration: 'Requires refrigeration',
        estimatedCost: 'Estimated Shipping Cost',

        // How It Works
        howBagoWorks: 'How Bago Works.',
        howSubtitle: "Whether you're sending a gift to a loved one or monetizing your extra luggage space, Bago makes the process seamless, secure, and stress-free.",
        forSenders: 'For Senders',
        forTravelers: 'For Travelers',
        senderStep1Title: 'Search for a route',
        senderStep1Desc: 'Enter your departure and arrival cities, along with your preferred delivery date.',
        senderStep2Title: 'Choose your traveler',
        senderStep2Desc: 'Browse verified travelers on that route and select the one that fits your needs.',
        senderStep3Title: 'Secure payment',
        senderStep3Desc: 'Our escrow system holds your payment until the package is successfully delivered.',
        senderStep4Title: 'Track and receive',
        senderStep4Desc: 'Stay updated through real-time notifications until your package reaches its destination.',
        travelerStep1Title: 'Post your trip',
        travelerStep1Desc: 'Share your travel route (flight or bus) and indicate how much weight you can carry.',
        travelerStep2Title: 'Accept requests',
        travelerStep2Desc: 'Receive delivery requests from senders and chat with them to confirm details.',
        travelerStep3Title: 'Verified pickup',
        travelerStep3Desc: 'Meet the sender, verify the package contents, and mark the delivery as started.',
        travelerStep4Title: 'Get paid instantly',
        travelerStep4Desc: 'Once delivered, the escrow funds are released immediately to your Bago wallet.',
        prohibitedItems: 'Prohibited Items',
        prohibitedSubtitle: 'To ensure the safety of our travelers and compliance with international laws, the following items are strictly prohibited.',
        openPackagePolicy: 'Open Package Policy',
        openPackageDesc: 'Our community is built on trust. Travelers have the right to inspect package contents during pickup to ensure safety code compliance.',
        insuranceProtection: 'Insurance Protection',
        insuranceDesc: 'Every verified shipment is backed by our Insurance Protection Policy through our secure escrow system.',

        // Help Center
        helpCenterTitle: 'How can we help you?',
        helpSubtitle: 'Search our knowledge base or browse categories below',
        searchHelp: 'Search for articles...',
        shippingGuide: 'Shipping Guide',
        paymentPricing: 'Payments & Pricing',
        safetyTrust: 'Safety & Trust',
        accountSettings: 'Account Settings',
    },
    es: {
        // Common
        home: 'Inicio',
        about: 'Sobre Nosotros',
        howItWorks: 'Cómo funciona',
        track: 'Rastreo',
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        dashboard: 'Panel',
        logout: 'Cerrar Sesión',
        back: 'Volver',
        save: 'Guardar Cambios',
        loading: 'Cargando...',

        carpool: 'Vuelo',
        bus: 'Autobús',
        offerRide: 'Ofrecer espacio de equipaje',
        getApp: 'Obtener la app',
        heroTitle: 'Entrega Global de Paquetes.',
        heroSubtitle: 'Envía paquetes',
        heroWith: 'con mensajeros socios.',
        leavingFrom: 'Ciudad o país de salida',
        goingTo: 'Ciudad o país de llegada',
        today: 'Fecha',
        passengers: 'Mensajeros socios',
        search: 'Buscar',
        showStays: 'Mostrar estancias',
        promoTitle: 'Gana con tus viajes.',
        promoDesc: 'Ayuda a otros a enviar paquetes como socio de entrega. Publica tu ruta y gana dinero por tu espacio disponible.',
        shareRide: 'Publicar un viaje',
        featureTitle1: 'Envía a todas partes',
        featureDesc1: 'Envía paquetes de forma segura a cualquier ciudad. Nuestros socios de entrega van a donde necesites.',
        featureTitle2: 'Gana por tu espacio',
        featureDesc2: 'Convierte tu espacio extra en efectivo. Una forma sencilla de subsidiar tus costos de viaje.',
        featureTitle3: 'Confianza integrada',
        featureDesc3: 'Verificamos a cada socio y remitente. Tu paquete está en buenas manos en cada paso del camino.',
        tripTypeTitle: '¿Cómo envías hoy?',
        byBus: 'Por vuelo',
        busDesc: 'La forma más rápida de enviar paquetes internacionales',
        byCarpool: 'Por autobús',
        carpoolDesc: 'Forma económica de enviar paquetes nacionales',
        ratingsTitle: 'Calificaciones Automáticas.',
        ratingsSubtitle: 'Más confiable.',
        ratingsSubtitle2: 'servicio.',
        ratingsDesc: 'Lanzamos Calificaciones Automáticas para que los perfiles sean más justos y precisos. ¡Envía con más confianza!',
        getGoing: 'Comenzar',
        testimonialTitle: 'Solo en Bago...',
        testimonialQuote: '¡Perfecto para mí porque puedo enviar paquetes con mensajeros socios! Es más rápido y económico.',
        testimonialAuthor: 'Anna, miembro de Bago desde 2024',

        // About Us
        aboutHero: 'Revolucionando la Logística para Todos.',
        aboutSubtitle: 'Bago conecta viajeros con personas que necesitan enviar paquetes por todo el mundo. Estamos construyendo una forma de envío más conectada, eficiente y humana.',
        ourStory: 'Nuestra Historia',
        storyTitle: 'Nacido de una simple observación de viaje.',
        storyDesc1: 'La idea de Bago comenzó cuando notamos cuánto espacio de equipaje vacío se desperdicia cada día en miles de vuelos y rutas de autobús.',
        storyDesc2: 'Nos dimos cuenta de que los viajeros son la red de entrega definitiva. Al conectar a estos dos grupos, Bago crea una situación en la que todos ganan.',
        coreValues: 'Valores Fundamentales',
        trustSafety: 'Seguridad y Confianza',
        trustDesc: 'Cada miembro está verificado. Priorizamos la seguridad de sus artículos y sus datos personales ante todo.',
        globalCommunity: 'Comunidad Global',
        globalDesc: 'Estamos construyendo un mundo sin fronteras donde las personas ayudan a las personas, independientemente de la geografía.',
        innovation: 'Innovación',
        innovationDesc: 'Usar la tecnología para resolver viejos problemas de nuevas maneras. La mejora constante está en nuestro ADN.',

        // Dashboard
        overview: 'Resumen',
        myTrips: 'Mis Viajes',
        myShipments: 'Mis Envíos',
        chats: 'Chats',
        earnings: 'Ganancias',
        settings: 'Ajustes',
        verification: 'Verificación',
        verifiedMember: 'Miembro Verificado',
        unverifiedMember: 'No Verificado',
        identityConfirmed: 'Identidad confirmada.',
        underReview: 'En Revisión',
        reviewDocs: '¡Espera! Revisando documentos.',
        verifyNow: 'Verificar Ahora',

        // Post Trip
        postTripTitle: 'Publica tu viaje',
        postTripSubtitle: 'Comparte tu viaje y gana entregando paquetes',
        route: 'Ruta',
        fromCountry: 'Desde — País',
        fromCity: 'Desde — Ciudad',
        toCountry: 'Hasta — País',
        toCity: 'Hasta — Ciudad',
        selectCountry: 'Seleccionar país...',
        anyCity: 'Cualquier ciudad en',
        travelDates: 'Fechas de viaje',
        departureDate: 'Fecha de salida',
        arrivalDate: 'Fecha de llegada',
        transportMode: 'Medio de transporte',
        capacity: 'Capacidad',
        availableWeight: 'Peso disponible (kg)',
        maxWeight: 'Máximo 50 kg por viaje',
        earningsWallet: 'Ganancias vía Bago Wallet',
        earningsDesc: 'Las ganancias se acreditan después de la entrega. Retira vía Stripe Connect o Paystack.',
        additionalNotes: 'Notas adicionales',
        notesPlaceholder: 'Cualquier requisito especial o información...',
        postingTrip: 'Publicando viaje...',
        tripPosted: '¡Viaje publicado! 🎉',
        tripSuccessDesc: 'Tu viaje ya está disponible para envíos.',
        redirectDashboard: 'Redirigiendo al panel...',
        kycRequired: 'Por favor complete la verificación de identidad antes de publicar.',

        // Send Package
        sendPackageTitle: 'Enviar un paquete',
        sendRequestTitle: 'Enviar solicitud de envío',
        findTravelerSubtitle: 'Encuentra un viajero de confianza',
        requestSpaceSubtitle: 'Solicitando espacio a',
        packageName: 'Nombre del paquete',
        packageDescription: 'Descripción del paquete',
        packageWeight: 'Peso (kg)',
        packageValue: 'Valor (USD)',
        receiverName: 'Nombre del destinatario',
        receiverPhone: 'Teléfono del destinatario',
        deliveryDeadline: 'Fecha límite de entrega',
        specialInstructions: 'Instrucciones especiales',
        fragile: 'Frágil',
        perishable: 'Perecederos',
        refrigeration: 'Requiere refrigeración',
        estimatedCost: 'Costo estimado de envío',

        // How It Works
        howBagoWorks: 'Cómo funciona Bago.',
        howSubtitle: 'Ya sea que envíes un regalo o monetices tu espacio extra, Bago hace que el proceso sea sencillo, seguro y sin estrés.',
        forSenders: 'Para Remitentes',
        forTravelers: 'Para Viajeros',
        senderStep1Title: 'Busca una ruta',
        senderStep1Desc: 'Ingresa tus ciudades de salida y llegada, junto con la fecha preferida.',
        senderStep2Title: 'Elige tu viajero',
        senderStep2Desc: 'Explora viajeros verificados en esa ruta y selecciona el que se ajuste a tus necesidades.',
        senderStep3Title: 'Pago seguro',
        senderStep3Desc: 'Nuestro sistema de depósito en garantía retiene tu pago hasta que el paquete se entregue.',
        senderStep4Title: 'Rastrea y recibe',
        senderStep4Desc: 'Mantente actualizado con notificaciones en tiempo real hasta el destino final.',
        travelerStep1Title: 'Publica tu viaje',
        travelerStep1Desc: 'Comparte tu ruta e indica cuánto peso puedes llevar.',
        travelerStep2Title: 'Acepta solicitudes',
        travelerStep2Desc: 'Recibe solicitudes de envío y chatea con los remitentes para confirmar detalles.',
        travelerStep3Title: 'Recogida verificada',
        travelerStep3Desc: 'Reúnete con el remitente, verifica el contenido y marca el inicio de la entrega.',
        travelerStep4Title: 'Gana al instante',
        travelerStep4Desc: 'Una vez entregado, los fondos se liberan inmediatamente a tu billetera Bago.',
        prohibitedItems: 'Artículos Prohibidos',
        prohibitedSubtitle: 'Para garantizar la seguridad y cumplir con las leyes, los siguientes artículos están prohibidos.',
        openPackagePolicy: 'Política de Paquete Abierto',
        openPackageDesc: 'Los viajeros tienen derecho a inspeccionar el contenido del paquete durante la recogida por seguridad.',
        insuranceProtection: 'Protección de Seguro',
        insuranceDesc: 'Cada envío verificado está respaldado por nuestra política de protección mediante el sistema de depósito.',

        // Help Center
        helpCenterTitle: '¿Cómo podemos ayudarte?',
        helpSubtitle: 'Busca en nuestra base de conocimientos o explora las categorías',
        searchHelp: 'Buscar artículos...',
        shippingGuide: 'Guía de Envío',
        paymentPricing: 'Pagos y Precios',
        safetyTrust: 'Seguridad y Confianza',
        accountSettings: 'Ajustes de Cuenta',
    },
    fr: {
        home: 'Accueil',
        about: 'À propos',
        howItWorks: 'Comment ça marche',
        track: 'Suivi',
        login: 'Connexion',
        signup: 'S\'inscrire',
        dashboard: 'Tableau de bord',
        logout: 'Déconnexion',
        back: 'Retour',
        heroTitle: 'Livraison de Colis Globale.',
        heroSubtitle: 'Envoyez des colis',
        heroWith: 'avec des coursiers partenaires.',
        search: 'Rechercher',
        shareRide: 'Publier un trajet',
        overview: 'Aperçu',
        myTrips: 'Mes Trajets',
        myShipments: 'Mes Envois',
        chats: 'Discussions',
        earnings: 'Gains',
        settings: 'Paramètres',
        verification: 'Vérification',
        verifiedMember: 'Membre Vérifié',
        verifyNow: 'Vérifier maintenant',
    },
    de: {
        home: 'Startseite',
        about: 'Über uns',
        howItWorks: 'Wie es funktioniert',
        track: 'Verfolgen',
        login: 'Anmelden',
        signup: 'Registrieren',
        dashboard: 'Dashboard',
        logout: 'Abmelden',
        back: 'Zurück',
        heroTitle: 'Weltweiter Paketversand.',
        heroSubtitle: 'Pakete versenden',
        heroWith: 'mit Kurierpartnern.',
        search: 'Suchen',
        shareRide: 'Fahrt posten',
        overview: 'Übersicht',
        myTrips: 'Meine Fahrten',
        myShipments: 'Meine Sendungen',
        chats: 'Chats',
        earnings: 'Einnahmen',
        settings: 'Einstellungen',
        verification: 'Verifizierung',
        verifiedMember: 'Verifiziertes Mitglied',
        verifyNow: 'Jetzt verifizieren',
    },
    pt: {
        home: 'Início',
        about: 'Sobre Nós',
        howItWorks: 'Como funciona',
        track: 'Rastrear',
        login: 'Entrar',
        signup: 'Cadastrar',
        dashboard: 'Painel',
        logout: 'Sair',
        back: 'Voltar',
        heroTitle: 'Entrega Global de Encomendas.',
        heroSubtitle: 'Envie pacotes',
        heroWith: 'com parceiros de entrega.',
        search: 'Pesquisar',
        shareRide: 'Postar viagem',
        overview: 'Resumo',
        myTrips: 'Minhas Viagens',
        myShipments: 'Meus Envios',
        chats: 'Chats',
        earnings: 'Ganhos',
        settings: 'Configurações',
        verification: 'Verificação',
        verifiedMember: 'Membro Verificado',
        verifyNow: 'Verificar agora',
    }
};

const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'Pound Sterling', symbol: '£', flag: '🇬🇧' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' }
];

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        return localStorage.getItem('baggo_language') || 'en';
    });

    const [currency, setCurrency] = useState(() => {
        return localStorage.getItem('baggo_currency') || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('baggo_language', currentLanguage);
    }, [currentLanguage]);

    useEffect(() => {
        localStorage.setItem('baggo_currency', currency);
    }, [currency]);

    useEffect(() => {
        const checkLocationSettings = async () => {
            const hasLang = localStorage.getItem('baggo_language');
            const hasCurr = localStorage.getItem('baggo_currency');

            if (!hasLang || !hasCurr) {
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();

                    if (!hasCurr && data.currency) {
                        setCurrency(data.currency);
                    }
                    if (!hasLang && data.languages) {
                        const langCode = data.languages.split(',')[0].split('-')[0].toLowerCase();
                        if (languages.find(l => l.code === langCode)) {
                            setCurrentLanguage(langCode);
                        }
                    }
                } catch (e) {
                    console.error("Failed to detect location for settings", e);
                }
            }
        };

        // If we have a user but no stored currency, check their country
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user && user.country && !localStorage.getItem('baggo_currency')) {
            const countryToCurrency = {
                'Nigeria': 'NGN',
                'United Kingdom': 'GBP',
                'France': 'EUR',
                'Germany': 'EUR',
                'Spain': 'EUR',
                'Italy': 'EUR',
                'Canada': 'CAD',
                'Australia': 'AUD',
                'South Africa': 'ZAR',
                'Kenya': 'KES',
                'Ghana': 'GHS'
            };
            const mapped = countryToCurrency[user.country];
            if (mapped) setCurrency(mapped);
        }

        checkLocationSettings();
    }, []);

    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations.en[key] || key;
    };

    const value = {
        currentLanguage,
        setLanguage: setCurrentLanguage,
        currency,
        setCurrency,
        t,
        languages,
        currencies,
        currentLangData: languages.find(l => l.code === currentLanguage) || languages[0],
        currentCurrencyData: currencies.find(c => c.code === currency) || currencies[0]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
