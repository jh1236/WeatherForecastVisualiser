export function zip<T extends unknown[][]>(
    ...args: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
    // Source: https://stackoverflow.com/a/70192772/6053417
    const minLength = Math.min(...args.map((arr) => arr.length));
    // @ts-expect-error This is too much for ts
    return [...Array(minLength).keys()].map((i) => args.map((arr) => arr[i]));
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

export function getColorFromCurrentKts(current: number) {

    const {
        r,
        g,
        b
    } = hsvToRgb(240, 1.0, 0.5 * lerp(1, 0, current / 3) + 0.25)
    // const {r, g, b} = hsvToRgb(count! * 360, 0.7, 0.7)
    return `rgb(${r} ${g} ${b})`
}

export function getColorFromTemperature(temp: number) {

    const temperature = 1.1 * temp + 5
    const valueAdjustFactor = 0.0
    const satAdjustFactor = 0.7
    const hueAdjustFactor = 0.6
    // const t = (1 - (1 - temperature / 50) * (1 - temperature / 50)) * hueAdjustFactor + (temperature / 50) * (1 - hueAdjustFactor);
    const t = (1 - (Math.cos(Math.PI * temperature / 50) + 1) / 2) * hueAdjustFactor + (temperature / 50) * (1 - hueAdjustFactor);
    const whiteningCutoff = 12
    const {
        r,
        g,
        b
    } = hsvToRgb(-t * 360 - 40, temperature > whiteningCutoff ? 1 : (1 - satAdjustFactor) * (temperature / whiteningCutoff) + satAdjustFactor * (1 - (1 - temperature / whiteningCutoff) * (1 - temperature / whiteningCutoff)), temperature < whiteningCutoff ?
        lerp(0.8, 0.4, temperature / whiteningCutoff) :
        lerp(0.4, 0.9, valueAdjustFactor * ((temperature - whiteningCutoff) / 45) * ((temperature - whiteningCutoff) / 45) + ((temperature - whiteningCutoff) / 45) * (1 - valueAdjustFactor)))

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
