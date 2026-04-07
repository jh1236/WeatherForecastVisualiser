'use server';

import jsdap, {DDSResponse, DODSResponse} from "@jeremybarbet/jsdap"
import fs from 'fs';
import {generateHash} from "@/components/utilities";

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
    } else if (value.length !== undefined) { //list check
        return value.map(argToString).join("")
    }
    throw new Error(`Expected ${value} to be string or list`)
}

type numberOrObjectWithNumericIndices = number | number[] | number[][] | number[][][];

export async function getJsDapData<T extends string>(url: string, args?: Record<T, string | string[]>): Promise<{
    dds: DDSResponse,
    data: Record<T, numberOrObjectWithNumericIndices>
}> {
    let newUrl = url + ".dods"
    if (args) {
        newUrl += "?"
        const entries = (Object.entries(args) as [string, string | string[]][]);
        newUrl += entries.map(([key, value]) => `${key}${argToString(value)}`).join(",")
    }
    newUrl = encodeURI(newUrl)
    const hash = generateHash(newUrl)
    const path = `./cachedResponses/${hash}.json`;
    if (fs.existsSync(path)) {
        const text = (await fs.promises.readFile(path)).toString();
        return JSON.parse(text)
    }
    const json = await new Promise<DODSResponse>((resolve, reject) =>
        jsdap.loadDataAndDDS(
            newUrl,
            data => {
                resolve(data)
            },
            error => {
                reject(error)
            }
        )
    )
    json.data = (fixData(json.data) as Record<T, numberOrObjectWithNumericIndices>)
    let files = await fs.promises.readdir("./cachedResponses/");
    while (files.length >= 50) { // We only want to keep the 50 most recent files; delete the rest
        let oldestFileTime = Number.MAX_VALUE
        let oldestFile: string | undefined = undefined

        for (const i of files) {
            // Stat the file to see if we have a file or dir
            const stat = await fs.promises.stat(`./cachedResponses/${i}`);

            if (stat.isDirectory()) {
                continue
            }

            if (stat.mtimeMs < oldestFileTime) {
                oldestFileTime = stat.mtimeMs
                oldestFile = `./cachedResponses/${i}`
            }

        }
        if (oldestFile) {
            await fs.promises.unlink(oldestFile)
        }
        files = await fs.promises.readdir("./cachedResponses/");
    }

    fs.promises.writeFile(path, JSON.stringify(json))


    return json as {
        dds: DDSResponse,
        data: Record<T, numberOrObjectWithNumericIndices>
    }
}

