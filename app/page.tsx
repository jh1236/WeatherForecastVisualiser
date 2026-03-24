'use client';

import {LayerGroup, LayersControl, MapContainer, Rectangle, TileLayer, useMap, useMapEvents} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {LatLngBounds} from "leaflet";
import {Fragment, useEffect, useMemo, useState} from "react";
import {OceanTile} from "@/components/OceanTile";
import {addDataToWeatherSnapshot, iterateOverWeatherData, mapToScreen} from "@/components/dataArrayUtils";
import {WeatherDataSnapshot} from "@/components/types";
import {magnitude} from "@/components/vectorUtils";
import {mpsToKnots} from "@/components/utilities";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {ArrowLeftIcon, ArrowRightIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon} from "lucide-react";


const maxResolution = 35
// const maxResolution: [number, number] = [5, 5]

const SERVER_ADDRESS = "http://flun.in:25565";


export default function Home() {
    const [data, setData] = useState<{ [key: string]: WeatherDataSnapshot }>({})
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>(new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]))
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);

    const timestamps = useMemo(() => Object.keys(data).map(it => Number(it)).toSorted(), [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);
    const renderedData = useMemo(() => mapToScreen(data[currentTimeStamp], maxResolution, viewportBounds), [data, currentTimeStamp, viewportBounds])
    const maxWind = useMemo(() => iterateOverWeatherData(data[currentTimeStamp]).map(([_, it]) => mpsToKnots(magnitude([it.windU!, it.windV!]))).reduce((a, b) => Math.max(a, b), 0), [data, currentTimeStamp])

    useEffect(() => {
        if (playbackSpeed > 0) {
            const timer = setInterval(() => {
                setCurrentTimeStampIndex((currentTimeStampIndex + 1) % timestamps.length);
            }, 1200 / playbackSpeed);
            return () => clearInterval(timer);
        }
    }, [currentTimeStamp, currentTimeStampIndex, playbackSpeed, timestamps])


    useEffect(() => {

        fetch(SERVER_ADDRESS + "/api/grib2json").then(res =>
            res.json().then(json => {
                    const dataOut: { [key: string]: WeatherDataSnapshot } = {};
                    // we use this so that we don't have to try checking react state
                    let startIsSet = false;
                    let max = 0;
                    for (const i of json["grib"]) {
                        const header = i["header"]
                        const time = new Date(header["refTime"]).getTime()

                        const code = `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`
                        if (header["discipline"] !== 0 || header["parameterCategory"] !== 2 || header["significanceOfRT"] !== 0) continue;
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
        }, [map1]);
        const map = useMapEvents({
                zoomend:
                    () => {
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
                <div style={{display: 'flex', flexDirection: 'row', padding: '30px'}}>
                    <div style={{width: '15%', margin: 'auto'}}>{currentTimeStamp ? new Date(currentTimeStamp).toUTCString() : 'Loading...'} {playbackSpeed > 0 && `(${playbackSpeed}x)`}</div>
                    <Slider
                        min={timestamps.reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)}
                        max={timestamps.reduce((a, b) => Math.max(a, b), Number.MIN_VALUE)}
                        value={[isDragging ? dragValue : currentTimeStamp]}
                        style={{width: '60%', margin: 'auto'}}
                        onValueChange={([v]) => {
                            if (timestamps.length) {
                                setIsDragging(true);
                                setDragValue(v);
                                const closest = timestamps.reduce((best, t) =>
                                    Math.abs(t - v) < Math.abs(best - v) ? t : best
                                );
                                setCurrentTimeStampIndex(timestamps.indexOf(closest));
                            }
                        }}
                        onValueCommit={() => {
                            setIsDragging(false);
                        }}
                    />
                    <div style={{width: '15%', display: 'flex', flexDirection: 'row', margin: ''}}>
                        {playbackSpeed === 0 ?
                            <Button disabled={currentTimeStampIndex <= 0} style={{margin: 'auto'}} variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentTimeStampIndex(Math.max(0, currentTimeStampIndex - 1))}>
                                <ArrowLeftIcon/>
                            </Button> :
                            <Button disabled={playbackSpeed <= 1} style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setPlaybackSpeed(playbackSpeed / 2)}>
                                <RewindIcon/>
                            </Button>}
                        <Button style={{margin: 'auto'}}
                                variant="outline" size="icon"
                                onClick={() => {
                                    setPlaybackSpeed(playbackSpeed > 0 ? 0 : 1)
                                }}>
                            {playbackSpeed === 0 ? <PlayIcon/> : <PauseIcon/>}
                        </Button>
                        {playbackSpeed === 0 ?
                            <Button disabled={currentTimeStampIndex + 1 >= timestamps.length - 1}
                                    style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setCurrentTimeStampIndex(Math.min(currentTimeStampIndex + 1, timestamps.length - 1))}>
                                <ArrowRightIcon/>
                            </Button> :
                            <Button disabled={playbackSpeed >= 16} style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setPlaybackSpeed(playbackSpeed * 2)}>
                                <FastForwardIcon/>
                            </Button>}
                    </div>
                </div>
        </>
    );
}
