import {useEffect, useRef, useState} from "react";
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
        //this is like this because I am reaching inside the layer's private methods
        // (layerRef.current as unknown as { _timer: () => void })._timer = () => (layerRef.current as unknown as {
        //     _startWindy: () => void
        // })._startWindy()
        const container = context.layerContainer || context.map
        container.addLayer(layerRef.current!)
        layerRef.current!.setData([])
        return () => {
            try {
                container.removeLayer(layer)
            } catch (e) {
                // What you are witnessing is me giving up
                console.error(e)
            }
        }
    }, []);
    useEffect(() => {
        try {
            if (layerRef.current === null || context.map === null || !props.data.length) return

            (layerRef.current! as unknown as { _map: L.Map })._map = context.map

            layerRef.current!.setData(props.data);
            if (props.opacity !== undefined) {
                layerRef.current!.setOpacity(props.opacity)
            }
            if (props.velocityScale !== propsRef.current.velocityScale || props.colorScale !== propsRef.current.colorScale) {
                layerRef.current!.setOptions(props)
                propsRef.current = props
            }
        } catch (e) {
            console.error(e)
            //again i don't know how to fix this code
        }
    }, [context.map, props])

    return null!
}