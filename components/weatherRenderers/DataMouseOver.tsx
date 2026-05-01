import {useMemo, useState} from "react";
import {bearing, magnitude} from "@/components/vectorUtils";
import {Rectangle, Tooltip, useMapEvents} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {convertToDMS, roundTo} from "@/components/utilities";
import {GribFrame} from "@/components/types";
import {getWeatherDataPointForPoint,} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";
import {boundsFromGribFrame, latLngBndsIntersection} from "@/components/dataManagement/gribUtils";
import {useCurrentSpeedInUserUnits, useTemperatureInUserUnits, useWindSpeedInUserUnits} from "@/components/unitsUtils";

interface WindDataMouseOverProps {
    data: GribFrame[]
    viewportBounds: LatLngBounds | undefined;
}


export function DataMouseOver({data, viewportBounds}: WindDataMouseOverProps) {
    const [latLng, setLatLng] = useState<LatLng>(new LatLng(0, 0));
    const dataPoint = useMemo(() => (viewportBounds && viewportBounds.contains(latLng)) ? getWeatherDataPointForPoint(data, latLng) : undefined, [data, latLng, viewportBounds])
    const windSpeed = useWindSpeedInUserUnits(magnitude([dataPoint?.windU ?? 0, dataPoint?.windV ?? 0]), 'm/s')
    const windBearing = useMemo(() => dataPoint ? bearing([-dataPoint.windV!, -dataPoint.windU!]) : undefined, [dataPoint]);

    const currentSpeed = useCurrentSpeedInUserUnits(magnitude([dataPoint?.currentU ?? 0, dataPoint?.currentV ?? 0]), 'm/s')
    const currentBearing = useMemo(() => dataPoint ? bearing([-dataPoint.currentV!, -dataPoint.currentU!]) : undefined, [dataPoint]);

    useMapEvents({
        mousemove: e => setLatLng(e.latlng),
    })
    const bounds = useMemo(() => ((data?.length && viewportBounds) ? latLngBndsIntersection(viewportBounds, boundsFromGribFrame(data[0]))! : new LatLngBounds([[0, 0], [0, 0]])), [data, viewportBounds]);
    const wind = !!(dataPoint?.windU && dataPoint.windV);
    const current = !!(dataPoint?.currentU && dataPoint.currentV);
    const {settings} = useSettings();
    const temperature = useTemperatureInUserUnits(dataPoint?.temperature, 'C');
    const oceanTemperature = useTemperatureInUserUnits(dataPoint?.oceanTemperature, 'C');
    return <Rectangle bounds={bounds}
                      opacity={0} fillOpacity={0}
    >
        <Tooltip sticky>{dataPoint ?
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <div>
                    <b>{convertToDMS(Math.abs(latLng.lat))} {latLng.lat > 0 ? 'N' : 'S'}, {convertToDMS(latLng.lng)} E</b>
                </div>
                {'\n'}
                {wind && <div><i
                    style={{fontWeight: 600}}>Wind: </i>{roundTo(windSpeed, 2)}{settings.windSpeedUnit} @ {Math.round(windBearing ?? 0)}°
                </div>}
                {!!temperature &&
                    <div><i
                        style={{fontWeight: 600}}>Temperature: </i>{roundTo(temperature, 1)}°{settings.temperatureUnit}
                    </div>}
                {current && <div><i
                    style={{fontWeight: 600}}>Current: </i>{roundTo(currentSpeed, 2)}{settings.currentSpeedUnit} @ {Math.round(currentBearing ?? 0)}°
                </div>}
                {!!oceanTemperature &&
                    <div><i style={{fontWeight: 600}}>Ocean
                        Temperature: </i>{roundTo(oceanTemperature, 1)}°{settings.temperatureUnit}</div>}
                <i>{dataPoint.debugData}</i> {'\n'}
            </div> : <i>No Data</i>}
        </Tooltip>
    </Rectangle>
}