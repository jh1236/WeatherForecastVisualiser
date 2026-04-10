import {useEffect, useRef} from "react";
import {VelocityLayerProps} from "@/components/weatherRenderers/LeafletVelocityWrapper/types";
import {useLeafletContext} from "@react-leaflet/core";
import L from 'leaflet';
import 'leaflet-velocity';

export const defaultVelocityProps: {
    velocityType: string,

    position: string,

    emptyString: string,

    angleConvention: "bearingCW" | "bearingCCW" | "meteoCW" | "meteoCCW",

    showCardinal: boolean,

    speedUnit: "m/s" | "k/h" | "mph" | "kt",

    directionString: string,

    speedString: string,
} = {
    angleConvention: "meteoCW",
    directionString: "Direction",
    emptyString: "No Value",
    position: "bottomleft",
    showCardinal: false,
    speedString: "Speed",
    speedUnit: "m/s",
    velocityType: "GBR Wind"
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
function onDrawLayer(this: any) {

    if (!this._windy) {
        this._initWindy(this);
        return;
    }

    if (!this.options.data) {
        return;
    }

    if (this._timer) clearTimeout(this._timer);

    this._timer = setTimeout(() => this._startWindy(), 0); // showing velocity is delayed
}


export function VelocityLayer(props: VelocityLayerProps): React.ReactElement | null {
    const context = useLeafletContext();
    const layerRef = useRef<L.VelocityLayer>(null);
    const propsRef = useRef(props)
    useEffect(() => {
        if (!props.data?.length) return
        const layer = L.velocityLayer(props);
        layerRef.current = layer;
        // (layerRef.current as unknown as { onDrawLayer: () => void }).onDrawLayer = onDrawLayer
        const container = context.layerContainer || context.map
        container.addLayer(layerRef.current!)
        return () => {
            container.removeLayer(layer)
        }
    }, [props.data === undefined]);

    useEffect(() => {
        if (layerRef.current === null || context.map === null) return

        (layerRef.current as unknown as { _map: L.Map })._map = context.map
        console.log('setting data, sample value:', props.data?.[0]?.data?.[0])
        layerRef.current!.setData(props.data)

        const currentOptions = Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'data'))
        const prevOptions = Object.fromEntries(Object.entries(propsRef.current).filter(([k]) => k !== 'data'))
        if (JSON.stringify(currentOptions) !== JSON.stringify(prevOptions)) {
            layerRef.current!.setOptions(props)
        }

        propsRef.current = props
    }, [context.map, props])

    return null!
}