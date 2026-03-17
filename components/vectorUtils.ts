import {zip} from "@/components/utilities";

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

export function bearing(arr: number[]) {
    // Js uses rad instead of degrees
    return Math.acos(dotproduct([0, 1], normalised(arr))) / Math.PI * 180
}