import {LatLngBounds} from "leaflet";

export function latLngBndsIntersection(in1: LatLngBounds, in2: LatLngBounds): LatLngBounds {
    const east = Math.min(in1.getEast(), in2.getEast())
    const west = Math.max(in1.getWest(), in2.getWest())
    const north = Math.min(in1.getNorth(), in2.getNorth())
    const south = Math.max(in1.getSouth(), in2.getSouth())
    return new LatLngBounds([[north, east], [south, west]])
}

export function unflattenArray<T>(arr: T[], x: number): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i++) {
        if (i % x === 0) {
            out.push([])
        }
        out[out.length - 1].push(arr[i])
    }
    return out
}

function averageConvolve(arr: number[][], strideX: number, strideY: number): number[][] {
    const out: number[][] = []
    const kernelX = Math.ceil(strideX / 2);
    const kernelY = Math.ceil(strideY / 2);
    //TODO: maybe use a library impl; this seems inefficient
    for (let y = 0; y < arr.length; y += strideY) {
        y = Math.floor(y);
        out.push([])
        for (let x = 0; x < arr[y].length; x += strideX) {
            x = Math.floor(x);
            let count = 0
            let sum = 0
            for (let innerY = -kernelY; innerY < kernelY; innerY += 1) {
                if (y + innerY < 0 || y + innerY >= arr.length) continue;
                for (let innerX = -kernelX; innerX < kernelX; innerX += 1) {
                    if (x + innerX < 0 || x + innerX >= arr[y + innerY].length) continue;
                    count++
                    sum += arr[y + innerY][x + innerX]
                }
            }
            out[out.length - 1].push(sum / count)
        }
    }
    return out
}

export function averageArrayToSize(arr: number[][], dim: [number, number]) {
    if (arr.length === 0) return []
    return averageConvolve(arr, arr[0].length / dim[0], arr.length / dim[1])
}

export function getSliceOf2DArray(arr: number[][], resolution: [number, number], dataBounds: LatLngBounds, viewPortBounds: LatLngBounds) {
    if (arr.length === 0) return []
    let out = arr
    const targetDataOverlap = latLngBndsIntersection(dataBounds, viewPortBounds)
    const latitudePerValue = (dataBounds.getEast() - dataBounds.getWest()) / arr[0].length
    const longitutePerValue = (dataBounds.getNorth() - dataBounds.getSouth()) / arr.length
    const startLong = Math.max(0, (dataBounds.getWest() - viewPortBounds.getWest()) / longitutePerValue)
    const endLong = Math.min(arr.length - 1, (dataBounds.getEast() - viewPortBounds.getEast()) / longitutePerValue)
    out = out.slice(startLong, endLong)
    const startLat = Math.max(0, (dataBounds.getSouth() - viewPortBounds.getSouth()) / latitudePerValue)
    const endLat = Math.min(arr[0].length - 1, (dataBounds.getNorth() - viewPortBounds.getNorth()) / latitudePerValue)
    out = out.map(it => it.slice(startLat, endLat))
    if (out.length === 0) return []
    return averageConvolve(out, out[0].length / resolution[0], out.length / resolution[1])
}
