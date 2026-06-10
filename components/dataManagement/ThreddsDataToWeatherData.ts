'use server'

import {WeatherData} from "@/components/types";
import sanitize from "sanitize-filename";
import fs from "fs";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";
import {
    Bound,
    convertThreddsToGrib,
    mergeWeatherDatas,
    roundWeatherData
} from "@/components/dataManagement/ServerDataProcessing";

type ThreddsData = {
    startDate: number;
    link: string;
    bindings: { [binding in keyof Bound]: string };
    args: { [key: string]: string | string[] };
    quickArgs: { [key: string]: string | string[] };
};

type ThreddsConfigData = {
    [region: string]: {
        ocean: ThreddsData[];
        wind: ThreddsData[]
    };

};
const threddsConfigData: ThreddsConfigData = {
    perth:
        {
            ocean: [{
                startDate: Date.UTC(2026, 0, 1),
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
                    "lat_rho": ["0:2:258", "0:2:128"],
                    "lon_rho": ["0:2:258", "0:2:128"],
                    "ocean_time": ["0:1:23"],
                    "u_sur_eastward": ["0:1:23", "0:2:258", "0:2:128"],
                    "v_sur_northward": ["0:1:23", "0:2:258", "0:2:128"],
                    "temp_sur": ["0:1:23", "0:2:258", "0:2:128"],
                },
                quickArgs: {
                    "lat_rho": ["0:4:258", "0:4:128"],
                    "lon_rho": ["0:4:258", "0:4:128"],
                    "ocean_time": ["0:1:23"],
                    "u_sur_eastward": ["0:1:23", "0:4:258", "0:4:128"],
                    "v_sur_northward": ["0:1:23", "0:4:258", "0:4:128"],
                    "temp_sur": ["0:1:23", "0:4:258", "0:4:128"],
                }
            }],
            wind: [{
                startDate: Date.UTC(2026, 0, 1),
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
                    Tair: ["0:1:23", "0:1:164", '0:1:89']
                },
                quickArgs: {
                    wind_time: "0:1:23",
                    tair_time: "0:1:23",
                    Uwind: ["0:1:23", "0:2:164", '0:2:89'],
                    Vwind: ["0:1:23", "0:2:164", '0:2:89'],
                    LON: ["0:1:0", '0:2:89'],
                    LAT: ["0:2:164", "0:1:0"],
                    Tair: ["0:1:23", "0:2:164", '0:2:89'],
                }
            }]
        },

    greaterPerth: {
        wind: [
            {
                startDate: Date.UTC(2026, 0, 1),
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
                },
                quickArgs: {
                    wind_time: "0:1:23",
                    tair_time: "0:1:23",
                    Uwind: ["0:1:23", "0:2:164", '0:2:98'],
                    Vwind: ["0:1:23", "0:2:164", '0:2:98'],
                    LON: ["0:1:0", '0:2:98'],
                    LAT: ["0:2:164", "0:1:0"],
                    Tair: ["0:1:23", "0:2:164", '0:2:98'],
                }
            }
        ],
        ocean: [{
            startDate: Date.UTC(2025, 12, 8),
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
            },
            quickArgs: {
                "lat_rho": ["0:6:639", "0:8:479"],
                "lon_rho": ["0:6:639", "0:8:479"],
                "ocean_time": ["0:1:23"],
                "u_sur_eastward": ["0:1:23", "0:6:639", "0:8:479"],
                "v_sur_northward": ["0:1:23", "0:6:639", "0:8:479"],
                "temp_sur": ["0:1:23", "0:6:639", "0:4:479"],
            }
        }]
    }
};


export async function getWeatherDataFromThredds(yearIn: number, monthIn: number, dayIn: number, region: keyof typeof threddsConfigData, quickLoad: boolean = false): Promise<WeatherData> {
    const year = yearIn.toString();
    const month = monthIn.toString().padStart(2, '0');
    const day = dayIn.toString().padStart(2, '0');
    const date = Date.UTC(yearIn, monthIn, dayIn)
    const file = sanitize(`${year}-${month}-${day}-${region}${quickLoad ? '-quick' : ''}`)
    const cacheFolder = (process.env.CACHE_DIRECTORY) ?? './cachedResponses';
    const path = `${cacheFolder}/${file}.json`;
    if (fs.existsSync(path)) {
        const text = (await fs.promises.readFile(path)).toString();
        return JSON.parse(text) as WeatherData;
    }
    console.log(`Data for ${file} not in cache, fetching from THREDDS`)

    const {ocean, wind} = threddsConfigData[region]!;
    const oceanBindings = ocean.filter(it => it.startDate < date).toSorted((a, b) => b.startDate - a.startDate)[0]
    const meteoBindings = wind.filter(it => it.startDate < date).toSorted((a, b) => b.startDate - a.startDate)[0]

    const tasks = []

    if (oceanBindings) {
        const oceanLink = oceanBindings.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)
        tasks.push(getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${oceanLink}`, quickLoad ? oceanBindings.quickArgs : oceanBindings.args)
            .then(({data}) => convertThreddsToGrib(data, oceanBindings.bindings)
            ).catch(e => {
                console.error(`Error Getting Oceanographic Data: ${e}`)
                return null
            }));
    } else {
        tasks.push(Promise.resolve(null))
    }

    if (meteoBindings) {
        const windLink = meteoBindings.link.replace('\{year\}', year).replace('\{month\}', month).replace('\{day\}', day)

        tasks.push(getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/${windLink}`, quickLoad ? meteoBindings.quickArgs : meteoBindings.args)
            .then(({data}) => convertThreddsToGrib(data, meteoBindings.bindings)
            ).catch(e => {
                console.error(`Error Getting Meteorological Data: ${e}`)
                return null
            }))
    } else {
        tasks.push(Promise.resolve(null))
    }

    const [meteoData, oceanData] = await Promise.all(tasks)

    const out = mergeWeatherDatas(meteoData, oceanData);

    if (!meteoData && !oceanData) {
        return out;
    }

    (async () => {
        let files = await fs.promises.readdir(cacheFolder);
        while (files.length >= 39) { // We only want to keep the 39 most recent files; delete the rest
            let oldestFileTime = Number.MAX_VALUE

            let oldestFile: string | undefined = undefined
            for (const i of files) {
                // Stat the file to see if we have a file or dir

                const stat = await fs.promises.stat(`${cacheFolder}/${i}`);
                if (stat.isDirectory()) {
                    continue
                }
                if (stat.mtimeMs < oldestFileTime) {
                    oldestFileTime = stat.mtimeMs
                    oldestFile = `${cacheFolder}/${i}`

                }
            }
            if (oldestFile) {
                await fs.promises.unlink(oldestFile)
                files = await fs.promises.readdir(cacheFolder);
            }
        }
        await fs.promises.writeFile(path, JSON.stringify(roundWeatherData(out)))
    })().catch(console.error);

    return out;
}