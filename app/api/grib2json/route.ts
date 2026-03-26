import grib2json from "@weacast/grib2json";
import {NextRequest} from "next/server";


export async function GET(request: NextRequest) {
    // const req = await request.json()
    const file = request.nextUrl.searchParams.get("file");
    const data = request.nextUrl.searchParams.get("data") !== 'false';
    const names = request.nextUrl.searchParams.get("names") === 'true';
    const out = await grib2json(`./resources/${file}.grb2`, {
            // scriptPath: './grib2json-0.8.0-SNAPSHOT/bin/grib2json',
            data,
            names,
            bufferSize: 128 * 1024 * 1024
        }
    )
    return Response.json({grib: out});
}