import {useEffect, useMemo, useState} from "react";
import {WeatherData} from "@/components/types";
import {useSettings} from "@/components/settings";

//http://boreas.mywire.org:8080/thredds/catalog/catalog.html
//https://boreas.mywire.org:8043/sailing

interface DataFunctionReturn {
    data: WeatherData;
    reset: () => void;
    populated: boolean;
}


export function useDataFromSettingsSource(date: Date | undefined): DataFunctionReturn {
    const {settings, isLoaded} = useSettings()
    const [hasWind, setHasWind] = useState<boolean>(false)
    const [hasOcean, setHasOcean] = useState<boolean>(false)
    const [data, setData] = useState<WeatherData>({times: {}})
    const [populated, setPopulated] = useState<boolean>(false)
    useEffect(() => {
        if (!isLoaded || !date) return;
        fetch(`/api/dataFromThredds`, {
            method: "POST",
            body: JSON.stringify({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                region: settings.region
            }),
        }).then(res =>
            res.json().then(({data}: { data: WeatherData}) => {
                    setData(data)
                    setPopulated(true)
                }
            )
        )

    }, [date, isLoaded, settings.region])
    return {
        data,
        reset: () => {
            setPopulated(false)
            setData({times: {}})
        },
        populated
    }
}