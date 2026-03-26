import {LatLngBounds} from "leaflet";
import {GribFrame} from "@/components/VelocityWrapper/types";

export interface WeatherDataPoint {
    windU?: number;
    windV?: number;
    currentU?: number;
    currentV?: number;
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
    originalData?: GribFrame[]
    bounds: LatLngBounds;
    data: { [lat: number]: { [long: number]: WeatherDataPoint } };
}
