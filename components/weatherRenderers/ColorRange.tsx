import {lerp, roundTo} from "@/components/utilities";

interface ColorRangeParams {
    colorFunc: (t: number) => string;
    textFunc: (t: number) => string;
    top: number;
    bottom: number;
    resolution: number;
    textCount: number;
}

export function ColorRange({colorFunc, top, bottom, resolution, textCount, textFunc}: ColorRangeParams ) {
    return <div style={{
        height: "100%",
        width: "100%",
        textAlign: 'center',
        display: 'grid',
        gridTemplate: '1fr / 1fr',
        placeItems: 'center',
    }}>
        <div style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
            position: 'relative',
            width: '100%',
            height: '100%'
        }}>
            {Array.from({length: resolution}).map((_, i) =>
                <div key={i} style={{
                    display: 'flex',
                    backgroundColor: colorFunc(lerp(top, bottom, i / resolution)),
                    height: `${100 / resolution}%`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                }}>

                </div>
            )}
        </div>
        <div style={{
            gridColumn: '1 / 1',
            gridRow: '1 / 1',
            position: 'relative',
            width: '100%',
            height: '100%'
        }}>
            {Array.from({length: textCount}).map((_, i) =>
                <div key={i} style={{
                    display: 'flex',
                    height: `${roundTo(100 / textCount, 2)}%`,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                }}>
                    <b>{textFunc(lerp(top, bottom, i / textCount))}</b>
                </div>
            )}
        </div>
    </div>
}