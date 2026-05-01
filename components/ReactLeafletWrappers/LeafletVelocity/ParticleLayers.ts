import {VelocityLayerProps} from "@/components/ReactLeafletWrappers/LeafletVelocity/types";
import {createElementObject, createLayerComponent, LeafletContextInterface} from "@react-leaflet/core";
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


function createVelocityLayer(props: VelocityLayerProps, context: LeafletContextInterface) {
    const ret = createElementObject(L.velocityLayer(props), context)
    return ret
}

function updateVelocityLayer(instance: L.VelocityLayer, props: VelocityLayerProps, prevProps: VelocityLayerProps) {
    instance.setData(props.data)

    const currentOptions = Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'data'))
    const prevOptions = Object.fromEntries(Object.entries(prevProps).filter(([k]) => k !== 'data'))
    if (JSON.stringify(currentOptions) !== JSON.stringify(prevOptions)) {
        instance.setOptions(props)
    }
}


export const VelocityLayer = createLayerComponent(createVelocityLayer, updateVelocityLayer);
