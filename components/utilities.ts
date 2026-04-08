import {useSettings} from "@/components/settings";

export function zip<T>(...rows: T[][]): T[][] {
    // snippet from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    return [...rows[0]].map((_, c) => rows.map(row => row[c]))
}

export function lerp(a: number, b: number, t: number) {
    if (t > 1 || a === undefined) {
        return b;
    } else if (t < 0 || b === undefined) {
        return a;
    }
    return a + (b - a) * t;
}

export function convertToDMS(deg: number) {
    //excerpt from https://stackoverflow.com/a/5786281
    return [0 | deg, '° ', 0 | (deg = (deg < 0 ? -deg : deg) + 1e-4) % 1 * 60, "' ", 0 | deg * 60 % 1 * 60, '"'].join('');
}


export function roundTo(n: number, digits: number) {
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
}

function mix(a: number, b: number, v: number) {
    return (1 - v) * a + v * b;
}

const convertToMps: {
    'm/s': number,
    'kt': number,
    'km/h': number
} = {
    'kt': 0.514444,
    'km/h': 0.277778,
    'm/s': 1
}

export function useSpeedInUserUnits(valueIn: number, unitType: 'm/s' | 'kt' | 'km/h') {
    const mps = valueIn * convertToMps[unitType];
    const {settings} = useSettings()
    return mps / convertToMps[settings.speedUnit];
}

export function mpsToKnots(mps: number) {
    const mpsToKtConversionFactor = 1.94384;
    return mps * mpsToKtConversionFactor;
}

export function knotsToMps(knots: number) {
    const mpsToKtConversionFactor = 1.94384;
    return knots / mpsToKtConversionFactor;
}

export function hsvToRgb(H: number, S: number, V: number) {
    const trueH = ((H % 360) + 360) % 360
    //from https://stackoverflow.com/a/31490738
    const V2 = V * (1 - S);
    const r = ((trueH >= 0 && trueH <= 60) || (trueH >= 300 && trueH <= 360)) ? V : ((trueH >= 120 && trueH <= 240) ? V2 : ((trueH >= 60 && trueH <= 120) ? mix(V, V2, (trueH - 60) / 60) : ((trueH >= 240 && trueH <= 300) ? mix(V2, V, (trueH - 240) / 60) : 0)));
    const g = (trueH >= 60 && trueH <= 180) ? V : ((trueH >= 240 && trueH <= 360) ? V2 : ((trueH >= 0 && trueH <= 60) ? mix(V2, V, trueH / 60) : ((trueH >= 180 && trueH <= 240) ? mix(V, V2, (trueH - 180) / 60) : 0)));
    const b = (trueH >= 0 && trueH <= 120) ? V2 : ((trueH >= 180 && trueH <= 300) ? V : ((trueH >= 120 && trueH <= 180) ? mix(V2, V, (trueH - 120) / 60) : ((trueH >= 300 && trueH <= 360) ? mix(V, V2, (trueH - 300) / 60) : 0)));

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function getColorFromWindSpeedKts(windspeed: number, saturation: number = 0.7) {
    let interpolatedWindspeed = windspeed;
    const f = 30
    if (interpolatedWindspeed < f) {
        interpolatedWindspeed = f - (Math.pow(f - interpolatedWindspeed, 2) / f)
    }
    const {
        r,
        g,
        b
    } = hsvToRgb((180 - interpolatedWindspeed / 32 * 180) % 360, saturation, Math.max(0.2, Math.min(0.7, 0.7 - ((interpolatedWindspeed - 40) * .02))))
    // const {r, g, b} = hsvToRgb(count! * 360, 0.7, 0.7)
    return `rgb(${r},${g},${b})`
}

export function getColorFromTemperature(temperature: number) {
    const t = temperature / 55;
    const {
        r,
        g,
        b
    } = hsvToRgb(-t * 360 - 50, 1.0, temperature < 40 ? lerp(0.4, 0.9, temperature / 40) : 0.9)
    // const {r, g, b} = hsvToRgb(count! * 360, 0.7, 0.7)
    return `rgb(${r},${g},${b})`
}

export function divMod(numerator: number, denominator: number) {
    return [numerator / denominator, numerator % denominator];
}

export function floorCeil(x: number): [number, number] {
    return [Math.floor(x), Math.ceil(x)];
}

export function generateHash(string: string) {
    //snippet from https://stackoverflow.com/a/7616484
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Constrain to 32bit integer
    }
    return hash;
}
