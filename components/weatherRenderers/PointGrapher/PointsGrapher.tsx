import {Marker, useMap} from "react-leaflet"
import L, {LatLng, LatLngBounds, Marker as MarkerType, PointTuple} from 'leaflet'
import {useEffect, useMemo, useRef, useState} from "react";
import {WeatherData} from "@/components/types";
import {ChartLineLinear} from "@/components/weatherRenderers/PointGrapher/LineGraph";
import {createPortal} from "react-dom";


interface PointsGrapherProps {
    viewportBounds: LatLngBounds,
    currentTimeStamp: number,
    data: WeatherData,
    draggable: boolean
    populated: boolean
}

export const COLORS = ['blue', 'red', 'green', 'orange', 'pink'] as const

export type MapGraphPointer = { pos: LatLng, color: typeof COLORS[number] };

export function PointsGrapher({data, viewportBounds, draggable, populated}: PointsGrapherProps) {
    const [points, setPoints] = useState<MapGraphPointer[]>([{pos: viewportBounds.getCenter(), color: 'blue'}]);
    const parentRef = useRef<HTMLDivElement>(null);
    const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);
    const map = useMap()
    useEffect(() => {
        const a = new (L.Control.extend({
            onAdd: () => {
                const child = L.DomUtil.create('div', 'leaflet-top leaflet-right', parentRef.current!);
                // child.style = {aspectRatio: '4 / 3', height: '30svh', margin: 20, marginRight: 70}
                child.style.aspectRatio = '1 / 1'
                child.style.height = '40svh'
                child.style.marginTop = '70px'
                L.DomEvent.disableScrollPropagation(child)
                L.DomEvent.disableClickPropagation(child)
                setPortalTarget(child)
                return child;
            }
        }))()
        map.addControl(a)
        return () => {
            setPortalTarget(null);
            map.removeControl(a)
        }
    }, [map]);

    const graph = portalTarget ? createPortal(<ChartLineLinear data={data}
                                                               points={points}
                                                               setPoints={setPoints}
                                                               viewportBounds={viewportBounds!}></ChartLineLinear>, portalTarget) : null
    return <>
        {populated && graph}
        <div ref={parentRef}>
        </div>
        {points.map((point, index) =>
            <Point key={index} point={point}
                   draggable={draggable}
                   id={index}
                   setPoint={(newPos) => setPoints(prev => prev.map((p, i) => i === index ? newPos : p))}></Point>
        )}

    </>
}


interface PointProps {
    id: number,
    point: MapGraphPointer,
    setPoint: (point: MapGraphPointer) => void,
    draggable: boolean
}

function Point({point, setPoint, draggable}: PointProps) {
    const markerRef = useRef<MarkerType>(null)
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    setPoint({...point, pos: marker.getLatLng()})
                }
            },
        }),
        [point, setPoint],
    )
    const iconSize: PointTuple = [30, 30]
    const shadowSize: PointTuple = (iconSize.map(it => Math.floor(it * 1.5)) as PointTuple)

    return (
        <Marker
            icon={L.icon({
                iconUrl: `/drag_${point.color}.png`,
                iconSize,
                shadowUrl: '/draggable_shadow.png',
                shadowSize
            })}
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={point.pos}
            ref={markerRef}>

        </Marker>
    )
}

