import {NextRequest} from "next/server";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";
import {Bindings, convertThreddsToGrib, mergeWeatherDatas} from "@/components/dataManagement/ServerDataProcessing";


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
    greatererPerth: {
        wind: {
            link: 'NCEP2026/gbr_roms_forcing_{year}{month}{day}.nc',
            bindings: {
                windU: 'Uwind',
                windV: 'Vwind',
                windTime: 'wind_time',
                temperature: 'Tair',
                temperatureTime: 'tair_time',
                lat: 'lat',
                lng: 'lon'
            },
            args: {
                wind_time: "0:1:7",
                tair_time: "0:1:7",
                Uwind: ["0:1:7", "0:1:164", '0:1:98'],
                Vwind: ["0:1:7", "0:1:164", '0:1:98'],
                lon: ["0:1:0", '0:1:98'],
                lat: ["0:1:164", "0:1:0"],
                Tair: ["0:1:7", "0:1:164", '0:1:98'],
            }
        },
        ocean: {
            link: 'gbrqck/gbr_qck_{year}{month}{day}.nc',
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
                "lat_rho": ["0:2:561", "0:2:241"],
                "lon_rho": ["0:2:561", "0:2:241"],
                "ocean_time": ["0:1:23"],
                "u_sur_eastward": ["0:1:23", "0:2:561", "0:2:241"],
                "v_sur_northward": ["0:1:23", "0:2:561", "0:2:241"],
                "temp_sur": ["0:1:23", "0:2:561", "0:2:241"],
            }
        }
    },
};


export async function GET() {
    const proxyRequestObject = {
        json: () => new Promise(resolve => resolve({
            year: 2026,
            month: 4,
            day: 10,
            region: 'perth'
        }))
    }

    return POST(proxyRequestObject as unknown as NextRequest)
}

export async function POST(request: NextRequest):Promise<Response> {
    const req = await request.json()

    const region = req.region
    const year = req.year.toString();
    const month = req.month.toString().padStart(2, '0');
    const day = req.day.toString().padStart(2, '0');

    const regionData = threddsConfigData[region];

    const oceanBindings = regionData.ocean;
    const meteoBindings = regionData.wind;


    const oceanLink = oceanBindings.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)
    const windLink = meteoBindings.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)

    const meteoDataPromise = getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${windLink}`, meteoBindings.args)
        .then(({data}) => convertThreddsToGrib(data, meteoBindings.bindings)
        )

    const oceanDataPromise = await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${oceanLink}`, oceanBindings.args)
        .then(({data}) => convertThreddsToGrib(data, oceanBindings.bindings)
        )

    const [meteoData, oceanData] = await Promise.all([meteoDataPromise, oceanDataPromise])

    return Response.json({
        data: mergeWeatherDatas(meteoData, oceanData),
    });
}