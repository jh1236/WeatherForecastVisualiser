export function zip<T>(...rows: T[][]): T[][] {
    // snippet from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    return [...rows[0]].map((_, c) => rows.map(row => row[c]))
}

export const WEIRDNESS_THRESHOLD = 145

export function lerp(a: number, b: number, t: number) {
    if (t > 1) {
        return b;
    } else if (t < 0) {
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

export function mpsToKnots(mps: number) {
    const mpsToKtConversionFactor = 1.94384;
    return mps * mpsToKtConversionFactor;
}

export function knotsToMps(knots: number) {
    const mpsToKtConversionFactor = 1.94384;
    return knots / mpsToKtConversionFactor;
}

export function hsvToRgb(H: number, S: number, V: number) {
    //from https://stackoverflow.com/a/31490738
    const V2 = V * (1 - S);
    const r = ((H >= 0 && H <= 60) || (H >= 300 && H <= 360)) ? V : ((H >= 120 && H <= 240) ? V2 : ((H >= 60 && H <= 120) ? mix(V, V2, (H - 60) / 60) : ((H >= 240 && H <= 300) ? mix(V2, V, (H - 240) / 60) : 0)));
    const g = (H >= 60 && H <= 180) ? V : ((H >= 240 && H <= 360) ? V2 : ((H >= 0 && H <= 60) ? mix(V2, V, H / 60) : ((H >= 180 && H <= 240) ? mix(V, V2, (H - 180) / 60) : 0)));
    const b = (H >= 0 && H <= 120) ? V2 : ((H >= 180 && H <= 300) ? V : ((H >= 120 && H <= 180) ? mix(V2, V, (H - 120) / 60) : ((H >= 300 && H <= 360) ? mix(V, V2, (H - 300) / 60) : 0)));

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function getColorFromWindSpeedKts(windspeed: number) {
    const {r, g, b} = hsvToRgb(((180 + 360) - windspeed / 32 * 180) % 360, 0.7, Math.max(0.2, Math.min(0.6, 0.6 - ((windspeed - 40) * .02))))
    // const {r, g, b} = hsvToRgb(count! * 360, 0.7, 0.7)
    return `rgb(${r},${g},${b})`
}
