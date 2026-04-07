import "leaflet"
import {VelocityLayerProps} from "@/components/weatherRenderers/VelocityWrapper/types";

// this is so that TS recognises the custom types that 'leaflet-velocity' adds
declare module "leaflet" {
    export function velocityLayer({options}: VelocityLayerProps): L.VelocityLayer;

    interface VelocityLayer extends L.Layer {
        setData: (data: GribData) => void;
        setOptions: (options: VelocityLayerOptions) => void;
    }
}