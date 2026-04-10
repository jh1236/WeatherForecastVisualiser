import {Settings, useSettings} from "@/components/settings";

const convertToMps: {[key in Settings['currentSpeedUnit']]: number} = {
    'kt': 0.514444,
    'km/h': 0.277778,
    'm/s': 1,
    'mph': 0.44704
}

const convertTodegC: {[key in Settings['temperatureUnit']]: (v: number) => number} = {
    C: a => a,
    K: a => a - 273.15,
    F: a => (a - 32) * 5 / 9
}

const convertFromdegC: {[key in Settings['temperatureUnit']]: (v: number) => number} = {
    C: a => a,
    K: a => a + 273.15,
    F: a => (a  * 9 / 5) + 32
}

export function useWindSpeedInUserUnits(valueIn: number, unitType: Settings['windSpeedUnit']) {
    const mps = valueIn * convertToMps[unitType];
    const {settings} = useSettings()
    return mps / convertToMps[settings.windSpeedUnit];
}

export function useCurrentSpeedInUserUnits(valueIn: number, unitType: Settings['currentSpeedUnit']) {
    const mps = valueIn * convertToMps[unitType];
    const {settings} = useSettings()
    return mps / convertToMps[settings.currentSpeedUnit];
}

export function useTemperatureInUserUnits(valueIn: number | undefined, unitType: Settings['temperatureUnit']) {
    const {settings} = useSettings()
    if (valueIn === undefined) return undefined;
    const degC = convertTodegC[unitType](valueIn);
    return convertFromdegC[settings.temperatureUnit](degC);
}

export function mpsToKnots(mps: number) {
    const mpsToKtConversionFactor = 1.94384;
    return mps * mpsToKtConversionFactor;
}

export function knotsToMps(knots: number) {
    const mpsToKtConversionFactor = 1.94384;
    return knots / mpsToKtConversionFactor;
}