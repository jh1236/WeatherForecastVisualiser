import {useMemo} from "react";
import {magnitude} from "@/components/vectorUtils";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromWindSpeedKts, mpsToKnots} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToScreen} from "@/components/dataManagement/DataProcessing";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    currentLayer: string;
    resolution?: number;
    enabled?: boolean;
}


export function WindColors({data, viewportBounds, currentLayer, resolution = 60, enabled = true}: WindColorsProps) {

    const windBarbData = useMemo(() => [...mapToScreen(data ?? [], resolution, viewportBounds)], [data, resolution, viewportBounds])

    if (!enabled) return

    return windBarbData.map((dataPoint, i) =>
        <SingleWindColor
            key={i}
            count={i}
            viewportBounds={viewportBounds}
            dataPoint={dataPoint}
            baseLayer={currentLayer}
        />
    )
}

interface SingleWindColorProps {
    dataPoint: WeatherDataPoint
    viewportBounds: LatLngBounds | undefined,
    count?: number,
    trueLatLng?: LatLng,
    baseLayer: string,
}

function SingleWindColor({viewportBounds, dataPoint, baseLayer}: SingleWindColorProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const strength = useMemo(() => mpsToKnots(magnitude([windU!, windV!])), [windU, windV]);
    const isSatellite = baseLayer === "satellite";

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
            fillOpacity={isSatellite ? 0.8 : 0.5}
            fill={getColorFromWindSpeedKts(strength)}>
        </rect>
        {/*<Rectangle bounds={dataPoint.bounds!} fillOpacity={isSatellite ? 0.8 : 0.5} opacity={0}*/}
        {/*           color={getColorFromWindSpeedKts(strength)}>*/}
        {/*</Rectangle>*/}
    </SVGOverlay>

}