import {useMemo} from "react";
import {magnitude, normalised} from "@/components/vectorUtils";
import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {mpsToKnots} from "@/components/unitsUtils";
import {roundTo} from "@/components/utilities";
import {mapToBigBox} from "@/components/weatherRenderers/WindBarbs";
import {latLngBndsIntersection, maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";


interface CurrentArrowsParams {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}

export function CurrentArrows({
                                  viewportBounds,
                                  data,
                                  darkModeRender,
                                  resolution = 10,
                              }: CurrentArrowsParams) {

    const currentData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["10.1.2", "10.1.3"])], [data, resolution, viewportBounds])

    const svgSize = latLngBndsIntersection(maxBoundsFromGribFrames(data), viewportBounds!)

    const latWidth = svgSize.getEast() - svgSize.getWest()
    const lngHeight = svgSize.getNorth() - svgSize.getSouth()
    return currentData.map((dataPoint, i) =>
        <SingleCurrentArrow
            key={i}
            count={i}
            x={100 * (dataPoint.bounds!.getWest() - svgSize.getWest()) / latWidth + "%"}
            y={(100 * (svgSize.getNorth() - dataPoint.bounds!.getNorth()) / lngHeight) + "%"}
            w={100 * (dataPoint.bounds!.getEast() - dataPoint.bounds.getWest()) / latWidth + "%"}
            h={100 * (dataPoint.bounds!.getNorth() - dataPoint.bounds.getSouth()) / lngHeight + "%"}
            viewportBounds={viewportBounds}
            dataPoint={dataPoint}
            darkModeRender={darkModeRender}
        />
    )
}

interface SingleCurrentArrowProps {
    dataPoint: WeatherDataPoint
    viewportBounds: LatLngBounds | undefined,
    count?: number,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    x: string,
    y: string,
    w: string,
    h: string,
}


function SingleCurrentArrow({
                                viewportBounds,
                                dataPoint,
                                darkModeRender,
                                x,
                                y,
                                w,
                                h
                            }: SingleCurrentArrowProps) {
    const {currentU, currentV, bounds: tileBounds} = dataPoint;
    const windDir = useMemo(() => normalised([currentU!, -currentV!]), [currentU, currentV])
    // const windDir = [1, 0]
    const magnitudeKnots = mpsToKnots(magnitude([currentU!, currentV!]));
    const opacity = darkModeRender ? 1 : 0.5;
    const color = darkModeRender ? "lightBlue" : "blue";


    if (!viewportBounds || !viewportBounds.intersects(tileBounds!) || !currentU || !currentV || Number.isNaN(currentU)) {
        return null
    }
    const stroke = `${(roundTo(magnitudeKnots * 1.4 , 4) + 1.1) * Number(w.replace(/%$/, '')) / 30}%`
    const length = 20 * magnitudeKnots + 14;
    return <>
        <defs>
            <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth={2}
                markerHeight={2}
                stroke={color}
                fill={color}
                orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z"/>
            </marker>
        </defs>
        <line
            key={0}
            opacity={opacity}
            x1={mapToBigBox(x, w, `${Math.round(50 - windDir[0] * length)}%`)}
            y1={mapToBigBox(y, h, `${Math.round(50 - windDir[1] * length)}%`)}
            x2={mapToBigBox(x, w, `${Math.round(50 + windDir[0] * length)}%`)}
            y2={mapToBigBox(y, h, `${Math.round(50 + windDir[1] * length)}%`)}
            stroke={color}
            strokeWidth={stroke}
            markerEnd="url(#arrow)"/>
    </>

}