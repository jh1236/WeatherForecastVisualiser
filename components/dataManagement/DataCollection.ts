import {useEffect, useState} from "react";
import {WeatherData} from "@/components/types";
import {useSettings} from "@/components/settings";

const SERVER_ADDRESS = "http://flun.in:25565";

//http://boreas.mywire.org:8080/thredds/catalog/catalog.html
//https://boreas.mywire.org:8043/sailing

interface DataFunctionReturn {
    data: WeatherData;
    reset: () => void;
}

export function useLocalData(filename: string): DataFunctionReturn {
    const [data, setData] = useState<WeatherData>({endTime: 0, startTime: 0, times: {}})
    useEffect(() => {
        fetch(SERVER_ADDRESS + `/api/dataFromGrib`, {
            method: "POST",
            body: JSON.stringify({file: filename}),
        }).then(res =>
            res.json().then(({data}: { data: WeatherData }) => {
                    setData(data)
                }
            )
        )
    }, [filename])
    return {data: data, reset: () => setData({endTime: 0, startTime: 0, times: {}})}
}

export function useThreddsServer(date: Date): DataFunctionReturn {
    const [data, setData] = useState<WeatherData>({endTime: 0, startTime: 0, times: {}})
    useEffect(() => {
        fetch(SERVER_ADDRESS + `/api/dataFromThredds`, {
            method: "POST",
            body: JSON.stringify({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }),
        }).then(res =>
            res.json().then(({data}: { data: WeatherData }) => {
                    setData(data)
                }
            )
        )
    }, [date])
    return {data: data, reset: () => setData({endTime: 0, startTime: 0, times: {}})}
}

export function useDataFromSettingsSource(date: Date): { data: WeatherData, reset: () => void } {
    const {settings} = useSettings()
    const [data, setData] = useState<WeatherData>({endTime: 0, startTime: 0, times: {}})
    useEffect(() => {
        setData({endTime: 0, startTime: 0, times: {}})
        if (settings.dataSource === 'netCDF') {
            fetch(SERVER_ADDRESS + `/api/dataFromThredds`, {
                method: "POST",
                body: JSON.stringify({
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate()
                }),
            }).then(res =>
                res.json().then(({data}: { data: WeatherData }) => {
                        setData(data)
                    }
                )
            )
        } else {
            fetch(SERVER_ADDRESS + `/api/dataFromGrib`, {
                method: "POST",
                body: JSON.stringify({file: settings.gribFile}),
            }).then(res =>
                res.json().then(({data}: { data: WeatherData }) => {
                        setData(data)
                    }
                )
            )
        }
    }, [date, settings.dataSource, settings.gribFile])
    return {data: data, reset: () => setData({endTime: 0, startTime: 0, times: {}})}
}