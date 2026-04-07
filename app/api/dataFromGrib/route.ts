import {NextRequest} from "next/server";

import fs from 'fs';
import {GribData, WeatherDataTimeSnapshot} from "@/components/types";
import {getGribData} from "@/components/dataManagement/grib2JsonWrapper";

export async function POST(request: NextRequest) {
    const req = await request.json()
    const file = req.file;
    const data = req.data !== 'false';
    const names = req.names === 'true';
    if (!fs.existsSync(`./resources/${file}.grb2`)) {
        return Response.json({status: 404, statusText: "Not Found"});
    }
    const out = await getGribData(`./resources/${file}.grb2`, {
            // scriptPath: './grib2json-0.8.0-SNAPSHOT/bin/grib2json',
            data,
            names,
            bufferSize: 128 * 1024 * 1024
        }
    ).then((grib: GribData) => {
            const times: { [key: string]: WeatherDataTimeSnapshot } = {};
            let startTime = Number.MAX_VALUE
            let endTime = Number.MIN_VALUE
            // we use this so that we don't have to try checking react state
            for (const i of grib) {
                const header = i["header"]
                if (data && !i["data"]) continue;
                let isKeyFrame = false;
                let time = new Date(header["refTime"]).getTime()
                if (header["significanceOfRT"] === 1) {
                    const daysToMs = 1000 * 60 * 60 * 24;
                    const secsToMs = 1000;
                    let delta = header["forecastTime"]! * daysToMs
                    /*
                     * THIS IS CRAZINESS:
                     * The grib2json library does not tell us what unit this field is in.  It is encoded in the file,
                     * but the encoding is not extracted during conversion (I have read the source of that project and
                     * confirmed).  So we are stuck doing little hacks like the below code until they choose to fix it.
                     */
                    if (delta > 36525) { // if the time is more than 100 years in days, this is likely to be seconds
                        delta = header["forecastTime"]! * secsToMs
                    }
                    time += delta
                    isKeyFrame = true;
                    const tempDate = new Date(0);
                    tempDate.setUTCMilliseconds(time)
                    i.header.refTime = tempDate.toISOString().replace('T', ' ').split('\.')[0]
                }
                if (header.dy < Number.EPSILON) {
                    i.header.dy = (header["la2"] - header["la1"]) / header["ny"]
                }

                if (!Object.keys(times).includes('' + time)) {
                    times[time] = {time, isKeyFrame, gribFrames: [i]};
                    startTime = Math.min(startTime, time)
                    endTime = Math.max(endTime, time)
                } else {
                    times[time].gribFrames!.push(i)
                }
            }
            return {times: times, startTime, endTime}
        }
    );
    return Response.json({data: out});
}