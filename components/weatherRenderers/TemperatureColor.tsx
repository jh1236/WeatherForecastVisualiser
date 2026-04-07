import {useMemo} from "react";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromTemperature} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToScreen} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}


export function TemperatureColors({data, viewportBounds, darkModeRender, resolution = 60}: WindColorsProps) {

    const windBarbData = useMemo(() => [...mapToScreen(data ?? [], resolution, viewportBounds)], [data, resolution, viewportBounds])

    return windBarbData.map((dataPoint, i) => {
            return <SingleTempColor
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
}

function SingleTempColor({viewportBounds, dataPoint}: SingleTempColorProps) {
    const {temperature, bounds: tileBounds} = dataPoint;
    const {settings} = useSettings();

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
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