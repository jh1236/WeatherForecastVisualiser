'use client';


import {useLocalStorage} from "react-use";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";

interface Settings {
    displayColorScale: boolean;

    "windParticles.enabled": boolean;
    "windParticles.particleMultiplier": number;

    "windBarbs.enabled": boolean;
    "windBarbs.count": number;

    "windColors.enabled": boolean;
    "windColors.count": number;

    dataSource: 'netCDF' | 'grib'
    gribFile: null | string;
}

const defaultSettings: Settings = {
    dataSource: 'netCDF',
    gribFile: 'cwa_atmosphere',
    "windBarbs.count": 30,
    "windColors.count": 60,
    "windBarbs.enabled": false,
    "windColors.enabled": false,
    "windParticles.enabled": true,
    "windParticles.particleMultiplier": 1,
    displayColorScale: false
};

const SettingsContext = createContext<{
    settings: Settings,
    setSetting: <K extends keyof Settings>(setting: K, value: Settings[K]) => void
}>({
    settings: defaultSettings, setSetting: () => {
    }
})

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({children}: { children: ReactNode }) {
    const [settingsStorage, setSettingStorage] = useLocalStorage<Settings>('settings', defaultSettings);
    const [settings, setSettings] = useState<Settings>();

    const setSetting = <K extends keyof Settings>(setting: K, value: Settings[K]) => {
        const current = settings ?? defaultSettings;
        const newSettings = {...current, [setting]: value};
        setSettings(newSettings);
        setSettingStorage(newSettings);
    }
    useEffect(() => {
        if (settings === undefined && settingsStorage) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSettings(settingsStorage);
        }
    }, [settings, settingsStorage])

    return <SettingsContext.Provider value={{setSetting, settings: settings ?? defaultSettings}}>
        {children}
    </SettingsContext.Provider>
}