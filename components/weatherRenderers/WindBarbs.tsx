import {useMemo} from "react";
import {magnitude, normalised, rotatedBy} from "@/components/vectorUtils";
import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {mpsToKnots} from "@/components/unitsUtils";
import {latLngBndsIntersection, maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";
import {lerp} from "@/components/utilities";


interface WindBarbsParams {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}

export function WindBarbs({viewportBounds, data, darkModeRender, resolution = 25}: WindBarbsParams) {

    const windBarbData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.2.2", "0.2.3"])], [data, resolution, viewportBounds])

    const svgSize = latLngBndsIntersection(maxBoundsFromGribFrames(data), viewportBounds!)

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
    count: number,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    x: string,
    y: string,
    w: string,
    h: string,
}


export function mapToBigBox(coord: number | string, delta: number | string, t: number | string) {
    const trueCoord = typeof coord === 'number' ? coord : Number(coord.replace(/%$/, ''))
    const trueDelta = typeof delta === 'number' ? delta : Number(delta.replace(/%$/, ''))
    const trueT = typeof t === 'number' ? t : (Number(t.replace(/%$/, '')) / 100)
    return `${lerp(trueCoord, trueCoord + trueDelta, trueT)}%`
}


function SingleWindBarb({
                            viewportBounds,
                            dataPoint,
                            darkModeRender,
                            x,
                            y,
                            w,
                            h
                        }: SingleWindBarbProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const windDir = useMemo(() => normalised([-windU!, windV!]), [windU, windV])
    const magnitudeKnots = Math.round(mpsToKnots(magnitude([windU!, windV!])) / 5) * 5;
    const strokeWidth = 3
    const out = []
    const opacity = darkModeRender ? 1 : 0.5;
    const color = darkModeRender ? "white" : "black";
    if (magnitudeKnots === 0) {
        out.push(<circle cx="50%" cy="50%" r="15%" fillOpacity={0}
                         stroke={color} opacity={opacity}
                         strokeWidth={strokeWidth}/>)
    } else {
        let magnitudeLeftToRepresent = magnitudeKnots
        const tailDir = rotatedBy(windDir, 290);
        const perpendicular = rotatedBy(windDir, 270);
        const tailLen = 25
        const notchSpacing = 13;
        const bodyLen = 40
        let key = 1
        let notchesFromEnd = 0
        out.push(<line
            key={0}
            opacity={opacity}
            fil={color}
            x1={`${Math.round(50 - windDir[0] * bodyLen)}%`}
            y1={`${Math.round(50 - windDir[1] * bodyLen)}%`}
            x2={`${Math.round(50 + windDir[0] * bodyLen)}%`}
            y2={`${Math.round(50 + windDir[1] * bodyLen)}%`}
            stroke={color}
            strokeWidth={strokeWidth}/>)
        while (magnitudeLeftToRepresent >= 50) {
            const triangleStartX = Math.round(50 + windDir[0] * (bodyLen - 1 - notchSpacing * notchesFromEnd));
            const triangleStartY = Math.round(50 + windDir[1] * (bodyLen - 1 - notchSpacing * notchesFromEnd));
            const triangleEndX = Math.round(50 + windDir[0] * (bodyLen - 1 - notchSpacing * (notchesFromEnd + 1)));
            const triangleEndY = Math.round(50 + windDir[1] * (bodyLen - 1 - notchSpacing * (notchesFromEnd + 1)));
            const points = [
                [triangleStartX, triangleStartY],
                [triangleStartX + perpendicular[0] * tailLen, triangleStartY + perpendicular[1] * tailLen],
                [triangleEndX, triangleEndY],
            ].map(([xin, yin]) => `${xin},${yin}`).join(' ')
            console.log(points)
            out.push(
                <polygon
                    opacity={opacity}
                    points={points}
                    stroke={color}
                    fill={color}
                    strokeWidth={strokeWidth}
                    key={key}
                />
            )
            key++
            magnitudeLeftToRepresent -= 50
            notchesFromEnd += 1.2
            if (magnitudeLeftToRepresent < 50) {
                notchesFromEnd += 0.75
            }
        }
        while (magnitudeLeftToRepresent >= 10) {
            const stemStartX = Math.round(50 + windDir[0] * (bodyLen - 1 - notchSpacing * notchesFromEnd));
            const stemStartY = Math.round(50 + windDir[1] * (bodyLen - 1 - notchSpacing * notchesFromEnd));
            out.push(
                <line
                    opacity={opacity}
                    x1={`${stemStartX}%`}
                    y1={`${stemStartY}%`}
                    x2={`${stemStartX + tailDir[0] * tailLen}%`}
                    y2={`${stemStartY + tailDir[1] * tailLen}%`}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    key={key}
                />
            )
            key++
            magnitudeLeftToRepresent -= 10
            notchesFromEnd++
        }
        if (magnitudeLeftToRepresent >= 5) {
            if (notchesFromEnd === 0) {
                //we don't ever want to be on the very end
                notchesFromEnd++;
            }
            const stemStartX = Math.round(50 + windDir[0] * (bodyLen - notchSpacing * notchesFromEnd));
            const stemStartY = Math.round(50 + windDir[1] * (bodyLen - notchSpacing * notchesFromEnd));
            out.push(
                <line
                    opacity={opacity}
                    x1={`${stemStartX}%`}
                    y1={`${stemStartY}%`}
                    x2={`${stemStartX + tailDir[0] * tailLen / 2}%`}
                    y2={`${stemStartY + tailDir[1] * tailLen / 2}%`}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    key={key}
                />
            )
            key++
        }


    }

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }
    return <svg
        viewBox="0 0 100 100"
        x={x}
        width={w}
        y={y}
        height={h}
    >
        {out}
    </svg>

}