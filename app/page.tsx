'use client';

import {
    Circle,
    FeatureGroup,
    LayerGroup,
    LayersControl,
    MapContainer,
    Marker,
    Popup, Rectangle,
    TileLayer,
    useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {LatLng} from "leaflet";
import {useEffect, useMemo, useState} from "react";


function MapCoordinates() {
    const x: LatLng = useMap().getCenter();
    return <Marker position={[0, 0]}>
        <Popup>
            A pretty CSS3 popup. <br/> Easily customizable.
        </Popup>
    </Marker>
}

const center = [51.505, -0.09]
const rectangle = [
    [51.49, -0.08],
    [51.5, -0.06],
]
export default function Home() {
    const [data, setData] = useState()
    const [currents, setCurrents] = useState<any[]>([])
    const [width, setWidth] = useState<number>(0)
    const [deltas, setDeltas] = useState<number[]>([0, 0])
    const [start, setStart] = useState<number[]>([0, 0])
    useEffect(() => {
        fetch("http://localhost:3000/api/grib2json").then(res =>
            res.json().then(json => {
                    console.log(json["grib"]);
                    setData(json["grib"])
                    for (const i of json["grib"]) {
                        const obj = i["header"]
                        if (obj["discipline"] === 0 && obj["parameterCategory"] === 2 && obj["parameterNumber"] === 2) {
                            console.log(i["data"])
                            setStart([obj.la1, obj.lo1]);
                            setCurrents(i.data);
                            setDeltas([(obj.la2 - obj.la1) / obj.nx, (obj.lo2 - obj.lo1) / obj.ny]);
                            setWidth(obj.nx)
                            break;
                        }
                    }
                }
            )
        )

    }, [])
    return (
        <>
            <MapContainer center={[0, 0]} zoom={13} scrollWheelZoom={false} style={{height: '90vh'}}>
                <LayersControl position="topright">
                    <LayersControl.Overlay name="Marker with popup">
                        <Marker position={center}>
                            <Popup>
                                A pretty CSS3 popup. <br/> Easily customizable.
                            </Popup>
                        </Marker>
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name="Layer group with circles">
                        <LayerGroup>
                            <Circle
                                center={center}
                                pathOptions={{fillColor: 'blue'}}
                                radius={200}
                            />
                            <Circle
                                center={center}
                                pathOptions={{fillColor: 'red'}}
                                radius={100}
                                stroke={false}
                            />
                            <LayerGroup>
                                <Circle
                                    center={[51.51, -0.08]}
                                    pathOptions={{color: 'green', fillColor: 'green'}}
                                    radius={100}
                                />
                            </LayerGroup>
                        </LayerGroup>
                    </LayersControl.Overlay>
                    <LayersControl.Overlay name="Feature group">
                        <LayerGroup pathOptions={{color: 'purple'}}>
                            {currents.map((item, i) => (
                                <Rectangle
                                    bounds={[[start[0] + deltas[0] * (i % width), start[1] + deltas[1] * (Math.floor(i / width))],
                                        [start[0] + deltas[0] * (i% width + 1), start[1] + deltas[1] * (Math.floor((i / width + 1)))]]}
                                    key={i}
                                    pathOptions={{pathColor: 'red', fillColor: 'green'}}/>
                            ))}
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCoordinates></MapCoordinates>
            </MapContainer>
            <code style={{height: '10vh', overflow: 'scroll'}}>
                currents: {JSON.stringify(currents, null, 2)} {'\n'}
                width: {JSON.stringify(width, null, 2)} {'\n'}
                deltas: {JSON.stringify(deltas, null, 2)} {'\n'}
                start: {JSON.stringify(start, null, 2)} {'\n'}
            </code>
        </>
    );
}
