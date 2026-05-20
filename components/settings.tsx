'use client';


import {useLocalStorage} from "react-use";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";

export interface Settings {
    quickLoad: boolean;
    baseLayer: 'Satellite' | 'Street Map';
    showDataOnMouseOver: boolean;
    interpolateDataMouseOver: boolean;
    displayDataArea: boolean;
    displayTempScale: boolean;
    displayWindScale: boolean;
    showObscureUnits: boolean;

    displayDataPickerPoints: boolean;
    forceGraphsToZero: boolean;

    "24HourTime": boolean;
    windSpeedUnit: 'm/s' | 'km/h' | 'kt' | 'mph' | 'c',
    currentSpeedUnit: 'm/s' | 'km/h' | 'kt' | 'mph' | 'c',
    temperatureUnit: 'C' | 'K' | 'F',

    "windParticles.enabled": boolean;
    "windParticles.particleMultiplier": number;
    "windParticles.opacity": number;
    "windBarbs.enabled": boolean;

    "windBarbs.count": number;
    "windColors.enabled": boolean;

    "windColors.count": number;
    "windColors.opacity": number;
    
    "temperatureColors.enabled": boolean;
    "temperatureColors.quantized": boolean;
    "temperatureColors.count": number;
    "temperatureColors.opacity": number;
    "oceanTemperatureColors.enabled": boolean;

    "oceanTemperatureColors.count": number;
    "oceanTemperatureColors.quantized": boolean;
    "oceanTemperatureColors.opacity": number;

    "currentArrows.enabled": boolean;
    "currentArrows.count": number;

    "currentParticles.enabled": boolean;
    "currentParticles.particleMultiplier": number;
    "currentParticles.opacity": number;

    region: 'perth' | 'greaterPerth'
}

const DEFAULT_GRID_RESOLUTION = 90

const defaultSettings: Settings = {
    quickLoad: false,
    baseLayer: 'Satellite',
    showObscureUnits: false,
    displayDataPickerPoints: false,
    forceGraphsToZero: false,
    "24HourTime": false,
    showDataOnMouseOver: true,
    interpolateDataMouseOver: true,
    displayDataArea: false,

    region: 'perth',

    windSpeedUnit: 'kt',
    currentSpeedUnit: 'km/h',
    temperatureUnit: 'C',

    "currentArrows.count": 30,
    "currentArrows.enabled": false,

    "oceanTemperatureColors.enabled": false,
    "oceanTemperatureColors.count": DEFAULT_GRID_RESOLUTION,
    "oceanTemperatureColors.opacity": 0.6,
    "oceanTemperatureColors.quantized": false,

    "currentParticles.enabled": false,
    "currentParticles.opacity": 0.97,
    "currentParticles.particleMultiplier": 1,

    "windBarbs.enabled": false,
    "windBarbs.count": 15,

    "windColors.enabled": false,
    "windColors.count": DEFAULT_GRID_RESOLUTION,
    "windColors.opacity": 0.6,

    "windParticles.enabled": true,
    "windParticles.particleMultiplier": 1,
    "windParticles.opacity": 0.97,

    "temperatureColors.enabled": false,
    "temperatureColors.count": DEFAULT_GRID_RESOLUTION,
    "temperatureColors.opacity": 0.6,
    "temperatureColors.quantized": false,

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

        if (setting === 'showObscureUnits' && value === false) {
            if (['c', 'mph'].includes(newSettings.currentSpeedUnit)) {
                newSettings.currentSpeedUnit = 'kt';
            }
            if (['c', 'mph'].includes(newSettings.windSpeedUnit)) {
                newSettings.windSpeedUnit = 'kt';
            }
            if (['K'].includes(newSettings.temperatureUnit)) {
                newSettings.temperatureUnit = 'C';
            }
        }
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