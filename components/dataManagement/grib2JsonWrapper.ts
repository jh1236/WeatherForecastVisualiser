'use server';
import grib2json from "@weacast/grib2json";

import fs from 'fs';
import {generateHash} from "@/components/utilities";
import {GribData} from "@/components/types";
import {Grib2JsonArguments} from "@weacast/grib2json";


export async function getGribData(file: string, args: Grib2JsonArguments): Promise<GribData> {

    const hash = generateHash(file + JSON.stringify(args))
    const path = `./cachedResponses/${hash}.json`;
    if (fs.existsSync(path)) {
        const text = (await fs.promises.readFile(path)).toString();
        return JSON.parse(text)
    }
    const out = await grib2json(file, args)

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

    fs.promises.writeFile(path, JSON.stringify(out))


    return out
}

