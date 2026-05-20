import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, GribHeader, WeatherData, WeatherDataPoint} from "@/components/types";
import {floorCeil, lerp} from "@/components/utilities";
import {
    boundsFromGribFrame,
    codeFromGribFrame, getFieldnameFromHeader,
    iterateOverBounds,
    latLngBndsIntersection,
    maxBoundsFromGribFrames
} from "./gribUtils";
import {round} from "@floating-ui/utils";

export function* mapToBounds(gribFrames: GribFrame[], resolution: number | number[], viewportBounds: LatLngBounds | undefined, relevantCodes?: string[]): Generator<WeatherDataPoint> {
    const relevantFrames = gribFrames?.filter(it => relevantCodes?.includes(codeFromGribFrame(it)))
    if (relevantFrames === undefined || relevantFrames.length === 0 || viewportBounds === undefined) return {
        bounds: new LatLngBounds([[0, 0], [0, 0]]),
        data: {},
        time: 0,
        isKeyFrame: false
    }

    const targetBounds = latLngBndsIntersection(maxBoundsFromGribFrames(relevantFrames), viewportBounds.pad(0.2));
    for (const i of iterateOverBounds(targetBounds, resolution)) {
        yield getWeatherDataPointForArea(relevantFrames, i);
    }
}

function getLatAndLngIndex(point: LatLng, weatherIn: GribFrame) {
    const offsetLat = point.lat - weatherIn.header.la1;
    const offsetLong = point.lng - weatherIn.header.lo1;

    const dx = weatherIn.header.dx
    const dy = weatherIn.header.dy

    return [Math.max(0, Math.min(offsetLat / dy, weatherIn.header.ny)), Math.max(0, Math.min(offsetLong / dx, weatherIn.header.nx))]
}

function getInterpolatedDatumForLatLong(weatherIn: GribFrame, point: LatLng): number {
    const offsetLat = point.lat - weatherIn.header.la1;
    const offsetLong = point.lng - weatherIn.header.lo1;

    const dx = weatherIn.header.dx
    const dy = weatherIn.header.dy
    const nx = weatherIn.header.nx

    const lats = floorCeil(offsetLat / dy);
    const longs = floorCeil(offsetLong / dx)
    const latTValue = (offsetLat / dy) % 1;
    const longTValue = (offsetLong / dx) % 1;
    const coords = lats.map(it => longs.map(it2 => it * nx + it2))

    const values = coords.map(lats => lats.map(it => weatherIn.data[it]))
    if (values.flat().reduce((a, b) => a || (b === undefined || isNaN(b) || b === null), false)) {
        return NaN
    }

    const intermediateValues = values.map(([a, b]) => lerp(a, b, latTValue))

    return lerp(intermediateValues[0], intermediateValues[1], longTValue)
}

function getClosestDatumForLatLong(weatherIn: GribFrame, point: LatLng): number {
    const offsetLat = point.lat - weatherIn.header.la1;
    const offsetLong = point.lng - weatherIn.header.lo1;

    const dx = weatherIn.header.dx
    const dy = weatherIn.header.dy
    const nx = weatherIn.header.nx

    const lat = round(offsetLat / dy);
    const long = round(offsetLong / dx)

    return weatherIn.data[lat * nx + long]
}


const discardThreshold = 0.5;

function getDatumForArea(weatherIn: GribFrame, area: LatLngBounds): number {

    const trueArea = latLngBndsIntersection(area, boundsFromGribFrame(weatherIn))

    // if (!trueArea.isValid()) return NaN

    const [smallLat, smallLong] = getLatAndLngIndex(trueArea.getSouthWest(), weatherIn).map(it => Math.floor(it))

    const [bigLat, bigLong] = getLatAndLngIndex(trueArea.getNorthEast(), weatherIn).map(it => Math.ceil(it))

    const nx = weatherIn.header.nx

    let nanCount = 0;

    const values = []
    for (let lng = smallLong; lng < bigLong; lng++) {
        for (let lat = smallLat; lat < bigLat; lat++) {
            const number = weatherIn.data[lat * nx + lng];
            if (number === undefined || number === null || Number.isNaN(number) || number >= 1e30) {
                nanCount++;
            } else if (number) {
                values.push(number)
            }
        }
    }
    if (nanCount > (nanCount + values.length) * discardThreshold) {
        //if at least half of the values are bad, throw away this cell
        return NaN
    }
    return values.reduce((a, b) => a + b, 0) / values.length
}


function addToWeatherDataPoint(dataPoint: WeatherDataPointValues, header: GribHeader, value: number) {
    dataPoint[getFieldnameFromHeader(header)] = value
}

export function getWeatherDataPointForArea(weatherIn: GribFrame[], area: LatLngBounds): WeatherDataPoint {
    const out: WeatherDataPoint = {bounds: area}
    for (const i of weatherIn) {
        if (!boundsFromGribFrame(i).intersects(area)) continue
        const datum = getDatumForArea(i, area);
        addToWeatherDataPoint(out, i.header, datum)
    }

    return out
}


export function getWeatherDataPointForPoint(weatherIn: GribFrame[], point: LatLng, interpolate?: boolean): WeatherDataPoint
export function getWeatherDataPointForPoint(weatherIn: GribFrame[] | undefined, point: LatLng, interpolate: boolean = true): WeatherDataPoint | undefined {
    if (weatherIn === undefined) return undefined
    const out: WeatherDataPoint = {bounds: point.toBounds(0)}
    for (const i of weatherIn) {
        if (!boundsFromGribFrame(i).contains(point)) continue
        const datum = interpolate ? getInterpolatedDatumForLatLong(i, point) : getClosestDatumForLatLong(i, point);
        addToWeatherDataPoint(out, i.header, datum)
    }

    return out
}

export type WeatherDataPointValues = Omit<WeatherDataPoint, 'bounds' | 'nanPercentage' | 'debugData'>;


export function getValueRangeForData(weatherIn: WeatherData): [WeatherDataPointValues, WeatherDataPointValues]
export function getValueRangeForData(weatherIn: WeatherData | undefined): [WeatherDataPointValues, WeatherDataPointValues] | undefined {
    if (weatherIn === undefined) return undefined
    const min: WeatherDataPointValues = {}
    const max: WeatherDataPointValues = {}
    for (const i of Object.values(weatherIn.times)) {
        for (const frame of i.gribFrames) {
            const [frameMin, frameMax] = frame.data.reduce((a, b) => Number.isNaN(b) || !b ? a : [Math.min(a[0], Math.abs(b)), Math.max(a[1], Math.abs(b))], [Number.MAX_VALUE, 0]);
            addToWeatherDataPoint(min, frame.header, frameMin)
            addToWeatherDataPoint(max, frame.header, frameMax)
        }
    }

    return [min, max]
}