import {LatLng} from "leaflet";

export function zip<T extends unknown[][]>(
    ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
    // Source: https://stackoverflow.com/a/70192772/6053417
    const minLength = Math.min(...args.map((arr) => arr.length));
    // @ts-expect-error This is too much for ts
    return [...Array(minLength).keys()].map((i) => args.map((arr) => arr[i]));
}

export function lerp(a: number, b: number, t: number, clamp = true) {
    if (clamp && t > 1 || a === undefined) {
        return b;
    } else if (clamp && t < 0 || b === undefined) {
        return a;
    }
    return a + (b - a) * t;
}

export function convertToDMS(deg: number, brief: boolean = false): string {
    //excerpt from https://stackoverflow.com/a/5786281
    const out = [0 | deg, '° ', 0 | (deg = (deg < 0 ? -deg : deg) + 1e-4) % 1 * 60, "' "];
    if (!brief) {
        out.push(...[0 | deg * 60 % 1 * 60, '"'])
    }
    return out.join('');
}

export function latLngToDMS(latLng: LatLng, brief: boolean = false) {
    return `${convertToDMS(Math.abs(latLng.lat), brief)} ${latLng.lat > 0 ? 'N' : 'S'}, ${convertToDMS(latLng.lng, brief)} E`
}

export function roundTo(n: number, digits: number) {
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
}

function mix(a: number, b: number, v: number) {
    return (1 - v) * a + v * b;
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

export function getColorFromWindSpeedKts(windspeed: number, saturation: number = 0.9) {
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
    return `rgb(${r} ${g} ${b})`
}


export function getColorFromTemperature(temp: number) {

    const adjustedTemp = (temp - 5) / 32;
    // const t = clamp(.7 * (adjustedTemp), 0, 1);
    //y=0.0004375x^{2}+0x+0
    const factor = 0.75
    let t = clamp(-factor * (adjustedTemp - 2) * (adjustedTemp), 0, 1);
    if (adjustedTemp <= 0) {
        t = 0
    } else if (adjustedTemp > 1) {
        t = factor + (adjustedTemp - 1) * 0.9;
    }
    const hue = lerp(240, -100, t)
    let value = 0.8
    if (temp > 30) {
        // turn black at approximately 90 deg C
        value = lerp(0.8, 0, (temp - 30) / 30)
    }
    let saturation = 1
    if (temp < 5) {
        saturation = lerp(0.2, 1, 1 - (1 - (temp + 5) / 10) * (1 - (temp + 5) / 10))
    }
    const {
        r,
        g,
        b
    } = hsvToRgb(
        hue,
        saturation,
        value
    )

    return `rgb(${r} ${g} ${b})`
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

export function camelCaseToTitleCase(s: string) {
    // snippet from https://stackoverflow.com/a/7225450
    const result = s.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
}

export function convertScientificNotationNumber(value: number, sigFigs?: number) {
// snippet from https://stackoverflow.com/a/73709990
    const decimalsPart = value?.toString()?.split('.')?.[1] || '';
    const eDecimals = Number(decimalsPart?.split('e-')?.[1]) || 0;
    const countOfDecimals = (sigFigs ?? decimalsPart.length) + eDecimals;
    return Number(value).toFixed(countOfDecimals);
}

export function clamp(value: number, min: number, max: number) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

