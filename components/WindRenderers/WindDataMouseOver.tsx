import {useMemo, useState} from "react";
import {bearing, magnitude} from "@/components/vectorUtils";
import {Rectangle, Tooltip, useMapEvents} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {convertToDMS, mpsToKnots, roundTo} from "@/components/utilities";
import {GribFrame} from "@/components/types";
import {boundsFromGribHeader, getWeatherDataPointForPoint, latLngBndsIntersection} from "@/components/DataProcessing";

interface WindDataMouseOverProps {
    data: GribFrame[]
    viewportBounds: LatLngBounds | undefined;
}


export function WindDataMouseOver({data, viewportBounds,}: WindDataMouseOverProps) {
    const [latLng, setLatLng] = useState<LatLng>(new LatLng(0, 0));
    const dataPoint = useMemo(() => (viewportBounds && viewportBounds.contains(latLng)) ? getWeatherDataPointForPoint(data, latLng) : undefined, [data, latLng, viewportBounds])
    useMapEvents({
        mousemove: e => setLatLng(e.latlng),
    })

    const bounds = useMemo(() => ((data?.length && viewportBounds) ? latLngBndsIntersection(viewportBounds, boundsFromGribHeader(data[0].header))! : new LatLngBounds([[0, 0], [0, 0]])), [data, viewportBounds]);

    const windBearing = useMemo(() => dataPoint ? bearing([-dataPoint.windV!, -dataPoint.windU!]) : undefined, [dataPoint]);

    return <Rectangle bounds={bounds}
                      opacity={0} fillOpacity={0}
    >
        <Tooltip sticky>{dataPoint ?
            <p>
                <b>{convertToDMS(Math.abs(latLng.lat))} {latLng.lat > 0 ? 'N' : 'S'}, {convertToDMS(latLng.lng)} E</b> {'\n'}
                {roundTo(mpsToKnots(magnitude([dataPoint?.windU ?? 0, dataPoint?.windV ?? 0])), 2)}kt @ {' '}
                {Math.round(windBearing ?? 0)}° {'\n'}
                <i>{dataPoint?.debugData}</i> {'\n'}
            </p> : <i>No Data</i>}
        </Tooltip>
    </Rectangle>
}