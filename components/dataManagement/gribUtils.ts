import {GribFrame, GribHeader} from "@/components/types";
import {LatLngBounds} from "leaflet";
import {WeatherDataPointValues} from "@/components/dataManagement/DataProcessing";

export function codeFromGribFrame({header}: { header: GribHeader }) {
    return `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`;
}

export function getFieldnameFromHeader(header: GribHeader): keyof WeatherDataPointValues {
    const code = codeFromGribFrame({header})

    switch (code) {
        case "0.0.0":
            return 'temperature';
        case "0.2.2":
            return 'windU';
        case "0.2.3":
            return 'windV';
        case "10.1.2":
            return 'currentU';
        case "10.1.3":
            return 'currentV';
        case "10.3.0":
            return 'oceanTemperature';
        default:
            throw new Error(`Unknown header: ${header}`);
    }
    
}

export function latLngBndsCompletelyContains(outside: LatLngBounds, inside: LatLngBounds): boolean {
    return outside.getWest() < inside.getWest()
        && outside.getEast() > inside.getEast()
        && outside.getSouth() < inside.getSouth()
        && outside.getNorth() > inside.getNorth();
}

export function latLngBndsIntersection(in1: LatLngBounds, in2: LatLngBounds): LatLngBounds {
    const east = Math.min(in1.getEast(), in2.getEast())
    const west = Math.max(in1.getWest(), in2.getWest())
    const north = Math.min(in1.getNorth(), in2.getNorth())
    const south = Math.max(in1.getSouth(), in2.getSouth())
    return new LatLngBounds([[north, east], [south, west]])
}

export function maxBoundsFromGribFrames(framesIn: GribFrame[], codes?: string[]) {
    const frames = codes ? framesIn.filter((it) => codes.includes(codeFromGribFrame(it))) : framesIn
    if (!frames || !frames.length) {
        return new LatLngBounds([[0, 0], [0, 0]])
    }
    const minLat = Math.min(...frames.map(it => it.header.la1))
    const maxLat = Math.max(...frames.map(it => it.header.la2))
    const minLng = Math.min(...frames.map(it => it.header.lo1))
    const maxLng = Math.max(...frames.map(it => it.header.lo2))
    return new LatLngBounds([[minLat, minLng], [maxLat, maxLng]])
}

export function boundsFromGribFrame({header}: GribFrame) {
    return new LatLngBounds([[header.la1, header.lo1], [header.la2, header.lo2]])
}


export function* iterateOverBounds(targetBounds: LatLngBounds, maxResolution: number | number[], forceSquare: boolean = true): Generator<LatLngBounds> {
    let resolutionX, resolutionY;
    if (Array.isArray(maxResolution)) {
        [resolutionY, resolutionX] = maxResolution;
    } else {
        resolutionX = maxResolution;
        resolutionY = maxResolution;
    }
    const latWindow = Math.abs(targetBounds.getNorth() - targetBounds.getSouth());
    const lngWindow = Math.abs(targetBounds.getEast() - targetBounds.getWest());

    let deltaY = latWindow / (resolutionX + 1)
    let deltaX = lngWindow / (resolutionY + 1)

    if (forceSquare) {
        deltaY = Math.max(deltaY, deltaX);
        // my IDE calls this suspicious, but it is deliberate; deltaY and deltaX should be equal for a square
        deltaX = deltaY;
    }

    //these correction values ensure that the grid is aligned
    const correctionLat = (latWindow - (Math.floor(latWindow / deltaY) * deltaY)) / 2;
    const correctionLng = (lngWindow - (Math.floor(lngWindow / deltaX) * deltaX)) / 2;

    for (let long = targetBounds.getWest() + deltaX / 2 + correctionLng; long < targetBounds.getEast(); long += deltaX) {
        for (let lat = targetBounds.getSouth() + deltaY / 2 + correctionLat; lat < targetBounds.getNorth(); lat += deltaY) {
            yield new LatLngBounds([[lat - deltaY / 2, long - deltaX / 2], [lat + deltaY / 2, long + deltaX / 2]])
        }
    }
}
