import {useEffect, useMemo, useState} from "react";
import {WeatherData} from "@/components/types";
import {useSettings} from "@/components/settings";

const SERVER_ADDRESS = "http://flun.in:25565";

//http://boreas.mywire.org:8080/thredds/catalog/catalog.html
//https://boreas.mywire.org:8043/sailing

interface DataFunctionReturn {
    data: WeatherData;
    reset: () => void;
    populated: boolean;
}


export function useLocalData(filename: string): DataFunctionReturn {
    const [data, setData] = useState<WeatherData>({times: {}})
    const populated = useMemo(() => Object.keys(data.times).length > 0, [data.times])
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
    return {
        data: data,
        reset: () => {
            setData({times: {}})
        },
        populated
    }
}

export function useThreddsServer(date: Date): DataFunctionReturn {
    const [data, setData] = useState<WeatherData>({times: {}})
    const populated = useMemo(() => Object.keys(data.times).length > 0, [data.times])
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
    return {
        data: data,
        reset: () => {
            setData({times: {}})
        },
        populated
    }
}

export function useDataFromSettingsSource(date: Date): DataFunctionReturn {
    const {settings, isLoaded} = useSettings()
    const [data, setData] = useState<WeatherData>({times: {}})
    const populated = useMemo(() => Object.keys(data.times).length > 0, [data.times])
    useEffect(() => {
        if (!isLoaded) return;
        if (settings.dataSource === 'netCDF') {
            fetch(SERVER_ADDRESS + `/api/dataFromThredds`, {
                method: "POST",
                body: JSON.stringify({
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate(),
                    region: settings.region
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
    }, [date, isLoaded, settings.dataSource, settings.gribFile, settings.region])
    return {
        data: data,
        reset: () => {
            setData({times: {}})
        },
        populated
    }
}