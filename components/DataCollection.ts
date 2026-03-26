import {useEffect, useState} from "react";
import {WeatherData, WeatherDataTimeSnapshot} from "@/components/types";
import {LatLngBounds} from "leaflet";
import {addDataToWeatherSnapshotByBounds} from "@/components/DataProcessing"
import {GribData} from "@/components/VelocityWrapper/types";

const SERVER_ADDRESS = "http://flun.in:25565";

//http://boreas.mywire.org:8080/thredds/catalog/catalog.html
//https://boreas.mywire.org:8043/sailing


export function useLocalData(filename: string, includeNames = false): WeatherData {
    const [data, setData] = useState<WeatherData>({endTime: 0, startTime: 0, times: {}})
    useEffect(() => {
        fetch(SERVER_ADDRESS + `/api/grib2json?file=${filename}&names=${includeNames}`).then(res =>
            res.json().then((json: {grib: GribData}) => {
                    const times: { [key: string]: WeatherDataTimeSnapshot } = {};
                    let startTime = Number.MAX_VALUE
                    let endTime = Number.MIN_VALUE
                    // we use this so that we don't have to try checking react state
                    let max = 0;
                    for (const i of json["grib"]) {
                        if (!("data" in i)) continue;
                        const header = i["header"]
                        let isKeyFrame = false;
                        let time = new Date(header["refTime"]).getTime()

                        const code = `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`
                        if (header["significanceOfRT"] === 1) {
                            const convertToDays = 1000 * 60 * 60 * 24;
                            time += header["forecastTime"]! * convertToDays
                            isKeyFrame = true;
                            const tempDate = new Date(0);
                            tempDate.setUTCMilliseconds(time)
                            i.header.refTime = tempDate.toISOString().replace('T', ' ').split('\.')[0]
                            console.log(i)
                        }
                        if (i["data"]) {
                            i.header.dy = (header["la2"] - header["la1"]) / header["ny"]
                        }

                        const tempDataBounds = new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]]);
                        if (!Object.keys(times).includes('' + time)) {
                            times[time] = {time, data: {}, bounds: tempDataBounds, isKeyFrame, originalData: [i]};
                            startTime = Math.min(startTime, time)
                            endTime = Math.max(endTime, time)
                        } else {
                            times[time].originalData!.push(i)
                        }
                        switch (code) {
                            case "0.2.2": {
                                addDataToWeatherSnapshotByBounds(times[time], 'windU', i.data, [header['ny'], header['nx']], tempDataBounds)
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                            }
                                break;
                            case "0.2.3": {
                                addDataToWeatherSnapshotByBounds(times[time], 'windV', i.data, [header['ny'], header['nx']], tempDataBounds)
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                                break;
                            }
                            case "10.1.2": {
                                console.log(header)
                                break;
                            }
                        }
                    }
                    setData({times, startTime, endTime})
                }
            )
        )

    }, [filename, includeNames])
    return data
}

export function useOpenDAP() {

}