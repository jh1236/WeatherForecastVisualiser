import {NextRequest} from "next/server";
import {GribFrame, GribHeader, WeatherDataTimeSnapshot} from "@/components/types";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";
import {realignDataToGrid} from "@/components/dataManagement/ServerDataProcessing";
import {zip} from "@/components/utilities";

const netCdfEpoch = Date.UTC(2000, 0, 1)

const DAYS_TO_MS = 24 * 60 * 60 * 1000;

type Bindings = {
    [key in (keyof Bound)]?: string;
};


type Bound = {
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


type ThreddsRecord = {
    link: string;
    bindings: Bindings
    args: Record<string, string | string[]>
};
const threddsConfigData: {
    [key: string]: {
        wind: ThreddsRecord,
        ocean: ThreddsRecord
    }
} = {
    perth: {
        ocean: {
            link: 'perthqck/perth_qck_{year}{month}{day}.nc',
            bindings: {
                currentU: 'u_sur_eastward',
                currentV: 'v_sur_northward',
                currentTime: 'ocean_time',
                latRho: 'lat_rho',
                lngRho: 'lon_rho',
                waterTemperature: 'temp_sur',
                waterTemperatureTime: 'ocean_time',
            },
            args: {
                "lat_rho": ["0:1:258", "0:1:128"],
                "lon_rho": ["0:1:258", "0:1:128"],
                "ocean_time": ["0:1:23"],
                "u_sur_eastward": ["0:1:23", "0:1:258", "0:1:128"],
                "v_sur_northward": ["0:1:23", "0:1:258", "0:1:128"],
                "temp_sur": ["0:1:23", "0:1:258", "0:1:128"],
            }
        },
        wind: {
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
        }
    },
    greaterPerth: {
        wind: {
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
        ocean: {
            link: 'cwaqck/cwa_qck_{year}{month}{day}.nc',
            bindings: {
                currentU: 'u_sur_eastward',
                currentV: 'v_sur_northward',
                currentTime: 'ocean_time',
                latRho: 'lat_rho',
                lngRho: 'lon_rho',
                waterTemperature: 'temp_sur',
                waterTemperatureTime: 'ocean_time',
            },
            args: {
                "lat_rho": ["0:3:639", "0:4:479"],
                "lon_rho": ["0:3:639", "0:4:479"],
                "ocean_time": ["0:1:23"],
                "u_sur_eastward": ["0:1:23", "0:3:639", "0:4:479"],
                "v_sur_northward": ["0:1:23", "0:3:639", "0:4:479"],
                "temp_sur": ["0:1:23", "0:3:639", "0:4:479"],
            }
        }
    },
    // greatBarrierReef: {
    //     wind: {
    //         link: 'NCEP2026/gbr_roms_forcing_{year}{month}{day}.nc',
    //         bindings: {
    //             windU: 'Uwind',
    //             windV: 'Vwind',
    //             windTime: 'wind_time',
    //             temperature: 'Tair',
    //             temperatureTime: 'tair_time',
    //             lat: 'lat',
    //             lng: 'lon'
    //         },
    //         args: {
    //             wind_time: "0:1:7",
    //             tair_time: "0:1:7",
    //             Uwind: ["0:1:7", "0:1:164", '0:1:98'],
    //             Vwind: ["0:1:7", "0:1:164", '0:1:98'],
    //             lon: ["0:1:0", '0:1:98'],
    //             lat: ["0:1:164", "0:1:0"],
    //             Tair: ["0:1:7", "0:1:164", '0:1:98'],
    //         }
    //     },
    //     ocean: {}
    // },
};

function getBaseHeader(lats
                       :
                       number[], longs
                       :
                       number[]
) {
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
    const getWindData = req.type === 'meteorological'
    const shouldReturnData = req.data !== false;
    const year = req.year.toString();
    const month = req.month.toString().padStart(2, '0');
    const day = req.day.toString().padStart(2, '0');

    const regionData = threddsConfigData[region];

    const relevantData = regionData[getWindData ? 'wind' : 'ocean'];

    const {bindings} = relevantData;

    const link = relevantData.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)

    const out = await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${link}`, relevantData.args)
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
                if (bound.latRho && bound.lngRho) {
                    const toFix = (["currentU", "currentV", "waterTemperature"] as (keyof Bound)[]).filter(it => bound[it] !== undefined)
                    const {data: fixed, lat, lon} = realignDataToGrid(bound.latRho, bound.lngRho, ...toFix.map(it => bound[it] as number[][][]))
                    for (const [k, data] of zip(toFix, fixed)) {
                        bound[k] = data as never;
                    }
                    lats=lat
                    longs=lon
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


                const baseHeader: GribHeader = getBaseHeader(lats, longs)
                // we use this so that we don't have to try checking react state
                if (bound.windTime && bound.windU && bound.windV && shouldReturnData) {
                    for (let t = 0; t < bound.windTime.length; t++) {
                        const convertedTime = netCdfEpoch + bound.windTime[t]! * DAYS_TO_MS
                        const windUData = []
                        const windVData = []

                        for (let lat = 0; lat < lats.length; lat++) {
                            for (let lon = 0; lon < longs.length; lon++) {
                                windUData.push(bound.windU[t][lat][lon])
                                windVData.push(bound.windV[t][lat][lon])
                            }
                        }

                        const windUFrame: GribFrame = {data: windUData, header: {...baseHeader, parameterNumber: 2}}
                        const windVFrame: GribFrame = {data: windVData, header: {...baseHeader, parameterNumber: 3}}
                        if (convertedTime in timesOut) {
                            timesOut[convertedTime].gribFrames.push(windUFrame)
                            timesOut[convertedTime].gribFrames.push(windVFrame)
                        } else {
                            timesOut[convertedTime] = {
                                gribFrames: [windUFrame, windVFrame],
                                isKeyFrame: false,
                                time: convertedTime
                            }
                        }
                    }
                }

                if (bound.temperatureTime && bound.temperature && shouldReturnData) {
                    for (let i = 0; i < bound.temperatureTime.length; i++) {
                        const convertedTime = netCdfEpoch + bound.temperatureTime[i]! * DAYS_TO_MS
                        const temperatureData = []

                        for (let x = 0; x < lats.length; x++) {
                            for (let y = 0; y < longs.length; y++) {
                                const temp = bound.temperature[i][x][y];
                                if (temp > 1e30) {
                                    // this happens when the data point is on land,
                                    // and we are looking at ocean surface temp.
                                    temperatureData.push(NaN)
                                } else {
                                    temperatureData.push(temp)
                                }
                            }
                        }

                        const tempFrame: GribFrame = {
                            data: temperatureData,
                            header: {...baseHeader, parameterNumber: 0, discipline: 0, parameterCategory: 0}
                        }

                        if (convertedTime in timesOut) {
                            timesOut[convertedTime].gribFrames.push(tempFrame)
                        } else {
                            timesOut[convertedTime] = {
                                gribFrames: [tempFrame],
                                isKeyFrame: false,
                                time: convertedTime
                            }
                        }

                    }
                }
                if (bound.waterTemperatureTime && bound.waterTemperature && shouldReturnData) {
                    for (let i = 0; i < bound.waterTemperatureTime.length; i++) {
                        const convertedTime = netCdfEpoch + bound.waterTemperatureTime[i]! * DAYS_TO_MS
                        const waterTemperatureData = bound.waterTemperature[i]


                        const tempFrame: GribFrame = {
                            data: waterTemperatureData,
                            header: {...baseHeader, parameterNumber: 0, discipline: 10, parameterCategory: 3}
                        }

                        if (convertedTime in timesOut) {
                            timesOut[convertedTime].gribFrames.push(tempFrame)
                        } else {
                            timesOut[convertedTime] = {
                                gribFrames: [tempFrame],
                                isKeyFrame: false,
                                time: convertedTime
                            }
                        }

                    }
                }

                if (bound.currentTime && bound.currentU && bound.currentV && shouldReturnData) {
                    for (let i = 0; i < bound.currentTime.length; i++) {
                        const convertedTime = netCdfEpoch + bound.currentTime[i]! * DAYS_TO_MS
                        const currentUData = bound.currentU[i]
                        const currentVData = bound.currentV[i]



                        const currentUFrame: GribFrame = {
                            data: currentUData,
                            header: {...baseHeader, discipline: 10, parameterCategory: 1, parameterNumber: 2}
                        }
                        const currentVFrame: GribFrame = {
                            data: currentVData,
                            header: {...baseHeader, discipline: 10, parameterCategory: 1, parameterNumber: 3}
                        }
                        if (convertedTime in timesOut) {
                            timesOut[convertedTime].gribFrames.push(currentUFrame)
                            timesOut[convertedTime].gribFrames.push(currentVFrame)
                        } else {
                            timesOut[convertedTime] = {
                                gribFrames: [currentUFrame, currentVFrame],
                                isKeyFrame: false,
                                time: convertedTime
                            }
                        }
                    }
                }

                return {times: timesOut}
            }
        )

    return Response.json({data: out});

}