import {LayersControl, MapContainer, Pane, SVGOverlay, TileLayer, useMap, useMapEvents} from "react-leaflet";
import {VelocityLayer} from "@/components/ReactLeafletWrappers/LeafletVelocity/ParticleLayers";
import {getColorFromTemperature, getColorFromWindSpeedKts} from "@/components/utilities";
import {WindBarbs} from "@/components/weatherRenderers/WindBarbs";
import {WindColors} from "@/components/weatherRenderers/WindColor";
import {LatLngBounds} from "leaflet";
import {useEffect, useState} from "react";
import {WeatherDataTimeSnapshot} from "@/components/types";
import {useSettings} from "@/components/settings";
import {useTheme} from "next-themes";
import {TemperatureColors} from "@/components/weatherRenderers/TemperatureColor";
import {ColorRange} from "@/components/weatherRenderers/ColorRange";
import {latLngBndsIntersection, maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";
import {cn} from "@/lib/utils";
import {Spinner} from "@/components/ui/spinner";
import {CurrentArrows} from "@/components/weatherRenderers/CurrentArrows";
import {knotsToMps} from "@/components/unitsUtils";
import {DataMouseOver} from "@/components/weatherRenderers/DataMouseOver";
import {GeoJSON as GeoJSONType} from "geojson";
import {MaskedTileLayer} from "@/components/ReactLeafletWrappers/LeafletMaskTile/MaskedTileLayer";
import {BoundaryCanvas} from "@/components/ReactLeafletWrappers/LeafletBoundaryCanvas/BoundaryCanvas";


interface WindMapParams {
    defaultBounds?: LatLngBounds,
    data: WeatherDataTimeSnapshot,
    populated: boolean
}

interface MapEventHandlerParams {
    viewportBounds?: LatLngBounds;
    setViewportBounds: (bounds: LatLngBounds) => void;
    setBaseLayer: (layer: string) => void;
    data: WeatherDataTimeSnapshot;
    populated: boolean;
}

function MapEventHandler({
                             viewportBounds,
                             setViewportBounds,
                             setBaseLayer,
                             data,
                             populated,
                         }: MapEventHandlerParams) {
    const map1 = useMap();
    const {setSetting} = useSettings();
    useEffect(() => {
        if (!viewportBounds) {
            setViewportBounds(map1.getBounds())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map1]);
    useEffect(() => {
        if (data?.gribFrames?.length) {
            const boundsTarget = maxBoundsFromGribFrames(data.gribFrames);
            map1.fitBounds(boundsTarget.pad(0.1));
            setViewportBounds(map1.getBounds())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [populated]);
    const map = useMapEvents({
            zoomend:
                () => {
                    setViewportBounds(map.getBounds())
                },
            moveend: () => setViewportBounds(map.getBounds()),
            baselayerchange: e => setBaseLayer(e.name),
            overlayremove: e => {
                switch (e.name) {
                    case "Wind Particles":
                        setSetting("windParticles.enabled", false);
                        break;
                    case "Wind Barbs":
                        setSetting("windBarbs.enabled", false);
                        break;
                    case "Wind Colors":
                        setSetting("windColors.enabled", false);
                        break;
                    case "Temperature Colors":
                        setSetting("temperatureColors.enabled", false);
                        break;
                }
            },
            overlayadd: e => {
                switch (e.name) {
                    case "Wind Particles":
                        setSetting("windParticles.enabled", true);
                        break;
                    case "Wind Barbs":
                        setSetting("windBarbs.enabled", true);
                        break;
                    case "Wind Colors":
                        setSetting("windColors.enabled", true);
                        break;
                    case "Temperature Colors":
                        setSetting("temperatureColors.enabled", true);
                        break;
                }
            }
        }
    )
    return null

}

export function WeatherMap({
                               defaultBounds = new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]),
                               data,
                               populated
                           }: WindMapParams) {
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>()
    const {settings, setSetting} = useSettings()
    const {resolvedTheme} = useTheme()
    const [westAusBbox, setWestAusBbox] = useState<GeoJSONType>()
    const darkModeRender = resolvedTheme === 'dark' || settings.baseLayer === 'Satellite'

    useEffect(() => {
        fetch('/west_aus_coast_mp.json').then(it => it.json()).then(it => {
            setWestAusBbox(it)
        })
    }, []);

    const dataBounds = maxBoundsFromGribFrames(data?.gribFrames);
    return <>
        {resolvedTheme === 'dark' && (
            //works to invert the colors on the white controls in dark mode
            <style>
                .leaflet-control-layers,
                .leaflet-control-zoom-in,
                .leaflet-control-zoom-out,
                .leaflet-control-attribution {'{'}
                filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                {'}'}
            </style>
        )}

        <MapContainer bounds={defaultBounds} scrollWheelZoom={true}
                      style={{height: '100%', width: `100%`}}>
            {!populated && (<div className={cn("leaflet-control", "leaflet-bottom", "leaflet-left")}
                                 style={{
                                     color: resolvedTheme === 'dark' || settings.baseLayer === 'Satellite' ? 'white' : 'black',
                                     fontSize: '5em',
                                     fontWeight: 400,
                                     padding: 20,
                                     display: 'flex',
                                     flexDirection: 'row',
                                     justifyContent: 'space-between'
                                 }}>
                <Spinner className="size-16"/> <i style={{paddingLeft: 20}}>Loading</i>
            </div>)}
            <MapEventHandler
                viewportBounds={viewportBounds}
                setViewportBounds={setViewportBounds}
                setBaseLayer={layer => setSetting("baseLayer", (layer as 'Satellite' | 'Street Map'))}
                data={data}
                populated={populated}/>
            {populated && <>
                <SVGOverlay bounds={latLngBndsIntersection(dataBounds, viewportBounds!)}>
                    {settings.displayDataArea &&
                        <rect x="0%" width="100%" y="0%" height="100%"
                              fill={darkModeRender ? 'lightblue' : 'blue'}
                              stroke="blue"
                              fillOpacity={0.1}
                              strokeOpacity={0.5}
                        />}


                    {settings["windColors.enabled"] &&
                        <WindColors
                            data={data?.gribFrames}
                            resolution={settings["windColors.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </WindColors>
                    }

                    {settings["temperatureColors.enabled"] &&
                        <TemperatureColors
                            data={data?.gribFrames}
                            opacity={settings["temperatureColors.opacity"]}
                            resolution={settings["temperatureColors.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </TemperatureColors>
                    }

                    {settings["windBarbs.enabled"] &&
                        <WindBarbs
                            data={data?.gribFrames}
                            resolution={settings["windBarbs.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </WindBarbs>
                    }

                </SVGOverlay>
                <Pane name="ocean" style={{zIndex: 380}}>
                    <SVGOverlay bounds={latLngBndsIntersection(dataBounds, viewportBounds!)}>
                        {settings["oceanTemperatureColors.enabled"] &&
                            <TemperatureColors
                                opacity={settings["oceanTemperatureColors.opacity"]}
                                data={data?.gribFrames}
                                resolution={settings["oceanTemperatureColors.count"]}
                                viewportBounds={viewportBounds}
                                darkModeRender={darkModeRender}
                                tempKey={"oceanTemperature"}
                            >
                            </TemperatureColors>
                        }

                        {settings["currentArrows.enabled"] &&
                            <CurrentArrows
                                data={data?.gribFrames}
                                resolution={settings["currentArrows.count"]}
                                viewportBounds={viewportBounds}
                                darkModeRender={darkModeRender}>
                            </CurrentArrows>
                        }

                    </SVGOverlay>
                </Pane>
                {settings["windParticles.enabled"] &&
                    <VelocityLayer
                        data={data?.gribFrames.filter(it => it.header.discipline === 0)}
                        maxVelocity={knotsToMps(50)}
                        velocityScale={0.01 * settings["windParticles.particleMultiplier"]}
                        opacity={settings["windParticles.opacity"]}
                        displayValues={false}
                        colorScale={Array.from({length: 10}).map((_, i) =>
                            getColorFromWindSpeedKts(50 * (i) / 10))}></VelocityLayer>
                }

                {settings["currentParticles.enabled"] &&
                        <VelocityLayer
                            data={data?.gribFrames.filter(it => it.header.discipline === 10)}
                            maxVelocity={2}
                            velocityScale={darkModeRender ? 0.075 : 0.125}
                            opacity={settings["currentParticles.opacity"]}
                            displayValues={false}
                            paneName="ocean"
                        >
                        </VelocityLayer>
                }


                {settings.showDataOnMouseOver &&
                    <DataMouseOver
                        data={data?.gribFrames}
                        viewportBounds={viewportBounds}/>
                }
            </>}
            <LayersControl position="topright" autoZIndex>
                <LayersControl.BaseLayer checked={settings.baseLayer === 'Satellite'} name="Satellite">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked={settings.baseLayer === 'Street Map'} name="Street Map">
                    <TileLayer
                        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={resolvedTheme === 'dark' ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>
            <Pane name="above" style={{zIndex: 390}}>
                {westAusBbox && <BoundaryCanvas
                    attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={settings.baseLayer === 'Satellite' ?
                        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" :
                        resolvedTheme === 'dark' ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' :
                            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    // url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    boundary={westAusBbox}
                    zIndex={10}/>}
            </Pane>

        </MapContainer>
        {settings.displayWindScale && <div style={{width: '3%', textAlign: 'center', height: '100%'}}>
            <ColorRange
                colorFunc={getColorFromWindSpeedKts} textFunc={n => `${Math.round(n - 2.5)}kt`}
                top={52.5}
                bottom={-2.5}
                resolution={100}
                textCount={11}/>
        </div>}
        {settings.displayTempScale && settings.displayWindScale &&
            <div style={{width: '5px', textAlign: 'center'}}></div>
        }
        {settings.displayTempScale &&
            <div style={{width: '3%', textAlign: 'center', height: '100%'}}>
                <ColorRange
                    colorFunc={getColorFromTemperature}
                    textFunc={n => `${Math.round(n - 2.5)}°C`}
                    top={52.5}
                    bottom={-2.5}
                    resolution={100}
                    textCount={11}></ColorRange>
            </div>
        }

    </>
}