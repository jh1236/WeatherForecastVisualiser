import {GribFrame, GribHeader} from "@/components/types";
import {LatLngBounds} from "leaflet";

export function getCodeFromHeader(header: GribHeader) {
    return `${header['discipline']}.${header['parameterCategory']}.${header['parameterNumber']}`;
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

    //these correction values ensure that the grid is aligned on ea
    const correctionLat = (latWindow - (Math.floor(latWindow / deltaY) * deltaY)) / 2;
    const correctionLng = (lngWindow - (Math.floor(lngWindow / deltaX) * deltaX)) / 2;

    for (let long = targetBounds.getWest() + deltaX / 2 + correctionLng; long < targetBounds.getEast(); long += deltaX) {
        for (let lat = targetBounds.getSouth() + deltaY / 2 + correctionLat; lat < targetBounds.getNorth(); lat += deltaY) {
            yield new LatLngBounds([[lat - deltaY / 2, long - deltaX / 2], [lat + deltaY / 2, long + deltaX / 2]])
        }
    }
}
