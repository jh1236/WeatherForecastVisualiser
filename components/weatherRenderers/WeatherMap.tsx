import {LayerGroup, LayersControl, MapContainer, TileLayer, useMap, useMapEvents} from "react-leaflet";
import {VelocityLayer} from "@/components/weatherRenderers/VelocityWrapper/VelocityLayer";
import {getColorFromTemperature, getColorFromWindSpeedKts, knotsToMps, roundTo} from "@/components/utilities";
import {WindBarbs} from "@/components/weatherRenderers/WindBarbs";
import {WindColors} from "@/components/weatherRenderers/WindColor";
import {DataMouseOver} from "@/components/weatherRenderers/DataMouseOver";
import {LatLngBounds} from "leaflet";
import {useEffect, useState} from "react";
import {WeatherDataTimeSnapshot} from "@/components/types";
import {useSettings} from "@/components/settings";
import {useTheme} from "next-themes";
import {TemperatureColors} from "@/components/weatherRenderers/TemperatureColor";

interface WindMapParams {
    defaultBounds?: LatLngBounds;
    data: WeatherDataTimeSnapshot;
}

export function WeatherMap({
                               defaultBounds = new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]),
                               data
                           }: WindMapParams) {
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>()
    const [baseLayer, setBaseLayer] = useState<string>("Satellite")
    const {settings, setSetting} = useSettings()
    const {resolvedTheme} = useTheme()

    const darkModeRender = resolvedTheme === 'dark' || baseLayer === 'Satellite'

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
            <MapEventHandler/>
            <LayersControl position="topright" autoZIndex>
                <LayersControl.BaseLayer checked name="Satellite">
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Street Map">
                    <TileLayer
                        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={resolvedTheme === 'dark' ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    />

                </LayersControl.BaseLayer>
                <LayersControl.Overlay checked={settings["windParticles.enabled"]} name="Wind Particles">
                    <LayerGroup>
                        <VelocityLayer
                            data={data?.gribFrames}
                            maxVelocity={knotsToMps(50)}
                            velocityScale={0.01}
                            displayValues={false}
                            colorScale={Array.from({length: 10}).map((_, i) =>
                                getColorFromWindSpeedKts(50 * (i) / 10))}></VelocityLayer>
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay checked={settings["windBarbs.enabled"]} name="Wind Barbs">
                    <LayerGroup>
                        <WindBarbs
                            data={data?.gribFrames}
                            resolution={settings["windBarbs.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </WindBarbs>

                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay checked={settings["windColors.enabled"]} name="Wind Colors">
                    <LayerGroup>
                        <WindColors
                            data={data?.gribFrames}
                            resolution={settings["windColors.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </WindColors>
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay checked={settings["temperatureColors.enabled"]} name="Temperature Colors">
                    <LayerGroup>
                        <TemperatureColors
                            data={data?.gribFrames}
                            resolution={settings["temperatureColors.count"]}
                            viewportBounds={viewportBounds}
                            darkModeRender={darkModeRender}>
                        </TemperatureColors>
                    </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Data on Mouse Over">
                    <LayerGroup>
                        <DataMouseOver
                            data={data?.gribFrames}
                            viewportBounds={viewportBounds}/>
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
        {settings.displayWindScale && <div style={{width: '3%', textAlign: 'center'}}>
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
        </div>}
        {settings.displayTempScale && settings.displayWindScale &&
            <div style={{width: '5px', textAlign: 'center'}}></div>}
        {settings.displayTempScale &&
            <div style={{
                width: '3%',
                textAlign: 'center',
                height: '100%',
                display: 'grid',
                gridTemplate: '1fr / 1fr',
                placeItems: 'center',
            }}>
                <div style={{
                    gridColumn: '1 / 1',
                    gridRow: '1 / 1',
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                }}>
                    {Array.from({length: 111}).map((_, i) =>
                        <div key={i} style={{
                            display: 'flex',
                            backgroundColor: getColorFromTemperature(50 * (105 - i) / 100),
                            height: `${100.1 / 111}%`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                        }}>

                        </div>
                    )}
                </div>
                <div style={{
                    gridColumn: '1 / 1',
                    gridRow: '1 / 1',
                    position: 'relative',
                    width: '100%',
                    height: '100%'
                }}>
                    {Array.from({length: 11}).map((_, i) =>
                        <div key={i} style={{
                            display: 'flex',
                            height: `${roundTo(100 / 11, 2)}%`,
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                        }}>
                            <b>{50 * (10 - i) / 10}°C</b>
                        </div>
                    )}
                </div>
            </div>
        }

    </>
}