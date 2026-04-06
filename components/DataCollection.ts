import {useEffect, useState} from "react";
import {WeatherData} from "@/components/types";

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
                    console.log(Object.entries(data.times)[0])
                }
            )
        )
    }, [date])
    return {data: data, reset: () => setData({endTime: 0, startTime: 0, times: {}})}
}