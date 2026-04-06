import {NextRequest} from "next/server";
import {GribFrame, GribHeader, WeatherDataTimeSnapshot} from "@/components/types";
import {getJsDapData} from "@/components/jsdapWrapper";

const netCdfEpoch = Date.UTC(2000, 0, 1)

const DAYS_TO_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
    const req = await request.json()
    console.log(req)
    const displayData = req.data !== 'false';
    const year = req.year.toString();
    const month = req.month.toString().padStart(2, '0');
    const day = req.day.toString().padStart(2, '0');
    const out = await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/WRF2026/wrf_roms_d02_${year}${month}${day}.nc`, {
        wind_time: "0:1:23",
        Uwind: ["0:1:23", "0:1:164", "0:1:89"],
        Vwind: ["0:1:23", "0:1:164", "0:1:89"],
        LON: ["0:1:0", "0:1:89"],
        LAT: ["0:1:164", "0:1:0"],
    }).then(({data, dds}) => {
            const timesOut: { [key: string]: WeatherDataTimeSnapshot } = {};
            const times = (data.wind_time as number[])
            const windU = (data.Uwind as number[][][])
            const windV = (data.Vwind as number[][][])
            const lats = (data.LAT as number[][]).map(it => it[0])
            const longs = (data.LON as number[][])[0]
            const dx = longs[1] - longs[0]
            const dy = lats[1] - lats[0]
            const startTime = netCdfEpoch + DAYS_TO_MS * times[0];
            const endTime = netCdfEpoch + DAYS_TO_MS * times[times.length - 1];
            // we use this so that we don't have to try checking react state
            for (let i = 0; i < times.length; i++) {
                const time = times[i]
                const convertedTime = netCdfEpoch + time * DAYS_TO_MS
                const windUData = []
                const windVData = []
                if (displayData) {
                    for (let x = 0; x < lats.length; x++) {
                        for (let y = 0; y < longs.length; y++) {
                            windUData.push(windU[i][x][y])
                            windVData.push(windV[i][x][y])
                        }
                    }
                }


                const header: GribHeader = {
                    discipline: 0,
                    dx,
                    dy,
                    la1: lats[0],
                    la2: lats[lats.length - 1],
                    lo1: longs[0],
                    lo2: longs[longs.length - 1],
                    nx: longs.length,
                    ny: lats.length,
                    parameterCategory: 2,
                    parameterNumber: 0,
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
                }
                const windUFrame: GribFrame = {data: windUData, header: {...header, parameterNumber: 2}}
                const windVFrame: GribFrame = {data: windVData, header: {...header, parameterNumber: 3}}

                timesOut[convertedTime] = {gribFrames: [windUFrame, windVFrame], isKeyFrame: false, time: convertedTime}
            }
            return {times: timesOut, startTime, endTime}
        }
    );
    return Response.json({data: out});

}