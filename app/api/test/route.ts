import {getJsDapData} from "@/components/dataManagement/jsdapWrapper";

export async function GET() {
    return await getJsDapData(`http://boreas.mywire.org:8080/thredds/dodsC/perthqck/perth_qck_20260406.nc`, {
        "lat_rho": ["0:1:258", "0:1:128"],
        "lon_rho": ["0:1:258", "0:1:128"]
    }).then(Response.json)
}