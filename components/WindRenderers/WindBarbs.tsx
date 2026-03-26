import {useMemo, useState} from "react";
import {bearing, magnitude, normalised, rotatedBy} from "@/components/vectorUtils";
import {Rectangle, SVGOverlay, Tooltip, useMap, useMapEvent} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {convertToDMS, getColorFromWindSpeedKts, hsvToRgb, mpsToKnots, roundTo} from "@/components/utilities";
import {WeatherDataPoint} from "@/components/types";


const strokeWidth = "3%"


interface OceanTileProps {
    dataPoint: WeatherDataPoint
    maxWind: number,
    viewportBounds: LatLngBounds | undefined,
    count?: number,
    trueLatLng?: LatLng,
    baseLayer: string,
}


export function WindBarb({viewportBounds, dataPoint, baseLayer}: OceanTileProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const isSatellite = baseLayer === 'Satellite';
    const windDir = useMemo(() => normalised([-windU!, windV!]), [windU, windV])
    const magnitudeKnots = Math.round(5 * mpsToKnots(magnitude([windU!, windV!]))) / 5;
    const out = []
    const opacity = isSatellite ? 1 : 0.5;
    const color = isSatellite ? "white" : "black";
    if (magnitudeKnots === 0) {
        out.push(<circle cx="50%" cy="50%" r="8%" fillOpacity={0.0} stroke={color} opacity={opacity}
                         strokeWidth={strokeWidth}/>)
    } else {
        let magnitudeLeftToRepresent = Math.round(magnitudeKnots / 5) * 5
        const tailDir = rotatedBy(windDir, 290);
        const tailLen = 14
        out.push(<line
            key={0}
            opacity={opacity}
            x1={`${Math.round(50 - windDir[0] * 15)}%`}
            y1={`${Math.round(50 - windDir[1] * 15)}%`}
            x2={`${Math.round(50 + windDir[0] * 15)}%`}
            y2={`${Math.round(50 + windDir[1] * 15)}%`}
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
            const stemStartX = Math.round(50 + windDir[0] * (19 - magnitudeLeftToRepresent / 2));
            const stemStartY = Math.round(50 + windDir[1] * (19 - magnitudeLeftToRepresent / 2));
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
            if (isOnlyTail) {
                magnitudeLeftToRepresent = 0;
            } else {
                magnitudeLeftToRepresent -= 10;
            }
            key++
        }
        while (magnitudeLeftToRepresent >= 10) {
            const stemStartX = Math.round(50 + windDir[0] * (19 - magnitudeLeftToRepresent / 2));
            const stemStartY = Math.round(50 + windDir[1] * (19 - magnitudeLeftToRepresent / 2));
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
        }

    }

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    return <SVGOverlay
        zIndex={-99}
        bounds={tileBounds!.pad(0.5)}
    >
        {out}
    </SVGOverlay>

}