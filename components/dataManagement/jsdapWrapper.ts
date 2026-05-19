'use server';

import jsdap, {DDSResponse, DODSResponse} from "@jeremybarbet/jsdap"

function fixData<T extends object>(data: T): T {
    switch (data.constructor.name) {
        case "Array":
            return ((data as never[]).map(fixData) as T)
        case "Float64Array":
        case "Float32Array":
        case "Int32Array":
        case "UInt32Array":
        case "Int16Array":
        case "UInt16Array":
        case "Int8Array":
        case "UInt8Array":
            return (Array.from(data as Uint8Array) as T);
        case "Object":
            return (Object.fromEntries(Object.entries(data).map(([k, v]) => [k, fixData(v)])) as T)
        default:
            return data
    }
}


function argToString(value: string | string[]): string {
    if (typeof value === "string") {
        return `[${value}]`
    } else if (Array.isArray(value)) { //list check
        return value.map(argToString).join("")
    }
    throw new Error(`Expected ${value} to be string or list`)
}

export type NumberOrNDArray = number | number[] | number[][] | number[][][];

export async function getJsDapData<T extends string>(url: string, args?: Record<T, string | string[]>): Promise<{
    dds: DDSResponse,
    data: Record<T, NumberOrNDArray>
}> {
    let newUrl = url + ".dods"
    if (args) {
        newUrl += "?"
        const entries = (Object.entries(args) as [string, string | string[]][]);
        newUrl += entries.map(([key, value]) => `${key}${argToString(value)}`).join(",")
    }
    newUrl = encodeURI(newUrl)

    const json = await new Promise<DODSResponse>((resolve, reject) =>
        jsdap.loadDataAndDDS(
            newUrl,
            data => {
                resolve(data)
            },
            error => {
                reject(error)
            },
            error => {
                reject(error)
            },
            undefined,
            error => {
                reject(error)
            }
        )
    )
    json.data = (fixData(json.data) as Record<T, NumberOrNDArray>)

    return json as {
        dds: DDSResponse,
        data: Record<T, NumberOrNDArray>
    }
}

