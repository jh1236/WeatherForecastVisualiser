import {LatLng, LatLngBounds} from "leaflet";
import {WeatherDataPoint, WeatherDataSnapshot} from "@/components/types";
import {lerp, roundTo} from "@/components/utilities";

export function latLngBndsIntersection(in1: LatLngBounds, in2: LatLngBounds): LatLngBounds {
    const east = Math.min(in1.getEast(), in2.getEast())
    const west = Math.max(in1.getWest(), in2.getWest())
    const north = Math.min(in1.getNorth(), in2.getNorth())
    const south = Math.max(in1.getSouth(), in2.getSouth())
    return new LatLngBounds([[north, east], [south, west]])
}

export function containsEntireArea(bigSquare: LatLngBounds, smallSquare: LatLngBounds): boolean {
    return bigSquare.getWest() <= smallSquare.getWest() && bigSquare.getEast() >= smallSquare.getEast() && bigSquare.getSouth() <= smallSquare.getSouth() && bigSquare.getNorth() >= smallSquare.getNorth()
}


export function addDataToWeatherSnapshot(weatherSnapshot: WeatherDataSnapshot, dataKey: 'windU' | 'windV' | 'current', arr: number[], dim: [number, number], dataBounds: LatLngBounds) {
    const deltaLat = (dataBounds.getNorth() - dataBounds.getSouth()) / dim[0]
    const deltaLong = (dataBounds.getEast() - dataBounds.getWest()) / dim [1]

    for (let i = 0; i < arr.length; i++) {
        const startLat = roundTo(dataBounds.getSouth() + deltaLat * Math.floor(i / dim[1]), 6)
        const startLong = roundTo(dataBounds.getWest() + deltaLong * Math.floor(i % dim[1]), 6)
        if (!(startLat in weatherSnapshot.data)) {
            weatherSnapshot.data[startLat] = {}
        }
        if (!(startLong in weatherSnapshot.data[startLat])) {
            weatherSnapshot.data[startLat][startLong] = {
                windU: undefined,
                windV: undefined,
                current: undefined,
                bounds: new LatLngBounds([[startLat - deltaLat / 2, startLong - deltaLong / 2], [startLat + deltaLat / 2, startLong + deltaLong / 2]]),
                originalIndex: i
            }
        }
        weatherSnapshot.data[startLat][startLong][dataKey] = arr[i]

    }
}

export function addDataPointToWeatherSnapshot(weatherSnapshot: WeatherDataSnapshot, dataPoint: WeatherDataPoint) {
    if (dataPoint?.bounds === undefined) return;
    const centre = dataPoint.bounds!.getCenter()
    const lat = roundTo(centre?.lat, 6)
    const long = roundTo(centre?.lng, 6)
    if (!(lat in weatherSnapshot.data)) {
        weatherSnapshot.data[lat] = {}
    }
    weatherSnapshot.data[lat][long] = dataPoint
}


export function iterateOverWeatherData(weatherDataSnapshot: WeatherDataSnapshot): [LatLng, WeatherDataPoint][] {
    if (weatherDataSnapshot === undefined) return [];
    const out: [LatLng, WeatherDataPoint][] = [];
    for (const latStr in weatherDataSnapshot.data) {
        const lat = parseFloat(latStr);
        for (const longStr in weatherDataSnapshot.data[lat]) {
            const long = parseFloat(longStr);
            out.push([new LatLng(lat, long), weatherDataSnapshot.data[lat][long]]);
        }
    }
    return out;
}


export function mapToScreen(weatherSnapshot: WeatherDataSnapshot, resolution: [number, number], viewportBounds: LatLngBounds): WeatherDataSnapshot {
    if (weatherSnapshot === undefined) return {bounds: new LatLngBounds([[0, 0], [0, 0]]), data: {}, time: 0}
    const dataInBounds = resizeDataSlice(weatherSnapshot, viewportBounds);
    const out: WeatherDataSnapshot = {
        time: dataInBounds.time,
        bounds: dataInBounds.bounds,
        data: {}
    }
    const targetBounds = latLngBndsIntersection(dataInBounds.bounds, viewportBounds.pad(0.2));
    const deltaY = Math.max(targetBounds.getNorth() - targetBounds.getSouth(), weatherSnapshot.bounds.getNorth() - weatherSnapshot.bounds.getSouth()) / (resolution[0])
    const deltaX = Math.max(targetBounds.getEast() - targetBounds.getWest(), weatherSnapshot.bounds.getEast() - weatherSnapshot.bounds.getWest()) / (resolution[1])
    let long = targetBounds.getWest() + 0.5 * deltaX
    while (long < targetBounds.getEast()) {
        let lat = targetBounds.getSouth() + 0.5 * deltaY
        while (lat < targetBounds.getNorth()) {
            const bounds = new LatLngBounds([[lat - deltaY / 2, long - deltaX / 2], [lat + deltaY / 2, long + deltaX / 2]])
            if (!bounds.intersects(targetBounds)) continue
            const newDataPoint = getDataForLatLong(dataInBounds, new LatLng(lat, long), bounds);
            addDataPointToWeatherSnapshot(out, newDataPoint)

            lat += deltaY
        }
        long += deltaX;
    }
    return out
}

function getSurroundingLatLong(data: WeatherDataSnapshot, point: LatLng): [LatLng, LatLng, LatLng, LatLng] {
    let lats: number[] = []
    let longs: number[] = []
    const latitudeKeys = Object.keys(data.data).toSorted((a, b) => Number(a) - Number(b));
    for (let i = 0; i < latitudeKeys.length; i++) {
        lats = [Number(latitudeKeys[i]), Number(latitudeKeys[i + 1])]
        if (Number.isNaN(lats[1])) {
            lats = [Number(latitudeKeys[i - 1]), Number(latitudeKeys[i])]
        }
        if (point.lat <= lats[1]) {
            break;
        }
    }
    const longitudeKeys = Object.keys(data.data[lats[0]]).toSorted((a, b) => Number(a) - Number(b));
    for (let i = 0; i < longitudeKeys.length; i++) {
        longs = [Number(longitudeKeys[i]), Number(longitudeKeys[i + 1])]
        if (Number.isNaN(longs[1])) {
            longs = [Number(longitudeKeys[i - 1]), Number(longitudeKeys[i])]
        }
        if (point.lng <= longs[1]) {
            break;
        }
    }

    const out = []

    for (const i of lats) {
        for (const j of longs) {
            out.push(new LatLng(i, j))
        }
    }
    return out as [LatLng, LatLng, LatLng, LatLng]

}

function getDataForLatLong(weatherIn: WeatherDataSnapshot, latLng: LatLng, newBounds?: LatLngBounds): WeatherDataPoint {
    const coords = getSurroundingLatLong(weatherIn, latLng)
    const values: WeatherDataPoint[][] = [coords.slice(0, 2).map((point) => weatherIn.data[point.lat][point.lng]), coords.slice(2, 4).map((point) => weatherIn.data[point.lat][point.lng])]
    const out: WeatherDataPoint = {...values[0][0], bounds: newBounds}
    //using the first value because the values for everything in out are undefined and don't show up when iterating
    for (const keyTypeless in values[0][0]) {
        // we don't want to average the bounds
        if (['bounds', 'originalIndex'].includes(keyTypeless)) continue
        const key = keyTypeless as 'windU' | 'windV' | 'current'
        // first lerp by long
        let isPopulated = true
        const lerpedValues = []
        for (const [p1, p2] of values) {
            const a = p1[key]
            const b = p2[key]
            const lngA = p1.bounds!.getCenter().lng
            const lngB = p2.bounds!.getCenter().lng
            if (a === undefined || b === undefined) {
                isPopulated = false
                break
            }
            lerpedValues.push(lerp(a, b, (latLng.lng - lngA) / (lngB - lngA)))
        }
        if (!isPopulated) continue
        const [latA, latB] = values.map(([v]) => v.bounds!.getCenter().lat)
        const [a, b] = lerpedValues
        out[key] = lerp(a, b, (latLng.lat - latA) / (latB - latA))

    }

    return out

}

function resizeDataSlice(weatherIn: WeatherDataSnapshot, viewPortBounds: LatLngBounds): WeatherDataSnapshot {
    if (Object.keys(weatherIn.data).length === 0) return weatherIn
    if (containsEntireArea(viewPortBounds, weatherIn.bounds)) return weatherIn;
    const targetBounds = latLngBndsIntersection(weatherIn.bounds, viewPortBounds);
    const out = {
        time: weatherIn.time,
        bounds: targetBounds,
        data: {}
    }
    for (const [_, i] of iterateOverWeatherData(weatherIn)) {
        if (targetBounds.intersects(i.bounds!) || true) {
            addDataPointToWeatherSnapshot(out, i)
        }
    }
    return out
}
