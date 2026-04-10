export * from "leaflet"
import {VelocityLayerProps} from "@/components/weatherRenderers/LeafletVelocityWrapper/types";

// this is so that TS recognises the custom types that 'leaflet-velocity' adds
declare module "leaflet" {
    export interface VelocityLayer extends L.Layer {
        setData: (data: GribData) => void;
        setOptions: (options: VelocityLayerOptions) => void;
    }

    export function velocityLayer({options}: VelocityLayerProps): L.VelocityLayer;
}