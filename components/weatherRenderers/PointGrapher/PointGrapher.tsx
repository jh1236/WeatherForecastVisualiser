import {Marker, Popup} from "react-leaflet"
import L, {Draggable, LatLng, LatLngBounds, Marker as MarkerType, PointTuple} from 'leaflet'
import {useCallback, useMemo, useRef, useState} from "react";
import {getWeatherDataPointForPoint} from "@/components/dataManagement/DataProcessing";
import {WeatherData} from "@/components/types";

const center = new LatLng(51.505, -0.09)

interface PointProps {
    viewportBounds: LatLngBounds | undefined,
    currentTimeStamp: number,
    data: WeatherData | undefined,
}

export function PointGrapher({viewportBounds, data, currentTimeStamp}: PointProps) {
    const [pos, setPos] = useState<LatLng>(center);
    const dataPoint = useMemo(() => (viewportBounds && viewportBounds.contains(pos)) ? getWeatherDataPointForPoint(data?.times[currentTimeStamp].gribFrames, pos) : undefined, [currentTimeStamp, data?.times, pos, viewportBounds])
    return <>
        <div className="leaflet-top leaflet-right" style={{aspectRatio:'4 / 3', height: '30svh', backgroundColor: 'red', margin: 20, marginRight: 70}}>
            This will be a graph one day!
        </div>
        <Point pos={pos} setPos={setPos}></Point>
    </>
}




function Point({pos, setPos}: { pos: LatLng, setPos: (pos: LatLng) => void }) {
    const markerRef = useRef<MarkerType>(null)
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    setPos(marker.getLatLng())
                }
            },
        }),
        [setPos],
    )
    const iconSize: PointTuple = [30, 30]
    const shadowSize: PointTuple = (iconSize.map(it => Math.floor(it * 1.5)) as PointTuple)

    return (
        <Marker
            icon={L.icon({
                iconUrl: "/draggable.png",
                iconSize,
                shadowUrl: '/draggable_shadow.png',
                shadowSize
            })}
            draggable
            eventHandlers={eventHandlers}
            position={pos}
            ref={markerRef}>

        </Marker>
    )
}

