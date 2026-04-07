import {LatLngBounds} from "leaflet";

export interface WeatherDataPoint {
    windU?: number;
    windV?: number;
    currentU?: number;
    currentV?: number;
    temperature?: number;
    bounds?: LatLngBounds;
    debugData?: string;
}

export interface WeatherData {
    startTime: number;
    endTime: number;
    times: { [time: string]: WeatherDataTimeSnapshot }
}

export interface WeatherDataTimeSnapshot {
    time: number;
    isKeyFrame: boolean;
    gribFrames: GribFrame[]
}

export type GribData = GribFrame[]

export interface GribFrame {
    data: number[]
    header: GribHeader
}

export interface GribHeader {
    basicAngle?: number
    center?: number
    centerName?: string
    discipline: number
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
    winds?: boolean
}