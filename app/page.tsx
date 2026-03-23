'use client';

import {
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
import {addDataToWeatherSnapshot, iterateOverWeatherData, mapToScreen} from "@/components/dataArrayUtils";
import {WeatherDataSnapshot} from "@/components/types";
import {magnitude} from "@/components/vectorUtils";
import {mpsToKnots} from "@/components/utilities";
import {Slider} from "@/components/ui/slider";



// const resolution: [number, number] = [24, 13]
const resolution: [number, number] = [50, 30]


export default function Home() {
    const [data, setData] = useState<{ [key: string]: WeatherDataSnapshot }>({})
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>(new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]))
    const [zoom, setZoom] = useState(13)
    const [sliderTimeStamp, setSliderTimeStamp] = useState(0)
    const timestamps = useMemo(() => Object.keys(data).map(it => Number(it)), [data]);
    const currentTimeStamp = useMemo(() => timestamps.reduce((a, b) => Math.abs(b - sliderTimeStamp) < Math.abs(a - sliderTimeStamp) ? b : a, 0), [timestamps, sliderTimeStamp])
    const renderedData = useMemo(() => mapToScreen(data[currentTimeStamp], resolution, viewportBounds), [viewportBounds, data, currentTimeStamp])
    const maxWind = useMemo(() => iterateOverWeatherData(data[currentTimeStamp]).map(([_, it]) => mpsToKnots(magnitude([it.windU!, it.windV!]))).reduce((a, b) => Math.max(a, b), 0), [data, currentTimeStamp])


    useEffect(() => {
        fetch("http://localhost:3000/api/grib2json").then(res =>
            res.json().then(json => {
                    const dataOut: { [key: string]: WeatherDataSnapshot } = {};
                    // we use this so that we don't have to try checking react state
                    let startIsSet = false;
                    let max = 0;

                    for (const i of json["grib"]) {
                        const header = i["header"]
                        const time = new Date(header["refTime"]).getTime()

                        const code = `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`
                        if (header["discipline"] !== 0 || header["parameterCategory"] !== 2) continue;
                        // console.log(header);
                        const tempDataBounds = new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]]);
                        if (!Object.keys(dataOut).includes('' + time)) {
                            dataOut[time] = {time, data: {}, bounds: tempDataBounds};
                        }
                        switch (code) {
                            case "0.2.2": {
                                if (!startIsSet) {
                                    startIsSet = true;
                                }
                                addDataToWeatherSnapshot(dataOut[time], 'windU', i.data, [header['ny'], header['nx']], tempDataBounds)
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                            }
                                break;
                            case "0.2.3": {
                                if (!startIsSet) {
                                    startIsSet = true;
                                }
                                addDataToWeatherSnapshot(dataOut[time], 'windV', i.data, [header['ny'], header['nx']], tempDataBounds)
                                const localMax = Math.max(...i.data)
                                if (max < localMax) {
                                    max = localMax;
                                }
                            }
                        }
                    }
                    setData(dataOut)
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
                        setViewportBounds(map.getBounds())
                    },
                moveend: () => setViewportBounds(map.getBounds())
            }
        )
        // return <div className="leaflet-bottom leaflet-left">
        //     <div className="leaflet-control leaflet-bar">
        //         <button style={{fill: 'blue'}} onClick={() => setViewportBounds(map1.getBounds())}>Set Viewport</button>
        //     </div>
        // </div>
        return null

    }

    return (
        <>
            {/*setting the bounds here isn't an issue because react-leaflet doesn't pass changes on to the container after initialisation*/}
            <MapContainer bounds={viewportBounds} scrollWheelZoom={false} style={{height: '90vh'}}>
                <ZoomGetter/>
                <LayersControl position="topright">
                    <LayersControl.Overlay name="Layer group with circles">
                        <LayerGroup>
                            <Rectangle bounds={[[90, 0], [-90, 0.05]]} fillColor="red">

                            </Rectangle>
                            <Rectangle bounds={[[90, 180], [-90, 180.05]]} fillColor="red">

                            </Rectangle>
                            <Rectangle bounds={[[0, -9999], [0, 9999]]} fillColor="red">

                            </Rectangle>
                            <Rectangle bounds={[[90, 180], [-90, 180.05]]} fillColor="red">

                            </Rectangle>
                        </LayerGroup>
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name="Wind">
                        <LayerGroup>
                            {/*<Rectangle bounds={renderedData.bounds} opacity={0.1} color="blue"></Rectangle>*/}
                            {iterateOverWeatherData(renderedData).map(([_, dataPoint], i) =>
                                <Fragment key={i}>
                                    <OceanTile
                                        count={i}
                                        trueLatLng={_}
                                        viewportBounds={viewportBounds}
                                        dataPoint={dataPoint}
                                        maxWind={maxWind}/>
                                </Fragment>
                            )}
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
            <div style={{height: '2vh', padding: '30px'}}>
                <Slider
                    max={timestamps.reduce((a, b) => Math.max(a, b), Number.MIN_VALUE)}
                    min={timestamps.reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)}
                    value={[sliderTimeStamp]}
                    onValueChange={([v]) => setSliderTimeStamp(v)}>
                </Slider>
            </div>
            <code style={{maxHeight: '8vh', overflow: 'scroll'}}>
                <b>renderedPoints:</b> {renderedData?.data && Object.keys(renderedData.data).length} x {' '}
                {renderedData?.data && Object.values(renderedData.data)[0] && Object.keys(Object.values(renderedData.data)[0]).length} {' '}
                <b>dataPoints:</b> {data[currentTimeStamp]?.data && Object.keys(data[currentTimeStamp].data).length} x {' '}
                {data[currentTimeStamp]?.data && Object.values(data[currentTimeStamp].data)[0] && Object.keys(Object.values(data[currentTimeStamp].data)[0]).length} {' '}
                <b>time:</b> {currentTimeStamp ? `${currentTimeStamp} (${new Date(currentTimeStamp).toUTCString()})` : 'unset'} {'\n'}
                <b>bounds:</b> [({viewportBounds?.getWest()}, {viewportBounds?.getNorth()}),
                ({viewportBounds?.getEast()}, {viewportBounds?.getSouth()})] {'\n'}
                <b>zoom:</b> {zoom} {' '}
                <b>maxWind:</b> {maxWind}
            </code>
        </>
    );
}
