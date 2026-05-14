'use server'

import {WeatherData} from "@/components/types";
import sanitize from "sanitize-filename";
import fs from "fs";
import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";
import {convertThreddsToGrib, mergeWeatherDatas} from "@/components/dataManagement/ServerDataProcessing";

const threddsConfigData = {
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
    }
};


export async function getWeatherDataFromThredds(yearIn: number, monthIn: number, dayIn: number, region: keyof typeof threddsConfigData): Promise<WeatherData> {
    const year = yearIn.toString();
    const month = monthIn.toString().padStart(2, '0');
    const day = dayIn.toString().padStart(2, '0');
    const file = sanitize(`${year}-${month}-${day}-${region}`)
    const path = `./cachedResponses/${file}.json`;
    if (fs.existsSync(path)) {
        const text = (await fs.promises.readFile(path)).toString();
        return JSON.parse(text) as WeatherData;
    }
    console.log(`Data for ${file} not in cache, fetching from THREDDS`)

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
    const out = mergeWeatherDatas(meteoData, oceanData);

    (async () => {
        const files = await fs.promises.readdir("./cachedResponses/");
        while (files.length >= 39) { // We only want to keep the 39 most recent files; delete the rest
            let oldestFileTime = Number.MAX_VALUE

            let oldestFile: string | undefined = undefined
            for (const i of files) {
                // Stat the file to see if we have a file or dir

                const stat = await fs.promises.stat(`./cachedResponses/${i}`);
                if (stat.isDirectory()) {
                    continue
                }
                if (stat.mtimeMs < oldestFileTime) {
                    oldestFileTime = stat.mtimeMs
                    oldestFile = `./cachedResponses/${i}`

                }
            }
            if (oldestFile) {
                await fs.promises.unlink(oldestFile)
            }
        }
        await fs.promises.writeFile(path, JSON.stringify(out))
    })().catch(console.error);

    return out
}