'use client';


import {useLocalStorage} from "react-use";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";

export interface Settings {
    displayTempScale: boolean;
    displayWindScale: boolean;

    speedUnit: 'm/s' | 'km/h' | 'kt',

    "windParticles.enabled": boolean;
    "windParticles.particleMultiplier": number;

    "windBarbs.enabled": boolean;
    "windBarbs.count": number;

    "windColors.enabled": boolean;
    "windColors.count": number;
    "windColors.opacity": number;

    "temperatureColors.enabled": boolean;
    "temperatureColors.count": number;
    "temperatureColors.opacity": number;

    dataSource: 'netCDF' | 'grib'
    region: 'perth' | 'greaterPerth' | 'greatBarrierReef';
    gribFile: null | string;
}

const defaultSettings: Settings = {
    dataSource: 'netCDF',
    region: 'perth',
    gribFile: 'cwa_atmosphere',

    speedUnit: 'kt',

    "windBarbs.count": 15,

    "windBarbs.enabled": false,
    "windColors.count": 30,
    "windColors.enabled": false,

    "windColors.opacity": 0.6,
    "windParticles.enabled": true,

    "windParticles.particleMultiplier": 1,
    "temperatureColors.count": 30,
    "temperatureColors.enabled": false,
    "temperatureColors.opacity": 0.6,

    displayTempScale: true,
    displayWindScale: true
};

const SettingsContext = createContext<{
    settings: Settings,
    setSetting: <K extends keyof Settings>(setting: K, value: Settings[K]) => void,
    isLoaded: boolean
}>({
    settings: defaultSettings, setSetting: () => {
    }, isLoaded: false
})

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({children}: { children: ReactNode }) {
    const [settingsStorage, setSettingStorage] = useLocalStorage<Settings>('settings', defaultSettings);
    const [loaded, setLoaded] = useState<boolean>(false);
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
            setSettings(Object.assign({}, defaultSettings, settingsStorage));
            setLoaded(true);
        }
    }, [settings, settingsStorage])

    return <SettingsContext.Provider
        value={{setSetting, settings: settings ?? defaultSettings, isLoaded: loaded}}>
        {children}
    </SettingsContext.Provider>
}