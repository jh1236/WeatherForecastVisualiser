export * from "leaflet"
import {VelocityLayerProps} from "@/components/ReactLeafletWrappers/LeafletVelocity/types";
import type {FeatureCollection, GeoJsonObject} from "geojson";

// this is so that TS recognises the custom types that 'leaflet-velocity' adds
declare module "leaflet" {
    export interface VelocityLayer extends L.Layer {
        setData: (data: GribData) => void;
        setOptions: (options: VelocityLayerOptions) => void;
    }

    export function velocityLayer({options}: VelocityLayerProps): L.VelocityLayer;

    namespace TileLayer {
        export interface MaskOptions extends TileLayerOptions {
            maskUrl?: string,
            maskSize?: number | L.Point
        }

        export interface BoundaryCanvasOptions extends TileLayerOptions {
            boundary?: GeoJsonObject | undefined;
            crossOrigin?: boolean | undefined;
            trackAttribution?: boolean | undefined;
        }

        class BoundaryCanvas extends TileLayer {
            constructor(url: string, options?: BoundaryCanvasOptions);
            static createFromLayer(tileLayer: TileLayer, options?: BoundaryCanvasOptions): BoundaryCanvas;
        }

        class Mask extends TileLayer {
            constructor(url: string, options?: MaskOptions);
            setCenter(x: number, y: number): Mask;
            setCenter(p: L.Point): Mask;
            getMaskSize(): number;
        }

        function boundaryCanvas(url: string, options?: BoundaryCanvasOptions): BoundaryCanvas;
    }
}