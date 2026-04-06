import {getJsDapData} from "@/components/jsdapWrapper";

export async function GET() {
    return getJsDapData("http://boreas.mywire.org:8080/thredds/dodsC/WRF2026/wrf_roms_d02_20260408.nc", {
        wind_time: "0:1:23",
        Uwind: ["0:1:23", "0:1:164", "0:1:89"],
        Vwind: ["0:1:23", "0:1:164", "0:1:89"],
        LON: ["0:1:164", "0:1:0"],
        LAT: ["0:1:0", "0:1:89"],
    }).then(Response.json)
}