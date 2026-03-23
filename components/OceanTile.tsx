import {useMemo} from "react";
import {bearing, magnitude, normalised, rotatedBy} from "@/components/vectorUtils";
import {Rectangle, SVGOverlay, Tooltip, useMap} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {convertToDMS, hsvToRgb, mpsToKnots, roundTo} from "@/components/utilities";
import {WeatherDataPoint} from "@/components/types";


const strokeWidth = "3%"


interface OceanTileProps {
    dataPoint: WeatherDataPoint
    maxWind: number,
    viewportBounds: LatLngBounds | undefined,
    count?: number,
    trueLatLng?: LatLng
}


function SVGWindLine({windU, windV}: { windU: number, windV: number }) {
    const windDir = useMemo(() => normalised([-windU!, windV!]), [windU, windV])
    const magnitudeKnots = mpsToKnots(magnitude([windU!, windV!]));
    const epsilon = 0.01;
    if (magnitudeKnots < epsilon) {
        return <circle cx="50%" cy="50%" r="8%" fillOpacity={0.0} stroke="black" opacity={0.5}
                       strokeWidth={strokeWidth}/>
    }
    let magnitudeLeftToRepresent = Math.round(magnitudeKnots / 5) * 5
    const tailDir = rotatedBy(windDir, 290);
    const tailLen = 14
    const out = [<line
        key={0}
        opacity={0.5}
        x1={`${Math.round(50 - windDir[0] * 15)}%`}
        y1={`${Math.round(50 - windDir[1] * 15)}%`}
        x2={`${Math.round(50 + windDir[0] * 15)}%`}
        y2={`${Math.round(50 + windDir[1] * 15)}%`}
        stroke="black"
        strokeWidth={strokeWidth}/>]
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
                opacity={0.5}
                x1={`${stemStartX}%`}
                y1={`${stemStartY}%`}
                x2={`${stemStartX + tailDir[0] * tailLen / 2}%`}
                y2={`${stemStartY + tailDir[1] * tailLen / 2}%`}
                stroke="black"
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

                opacity={0.5}
                x1={`${stemStartX}%`}
                y1={`${stemStartY}%`}
                x2={`${stemStartX + tailDir[0] * tailLen}%`}
                y2={`${stemStartY + tailDir[1] * tailLen}%`}
                stroke="black"
                strokeWidth={strokeWidth}
                key={key}
            />
        )
        key++
        magnitudeLeftToRepresent -= 10
    }
    return out
}

export function OceanTile({maxWind, viewportBounds, dataPoint}: OceanTileProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const strength = useMemo(() => magnitude([windU!, windV!]) / maxWind, [maxWind, windU, windV]);
    const windBearing = useMemo(() => bearing([-windU!, -windV!]), [windU, windV]);
    const zoom = useMap().getZoom();

    function getColor(u: number, v: number) {
        const {r, g, b} = hsvToRgb(bearing([u, v]), .7, strength / 2.0 + 0.5)
        return `rgb(${r},${g},${b})`
    }

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    const center = dataPoint.bounds!.getCenter();
    return <SVGOverlay
        bounds={tileBounds!.pad(0.5)}
    >

        <rect
            x="24%"
            y="24%"
            width="51%"
            height="51%"
            fillOpacity={Math.min(1, Math.max(0, 1.375 - (zoom / 8)))}
            fill={getColor(-windU!, -windV!)}>
        </rect>
        <Rectangle bounds={dataPoint.bounds!} fillOpacity={0} opacity={0}>
            <Tooltip sticky>
                <p>
                    <b>{convertToDMS(Math.abs(center.lat))} {center.lat > 0 ? 'N' : 'S'}, {convertToDMS(center.lng)} E</b> {'\n'}
                    {roundTo(mpsToKnots(magnitude([windU!, windV!])), 2)}kt @ {' '}
                    {Math.round(windBearing)}° {'\n'}
                </p>
            </Tooltip>
        </Rectangle>
        <SVGWindLine windU={windU!} windV={windV!}></SVGWindLine>

    </SVGOverlay>

}