import {createElementObject, createTileLayerComponent, LeafletContextInterface} from "@react-leaflet/core";
import L, {TileLayer,} from 'leaflet';
import 'leaflet-velocity';
import {TileLayerProps} from "react-leaflet/TileLayer";

import "@/components/ReactLeafletWrappers/LeafletBoundaryCanvas/source"

type BoundaryCanvasProps = TileLayer.BoundaryCanvasOptions & TileLayerProps;

function createBoundaryCanvas(props: BoundaryCanvasProps, context: LeafletContextInterface) {
    return createElementObject(new TileLayer.BoundaryCanvas(props.url, props), context)
}

function updateBoundaryCanvas(instance: TileLayer.BoundaryCanvas, props: BoundaryCanvasProps, prevProps: BoundaryCanvasProps) {
    if (prevProps.url !== props.url) {
        instance.setUrl(props.url);
    }
    if (props.boundary !== prevProps.boundary) {
        L.Util.setOptions(instance, {boundary: props.boundary})
    }
}


export const BoundaryCanvas = createTileLayerComponent(createBoundaryCanvas, updateBoundaryCanvas);
