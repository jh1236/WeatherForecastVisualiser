import {useMemo, useState} from "react";
import {bearing, magnitude} from "@/components/vectorUtils";
import {Rectangle, Tooltip, useMapEvents} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {latLngToDMS, roundTo} from "@/components/utilities";
import {GribFrame} from "@/components/types";
import {getWeatherDataPointForPoint,} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";
import {boundsFromGribFrame, latLngBndsIntersection} from "@/components/dataManagement/gribUtils";
import {
    useConvertToUserUnitsAndFormat,
    useCurrentSpeedInUserUnits,
    useTemperatureInUserUnits,
    useWindSpeedInUserUnits
} from "@/components/unitsUtils";

interface WindDataMouseOverProps {
    data: GribFrame[]
    viewportBounds: LatLngBounds | undefined;
}


export function DataMouseOver({data, viewportBounds}: WindDataMouseOverProps) {
    const [latLng, setLatLng] = useState<LatLng>(new LatLng(0, 0));
    const converter = useConvertToUserUnitsAndFormat()
    const dataPoint = useMemo(() => (viewportBounds && viewportBounds.contains(latLng)) ? getWeatherDataPointForPoint(data, latLng) : undefined, [data, latLng, viewportBounds])
    const windSpeed = converter('windSpeed', magnitude([dataPoint?.windU ?? 0, dataPoint?.windV ?? 0]), 'm/s')
    const windBearing = useMemo(() => dataPoint ? bearing([-dataPoint.windV!, -dataPoint.windU!]) : undefined, [dataPoint]);

    const currentSpeed = converter('current', magnitude([dataPoint?.currentU ?? 0, dataPoint?.currentV ?? 0]), 'm/s')
    const currentBearing = useMemo(() => dataPoint ? bearing([-dataPoint.currentV!, -dataPoint.currentU!]) : undefined, [dataPoint]);

    useMapEvents({
        mousemove: e => setLatLng(e.latlng),
    })
    const bounds = useMemo(() => ((data?.length && viewportBounds) ? latLngBndsIntersection(viewportBounds, boundsFromGribFrame(data[0]))! : new LatLngBounds([[0, 0], [0, 0]])), [data, viewportBounds]);
    const wind = !!(dataPoint?.windU && dataPoint.windV);
    const current = !!(dataPoint?.currentU && dataPoint.currentV);
    const {settings} = useSettings();
    const temperature = dataPoint?.temperature ? converter('temperature', dataPoint?.temperature, 'C') : undefined;
    const oceanTemperature = dataPoint?.oceanTemperature ? converter('oceanTemperature', dataPoint?.oceanTemperature, 'C') : undefined;

    return <Rectangle bounds={bounds}
                      opacity={0} fillOpacity={0}
    >
        <Tooltip sticky>{dataPoint ?
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <div>
                    <b>{latLngToDMS(latLng)}</b>
                </div>
                {'\n'}
                {wind && <div><i
                    style={{fontWeight: 600}}>Wind: </i>{windSpeed} @ {Math.round(windBearing ?? 0)}°
                </div>}
                {!!temperature &&
                    <div><i
                        style={{fontWeight: 600}}>Temperature: </i>{temperature}
                    </div>}
                {current && <div><i
                    style={{fontWeight: 600}}>Current: </i>{currentSpeed} @ {Math.round(currentBearing ?? 0)}°
                </div>}
                {!!oceanTemperature &&
                    <div><i style={{fontWeight: 600}}>Ocean
                        Temperature: </i>{oceanTemperature}</div>}
                <i>{dataPoint.debugData}</i> {'\n'}
            </div> : <i>No Data</i>}
        </Tooltip>
    </Rectangle>
}