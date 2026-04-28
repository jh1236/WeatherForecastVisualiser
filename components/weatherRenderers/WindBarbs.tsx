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
    const magnitudeKnots = Math.round(5 * mpsToKnots(magnitude([windU!, windV!]))) / 5;
    const strokeWidth = `${Number(w.replace(/%$/, '')) / 30}%`
    const out = []
    const opacity = darkModeRender ? 1 : 0.5;
    const color = darkModeRender ? "white" : "black";
    if (magnitudeKnots === 0) {
        const radius = `${Number(w.replace(/%$/, '')) / 10}%`
        out.push(<circle cx={mapToBigBox(x, w, "50%")} cy={mapToBigBox(y, h, "50%")} r={radius} fillOpacity={0.0}
                         stroke={color} opacity={opacity}
                         strokeWidth={strokeWidth}/>)
    } else {
        let magnitudeLeftToRepresent = Math.round(magnitudeKnots / 5) * 5
        const tailDir = rotatedBy(windDir, 290);
        const tailLen = 15
        const bodyLen = 30
        out.push(<line
            key={0}
            opacity={opacity}
            x1={mapToBigBox(x, w, `${Math.round(50 - windDir[0] * bodyLen)}%`)}
            y1={mapToBigBox(y, h, `${Math.round(50 - windDir[1] * bodyLen)}%`)}
            x2={mapToBigBox(x, w, `${Math.round(50 + windDir[0] * bodyLen)}%`)}
            y2={mapToBigBox(y, h, `${Math.round(50 + windDir[1] * bodyLen)}%`)}
            stroke={color}
            strokeWidth={strokeWidth}/>)
        let key = 1
        if (magnitudeLeftToRepresent % 10 >= 5 || magnitudeLeftToRepresent <= 5) {
            const isOnlyTail = magnitudeLeftToRepresent <= 5
            if (isOnlyTail) {
                magnitudeLeftToRepresent = 20
            } else {
                magnitudeLeftToRepresent += 5;
            }
            const stemStartX = Math.round(50 + windDir[0] * (30 - magnitudeLeftToRepresent));
            const stemStartY = Math.round(50 + windDir[1] * (30 - magnitudeLeftToRepresent));
            out.push(
                <line
                    opacity={opacity}
                    x1={mapToBigBox(x, w, `${stemStartX}%`)}
                    y1={mapToBigBox(y, h, `${stemStartY}%`)}
                    x2={mapToBigBox(x, w, `${stemStartX + tailDir[0] * tailLen / 2}%`)}
                    y2={mapToBigBox(y, h, `${stemStartY + tailDir[1] * tailLen / 2}%`)}
                    stroke={color}
                    strokeWidth={strokeWidth}
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
            const stemStartX = Math.round(50 + windDir[0] * (30 - magnitudeLeftToRepresent));
            const stemStartY = Math.round(50 + windDir[1] * (30 - magnitudeLeftToRepresent));
            out.push(
                <line

                    opacity={opacity}
                    x1={mapToBigBox(x, w, `${stemStartX}%`)}
                    y1={mapToBigBox(y, h, `${stemStartY}%`)}
                    x2={mapToBigBox(x, w, `${stemStartX + tailDir[0] * tailLen}%`)}
                    y2={mapToBigBox(y, h, `${stemStartY + tailDir[1] * tailLen}%`)}
                    stroke={color}
                    strokeWidth={strokeWidth}
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