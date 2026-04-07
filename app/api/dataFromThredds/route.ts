import {NextRequest} from "next/server";
import {GribFrame, GribHeader, WeatherDataTimeSnapshot} from "@/components/types";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";

const netCdfEpoch = Date.UTC(2000, 0, 1)

const DAYS_TO_MS = 24 * 60 * 60 * 1000;

type Bindings = {
    [key in (keyof Bound)]?: string;
} & {
    lat: string;
    lng: string;
};

type Bound = {
    windU?: number[][][],
    windV?: number[][][],
    windTime?: number[],
    temperature?: number[][][],
    temperatureTime?: number[],
    currentU?: number[][][],
    currentV?: number[][][],
    currentTime?: number[],
    lat: number[] | number[][],
    lng: number[] | number[][],
};


const threddsConfigData: {
    [key: string]: {
        link: string;
        bindings: Bindings
        args: Record<string, string | string[]>
    }
} = {
    perth: {
        link: 'WRF2026/wrf_roms_d02_{year}{month}{day}.nc',
        bindings: {
            windU: 'Uwind',
            windV: 'Vwind',
            windTime: 'wind_time',
            temperature: 'Tair',
            temperatureTime: 'tair_time',
            lat: 'LAT',
            lng: 'LON'
        },
        args: {
            wind_time: "0:1:23",
            tair_time: "0:1:23",
            Uwind: ["0:1:23", "0:1:164", '0:1:89'],
            Vwind: ["0:1:23", "0:1:164", '0:1:89'],
            LON: ["0:1:0", '0:1:89'],
            LAT: ["0:1:164", "0:1:0"],
            Tair: ["0:1:23", "0:1:164", '0:1:89'],
        }
    },
    greaterPerth: {
        link: 'WRF2026/wrf_roms_d01_{year}{month}{day}.nc',
        bindings: {
            windU: 'Uwind',
            windV: 'Vwind',
            windTime: 'wind_time',
            temperature: 'Tair',
            temperatureTime: 'tair_time',
            lat: 'LAT',
            lng: 'LON'
        },
        args: {
            wind_time: "0:1:23",
            tair_time: "0:1:23",
            Uwind: ["0:1:23", "0:1:164", '0:1:98'],
            Vwind: ["0:1:23", "0:1:164", '0:1:98'],
            LON: ["0:1:0", '0:1:98'],
            LAT: ["0:1:164", "0:1:0"],
            Tair: ["0:1:23", "0:1:164", '0:1:98'],
        }
    },
    greatBarrierReef: {
        link: 'gbrqck/gbr_qck_20260412.nc{year}{month}{day}.nc',
        bindings: {
            currentTime: 'ocean_time',
            temperature: 'temp_sur',
            temperatureTime: 'ocean_time',
            lat: 'lat_rho',
            lng: 'lng_rho'
        },
        args: {
            lat_rho: ["0:1:561", "0:1:241"],
            lon_rho: ["0:1:561", "0:1:241"],
            ocean_time: ["0:1:23"],
            temp_sur: ["0:1:23", "0:1:561", "0:1:241"],
            u_sur_eastward: ["0:1:23", "0:1:561", "0:1:241"],
            v_sur_northward: ["0:1:23", "0:1:561", "0:1:241"],
        }
    },
};

function getBaseHeader(lats: number[], longs: number[]) {
    // only moved here so that the function was more readable
    const dx = (longs[longs.length - 1] - longs[0]) / longs.length
    const dy = (lats[lats.length - 1] - lats[0]) / lats.length
    return {
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
    };
}

export async function POST(request: NextRequest) {
    const req = await request.json()
    console.log(req)

    const region = req.region
    const displayData = req.data !== false;
    const year = req.year.toString();
    const month = req.month.toString().padStart(2, '0');
    const day = req.day.toString().padStart(2, '0');

    const args = threddsConfigData[region];

    const {bindings} = args;

    const link = args.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)

    const out = await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${link}`, args.args)
        .then(({data, dds}) => {
                // initialised like this as we will have the req'd props by the end of the loop
                const bound: Bound = {} as Bound;
                for (const [k, v] of Object.entries(bindings)) {
                    //we need this never here to stop ts complaining, but it should always be valid
                    bound[(k as keyof Bound)] = (data[v] as never);
                }
                const timesOut: { [key: string]: WeatherDataTimeSnapshot } = {};

                let lats: number[];
                let longs: number[];
                //some of the latitudes and longitudes come in 2D arrays, so we need to fix them
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



                const baseHeader: GribHeader = getBaseHeader(lats, longs)
                // we use this so that we don't have to try checking react state
                if (bound.windTime && bound.windU && bound.windV && displayData) {
                    for (let i = 0; i < bound.windTime.length; i++) {
                        const convertedWindTime = netCdfEpoch + bound.windTime[i]! * DAYS_TO_MS
                        const windUData = []
                        const windVData = []

                        for (let x = 0; x < lats.length; x++) {
                            for (let y = 0; y < longs.length; y++) {
                                windUData.push(bound.windU[i][x][y])
                                windVData.push(bound.windV[i][x][y])
                            }
                        }

                        const windUFrame: GribFrame = {data: windUData, header: {...baseHeader, parameterNumber: 2}}
                        const windVFrame: GribFrame = {data: windVData, header: {...baseHeader, parameterNumber: 3}}
                        if (convertedWindTime in timesOut) {
                            timesOut[convertedWindTime].gribFrames.push(windUFrame)
                            timesOut[convertedWindTime].gribFrames.push(windVFrame)
                        } else {
                            timesOut[convertedWindTime] = {
                                gribFrames: [windUFrame, windVFrame],
                                isKeyFrame: false,
                                time: convertedWindTime
                            }
                        }
                    }
                }

                if (bound.temperatureTime && bound.temperature && displayData) {
                    for (let i = 0; i < bound.temperatureTime.length; i++) {
                        const convertedAirTime = netCdfEpoch + bound.temperatureTime[i]! * DAYS_TO_MS
                        const temperatureData = []

                        for (let x = 0; x < lats.length; x++) {
                            for (let y = 0; y < longs.length; y++) {
                                temperatureData.push(bound.temperature[i][x][y])
                            }
                        }

                        const tempFrame: GribFrame = {
                            data: temperatureData,
                            header: {...baseHeader, parameterNumber: 0, discipline: 0, parameterCategory: 0}
                        }

                        if (convertedAirTime in timesOut) {
                            timesOut[convertedAirTime].gribFrames.push(tempFrame)
                        } else {
                            timesOut[convertedAirTime] = {
                                gribFrames: [tempFrame],
                                isKeyFrame: false,
                                time: convertedAirTime
                            }
                        }

                    }
                }

                if (bound.currentTime && bound.currentU && bound.currentV && displayData) {
                    for (let i = 0; i < bound.currentTime.length; i++) {
                        const convertedCurrentTime = netCdfEpoch + bound.currentTime[i]! * DAYS_TO_MS
                        const currentUData = []
                        const currentVData = []

                        for (let x = 0; x < lats.length; x++) {
                            for (let y = 0; y < longs.length; y++) {
                                currentUData.push(bound.currentU[i][x][y])
                                currentVData.push(bound.currentV[i][x][y])
                            }
                        }

                        const currentUFrame: GribFrame = {
                            data: currentUData,
                            header: {...baseHeader, discipline: 10, parameterCategory: 1, parameterNumber: 2}
                        }
                        const currentVFrame: GribFrame = {
                            data: currentVData,
                            header: {...baseHeader, discipline: 10, parameterCategory: 1, parameterNumber: 3}
                        }
                        if (convertedCurrentTime in timesOut) {
                            timesOut[convertedCurrentTime].gribFrames.push(currentUFrame)
                            timesOut[convertedCurrentTime].gribFrames.push(currentVFrame)
                        } else {
                            timesOut[convertedCurrentTime] = {
                                gribFrames: [currentUFrame, currentVFrame],
                                isKeyFrame: false,
                                time: convertedCurrentTime
                            }
                        }
                    }
                }

                return {times: timesOut}
            }
        )

    return Response.json({data: out});

}