import {LayerGroup, LayersControl, MapContainer, TileLayer, useMap, useMapEvents} from "react-leaflet";
import {VelocityLayer} from "@/components/VelocityWrapper/VelocityLayer";
import {getColorFromWindSpeedKts, knotsToMps, roundTo} from "@/components/utilities";
import {WindBarbs} from "@/components/WindRenderers/WindBarbs";
import {WindColors} from "@/components/WindRenderers/WindColor";
import {WindDataMouseOver} from "@/components/WindRenderers/WindDataMouseOver";
import {LatLngBounds} from "leaflet";
import {useEffect, useState} from "react";
import {GribFrame} from "@/components/types";
import {useSettings} from "@/components/settings";

interface WindMapParams {
    defaultBounds?: LatLngBounds;
    data: GribFrame[];
}

export function WeatherMap({
                               defaultBounds = new LatLngBounds([[-31.957818684731258, 115.62852859497072], [-32.0988392350303, 115.95811843872072]]),
                               data
                           }: WindMapParams) {
    const [viewportBounds, setViewportBounds] = useState<LatLngBounds>()
    const [baseLayer, setBaseLayer] = useState<string>("Satellite")
    const {settings, setSetting} = useSettings()


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
                    }
                }
            }
        )
        return null

    }

    return <><MapContainer bounds={defaultBounds} scrollWheelZoom={true}
                           style={{height: '100%', width: settings.displayColorScale ? '97%' : '100%'}}>
        <MapEventHandler/>
        <LayersControl position="topright" autoZIndex>
            <LayersControl.BaseLayer checked name="Satellite">
                <TileLayer
                    attribution='© Esri © OpenStreetMap Contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Map">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay checked={settings["windParticles.enabled"]} name="Wind Particles">
                <LayerGroup>
                    <VelocityLayer
                        data={data}
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
                        data={data}
                        resolution={settings["windBarbs.count"]}
                        viewportBounds={viewportBounds}
                        currentLayer={baseLayer}>
                    </WindBarbs>

                </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay checked={settings["windColors.enabled"]} name="Wind Colors">
                <LayerGroup>
                    <WindColors
                        data={data}
                        resolution={settings["windColors.count"]}
                        viewportBounds={viewportBounds}
                        currentLayer={baseLayer}>
                    </WindColors>
                </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Data on Mouse Over">
                <WindDataMouseOver
                    data={data}
                    viewportBounds={viewportBounds}/>
            </LayersControl.Overlay>
        </LayersControl>
    </MapContainer>
        {settings.displayColorScale && <div style={{width: '3%', textAlign: 'center'}}>
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
    </>
}