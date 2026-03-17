export function zip<T>(...rows: T[][]): T[][] {
    // snippet from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    return [...rows[0]].map((_, c) => rows.map(row => row[c]))
}


function mix(a: number, b: number, v: number) {
    return (1 - v) * a + v * b;
}

export function hsvToRgb(H: number, S: number, V: number) {
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