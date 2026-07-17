import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/ng/app/bago/id6758903056';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.deracali.boltexponativewind&hl=en';
const DISMISSED_KEY = 'bago_app_download_banner_dismissed_v1';

const getMobilePlatform = () => {
    if (typeof navigator === 'undefined') return null;

    const userAgent = navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isAndroid) return 'android';
    if (isIOS) return 'ios';
    return null;
};

const AppDownloadBanner = () => {
    const [platform, setPlatform] = useState(null);
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        const mobilePlatform = getMobilePlatform();
        const dismissed = window.localStorage.getItem(DISMISSED_KEY) === 'true';
        setPlatform(mobilePlatform);
        setIsDismissed(dismissed);
    }, []);

    if (!platform || isDismissed) return null;

    const isIOS = platform === 'ios';
    const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    const deviceName = isIOS ? 'iPhone' : 'Android';
    const storeName = isIOS ? 'App Store' : 'Google Play';

    const dismiss = () => {
        window.localStorage.setItem(DISMISSED_KEY, 'true');
        setIsDismissed(true);
    };

    return (
        <aside className="relative z-[70] bg-[#21164F] text-white" aria-label="Download the Bago app">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                <img
                    src="/bago_logo.png"
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
                />
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-bold">Get Bago for {deviceName}</p>
                    <p className="truncate text-xs text-white/75">Faster access with the Bago app</p>
                </div>
                <a
                    href={storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-full bg-[#FFD84D] px-4 py-2 text-xs font-extrabold text-[#21164F] transition hover:bg-white"
                    aria-label={`Get Bago on the ${storeName}`}
                >
                    Get app
                </a>
                <button
                    type="button"
                    onClick={dismiss}
                    className="shrink-0 rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Dismiss app download suggestion"
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
};

export default AppDownloadBanner;
