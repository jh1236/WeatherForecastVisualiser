import {roundTo, zip} from "@/components/utilities";
import {NumberOrNDArray} from "@/components/dataManagement/jsdapWrapper";
import {WeatherData, WeatherDataTimeSnapshot} from "@/components/types";

export function realignDataToGrid(latRho: number[][], lngRho: number[][], ...data: number[][][][]): {
    lat: number[],
    lng: number[],
    data: number[][][]
} {
    const minLat = latRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLat = latRho.flat().reduce((a, b) => Math.max(a, b));
    const minLng = lngRho.flat().reduce((a, b) => Math.min(a, b));
    const maxLng = lngRho.flat().reduce((a, b) => Math.max(a, b));
    const nLat = latRho.length;
    const nLng = latRho[0].length;
    const dLat = (maxLat - minLat) / nLat;
    const dLng = (maxLng - minLng) / nLng;

    const datas: (number[] | number)[][][] = data.map(t => t.map(() => latRho.flat().map(() => [])))
    const latOut = []
    const lngOut = []
    for (let i = 0; i < latRho.length; i++) {
        latOut.push(minLat + i * dLat);
    }
    for (let j = 0; j < lngRho[0].length; j++) {
        lngOut.push(minLng + j * dLng);
    }
    for (let i = 0; i < nLat; i++) {
        for (let j = 0; j < nLng; j++) {
            const lat = latRho[i][j];
            const lng = lngRho[i][j];
            const latIdx = Math.max(0, Math.min(nLat - 1, Math.round((lat - minLat) / dLat)));
            const lngIdx = Math.max(0, Math.min(nLng - 1, Math.round((lng - minLng) / dLng)));
            for (let k = 0; k < data.length; k++) {
                for (let t = 0; t < data[k].length; t++) {
                    const value = data[k][t][i][j];
                    if (value > 1e30) {
                        // the cell does not have a datapoint; we don't want to use it for smoothing
                        continue
                    }
                    datas[k][t][latIdx * nLng + lngIdx] = value // set the value firmly for our true closest
                    for (let d1 = -1; d1 <= 1; d1++) {
                        for (let d2 = -1; d2 <= 1; d2++) {
                            if (d1 === 0 && d2 === 0) continue; //don't fill the centre square here; we fill it outside
                            const wiggleLatIdx = Math.max(0, Math.min(nLat - 1, latIdx + d1));
                            const wiggleLngIdx = Math.max(0, Math.min(nLng - 1, lngIdx + d2));
                            if (Array.isArray(datas[k][t][wiggleLatIdx * nLng + wiggleLngIdx])) {
                                (datas[k][t][wiggleLatIdx * nLng + wiggleLngIdx] as number[]).push(value)
                            }
                        }
                    }

                }
            }
        }
    }

    const ret = datas.map(it => it.map(it2 => it2.map(it3 => {
        if (Array.isArray(it3)) {
            if (it3.length === 0) return NaN
            // this cell was never set directly; so we average all the cells that were set nearby
            return it3.reduce((a, b) => a + b, 0) / it3.length
        } else {
            return it3
        }

    })));
    return {
        data: ret,
        lat: latOut,
        lng: lngOut
    }
}

const netCdfEpoch = Date.UTC(2000, 0, 1)

const SECONDS_TO_MS = 1000;
const DAYS_TO_MS = 24 * 60 * 60 * SECONDS_TO_MS;

export type Bindings = {
    [key in (keyof Bound)]?: string;
};


export const bindingToCode: { [key in (keyof Bound)]?: string } = {
    windU: '0.2.2',
    windV: '0.2.3',
    temperature: '0.0.0',
    waterTemperature: "10.3.0",
    currentU: "10.1.2",
    currentV: "10.1.3",
};

export type Bound = {
    windU?: number[][][],
    windV?: number[][][],
    windTime?: number[],
    temperature?: number[][][],
    temperatureTime?: number[],
    waterTemperature?: number[][],
    waterTemperatureTime?: number[],
    currentU?: number[][],
    currentV?: number[][],
    currentTime?: number[],
    lat?: number[] | number[][],
    lng?: number[] | number[][],
    latRho?: number[][],
    lngRho?: number[][],
};


function getBaseHeader(lats: number[], longs: number[], code: string) {

    const [discipline, parameterCategory, parameterNumber] = code.split('.').map(Number);

    // only moved here so that the function was more readable
    const dx = (longs[longs.length - 1] - longs[0]) / longs.length
    const dy = (lats[lats.length - 1] - lats[0]) / lats.length
    return {
        discipline,
        dx,
        dy,
        la1: lats[0],
        la2: lats[lats.length - 1],
        lo1: longs[0],
        lo2: longs[longs.length - 1],
        nx: longs.length,
        ny: lats.length,
        parameterCategory,
        parameterNumber,
        parameterUnit: "m.s-1",
        refTime: "",
        winds: true,
        basicAngle: 0,
        center: 98,
        forecastTime: 0,
        genProcessType: 0,
        gribEdition: 2,
        gribLength: 29879,
        gridDefinitionTemplate: 0,
        gridUnits: "degrees",
        numberPoints: longs.length * lats.length,
        productDefinitionTemplate: 0,
        productStatus: 0,
        productType: 2,
        resolution: 48,
        scanMode: 64,
        shape: 0,
        significanceOfRT: 0,
        subcenter: 0,
        surface1Type: 1,
        surface1Value: 0,
        surface2Type: 255,
        surface2Value: -9.999e-252,
    };
}


function addDataToWeatherTimeSnapshot(data: Bound,
                                      lats: number[],
                                      longs: number[],
                                      timeKey: keyof Bound,
                                      timeUnit: 'seconds' | 'days',
                                      scalarKeysIn: (keyof Bound)[],
                                      timesOut: {
                                          [p: string]: WeatherDataTimeSnapshot
                                      }) {
    if (data[timeKey] === undefined) return;
    const scalarKeys = scalarKeysIn.filter((i) => data[i] !== undefined)

    const times = data[timeKey] as number[];
    const scalars: (number | number[])[][][] = scalarKeys.map(it => data[it] as (number | number[])[][]);
    for (let t = 0; t < times.length; t++) {
        const convertedTime = netCdfEpoch + times[t]! * (timeUnit === 'days' ? DAYS_TO_MS : SECONDS_TO_MS);
        const outputDatas: number[][] = scalars.map(it => Array.isArray(it[t][0]) ? ([] as number[]) : (it as number[][])[t])

        for (let lat = 0; lat < lats.length; lat++) {
            for (let lng = 0; lng < longs.length; lng++) {
                for (let key = 0; key < scalars.length; key++) {
                    if (!Array.isArray(scalars[key][t][0])) continue;
                    outputDatas[key].push((scalars as number[][][][])[key][t][lat][lng])
                }
            }
        }

        for (const [key, data] of zip(scalarKeys, outputDatas)) {
            const gribFrame = {header: getBaseHeader(lats, longs, bindingToCode[key]!), data}
            if (convertedTime in timesOut) {
                timesOut[convertedTime].gribFrames.push(gribFrame)
            } else {
                timesOut[convertedTime] = {
                    gribFrames: [gribFrame],
                    time: convertedTime
                }
            }
        }
    }
}

export function convertThreddsToGrib(
    data: Record<string, NumberOrNDArray>,
    bindings: Bindings): WeatherData {
    // initialised like this as we will have the req'd props by the end of the loop
    const bound: Bound = {} as Bound;
    for (const [k, v] of Object.entries(bindings)) {
        //we need this never here to stop ts complaining, but it should always be valid
        bound[(k as keyof Bound)] = (data![v] as never);
    }
    const timesOut: { [key: string]: WeatherDataTimeSnapshot } = {};

    let lats: number[];
    let longs: number[];
    //some of the latitudes and longitudes come in 2D arrays, so we need to fix them
    if (bound.latRho && bound.lngRho) {
        // latRho and lngRho are not on grid, so everything that uses them needs to be re-calculated
        const toFix = (["currentU", "currentV", "waterTemperature"] as (keyof Bound)[]).filter(it => bound[it] !== undefined)
        const {
            data: fixed,
            lat,
            lng
        } = realignDataToGrid(bound.latRho, bound.lngRho, ...toFix.map(it => bound[it] as number[][][]))
        for (const [k, data] of zip(toFix, fixed)) {
            bound[k] = data as never;
        }
        lats = lat
        longs = lng
    } else {
        if (Array.isArray(bound.lat?.[0])) {
            lats = (bound.lat as number[][]).map(it => it[0])
        } else {
            lats = bound.lat as number[];
        }

        if (Array.isArray(bound.lng?.[0])) {
            longs = (bound.lng as number[][])[0]
        } else {
            longs = bound.lng as number[];
        }
    }


    addDataToWeatherTimeSnapshot(bound, lats, longs, "windTime", "days", ["windU", "windV"], timesOut);
    addDataToWeatherTimeSnapshot(bound, lats, longs, "temperatureTime", "days", ["temperature"], timesOut);
    addDataToWeatherTimeSnapshot(bound, lats, longs, "waterTemperatureTime", "seconds", ["waterTemperature"], timesOut);
    addDataToWeatherTimeSnapshot(bound, lats, longs, "currentTime", "seconds", ["currentU", "currentV"], timesOut);


    return {times: timesOut}
}

export function mergeWeatherDatas(...weatherDatas: (WeatherData | null)[]): WeatherData {
    const out: WeatherData = {times: {}};
    for (const data of weatherDatas) {
        if (!data) continue;
        for (const [time, wds] of Object.entries(data.times)) {
            if (time in out.times) {
                out.times[time].gribFrames.push(...wds.gribFrames);
            } else {
                out.times[time] = wds
            }
        }
    }
    return out
}

export function roundWeatherData(weatherData: WeatherData): WeatherData {
    const out: WeatherData = {times: {}};
    for (const [time, wds] of Object.entries(weatherData.times)) {
        out.times[time] = {time: +time, gribFrames: wds.gribFrames}
        for (let i = 0; i < out.times[time].gribFrames.length; i++) {
            const frame = out.times[time].gribFrames[i];
            out.times[time].gribFrames[i].data = frame.data.map(i => roundTo(i, 4));
        }
    }
    return out
}