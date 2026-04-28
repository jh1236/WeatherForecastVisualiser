import {useMemo} from "react";
import {magnitude} from "@/components/vectorUtils";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromWindSpeedKts} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";
import {mpsToKnots} from "@/components/unitsUtils";
import {latLngBndsIntersection, maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}


export function WindColors({data, viewportBounds, darkModeRender, resolution = 60}: WindColorsProps) {

    const windBarbData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.2.2", "0.2.3"])], [data, resolution, viewportBounds])

    const svgSize = latLngBndsIntersection(maxBoundsFromGribFrames(data), viewportBounds!)
    const latWidth = svgSize.getEast() - svgSize.getWest()
    const lngHeight = svgSize.getNorth() - svgSize.getSouth()

    return windBarbData.map((dataPoint, i) => {
            return <SingleWindColor
                key={i}
                viewportBounds={viewportBounds}
                x={100 * (dataPoint.bounds!.getWest() - svgSize.getWest()) / latWidth + "%"}
                y={(100 * (svgSize.getNorth() - dataPoint.bounds!.getNorth()) / lngHeight) + "%"}
                w={100 * (dataPoint.bounds!.getEast() - dataPoint.bounds.getWest()) / latWidth + "%"}
                h={100 * (dataPoint.bounds!.getNorth() - dataPoint.bounds.getSouth()) / lngHeight + "%"}
                dataPoint={dataPoint}
                darkModeRender={darkModeRender}
            />;
        }
    )

}

interface SingleWindColorProps {
    dataPoint: WeatherDataPoint
    viewportBounds: LatLngBounds | undefined,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    x: number | string, //allow string for percentages
    y: number | string,
    w: number | string,
    h: number | string,
}

function SingleWindColor({viewportBounds, dataPoint, x, y, w, h}: SingleWindColorProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const strength = useMemo(() => mpsToKnots(magnitude([windU!, windV!])), [windU, windV]);
    const {settings} = useSettings();

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    return <>
        {/*<Rectangle bounds={dataPoint.bounds} color={getColorFromWindSpeedKts(strength)} opacity={0} fillOpacity={0.2}>*/}

        {/*</Rectangle>*/}
        <rect
            z={-100}
            x={x}
            y={y}
            width={w}
            height={h}
            fillOpacity={settings["windColors.opacity"]}
            fill={getColorFromWindSpeedKts(strength)}>
        </rect>
        {/*<Rectangle bounds={dataPoint.bounds!} fillOpacity={isSatellite ? 0.8 : 0.5} opacity={0}*/}
        {/*           color={getColorFromWindSpeedKts(strength)}>*/}
        {/*</Rectangle>*/}
    </>

}