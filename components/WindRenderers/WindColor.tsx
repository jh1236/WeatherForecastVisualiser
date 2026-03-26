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


export function WindColor({viewportBounds, dataPoint, baseLayer}: OceanTileProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const strength = useMemo(() => mpsToKnots(magnitude([windU!, windV!])), [windU, windV]);
    const windBearing = useMemo(() => bearing([-windV!, -windU!]), [windU, windV]);
    const isSatellite = baseLayer === "satellite";

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    const center = dataPoint.bounds!.getCenter();
    return <SVGOverlay
        bounds={tileBounds!.pad(0.5)}
        zIndex={99}
    >

        <rect
            x="24%"
            y="24%"
            width="51%"
            height="51%"
            fillOpacity={isSatellite ? 0.6 : 0.3}
            fill={getColorFromWindSpeedKts(strength)}>
        </rect>
        <Rectangle bounds={dataPoint.bounds!} fillOpacity={0} opacity={0}>
            <Tooltip sticky>
                <p>
                    <b>{convertToDMS(Math.abs(center.lat))} {center.lat > 0 ? 'N' : 'S'}, {convertToDMS(center.lng)} E</b> {'\n'}
                    {roundTo(mpsToKnots(magnitude([windU!, windV!])), 2)}kt @ {' '}
                    {Math.round(windBearing)}° {'\n'}
                    <i>{dataPoint.debugData}</i> {'\n'}
                </p>
            </Tooltip>
        </Rectangle>
    </SVGOverlay>

}