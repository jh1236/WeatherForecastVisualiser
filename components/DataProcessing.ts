import {LatLng, LatLngBounds} from "leaflet";
import {WeatherDataPoint, WeatherDataTimeSnapshot} from "@/components/types";
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


export function addDataToWeatherSnapshotByBounds(weatherSnapshot: WeatherDataTimeSnapshot, dataKey: 'windU' | 'windV' | 'currentU' | 'currentV', arr: number[], dim: [number, number], dataBounds: LatLngBounds) {
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
                bounds: new LatLngBounds([[startLat - deltaLat / 2, startLong - deltaLong / 2], [startLat + deltaLat / 2, startLong + deltaLong / 2]]),
            }
        }
        weatherSnapshot.data[startLat][startLong][dataKey] = arr[i]

    }
}

export function addDataToWeatherSnapshotByLatLngList(weatherSnapshot: WeatherDataTimeSnapshot, dataKey: 'windU' | 'windV' | 'currentU' | 'currentV', arr: number[], dim: [number, number], dataBounds: LatLngBounds) {
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
                bounds: new LatLngBounds([[startLat - deltaLat / 2, startLong - deltaLong / 2], [startLat + deltaLat / 2, startLong + deltaLong / 2]]),
            }
        }
        weatherSnapshot.data[startLat][startLong][dataKey] = arr[i]

    }
}

export function addDataPointToWeatherSnapshot(weatherSnapshot: WeatherDataTimeSnapshot, dataPoint: WeatherDataPoint) {
    if (dataPoint?.bounds === undefined) return;
    const centre = dataPoint.bounds!.getCenter()
    const lat = roundTo(centre?.lat, 6)
    const long = roundTo(centre?.lng, 6)
    if (!(lat in weatherSnapshot.data)) {
        weatherSnapshot.data[lat] = {}
    }
    weatherSnapshot.data[lat][long] = dataPoint
}


export function iterateOverWeatherData(weatherDataSnapshot: WeatherDataTimeSnapshot): [LatLng, WeatherDataPoint][] {
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


export function* iterateOverBounds(targetBounds: LatLngBounds, maxResolution: number): Generator<LatLngBounds> {
    const deltaY = Math.abs(targetBounds.getNorth() - targetBounds.getSouth()) / (maxResolution)
    const deltaX = Math.abs(targetBounds.getEast() - targetBounds.getWest()) / (maxResolution)
    const delta = Math.max(deltaX, deltaY)
    let long = targetBounds.getWest() + 0.5 * delta
    while (long < targetBounds.getEast()) {
        let lat = targetBounds.getSouth() + 0.5 * delta
        while (lat < targetBounds.getNorth()) {
            yield new LatLngBounds([[lat - delta / 2, long - delta / 2], [lat + delta / 2, long + delta / 2]])
            lat += delta
        }
        long += delta;
    }
}

export function* mapToScreen(weatherSnapshot: WeatherDataTimeSnapshot, maxResolution: number, viewportBounds: LatLngBounds): Generator<WeatherDataPoint> {
    if (weatherSnapshot === undefined) return {
        bounds: new LatLngBounds([[0, 0], [0, 0]]),
        data: {},
        time: 0,
        isKeyFrame: false
    }
    const dataInBounds = weatherSnapshot //resizeDataSlice(weatherSnapshot, viewportBounds);
    const out: WeatherDataTimeSnapshot = {
        isKeyFrame: weatherSnapshot.isKeyFrame,
        time: dataInBounds.time,
        bounds: dataInBounds.bounds,
        data: {}
    }
    const targetBounds = latLngBndsIntersection(dataInBounds.bounds, viewportBounds.pad(0.2));
    for (const i of iterateOverBounds(targetBounds, 30)) {
        const centre = i.getCenter()
        yield getDataForLatLong(dataInBounds, centre, i);
    }
}

function binSearch(arr: number[], target: number) {
    let low = 0;
    let high = arr.length - 1;
    let mid;
    while (high > low) {
        mid = low + Math.floor((high - low + 1) / 2);
        if (arr[mid] > target) {
            high = mid - 1;
        } else {
            low = mid;
        }
    }
    return Math.max(0, Math.min(low, arr.length - 1));
}

function getSurroundingLatLong(sortedLat: number[], sortedLong: number[], point: LatLng): [LatLng, LatLng, LatLng, LatLng] {
    const lat = Math.min(binSearch(sortedLat, point.lat), sortedLat.length - 2)
    const lats: number[] = [lat, lat + 1]
    const long = Math.min(binSearch(sortedLong, point.lng), sortedLong.length - 2)
    const longs: number[] = [long, long + 1]
    const out = []

    for (const i of lats) {
        for (const j of longs) {
            out.push(new LatLng(sortedLat[i], sortedLong[j]))
        }
    }
    return out as [LatLng, LatLng, LatLng, LatLng]

}

export function getDataForLatLong(weatherIn: WeatherDataTimeSnapshot, latLng: LatLng, newBounds?: LatLngBounds): WeatherDataPoint {
    const sortedLat = Object.keys(weatherIn.data).map(Number).toSorted((a, b) => a - b)
    const sortedLong = Object.keys(weatherIn.data[sortedLat[0]]).map(Number).toSorted((a, b) => a - b)
    const coords = getSurroundingLatLong(sortedLat, sortedLong, latLng)
    const values: WeatherDataPoint[][] = [coords.slice(0, 2).map((point) => weatherIn.data[point.lat][point.lng]), coords.slice(2, 4).map((point) => weatherIn.data[point.lat][point.lng])]
    const out: WeatherDataPoint = {bounds: newBounds}
    //using the first value because the values for everything in out are undefined and don't show up when iterating
    for (const keyTypeless in values[0][0]) {
        // we don't want to average the bounds
        if (['bounds', 'originalIndex'].includes(keyTypeless)) continue
        const key = keyTypeless as 'windU' | 'windV' | 'currentU' | 'currentV'
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
