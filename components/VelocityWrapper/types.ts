import {PropsWithChildren} from "react";
import {GribData} from "@/components/types";



export type VelocityLayerOptions = {
    colorScale?: string[],
    data: GribData,
    displayOptions?: {
        velocityType: string,

        position: string | null,

        emptyString: string,

        angleConvention: "bearingCW" | "bearingCCW" | "meteoCW" | "meteoCCW",

        showCardinal: boolean,

        speedUnit: "m/s" | "k/h" | "mph" | "kt",

        directionString: string,

        speedString: string,
    },

    displayValues: boolean,
    maxVelocity?: number,
    minVelocity?: number,
    onAdd?: (map: L.Map) => void,
    onRemove?: (map: L.Map) => void,
    opacity?: number,
    paneName?: string,


    velocityScale?: number,
};
export type VelocityLayerProps = VelocityLayerOptions &
    PropsWithChildren;
