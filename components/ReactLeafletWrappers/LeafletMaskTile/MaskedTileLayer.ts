import {
    createElementObject,
    createTileLayerComponent,
    LeafletContextInterface,
    updateGridLayer
} from "@react-leaflet/core";
import {Point, TileLayer,} from 'leaflet';
import 'leaflet-velocity';
import {TileLayerProps} from "react-leaflet/TileLayer";

import "@/components/ReactLeafletWrappers/LeafletMaskTile/source"

export type MaskedTileLayerProps = { center?: Point } & TileLayer.MaskOptions & TileLayerProps;

function createMaskedTileLayer(props: MaskedTileLayerProps, context: LeafletContextInterface) {
    return createElementObject(new TileLayer.Mask(props.url, props), context)
}

function updateMaskedTileLayer(instance: TileLayer.Mask, props: MaskedTileLayerProps, prevProps: MaskedTileLayerProps) {
    updateGridLayer(instance, props, prevProps);
    if (prevProps.url !== props.url) {
        instance.setUrl(props.url);
    }
    if (props.center && prevProps.center !== props.center) {
        console.log('update!')
        instance.setCenter(props.center);
    }
}


export const MaskedTileLayer = createTileLayerComponent(createMaskedTileLayer, updateMaskedTileLayer);
