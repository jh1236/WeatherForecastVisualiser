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


    return Response.json({
        data: await getWeatherDataFromThredds(year, month, day, region),
    });
}