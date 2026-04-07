import {NextRequest} from "next/server";
import {GribFrame, GribHeader, WeatherDataTimeSnapshot} from "@/components/types";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";

const netCdfEpoch = Date.UTC(2000, 0, 1)

const DAYS_TO_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
    const req = await request.json()
    console.log(req)

    const isBig = req.largerPerth
    const displayData = req.data !== false;
    const year = req.year.toString();
    const month = req.month.toString().padStart(2, '0');
    const day = req.day.toString().padStart(2, '0');
    const rangeCeil = isBig ? 98 : 89
    const args = {
        wind_time: "0:1:23",
        tair_time: "0:1:23",
        Uwind: ["0:1:23", "0:1:164", `0:1:${rangeCeil}`],
        Vwind: ["0:1:23", "0:1:164", `0:1:${rangeCeil}`],
        LON: ["0:1:0", `0:1:${rangeCeil}`],
        LAT: ["0:1:164", "0:1:0"],
        Tair: ["0:1:23", "0:1:164", `0:1:${rangeCeil}`],
    };
    console.log(args);
    const out = await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/WRF2026/wrf_roms_d0${isBig ? 1 : 2}_${year}${month}${day}.nc`, args).then(({data, dds}) => {
            const timesOut: { [key: string]: WeatherDataTimeSnapshot } = {};
            const airTimes = (data.tair_time as number[])
            const windTimes = (data.wind_time as number[])
            const windU = (data.Uwind as number[][][])
            const windV = (data.Vwind as number[][][])
            const temperature = (data.Tair as number[][][])
            const lats = (data.LAT as number[][]).map(it => it[0])
            const longs = (data.LON as number[][])[0]
            const dx = (longs[longs.length - 1] - longs[0]) / longs.length
            const dy = (lats[lats.length - 1] - lats[0]) / lats.length
            const startTime = netCdfEpoch + DAYS_TO_MS * windTimes[0];
            const endTime = netCdfEpoch + DAYS_TO_MS * windTimes[windTimes.length - 1];
            // we use this so that we don't have to try checking react state
            for (let i = 0; i < windTimes.length; i++) {
                const airTime = airTimes[i]
                const convertedairTime = netCdfEpoch + airTime * DAYS_TO_MS
                const windTime = windTimes[i]
                const convertedWindTime = netCdfEpoch + windTime * DAYS_TO_MS
                const windUData = []
                const windVData = []
                const temperatureData = []
                if (displayData) {
                    for (let x = 0; x < lats.length; x++) {
                        for (let y = 0; y < longs.length; y++) {
                            windUData.push(windU[i][x][y])
                            windVData.push(windV[i][x][y])
                            temperatureData.push(temperature[i][x][y])
                        }
                    }
                }


                const baseHeader: GribHeader = {
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
                const tempFrame: GribFrame = {
                    data: temperatureData,
                    header: {...baseHeader, parameterNumber: 0, discipline: 0, parameterCategory: 0}
                }
                const windUFrame: GribFrame = {data: windUData, header: {...baseHeader, parameterNumber: 2}}
                const windVFrame: GribFrame = {data: windVData, header: {...baseHeader, parameterNumber: 3}}


                if (convertedWindTime in timesOut) {
                    timesOut[convertedairTime].gribFrames.push(windUFrame)
                    timesOut[convertedairTime].gribFrames.push(windVFrame)
                } else {
                    timesOut[convertedWindTime] = {
                        gribFrames: [windUFrame, windVFrame],
                        isKeyFrame: false,
                        time: convertedWindTime
                    }
                }

                if (convertedairTime in timesOut) {
                    timesOut[convertedairTime].gribFrames.push(tempFrame)
                } else {
                    timesOut[convertedairTime] = {gribFrames: [tempFrame], isKeyFrame: false, time: convertedWindTime}
                }
            }
            return {times: timesOut, startTime, endTime}
        }
    );
    return Response.json({data: out});

}