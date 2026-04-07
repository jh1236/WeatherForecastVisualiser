declare module '@weacast/grib2json' {
    import type {GribData} from "@/components/types";

    export interface Grib2JsonArguments {
        version?: boolean;
        data?: boolean;
        compact?: boolean;
        names?: boolean;
        output?: string;
        precision?: number;
        verbose?: boolean;
        filterCategory?: number;
        filterSurface?: number;
        filterParameter?: number;
        filterValue?: number;
        bufferSize?: number;
    }

    export default function (fileLocation: string, arguments: Grib2JsonArguments): Promise<GribData>;
}