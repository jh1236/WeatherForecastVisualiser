import {Settings, useSettings} from "@/components/settings";
import {convertScientificNotationNumber, roundTo} from "@/components/utilities";

const SPEED_OF_LIGHT = 299792458

const convertToMps: { [key in Settings['currentSpeedUnit']]: number } = {
    'kt': 0.514444,
    'km/h': 0.277778,
    'm/s': 1,
    'mph': 0.44704,
    'c': SPEED_OF_LIGHT
}

const convertTodegC: { [key in Settings['temperatureUnit']]: (v: number) => number } = {
    C: a => a,
    K: a => a - 273.15,
    F: a => (a - 32) * 5 / 9
}

const convertFromdegC: { [key in Settings['temperatureUnit']]: (v: number) => number } = {
    C: a => a,
    K: a => a + 273.15,
    F: a => (a * 9 / 5) + 32
}

export function to12HourTime(value: string) {
    const [hours, minutes] = value.split(":");
    if (+hours >= 12) {
        return `${+hours > 12 ? +hours - 12 : 12}:${minutes} PM`;
    }
    return `${+hours === 0 ? 12 : +hours}:${minutes} AM`;
}

export function from12HourTime(value: string) {
    const [hours, minutesAndPostscript] = value.split(":");
    const [minutes, postscript] = minutesAndPostscript.split(" ");
    if (postscript.startsWith('P')) {
        return `${((+hours + 12) % 24).toString().padStart(2, '0')}:${minutes}`;
    }
    return `${(+hours).toString().padStart(2, '0')}:${minutes}`;
}

type UnitMap = {
    windSpeed: Settings['windSpeedUnit'];
    temperature: Settings['temperatureUnit'];
    oceanTemperature: Settings['temperatureUnit'];
    current: Settings['currentSpeedUnit'];
};

export function useUserUnits(): <T extends keyof UnitMap>(type: T, value: number, unit?: UnitMap[T]) => number {
    const convertWindspeed = useWindSpeedInUserUnits()
    const convertTemperature = useTemperatureInUserUnits()
    const convertCurrent = useCurrentSpeedInUserUnits()
    return <T extends keyof UnitMap>(type: T, value: number, unit: UnitMap[T] | undefined) => {
        switch (type) {
            case 'windSpeed':
                return convertWindspeed(value, (unit as UnitMap['windSpeed'] | undefined) ?? 'kt')
            case 'temperature':
            case 'oceanTemperature':
                return convertTemperature(value, (unit as UnitMap['temperature'] | undefined) ?? 'C')
            case 'current':
                return convertCurrent(value, (unit as UnitMap['current'] | undefined) ?? 'kt');
        }

        throw new Error(`Unknown type ${type}`);
    }

}

export function useConvertToUserUnitsAndFormat(): <T extends keyof UnitMap>(type: T, value: number, unit?: UnitMap[T], decimalPlaces?: number) => string {
    const converter = useUserUnits()
    const formatter = useFormatUserUnits()
    return <T extends keyof UnitMap>(type: T, value: number, unit: UnitMap[T] | undefined, decimalPlaces: number | undefined) =>
        formatter(type, converter(type, value, unit), decimalPlaces)


}

function formatSpeed(value: number, unit: Settings['currentSpeedUnit'], decimalPlaces?: number) {
    if (unit === 'c') {
        return convertScientificNotationNumber(value, 2) + 'c'
    }
    return `${roundTo(value, decimalPlaces ?? 1)}${unit}`;
}

function formatTemp(value: number, unit: Settings['temperatureUnit'], decimalPlaces?: number) {
    return `${roundTo(value, decimalPlaces ?? 1)}°${unit}`;
}

export function useFormatUserUnits(): <T extends keyof UnitMap>(type: T, value: number, decimalPlaces?: number) => string {
    const {settings} = useSettings();
    return <T extends keyof UnitMap>(type: T, value: number, decimalPlaces: number | undefined) => {
        switch (type) {
            case 'windSpeed':
                return formatSpeed(value, settings.windSpeedUnit, decimalPlaces);
            case 'temperature':
            case 'oceanTemperature':
                return formatTemp(value, settings.temperatureUnit, decimalPlaces);
            case 'current':
                return formatSpeed(value, settings.currentSpeedUnit, decimalPlaces);
        }

        throw new Error(`Unknown type ${type}`);
    }
}


export function useTimeInUserUnits(): (valueIn: string, is24Hour?: boolean) => string {
    const {settings} = useSettings()
    return (valueIn: string, is24Hour: boolean = true) => {
        let _24HourTime = valueIn
        if (!is24Hour) {
            _24HourTime = from12HourTime(valueIn)
        }
        return settings["24HourTime"] ? _24HourTime : to12HourTime(_24HourTime)
    };
}

export function useWindSpeedInUserUnits(): (valueIn: number, unitType: Settings['windSpeedUnit']) => number {
    const {settings} = useSettings()
    return (valueIn: number, unitType: Settings['windSpeedUnit'] = 'kt') => {
        const mps = valueIn * convertToMps[unitType as Settings['windSpeedUnit']];
        return mps / convertToMps[settings.windSpeedUnit]
    };
}

export function useCurrentSpeedInUserUnits(): (valueIn: number, unitType: Settings['currentSpeedUnit']) => number {
    const {settings} = useSettings()
    return (valueIn: number, unitType: Settings['currentSpeedUnit']) => {
        const mps = valueIn * convertToMps[unitType as Settings['currentSpeedUnit']];
        return mps / convertToMps[settings.currentSpeedUnit];
    }
}


export function useTemperatureInUserUnits(): (valueIn: number, unitType: Settings['temperatureUnit']) => number {
    const {settings} = useSettings()
    return (valueIn: number, unitType: Settings['temperatureUnit']) => {
        const degC = convertTodegC[unitType as Settings['temperatureUnit']](valueIn);
        return convertFromdegC[settings.temperatureUnit](degC);
    }

}

export function mpsToKnots(mps: number) {
    const mpsToKtConversionFactor = 1.94384;
    return mps * mpsToKtConversionFactor;
}

export function knotsToMps(knots: number) {
    const mpsToKtConversionFactor = 1.94384;
    return knots / mpsToKtConversionFactor;
}