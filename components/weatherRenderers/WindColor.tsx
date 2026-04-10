import {useMemo} from "react";
import {magnitude} from "@/components/vectorUtils";
import {SVGOverlay} from "react-leaflet";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromWindSpeedKts} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {useSettings} from "@/components/settings";
import {mpsToKnots} from "@/components/unitsUtils";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
}


export function WindColors({data, viewportBounds, darkModeRender, resolution = 60}: WindColorsProps) {

    const windBarbData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.2.2", "0.2.3"])], [data, resolution, viewportBounds])

    return windBarbData.map((dataPoint, i) => {
            return <SingleWindColor
                key={i}
                viewportBounds={viewportBounds}
                dataPoint={dataPoint}
                darkModeRender={darkModeRender}
            />;
        }
    )
}

interface SingleWindColorProps {
    dataPoint: WeatherDataPoint
    viewportBounds: LatLngBounds | undefined,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
}

function SingleWindColor({viewportBounds, dataPoint}: SingleWindColorProps) {
    const {windU, windV, bounds: tileBounds} = dataPoint;
    const strength = useMemo(() => mpsToKnots(magnitude([windU!, windV!])), [windU, windV]);
    const {settings} = useSettings();

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!)) {
        return null
    }

    return <SVGOverlay
        bounds={tileBounds!}
    >

        <rect
            z={-100}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            fillOpacity={settings["windColors.opacity"]}
            fill={getColorFromWindSpeedKts(strength)}>
        </rect>
        {/*<Rectangle bounds={dataPoint.bounds!} fillOpacity={isSatellite ? 0.8 : 0.5} opacity={0}*/}
        {/*           color={getColorFromWindSpeedKts(strength)}>*/}
        {/*</Rectangle>*/}
    </SVGOverlay>

}