import {lerp} from "@/components/utilities";

export function realignDataToGrid(latRho: number[][], lonRho: number[][], ...data: number[][][][]): {
    lat: number[],
    lon: number[],
    data: number[][][]
} {
    const minLat = latRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLat = latRho.flat().reduce((a, b) => Math.max(a, b));
    const minLng = lonRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLng = lonRho.flat().reduce((a, b) => Math.max(a, b));
    const nLat = latRho.length;
    const nLng = latRho[0].length;
    const dLat = (maxLat - minLat) / nLat;
    const dLng = (maxLng - minLng) / nLng;

    const datas: number[][][][] = data.map(t => t.map(() => latRho.flat().map(() => [])))

    for (let i = 0; i < nLat; i++) {
        for (let j = 0; j < nLng; j++) {
            const lat = latRho[i][j];
            const lng = lonRho[i][j];
            const latIdx = Math.max(0, Math.min(nLat - 1, Math.round((lat - minLat) / dLat)));
            const lngIdx = Math.max(0, Math.min(nLng - 1, Math.round((lng - minLng) / dLng)));
            for (let k = 0; k < data.length; k++) {
                for (let t = 0; t < data[k].length; t++) {
                    const value = data[k][t][i][j];
                    if (value > 1e30) {
                        datas[k][t][latIdx * nLng + lngIdx].push(NaN)
                        continue;
                    }
                    for (let d1 = -1; d1 <= 1; d1++) {
                        for (let d2 = -1; d2 <= 1; d2++) {
                            const wiggleLatIdx = Math.max(0, Math.min(nLat - 1, latIdx + d1));
                            const wiggleLngIdx = Math.max(0, Math.min(nLng - 1, lngIdx + d2));
                            datas[k][t][wiggleLatIdx * nLng + wiggleLngIdx].push(value)
                        }
                    }
                }
            }
        }
    }
    const latOut = []
    const lonOut = []
    for (let i = 0; i < latRho.length; i++) {
        latOut.push(minLat + i * dLat);
    }
    for (let j = 0; j < lonRho[0].length; j++) {
        lonOut.push(minLng + j * dLng);
    }
    const ret = datas.map(it => it.map(it2 => it2.map(it3 => it3.reduce((a, b) => a + b, 0) / it3.length)));
    return {
        data: ret,
        lat: latOut,
        lon: lonOut
    }
}


function biLinearInterpolation(a: number, b: number, c: number, d: number, t1: number, t2: number) {
    const abLerp = lerp(a, b, t1)
    const cdLerp = lerp(c, d, t1)
    return lerp(abLerp, cdLerp, t2)
}

export function newRealignDataToGrid(latRho: number[][], lonRho: number[][], ...data: number[][][][]): {
    lat: number[],
    lon: number[],
    data: number[][][]
} {
    const minLat = latRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLat = latRho.flat().reduce((a, b) => Math.max(a, b));
    const minLon = lonRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLon = lonRho.flat().reduce((a, b) => Math.max(a, b));
    const nx = latRho[0].length;
    const dLat = (maxLat - minLat) / latRho.length;
    const dLon = (maxLon - minLon) / nx;

    const datas: number[][][] = data.map(d => d.map(() => []))

    const latOut = []
    const lonOut = []
    for (let i = 0; i < latRho.length; i++) {
        const lat = minLat + i * dLat
        latOut.push(lat);

        let lngIdxUpper = 0
        let latIdxUpper = 0

        for (let j = 0; j < lonRho[0].length; j++) {
            const lon = minLon + j * dLon;
            if (i === 0) {
                // only push to longs on first iteration
                lonOut.push(lon)
            }
            while (latRho[latIdxUpper][lngIdxUpper] < lat) {
                latIdxUpper++;
            }
            while (lonRho[latIdxUpper][lngIdxUpper] < lon) {
                lngIdxUpper++;
            }
            const latIdxLower = Math.max(0, latIdxUpper - 1)
            const lngIdxLower = Math.max(0, lngIdxUpper - 1)
            const latLower = latRho[latIdxLower][lngIdxLower]
            const lngLower = lonRho[latIdxLower][lngIdxLower]
            const latUpper = latRho[latIdxUpper][lngIdxUpper]
            const lngUpper = lonRho[latIdxUpper][lngIdxUpper]
            const latT = (lat - latLower) / (latUpper - latLower);
            const lngT = (lon - lngLower) / (lngUpper - lngLower);
            // const latT = (latRho[latIdxLower][lngIdxLower] / dLat) % 1;
            // const lngT = (lonRho[latIdxLower][lngIdxLower] / dLon) % 1;

            for (let k = 0; k < data.length; k++) {
                for (let t = 0; t < data[k].length; t++) {
                    let value = biLinearInterpolation(
                        data[k][t][latIdxLower][lngIdxLower], data[k][t][latIdxUpper][lngIdxLower],
                        data[k][t][latIdxLower][lngIdxUpper], data[k][t][latIdxUpper][lngIdxUpper], latT, lngT);
                    if (value > 1e30) {
                        value = NaN;
                    }
                    datas[k][t][i * nx + j] = value
                }
            }
        }
    }
    return {data: datas, lat: latOut, lon: lonOut}
}

