import {useMemo} from "react";
import {LatLng, LatLngBounds} from "leaflet";
import {useTemperatureMapper} from "@/components/utilities";
import {GribFrame, WeatherDataPoint} from "@/components/types";
import {mapToBounds} from "@/components/dataManagement/DataProcessing";
import {latLngBndsIntersection, maxBoundsFromGribFrames} from "@/components/dataManagement/gribUtils";
import {useSettings} from "@/components/settings";

interface TemperatureColorsProps {
    viewportBounds: LatLngBounds | undefined;
    data: GribFrame[];
    darkModeRender: boolean;
    resolution?: number;
    tempKey?: 'temperature' | 'oceanTemperature';
    opacity: number;
    shouldRender?: (pos: LatLng) => boolean;
}


export function TemperatureColors({
                                      data,
                                      viewportBounds,
                                      darkModeRender,
                                      resolution = 60,
                                      tempKey = 'temperature',
                                      opacity,
                                      shouldRender = () => true
                                  }: TemperatureColorsProps) {

    const temperatureData = useMemo(() => [...mapToBounds(data ?? [], resolution, viewportBounds, ["0.0.0", "10.3.0"])], [data, resolution, viewportBounds])

    const svgSize = latLngBndsIntersection(maxBoundsFromGribFrames(data), viewportBounds!)
    const latWidth = svgSize.getEast() - svgSize.getWest()
    const lngHeight = svgSize.getNorth() - svgSize.getSouth()

    return temperatureData.filter(it => shouldRender(it.bounds.getCenter())).map((dataPoint, i) =>
        <SingleTempColor
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
        />
    )
}

interface SingleTempColorProps {
    dataPoint: WeatherDataPoint,
    viewportBounds: LatLngBounds | undefined,
    trueLatLng?: LatLng,
    darkModeRender: boolean,
    tempKey: 'temperature' | 'oceanTemperature',
    opacity: number,
    x: number | string, //allow strings for percentage
    y: number | string,
    w: number | string,
    h: number | string,
}

function SingleTempColor({viewportBounds, dataPoint, tempKey, opacity, x, y, w, h}: SingleTempColorProps) {
    const {bounds: tileBounds} = dataPoint;
    const temperature = (dataPoint[tempKey] as number | undefined)
    const {settings} = useSettings()
    const needsDiscrete = settings[(tempKey + 'Colors.quantized') as 'temperatureColors.quantized' | 'oceanTemperatureColors.quantized']
    const round = tempKey === 'temperature' ? 1 : 0.2
    const temperatureColor = useTemperatureMapper(needsDiscrete ? round : undefined)

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
            fill={temperatureColor(temperature!)}>
        </rect>
    </>

}