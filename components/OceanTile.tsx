import {useMemo} from "react";
import {bearing, magnitude, normalised} from "@/components/vectorUtils";
import {Rectangle, SVGOverlay, Tooltip} from "react-leaflet";
import {LatLngBounds} from "leaflet";
import {hsvToRgb} from "@/components/utilities";


const lineLength = 0.8
const strokeWidth = "7%"


type OceanTileProps = { windU: number, windV: number, maxU: number, maxV: number, tileBounds: LatLngBounds, viewportBounds: LatLngBounds | undefined };

export function OceanTile({windU, windV, maxU, maxV, tileBounds, viewportBounds}: OceanTileProps) {

    const strength = 2 * useMemo(() => magnitude([windU, windV]) / magnitude([maxU, maxV]), [maxU, maxV, windU, windV]);
    const coords = useMemo(() => normalised([-windU, windV]).map(it => strength * lineLength * (0.5 + it / 2) + 0.2 * (0.5 + it / 2)), [strength, windU, windV])


    function getColor(u: number, v: number) {
        const {r, g, b} = hsvToRgb(bearing([u, v]), .7, strength)
        return `rgb(${r},${g},${b})`
    }


    const intensity = windU * windU + windV * windV
    if (!intensity || !viewportBounds || !viewportBounds.intersects(tileBounds)) {
        return null
    }

    if (magnitude([windU, windV]) * 2 < 5 && false) {
        return <circle cx="50%" cy="50%" r="15%" fillOpacity={0.0} stroke="black" strokeWidth={strokeWidth}/>
    }

    return <SVGOverlay
        bounds={tileBounds.pad(0.2)}
    >

        <defs>
            <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="2"
                markerHeight="2"
                orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z"/>
            </marker>
        </defs>
        <line
            x1="50%"
            y1="50%"
            x2={`${Math.round(coords[0] * 100)}%`}
            y2={`${Math.round(coords[1] * 100)}%`}
            stroke="black"
            strokeWidth={strokeWidth}
            markerEnd="url(#arrow)"
        />
        <Rectangle
            bounds={tileBounds}
            opacity={0.5} stroke={false} fillColor={getColor(windU, windV)}>
            <Tooltip sticky>
                {2 * Math.round(magnitude([windU, windV]) * 10) / 10}kt @ {' '}
                {Math.round(bearing([-windU, -windV]))}° {'\n'}
            </Tooltip>
        </Rectangle>
    </SVGOverlay>

}