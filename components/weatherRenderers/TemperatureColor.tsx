import {useMemo} from "react";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromTemperature} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
    tempKey?: keyof WeatherDataPoint;
}


export function TemperatureColors({data, viewportBounds, darkModeRender, resolution = 60, tempKey='temperature'}: WindColorsProps) {

    const windBarbData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds)], [data, resolution, viewportBounds])

    return windBarbData.map((dataPoint, i) => {
            return <SingleTempColor
                tempKey={tempKey}
                key={i}
                viewportBounds={viewportBounds}
                dataPoint={dataPoint}
                darkModeRender={darkModeRender}
            />;
        }
    )
}

interface SingleTempColorProps {
    dataPoint: WeatherDataPoint
    viewportBounds: LatLngBounds | undefined,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    tempKey: keyof WeatherDataPoint,
}

function SingleTempColor({viewportBounds, dataPoint, tempKey}: SingleTempColorProps) {
    const {bounds: tileBounds} = dataPoint;
    const temperature = (dataPoint[tempKey] as number | undefined)
    const {settings} = useSettings();

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!) || !temperature || isNaN(temperature)) {
        return null
    }

    return <SVGOverlay
        bounds={tileBounds!}
    >

        <rect
            z={-100}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            fillOpacity={settings["temperatureColors.opacity"]}
            fill={getColorFromTemperature(temperature!)}>
        </rect>
        {/*<Rectangle bounds={dataPoint.bounds!} fillOpacity={isSatellite ? 0.8 : 0.5} opacity={0}*/}
        {/*           color={getColorFromWindSpeedKts(strength)}>*/}
        {/*</Rectangle>*/}
    </SVGOverlay>

}