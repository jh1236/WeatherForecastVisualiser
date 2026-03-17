'use client';

import {
    Circle,
    LayerGroup,
    LayersControl,
    MapContainer,
    Marker,
    Popup,
    Rectangle,
    TileLayer,
    useMap,
    useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {LatLng, LatLngBounds} from "leaflet";
import {Fragment, useEffect, useMemo, useState} from "react";
import {OceanTile} from "@/components/OceanTile";
import {
    averageArrayToSize,
    getSliceOf2DArray,
    latLngBndsIntersection,
    unflattenArray
} from "@/components/dataArrayUtils";
import {zip} from "@/components/utilities";


function MapCoordinates() {
    const x: LatLng = useMap().getCenter();
    return <Marker position={[0, 0]}>
        <Popup>
            A pretty CSS3 popup. <br/> Easily customizable.
        </Popup>
    </Marker>
}

const center = [51.505, -0.09]
const resolution: [number, number] = [30, 30]

interface Datum {
    time: string;
    windU: number[][];
    windV: number[][];
}


function getSmartResizedUVFromData(data: {
    [key: string]: Datum
}, resolution: [number, number], totalBounds: LatLngBounds, targetBounds: LatLngBounds) {
    const out: { [key: string]: number[][][] } = {}
    // for each timeStep
    for (const i of Object.values(data)) {
        const resizedWindU = getSliceOf2DArray(i.windU, resolution, totalBounds, targetBounds);
        const resizedWindV = getSliceOf2DArray(i.windV, resolution, totalBounds, targetBounds);
        const innerOut = []
        for (const [x1, x2] of zip(resizedWindU, resizedWindV)) {
            const innererOut = []
            for (const [y1, y2] of zip(x1, x2)) {
                innererOut.push([y1, y2])
            }
            innerOut.push(innererOut)
        }
        out[i.time] = innerOut
    }
    return out
}

function getResizedUVFromData(data: {
    [key: string]: Datum
}, resolution: [number, number], totalBounds: LatLngBounds, targetBounds: LatLngBounds) {
    const out: { [key: string]: number[][][] } = {}
    // for each timeStep
    for (const i of Object.values(data)) {
        const resizedWindU = averageArrayToSize(i.windU, resolution);
        const resizedWindV = averageArrayToSize(i.windV, resolution);
        const innerOut = []
        for (const [x1, x2] of zip(resizedWindU, resizedWindV)) {
            const innererOut = []
            for (const [y1, y2] of zip(x1, x2)) {
                innererOut.push([y1, y2])
            }
            innerOut.push(innererOut)
        }
        out[i.time] = innerOut
    }
    return out
}

export default function Home() {
    const [data, setData] = useState<{ [key: string]: Datum }>({})
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>()
    const [zoom, setZoom] = useState(13)
    const [dataBounds, setDataBounds] = useState<LatLngBounds>(new LatLngBounds([[0, 0], [0, 0]]))
    const resizedUVWind = useMemo(() => viewportBounds ? getResizedUVFromData(data, resolution, dataBounds, viewportBounds) : {}, [viewportBounds, dataBounds, data])
    const deltas = useMemo(() => [(dataBounds.getNorth() - dataBounds.getSouth()) / resolution[0], (dataBounds.getEast() - dataBounds.getWest()) / resolution[1]], [dataBounds])
    const [maxWind, setMaxWind] = useState(0)


    useEffect(() => {
        fetch("http://localhost:3000/api/grib2json").then(res =>
            res.json().then(json => {
                    const dataOut: { [key: string]: Datum } = {};
                    // we use this so that we don't have to try checking react state
                    let startIsSet = false;
                    let max = 0;
                    for (const i of json["grib"]) {
                        const header = i["header"]
                        const time = header["refTime"]
                        if (header["discipline"] !== 0 || header["parameterCategory"] !== 2) continue;
                        // console.log(header);
                        switch (header["parameterNumber"]) {
                            case 2: {
                                if (!startIsSet) {
                                    startIsSet = true;
                                    setDataBounds(new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]]));
                                }
                                if (!Object.keys(dataOut).includes(time)) {
                                    dataOut[time] = {time, windU: [], windV: []};
                                }
                                dataOut[time].windU = unflattenArray(i.data, header["nx"]);
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                            }
                                break;
                            case 3: {
                                if (!startIsSet) {
                                    startIsSet = true;
                                    setDataBounds(new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]]));
                                }
                                if (!Object.keys(dataOut).includes(time)) {
                                    dataOut[time] = {time, windU: [], windV: []};
                                }
                                dataOut[time].windV = unflattenArray(i.data, header["nx"]);
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                            }
                        }
                    }
                    setData(dataOut)
                    setMaxWind(max)
                }
            )
        )

    }, [])

    function ZoomGetter() {
        const map1 = useMap();
        useEffect(() => {
            if (!viewportBounds) {
                setViewportBounds(map1.getBounds())
            }
            setZoom(map1.getZoom())
        }, [map1]);
        const map = useMapEvents({
                zoomend:
                    () => {
                        setZoom(map.getZoom())
                        // setViewportBounds(map.getBounds())
                    },
                // moveend: () => setViewportBounds(map.getBounds())
            }
        )
        return <div className="leaflet-bottom leaflet-left">
            <div className="leaflet-control leaflet-bar">
                <button style={{fill: 'blue'}} onClick={() => setViewportBounds(map1.getBounds())}>Set Viewport</button>
            </div>
        </div>

    }

    return (
        <>
            <MapContainer center={[-31.9514, 115.8617]} zoom={13} scrollWheelZoom={false} style={{height: '90vh'}}>
                <ZoomGetter/>
                <LayersControl position="topright">
                    <LayersControl.Overlay name="Layer group with circles">
                        <LayerGroup>
                            <Circle
                                center={center as unknown as LatLng}
                                pathOptions={{fillColor: 'blue'}}
                                radius={200}
                            />
                            <Circle
                                center={center as unknown as LatLng}
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
                    <LayersControl.Overlay checked name="Wind">
                        <LayerGroup>
                            {viewportBounds && <Rectangle bounds={viewportBounds} opacity={0.1} color="purple"></Rectangle>}
                            {Object.entries(resizedUVWind).length && Object.values(resizedUVWind)[0].map((l, i) => (
                                l.map((item, j) =>
                                    <Fragment key={i * 10_000 + j}>

                                        {/* TODO: This will break if we have a file with 10,000 readings in a dimension*/}
                                        <OceanTile
                                            viewportBounds={viewportBounds}
                                            tileBounds={new LatLngBounds([[dataBounds.getSouth() + deltas[0] * i, dataBounds.getWest() + deltas[1] * j],
                                                [dataBounds.getSouth() + deltas[0] * (i + 1), dataBounds.getWest() + deltas[1] * (j + 1)]])!}
                                            windU={item[0]} windV={item[1]} maxU={maxWind}
                                            maxV={maxWind}/>

                                    </Fragment>
                                )))}
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCoordinates></MapCoordinates>
            </MapContainer>
            <code style={{maxHeight: '10vh', overflow: 'scroll'}}>
                time: {Object.keys(resizedUVWind).length && Object.keys(resizedUVWind)[0]} {'\n'}
                dim: {Object.values(resizedUVWind).length && Object.values(resizedUVWind).length} x {Object.values(resizedUVWind).length && Object.values(resizedUVWind)[0].length} {'\n'}
                deltas: {JSON.stringify(deltas, null, 2)} {'\n'}
                bounds: [({viewportBounds?.getWest()}, {viewportBounds?.getNorth()}),
                ({viewportBounds?.getEast()}, {viewportBounds?.getSouth()})] {'\n'}
                zoom: {zoom}
            </code>
        </>
    );
}
