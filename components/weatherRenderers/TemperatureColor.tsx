import {useMemo} from "react";
import {LatLng, LatLngBounds} from "leaflet";
import {getColorFromTemperature} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";

interface WindColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
    tempKey?: keyof WeatherDataPoint;
    opacity: number;
}


export function TemperatureColors({
                                      data,
                                      viewportBounds,
                                      darkModeRender,
                                      resolution = 60,
                                      tempKey = 'temperature',
                                      opacity
                                  }: WindColorsProps) {

    const temperatureData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.0.0", "10.3.0"])], [data, resolution, viewportBounds])

    const svgSize = maxBoundsFromGribFrames(data)
    const latWidth = svgSize.getEast() - svgSize.getWest()
    const lngHeight = svgSize.getNorth() - svgSize.getSouth()

    return temperatureData.map((dataPoint, i) => {
            return <SingleTempColor
                tempKey={tempKey}
                key={i}
                viewportBounds={viewportBounds}
                x={100 * (dataPoint.bounds!.getWest() - svgSize.getWest()) / latWidth + "%"}
                y={(100 * (svgSize.getNorth() - dataPoint.bounds!.getNorth()) / lngHeight) + "%"}
                w={100 * (dataPoint.bounds!.getEast() - dataPoint.bounds.getWest()) / latWidth + "%"}
                h={100 * (dataPoint.bounds!.getNorth() - dataPoint.bounds.getSouth()) / lngHeight + "%"}
                dataPoint={dataPoint}
                darkModeRender={darkModeRender}
                opacity={opacity}
            />;
        }
    )
}

interface SingleTempColorProps {
    dataPoint: WeatherDataPoint,
    viewportBounds: LatLngBounds | undefined,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    tempKey: keyof WeatherDataPoint,
    opacity: number,
    x: number | string, //allow strings for percentage
    y: number | string,
    w: number | string,
    h: number | string,
}

function SingleTempColor({viewportBounds, dataPoint, tempKey, opacity, x, y, w, h}: SingleTempColorProps) {
    const {bounds: tileBounds} = dataPoint;
    const temperature = (dataPoint[tempKey] as number | undefined)

    if (!viewportBounds || !viewportBounds.intersects(tileBounds!) || !temperature || isNaN(temperature)) {
        return null
    }

    return <>

        <rect
            z={-100}
            x={x}
            y={y}
            width={w}
            height={h}
            fillOpacity={opacity}
            fill={getColorFromTemperature(temperature!)}>
        </rect>
        {/*<Rectangle bounds={dataPoint.bounds!} fillOpacity={isSatellite ? 0.8 : 0.5} opacity={0}*/}
        {/*           color={getColorFromWindSpeedKts(strength)}>*/}
        {/*</Rectangle>*/}
    </>

}