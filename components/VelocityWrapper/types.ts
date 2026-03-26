import {PropsWithChildren} from "react";

export type GribData = GribFrame[]

export interface GribFrame {
    data: number[]
    header: GribHeader
}

export interface GribHeader {
    basicAngle?: number
    center?: number
    centerName?: string
    discipline?: number
    disciplineName?: string
    dx: number
    dy: number
    forecastTime?: number
    genProcessType?: number
    genProcessTypeName?: string
    gribEdition?: number
    gribLength?: number
    gridDefinitionTemplate?: number
    gridDefinitionTemplateName?: string
    gridUnits?: string
    la1: number
    la2: number
    lo1: number
    lo2: number
    numberPoints?: number
    nx: number
    ny: number
    parameterCategory: number
    parameterCategoryName?: string
    parameterNumber: number
    parameterNumberName?: string
    parameterUnit: string
    productDefinitionTemplate?: number
    productDefinitionTemplateName?: string
    productStatus?: number
    productStatusName?: string
    productType?: number
    productTypeName?: string
    refTime: string
    resolution?: number
    scanMode?: number
    shape?: number
    shapeName?: string
    significanceOfRT?: number
    significanceOfRTName?: string
    subcenter?: number
    surface1Type?: number
    surface1TypeName?: string
    surface1Value?: number
    surface2Type?: number
    surface2TypeName?: string
    surface2Value?: number
    winds?: string
}


export type VelocityLayerOptions = {
    colorScale?: string[],
    data: GribData,
    displayOptions: {
        velocityType: string,

        position: string,

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
