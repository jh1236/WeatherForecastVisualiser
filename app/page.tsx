'use client';

import {LayerGroup, LayersControl, MapContainer, TileLayer, useMap, useMapEvents} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {control, LatLngBounds} from "leaflet";
import {Fragment, useEffect, useMemo, useState} from "react";
import {WindColor} from "@/components/WindRenderers/WindColor";
import {iterateOverWeatherData, mapToScreen} from "@/components/DataProcessing";
import {magnitude} from "@/components/vectorUtils";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {ArrowLeftIcon, ArrowRightIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon} from "lucide-react";
import {useLocalData} from "@/components/DataCollection";
import {getColorFromWindSpeedKts, knotsToMps, mpsToKnots, roundTo} from "@/components/utilities";
import {VelocityLayer} from "@/components/VelocityWrapper/VelocityLayer";
import {WindBarb} from "@/components/WindRenderers/WindBarbs";


const maxResolution = 35
// const maxResolution: [number, number] = [5, 5]


export default function Home() {
    // const {processed: data, raw} = useLocalData('cwa_atmosphere')
    // const {processed: data, raw}: { processed: WeatherData, raw: GribData } = {
    //     processed: {
    //         startTime: 0,
    //         endTime: 0,
    //         times: {}
    //     }, raw: []
    // };
    const data = useLocalData('cwa_atmosphere')
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>(new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]))
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);

    const timestamps = useMemo(() => Object.keys(data.times).map(it => Number(it)).toSorted((a, b) => a - b), [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);
    const renderedData = useMemo(() => [...mapToScreen(data.times[currentTimeStamp], maxResolution, viewportBounds)], [data, currentTimeStamp, viewportBounds])
    const maxWind = useMemo(() => iterateOverWeatherData(data.times[currentTimeStamp]).map(([_, it]) => mpsToKnots(magnitude([it.windU!, it.windV!]))).reduce((a, b) => Math.max(a, b), 0), [data, currentTimeStamp])
    const [baseLayer, setBaseLayer] = useState<string>("Satellite")

    useEffect(() => {
        if (playbackSpeed > 0) {
            const timer = setInterval(() => {
                setCurrentTimeStampIndex((currentTimeStampIndex + 1) % timestamps.length);
            }, 1200 / playbackSpeed);
            return () => clearInterval(timer);
        }
    }, [currentTimeStamp, currentTimeStampIndex, playbackSpeed, timestamps])


    function MapEventHandler() {
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
                moveend: () => setViewportBounds(map.getBounds()),
                baselayerchange: e => setBaseLayer(e.name)
            }
        )
        // return <div className="leaflet-bottom leaflet-left">
        //     <div className="leaflet-control leaflet-bar">
        //         <button style={{fill: 'blue'}} onClick={() => setViewportBounds(map1.getBounds())}>Set Viewport</button>
        //     </div>
        // </div>
        return null

    }


    return (<>
            <div style={{width: '100vw', height: '90vh', display: 'flex', flexDirection: 'row'}}>
                {/*setting the bounds here isn't an issue because react-leaflet doesn't pass changes on to the container after initialisation*/}
                <MapContainer bounds={viewportBounds} scrollWheelZoom={true}
                              style={{height: '100%', width: '97%'}}>
                    <MapEventHandler/>
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Satellite">
                            <TileLayer
                                zIndex={-100}
                                attribution='© Esri © OpenStreetMap Contributors'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Map">
                            <TileLayer
                                zIndex={-100}
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay checked name="Wind Particles">
                            <LayerGroup>
                                <VelocityLayer
                                    data={data.times?.[currentTimeStamp]?.originalData ?? []}
                                    displayOptions={{
                                        velocityType: "GBR Wind",
                                        position: "bottomleft",
                                        emptyString: "No wind data",
                                        showCardinal: false,
                                        angleConvention: "meteoCW",
                                        speedUnit: "kt",
                                        directionString: "Direction",
                                        speedString: "Speed",
                                    }} maxVelocity={knotsToMps(50)} velocityScale={0.01} displayValues={true}
                                    colorScale={Array.from({length: 10}).map((_, i) =>
                                        getColorFromWindSpeedKts(50 * (i) / 10))}></VelocityLayer>
                            </LayerGroup>
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Wind Barbs">
                            <LayerGroup>
                                {/*<Rectangle bounds={renderedData.bounds} opacity={0.1} color="blue"></Rectangle>*/}
                                {renderedData.map((dataPoint, i) =>
                                    <WindBarb
                                        key={i}
                                        count={i}
                                        viewportBounds={viewportBounds}
                                        dataPoint={dataPoint}
                                        maxWind={maxWind}
                                        baseLayer={baseLayer}
                                    />
                                )}
                            </LayerGroup>
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Wind Colors">
                            <LayerGroup>
                                {/*<Rectangle bounds={renderedData.bounds} opacity={0.1} color="blue"></Rectangle>*/}
                                {renderedData.map((dataPoint, i) =>
                                    <WindColor
                                        key={i}
                                        count={i}
                                        viewportBounds={viewportBounds}
                                        dataPoint={dataPoint}
                                        maxWind={maxWind}
                                        baseLayer={baseLayer}
                                    />
                                )}
                            </LayerGroup>
                        </LayersControl.Overlay>
                    </LayersControl>

                </MapContainer>
                <div style={{width: '3%', textAlign: 'center'}}>
                    {Array.from({length: 11}).map((_, i) =>
                        <div key={i} style={{
                            display: 'flex',
                            backgroundColor: getColorFromWindSpeedKts(50 * (10 - i) / 10),
                            height: `${roundTo(100 / 11, 2)}%`,
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                        }}>
                            <b>{50 * (10 - i) / 10}kt</b>
                        </div>
                    )}
                </div>
                {/*<div style={{width: '3%', textAlign: 'center'}}>*/}
                {/*    {Array.from({length: 11}).map((_, i) =>*/}
                {/*        <div key={i} style={{*/}
                {/*            display: 'flex',*/}
                {/*            backgroundColor: getColorFromWindSpeedKts(Math.round(1 + maxWind / 5) * 5 * (10 - i) / 10),*/}
                {/*            height: `${roundTo(100 / 11, 2)}%`,*/}
                {/*            width: '100%',*/}
                {/*            justifyContent: 'center',*/}
                {/*            alignItems: 'center',*/}
                {/*        }}>*/}
                {/*            <b>{Math.round(1 + maxWind / 5) * 5 * (10 - i) / 10}kt</b>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}
            </div>
            <div style={{display: 'flex', flexDirection: 'row', padding: '30px', width: '100%', height: '20%'}}>
                <div style={{
                    width: '20%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>
                    #{currentTimeStampIndex + 1}: {currentTimeStamp ? new Date(currentTimeStamp).toUTCString() : 'Loading...'} {playbackSpeed > 0 && `(${playbackSpeed}x)`}</div>
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
                <div style={{
                    width: '20%',
                    display: 'flex',
                    flexDirection: 'row',
                    paddingLeft: '5%',
                    paddingRight: '5%'
                }}>
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
