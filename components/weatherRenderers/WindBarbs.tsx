import {useMemo} from "react";
import {magnitude, normalised, rotatedBy} from "@/components/vectorUtils";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {mpsToKnots} from "@/components/unitsUtils";
import {maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";
import {getColorFromWindSpeedKts} from "@/components/utilities";


interface WindBarbsParams {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}

export function WindBarbs({viewportBounds, data, darkModeRender, resolution = 25}: WindBarbsParams) {

    const windBarbData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.2.2", "0.2.3"])], [data, resolution, viewportBounds])

    const svgSize = maxBoundsFromGribFrames(data)

    const latWidth = svgSize.getEast() - svgSize.getWest()
    const lngHeight = svgSize.getNorth() - svgSize.getSouth()
    return windBarbData.map((dataPoint, i) =>
        <SingleWindBarb
            key={i}
            x={100 * (dataPoint.bounds!.getWest() - svgSize.getWest()) / latWidth + "%"}
            y={(100 * (svgSize.getNorth() - dataPoint.bounds!.getNorth()) / lngHeight) + "%"}
            w={100 * (dataPoint.bounds!.getEast() - dataPoint.bounds.getWest()) / latWidth + "%"}
            h={100 * (dataPoint.bounds!.getNorth() - dataPoint.bounds.getSouth()) / lngHeight + "%"}
            count={i}
            viewportBounds={viewportBounds}
            dataPoint={dataPoint}
            darkModeRender={darkModeRender}
        />
    )
}

interface SingleWindBarbProps {
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


function SingleWindBarb({
                            viewportBounds,
                            dataPoint,
                            darkModeRender,
                            x: xPercent,
                            y: yPercent,
                            w: wPercent,
                            h: hPercent
                        }: SingleWindBarbProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const windDir = useMemo(() => normalised([-windU!, windV!]), [windU, windV])
    const magnitudeKnots = Math.round(5 * mpsToKnots(magnitude([windU!, windV!]))) / 5;
    const [x, y, w, h] = [xPercent, yPercent, wPercent, hPercent].map(it => Number(it.replace("%", "")));
    const out = [<rect
        key={x + 100 * y}
        z={-100}
        x={`${x}%`}
        y={`${y}%`}
        width={`${w}%`}
        height={`${h}%`}
        fillOpacity={0}
        opacity={0.5}
    >
    </rect>]
    const opacity = darkModeRender ? 1 : 0.5;
    const color = darkModeRender ? "white" : "black";
    const [centerX, centerY] = [[x, w], [y, h]].map(([left, delta]) => left + delta / 2);
    const d = Math.min(w, h) / 2
    if (magnitudeKnots === 0) {
        out.push(<circle cx={`${centerX}%`} cy={`${centerY}%`} r={`${d}%`} fillOpacity={0.0} stroke={color}
                         opacity={opacity}
                         strokeWidth={3}/>)
    } else {
        let magnitudeLeftToRepresent = Math.round(magnitudeKnots / 5) * 5
        const tailDir = rotatedBy(windDir, 290);
        const tailLen = 4
        out.push(<line
            key={0}
            opacity={opacity}
            x1={`${Math.round(centerX - windDir[0] * w * 0.5)}%`}
            y1={`${Math.round(centerY - windDir[1] * h * 0.5)}%`}
            x2={`${Math.round(centerX + windDir[0] * w * 0.5)}%`}
            y2={`${Math.round(centerY + windDir[1] * h * 0.5)}%`}
            stroke={color}
            strokeWidth={3}/>)
        let key = 1
        if (magnitudeLeftToRepresent % 10 >= 5 || magnitudeLeftToRepresent <= 5) {
            const isOnlyTail = magnitudeLeftToRepresent <= 5
            if (isOnlyTail) {
                magnitudeLeftToRepresent = 20
            } else {
                magnitudeLeftToRepresent += 5;
            }
            const stemStartX = Math.round(centerX + windDir[0] * (19 - magnitudeLeftToRepresent / 2) * 0.2);
            const stemStartY = Math.round(centerY + windDir[1] * (19 - magnitudeLeftToRepresent / 2) * 0.2);
            out.push(
                <line
                    opacity={opacity}
                    x1={`${stemStartX}%`}
                    y1={`${stemStartY}%`}
                    x2={`${stemStartX + tailDir[0] * tailLen / 2}%`}
                    y2={`${stemStartY + tailDir[1] * tailLen / 2}%`}
                    stroke={color}
                    strokeWidth={3}
                    key={key}
                />
            )
            if (isOnlyTail) {
                magnitudeLeftToRepresent = 0;
            } else {
                magnitudeLeftToRepresent -= 10;
            }
            key++
        }
        while (magnitudeLeftToRepresent >= 10) {
            const stemStartX = Math.round(centerX + windDir[0] * (d - magnitudeLeftToRepresent / 2));
            const stemStartY = Math.round(centerY + windDir[1] * (d - magnitudeLeftToRepresent / 2));
            out.push(
                <line

                    opacity={opacity}
                    x1={`${stemStartX}%`}
                    y1={`${stemStartY}%`}
                    x2={`${stemStartX + tailDir[0] * tailLen}%`}
                    y2={`${stemStartY + tailDir[1] * tailLen}%`}
                    stroke={color}
                    strokeWidth={3}
                    key={key}
                />
            )
            key++
            magnitudeLeftToRepresent -= 10
        }

    }

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    return out

}