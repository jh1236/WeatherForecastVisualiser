import {LatLng, LatLngBounds} from "leaflet";
import {GribFrame, GribHeader, WeatherDataPoint} from "@/components/types";
import {floorCeil, lerp} from "@/components/utilities";

export function latLngBndsIntersection(in1: LatLngBounds, in2: LatLngBounds): LatLngBounds {
    const east = Math.min(in1.getEast(), in2.getEast())
    const west = Math.max(in1.getWest(), in2.getWest())
    const north = Math.min(in1.getNorth(), in2.getNorth())
    const south = Math.max(in1.getSouth(), in2.getSouth())
    return new LatLngBounds([[north, east], [south, west]])
}

export function boundsFromGribHeader(header: GribHeader) {
    return new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]])
}


export function* iterateOverBounds(targetBounds: LatLngBounds, maxResolution: number): Generator<LatLngBounds> {
    const latWindow = Math.abs(targetBounds.getNorth() - targetBounds.getSouth());
    const lngWindow = Math.abs(targetBounds.getEast() - targetBounds.getWest());

    const deltaY = latWindow / (maxResolution + 1)
    const deltaX = lngWindow / (maxResolution + 1)

    const delta = Math.max(deltaX, deltaY)

    //these correction values ensure that the grid is aligned on ea
    const correctionLat = (latWindow - (Math.floor(latWindow / delta) * delta)) / 2;
    const correctionLng = (lngWindow - (Math.floor(lngWindow / delta) * delta)) / 2;

    for (let long = targetBounds.getWest() + delta / 2 + correctionLng; long < targetBounds.getEast(); long += delta) {
        for (let lat = targetBounds.getSouth() + delta / 2 + correctionLat; lat < targetBounds.getNorth(); lat += delta) {
            yield new LatLngBounds([[lat - delta / 2, long - delta / 2], [lat + delta / 2, long + delta / 2]])
        }
    }
}

export function* mapToScreen(gribFrames: GribFrame[], maxResolution: number, viewportBounds: LatLngBounds | undefined): Generator<WeatherDataPoint> {
    if (gribFrames === undefined || gribFrames.length === 0 || viewportBounds === undefined) return {
        bounds: new LatLngBounds([[0, 0], [0, 0]]),
        data: {},
        time: 0,
        isKeyFrame: false
    }

    const targetBounds = latLngBndsIntersection(boundsFromGribHeader(gribFrames[0].header), viewportBounds.pad(0.2));
    for (const i of iterateOverBounds(targetBounds, maxResolution)) {
        yield getWeatherDataPointForArea(gribFrames, i);
    }
}

function getLatAndLngIndex(point: LatLng, weatherIn: GribFrame) {
    const offsetLat = point.lat - weatherIn.header.la1;
    const offsetLong = point.lng - weatherIn.header.lo1;

    const dx = weatherIn.header.dx
    const dy = weatherIn.header.dy

    return [offsetLat / dy, offsetLong / dx]
}

function getDatumForLatLong(weatherIn: GribFrame, point: LatLng): number {
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

    const intermediateValues = values.map(([a, b]) => lerp(a, b, latTValue))

    return lerp(intermediateValues[0], intermediateValues[1], longTValue)
}

function getDatumForArea(weatherIn: GribFrame, area: LatLngBounds): number {

    const trueArea = latLngBndsIntersection(area, boundsFromGribHeader(weatherIn.header))

    const [smallLat, smallLong] = getLatAndLngIndex(trueArea.getSouthWest(), weatherIn).map(it => Math.floor(it))

    const [bigLat, bigLong] = getLatAndLngIndex(trueArea.getNorthEast(), weatherIn).map(it => Math.ceil(it))

    const nx = weatherIn.header.nx

    const values = []
    for (let lng = smallLong; lng <= bigLong; lng++) {
        for (let lat = smallLat; lat <= bigLat; lat++) {
            const number = weatherIn.data[lat * nx + lng];
            if (number !== undefined) {
                values.push(number)
            }
        }
    }
    return values.reduce((a, b) => a + b, 0) / values.length
}


export function getCodeFromHeader(header: GribHeader) {
    return `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`;
}

function addToWeatherDataPoint(dataPoint: WeatherDataPoint, header: GribHeader, value: number) {
    const code = getCodeFromHeader(header)

    switch (code) {
        case "0.0.0":
            dataPoint.temperature = value
            break;
        case "0.2.2":
            dataPoint.windU = value
            break;
        case "0.2.3":
            dataPoint.windV = value
            break;
    }
}

export function getWeatherDataPointForArea(weatherIn: GribFrame[], area: LatLngBounds): WeatherDataPoint {
    const out: WeatherDataPoint = {bounds: area}
    for (const i of weatherIn) {
        addToWeatherDataPoint(out, i.header, getDatumForArea(i, area))
    }

    return out
}

export function getWeatherDataPointForPoint(weatherIn: GribFrame[], point: LatLng): WeatherDataPoint | undefined {
    if (weatherIn === undefined || !boundsFromGribHeader(weatherIn[0].header).contains(point)) return undefined
    const out: WeatherDataPoint = {}
    for (const i of weatherIn) {
        addToWeatherDataPoint(out, i.header, getDatumForLatLong(i, point))
    }

    return out
}