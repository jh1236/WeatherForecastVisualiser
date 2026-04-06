import {useEffect, useRef} from "react";
import {VelocityLayerProps} from "@/components/VelocityWrapper/types";
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

export function VelocityLayer(props: VelocityLayerProps): React.ReactElement | null {
    const context = useLeafletContext();
    const layerRef = useRef<L.VelocityLayer>(null);
    const propsRef = useRef(props)
    useEffect(() => {
        // if (!layerRef.current === !props.data) return
        const maybeProps = {...props}
        maybeProps.data = maybeProps?.data ?? []
        const layer = L.velocityLayer(maybeProps);
        layerRef.current = layer;
        const container = context.layerContainer || context.map
        container.addLayer(layerRef.current!)
        layerRef.current!.setData([])
        return () => {
            container.removeLayer(layer)
        }
    }, []);
    useEffect(() => {
        if (layerRef.current === null || context.map === null) return

        (layerRef.current! as unknown as { _map: L.Map })._map = context.map

        const datalessOptions = Object.fromEntries(Object.entries(propsRef.current).filter(([k]) => k !== 'data'))
        const prevDatalessOptions = Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'data'))

        let changed = false;
        layerRef.current!.setData(props.data);
        if (JSON.stringify(datalessOptions) !== JSON.stringify(prevDatalessOptions)) {
            changed = true;
            if (props.opacity) {
                layerRef.current!.setOpacity(props.opacity)
            }
            layerRef.current!.setOptions(props)
        }

        if (props.data?.length !== propsRef.current.data?.length) {
            changed = true;
            layerRef.current!.setData(props.data)
        }
        if (props.enabled !== propsRef.current.enabled) {
            changed = true;
        }
        if (changed) {
            propsRef.current = props
        }
    }, [context.map, props])

    return null!
}