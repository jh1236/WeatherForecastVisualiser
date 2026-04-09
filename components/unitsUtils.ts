import {useSettings} from "@/components/settings";

const convertToMps: {
    'm/s': number,
    'kt': number,
    'km/h': number
} = {
    'kt': 0.514444,
    'km/h': 0.277778,
    'm/s': 1
}

export function useWindSpeedInUserUnits(valueIn: number, unitType: 'm/s' | 'kt' | 'km/h') {
    const mps = valueIn * convertToMps[unitType];
    const {settings} = useSettings()
    return mps / convertToMps[settings.windSpeedUnit];
}

export function useCurrentSpeedInUserUnits(valueIn: number, unitType: 'm/s' | 'kt' | 'km/h') {
    const mps = valueIn * convertToMps[unitType];
    const {settings} = useSettings()
    return mps / convertToMps[settings.currentSpeedUnit];
}

export function mpsToKnots(mps: number) {
    const mpsToKtConversionFactor = 1.94384;
    return mps * mpsToKtConversionFactor;
}

export function knotsToMps(knots: number) {
    const mpsToKtConversionFactor = 1.94384;
    return knots / mpsToKtConversionFactor;
}