'use server';

import {NextRequest} from "next/server";
import {getWeatherDataFromThredds} from "@/components/dataManagement/ThreddsDataToWeatherData";

export async function POST(request: NextRequest): Promise<Response> {
    const req = await request.json()

    const region = req.region
    if (!['perth', 'greaterPerth'].includes(region)) {
        return Response.error()
    }
    const year = +req.year;
    const month = +req.month;
    const day = +req.day;
    const quick = (req?.quick ?? false) as boolean;

    let success = true;
    const data = await getWeatherDataFromThredds(year, month, day, region, quick).catch(e => {
        success = false;
        return e;
    });
    if (!success) {
        return Response.json({error: data}, {status: 503, statusText: 'Upstream Server Unavailable'});
    }
    return Response.json({
        data: data,
    });
}