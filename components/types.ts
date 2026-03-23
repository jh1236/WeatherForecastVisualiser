import {LatLngBounds} from "leaflet";

export interface WeatherDataPoint {
    windU?: number;
    windV?: number;
    current?: number;
    bounds?: LatLngBounds;
    originalIndex?: number;
}

export interface WeatherDataSnapshot {
    time: number;
    bounds: LatLngBounds;
    data: { [lat: number]: { [long: number]: WeatherDataPoint } };
}
