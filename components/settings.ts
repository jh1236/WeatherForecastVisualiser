'use client';


import {useLocalStorage} from "react-use";

interface Settings {
    displayColorScale: boolean;
}

const defaultSettings = {displayColorScale: false};

export function useSettings(): { settings: Settings, setSettings: (prev: Settings) => void } {
    const [settings, setSettings] = useLocalStorage<Settings>('settings');
    return {settings: settings ?? defaultSettings, setSettings}
}