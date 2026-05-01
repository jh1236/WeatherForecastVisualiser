import {zip} from "@/components/utilities";
import {GeoJSON} from "geojson";
import {LatLng} from "leaflet";
import pointInPolygon from 'robust-point-in-polygon'

export function magnitude(arr: number[]) {
    return Math.sqrt(arr.reduce((a, b) => a + b * b, 0))
}

export function normalised(arr: number[]) {
    const mag = magnitude(arr)
    return arr.map(i => i / mag)
}

export function dotproduct(arr1: number[], arr2: number[]) {
    return zip(arr1, arr2).reduce((a, b) => a + b[0] * b[1], 0)
}

export function perpendicular(arr: number[]): number[] {
    return rotatedBy(arr, 90)
}

export function rotatedBy(arr: number[], degrees: number): number[] {
    const cs = Math.cos(degrees / 180 * Math.PI);
    const sn = Math.sin(degrees / 180 * Math.PI);
    return [arr[0] * cs - sn * arr[1], arr[0] * sn + cs * arr[1]]
}

export function bearing(arr: number[]) {
    // Js uses rad instead of degrees
    return (Math.atan2(arr[1], arr[0]) / Math.PI * 180 + 360) % 360
}