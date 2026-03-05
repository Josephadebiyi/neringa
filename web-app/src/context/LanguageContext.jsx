import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        carpool: 'Flight',
        bus: 'Bus',
        offerRide: 'Offer luggage space',
        getApp: 'Get the app',
        heroTitle: 'Social Shipping.',
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
    },
    es: {
        carpool: 'Compartir coche',
        bus: 'Autobús',
        offerRide: 'Ofrecer un viaje',
        getApp: 'Obtener la app',
        heroTitle: 'Autobús y coche compartido.',
        heroSubtitle: 'Viaja a tu manera',
        heroWith: 'con Baggo.',
        leavingFrom: 'Saliendo de',
        goingTo: 'Yendo a',
        today: 'Hoy',
        passengers: '1 pasajero',
        search: 'Buscar',
        showStays: 'Mostrar alojamientos',
        promoTitle: 'Comparte tu viaje. Reduce tus costos.',
        promoDesc: 'Comparte coche como conductor para convertir tus asientos vacíos en menores costos de viaje. Publica tu viaje y consigue pasajeros para compartir gastos.',
        shareRide: 'Comparte tu viaje',
        featureTitle1: 'Viaja a todas partes',
        featureDesc1: 'Explora el mundo a tu manera, con una gran selección de autobuses e innumerables viajes compartidos.',
        featureTitle2: 'Tu selección de viajes a precios bajos',
        featureDesc2: 'No importa a donde vayas, en autobús o coche compartido, encuentra el viaje perfecto entre nuestra amplia gama de destinos y rutas a precios bajos.',
        featureTitle3: 'Confía en quien viajas',
        featureDesc3: 'Nos tomamos el tiempo de conocer a cada uno de nuestros miembros. Verificamos reseñas, perfiles y documentos, para que sepas con quien viajas.',
        tripTypeTitle: 'Como viajas hoy?',
        byBus: 'En autobús',
        busDesc: 'Explora miles de rutas en todo el mundo con increíbles descuentos',
        byCarpool: 'En coche compartido',
        carpoolDesc: 'Comparte los costos para viajar directamente a tu destino',
        ratingsTitle: 'Calificaciones Automáticas.',
        ratingsSubtitle: 'Viajes más',
        ratingsSubtitle2: 'confiables.',
        ratingsDesc: 'Lanzamos Calificaciones Automáticas para hacer los perfiles más justos y precisos. Los viajes sin problemas reciben 5 estrellas. Las cancelaciones tardías recibirán 1 estrella.',
        getGoing: 'Comenzar',
        testimonialTitle: 'Solo en Baggo...',
        testimonialQuote: 'Perfecto para mí porque disfruto tanto del coche compartido como del autobús! Coche compartido para conocer gente nueva. Y Baggo Bus tiene buenos precios.',
        testimonialAuthor: 'Anna, miembro de Baggo desde 2024',
    },
    fr: {
        carpool: 'Covoiturage',
        bus: 'Bus',
        offerRide: 'Proposer un trajet',
        getApp: 'Obtenir l\'app',
        heroTitle: 'Bus et covoiturage.',
        heroSubtitle: 'Voyagez à votre façon',
        heroWith: 'avec Baggo.',
        leavingFrom: 'Au départ de',
        goingTo: 'En direction de',
        today: 'Aujourd\'hui',
        passengers: '1 passager',
        search: 'Rechercher',
        showStays: 'Afficher les séjours',
        promoTitle: 'Partagez votre trajet. Réduisez vos coûts.',
        promoDesc: 'Covoiturez en tant que conducteur pour transformer vos sièges vides en coûts réduits. Publiez votre trajet et trouvez des passagers.',
        shareRide: 'Partagez votre trajet',
        featureTitle1: 'Voyagez partout',
        featureDesc1: 'Explorez le monde à votre façon, avec un vaste choix de bus et de trajets en covoiturage.',
        featureTitle2: 'Votre choix de trajets à prix réduits',
        featureDesc2: 'Peu importe où vous allez, en bus ou en covoiturage, trouvez le trajet parfait parmi notre large gamme de destinations.',
        featureTitle3: 'Faites confiance à vos compagnons',
        featureDesc3: 'Nous prenons le temps de connaître chacun de nos membres. Nous vérifions les avis, les profils et les pièces d\'identité.',
        tripTypeTitle: 'Comment voyagez-vous aujourd\'hui?',
        byBus: 'En bus',
        busDesc: 'Explorez des milliers d\'itinéraires dans le monde avec des réductions incroyables',
        byCarpool: 'En covoiturage',
        carpoolDesc: 'Partagez les frais pour voyager directement vers votre destination',
        ratingsTitle: 'Évaluations Automatiques.',
        ratingsSubtitle: 'Trajets plus',
        ratingsSubtitle2: 'fiables.',
        ratingsDesc: 'Nous lançons les Évaluations Automatiques pour rendre les profils plus justes. Les trajets sans problème reçoivent 5 étoiles.',
        getGoing: 'Commencer',
        testimonialTitle: 'Seulement sur Baggo...',
        testimonialQuote: 'Parfait pour moi car j\'aime le covoiturage ET le bus! Le covoiturage pour rencontrer de nouvelles personnes. Et Baggo Bus a de bons prix.',
        testimonialAuthor: 'Anna, membre Baggo depuis 2024',
    },
    de: {
        carpool: 'Mitfahrgelegenheit',
        bus: 'Bus',
        offerRide: 'Fahrt anbieten',
        getApp: 'App herunterladen',
        heroTitle: 'Bus und Mitfahrgelegenheit.',
        heroSubtitle: 'Reisen Sie auf Ihre Art',
        heroWith: 'mit Baggo.',
        leavingFrom: 'Abfahrt von',
        goingTo: 'Fahrt nach',
        today: 'Heute',
        passengers: '1 Passagier',
        search: 'Suchen',
        showStays: 'Unterkünfte anzeigen',
        promoTitle: 'Teilen Sie Ihre Fahrt. Senken Sie Ihre Kosten.',
        promoDesc: 'Bilden Sie als Fahrer Fahrgemeinschaften, um Ihre leeren Sitze in niedrigere Reisekosten umzuwandeln. Veröffentlichen Sie Ihre Fahrt.',
        shareRide: 'Teilen Sie Ihre Fahrt',
        featureTitle1: 'Überall reisen',
        featureDesc1: 'Erkunden Sie die Welt auf Ihre Weise, mit einer riesigen Auswahl an Bussen und unzähligen Mitfahrgelegenheiten.',
        featureTitle2: 'Ihre Auswahl an Fahrten',
        featureDesc2: 'Egal wohin Sie fahren, mit dem Bus oder per Mitfahrgelegenheit, finden Sie die perfekte Fahrt aus unserer großen Auswahl.',
        featureTitle3: 'Vertrauen Sie Ihren Mitreisenden',
        featureDesc3: 'Wir nehmen uns die Zeit, jeden unserer Mitglieder kennenzulernen. Wir überprüfen Bewertungen, Profile und Ausweise.',
        tripTypeTitle: 'Wie reisen Sie heute?',
        byBus: 'Mit dem Bus',
        busDesc: 'Erkunden Sie tausende Routen weltweit mit unglaublichen Rabatten',
        byCarpool: 'Per Mitfahrgelegenheit',
        carpoolDesc: 'Teilen Sie die Kosten, um direkt zu Ihrem Ziel zu reisen',
        ratingsTitle: 'Automatische Bewertungen.',
        ratingsSubtitle: 'Zuverlässigere',
        ratingsSubtitle2: 'Fahrten.',
        ratingsDesc: 'Wir führen Automatische Bewertungen ein, um Profile fairer zu machen. Reibungslose Fahrten erhalten 5 Sterne.',
        getGoing: 'Los geht\'s',
        testimonialTitle: 'Nur bei Baggo...',
        testimonialQuote: 'Perfekt für mich, weil ich sowohl Mitfahrgelegenheit ALS AUCH Bus mag! Mitfahrgelegenheit, um neue Leute kennenzulernen.',
        testimonialAuthor: 'Anna, Baggo-Mitglied seit 2024',
    },
    pt: {
        carpool: 'Partilha de carro',
        bus: 'Autocarro',
        offerRide: 'Oferecer boleia',
        getApp: 'Obter a app',
        heroTitle: 'Autocarro e partilha de carro.',
        heroSubtitle: 'Viaje à sua maneira',
        heroWith: 'com Baggo.',
        leavingFrom: 'Partida de',
        goingTo: 'Indo para',
        today: 'Hoje',
        passengers: '1 passageiro',
        search: 'Pesquisar',
        showStays: 'Mostrar estadias',
        promoTitle: 'Partilhe a sua viagem. Reduza os seus custos.',
        promoDesc: 'Partilhe o carro como condutor para transformar os seus lugares vazios em custos mais baixos. Publique a sua viagem.',
        shareRide: 'Partilhe a sua viagem',
        featureTitle1: 'Viaje para todo o lado',
        featureDesc1: 'Explore o mundo à sua maneira, com uma enorme escolha de autocarros e inúmeras boleias partilhadas.',
        featureTitle2: 'A sua escolha de viagens',
        featureDesc2: 'Não importa para onde vai, de autocarro ou partilha de carro, encontre a viagem perfeita da nossa vasta gama de destinos.',
        featureTitle3: 'Confie em quem viaja consigo',
        featureDesc3: 'Dedicamos tempo a conhecer cada um dos nossos membros. Verificamos avaliações, perfis e identificações.',
        tripTypeTitle: 'Como vai viajar hoje?',
        byBus: 'De autocarro',
        busDesc: 'Explore milhares de rotas em todo o mundo com descontos incríveis',
        byCarpool: 'De partilha de carro',
        carpoolDesc: 'Partilhe os custos para viajar diretamente para o seu destino',
        ratingsTitle: 'Avaliações Automáticas.',
        ratingsSubtitle: 'Viagens mais',
        ratingsSubtitle2: 'confiáveis.',
        ratingsDesc: 'Estamos a lançar Avaliações Automáticas para tornar os perfis mais justos. Viagens tranquilas recebem 5 estrelas.',
        getGoing: 'Começar',
        testimonialTitle: 'Apenas no Baggo...',
        testimonialQuote: 'Perfeito para mim porque gosto de partilha de carro E de autocarro! Partilha de carro para conhecer novas pessoas.',
        testimonialAuthor: 'Anna, membro Baggo desde 2024',
    }
};

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
            if (!localStorage.getItem('baggo_language') || !localStorage.getItem('baggo_currency')) {
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();

                    if (!localStorage.getItem('baggo_currency') && data.currency) {
                        setCurrency(data.currency);
                    }
                    if (!localStorage.getItem('baggo_language') && data.languages) {
                        // e.g "en-US,en;q=0.9" -> "en"
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
        currentLangData: languages.find(l => l.code === currentLanguage) || languages[0]
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
