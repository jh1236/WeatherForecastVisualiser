import {useMemo} from "react";
import {magnitude, normalised} from "@/components/vectorUtils";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {mpsToKnots} from "@/components/unitsUtils";
import {roundTo} from "@/components/utilities";


interface CurrentArrowsParams {
    viewportBounds: LatLngBounds | undefined;
    data?: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
    enabled?: boolean;
}

export function CurrentArrows({
                                  viewportBounds,
                                  data,
                                  darkModeRender,
                                  resolution = 10,
                                  enabled = true
                              }: CurrentArrowsParams) {

    const currentData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds)], [data, resolution, viewportBounds])

    if (!enabled) return

    return currentData.map((dataPoint, i) =>
        <SingleCurrentArrow
            key={i}
            count={i}
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
    darkModeRender: boolean
}


function SingleCurrentArrow({viewportBounds, dataPoint, darkModeRender}: SingleCurrentArrowProps) {
    const {currentU, currentV, bounds: tileBounds} = dataPoint;
    const windDir = useMemo(() => normalised([currentU!, -currentV!]), [currentU, currentV])
    // const windDir = [1, 0]
    const magnitudeKnots = mpsToKnots(magnitude([currentU!, currentV!]));
    const opacity = darkModeRender ? 1 : 0.5;
    const color = darkModeRender ? "lightBlue" : "blue";


    if (!viewportBounds || !viewportBounds.intersects(tileBounds!) || !currentU || !currentV || Number.isNaN(currentU)) {
        return null
    }
    const stroke = roundTo(magnitudeKnots * 0.7, 4) + 2
    const length = 5 * magnitudeKnots + 7;
    return <SVGOverlay
        bounds={tileBounds!.pad(0.5)}
    >
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
            x1={`${Math.round(50 - windDir[0] * length)}%`}
            y1={`${Math.round(50 - windDir[1] * length)}%`}
            x2={`${Math.round(50 + windDir[0] * length)}%`}
            y2={`${Math.round(50 + windDir[1] * length)}%`}
            stroke={color}
            strokeWidth={stroke}
            markerEnd="url(#arrow)"/>
    </SVGOverlay>

}