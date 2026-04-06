'use client';

import "leaflet/dist/leaflet.css";
import {useEffect, useMemo, useState} from "react";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {ArrowLeftIcon, ArrowRightIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon} from "lucide-react";
import {useThreddsServer} from "@/components/DataCollection";
import {VelocityLayer} from "@/components/VelocityWrapper/VelocityLayer";
import {WindBarbs} from "@/components/WindRenderers/WindBarbs";
import {WindDataMouseOver} from "@/components/WindRenderers/WindDataMouseOver";
import {DatePicker} from "@/components/ui/datePicker";
import {WindMenubar} from "@/components/ui/WindMenubar";
import {WindMap} from "@/components/WindRenderers/WindMap";


export default function Home() {
    // const data = useLocalData('cwa_atmosphere');
    const [date, setDate] = useState(new Date());
    const {data, reset} = useThreddsServer(date);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const timestamps = useMemo(() => data.times ? Object.keys(data.times).map(it => Number(it)).toSorted((a, b) => a - b) : [], [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);

    useEffect(() => {
        if (playbackSpeed > 0) {
            const timer = setInterval(() => {
                setCurrentTimeStampIndex((currentTimeStampIndex + 1) % timestamps.length);
            }, 1200 / playbackSpeed);
            return () => clearInterval(timer);
        }
    }, [currentTimeStamp, currentTimeStampIndex, playbackSpeed, timestamps])





    return (
        <div style={{width: '100vw', height: '100vh',}}>
            <div style={{width: '100%'}}>
                <WindMenubar></WindMenubar>
            </div>
            <div>
                <div style={{width: '100vw', height: '86vh', display: 'flex', flexDirection: 'row'}}>
                    <WindMap data={data.times?.[currentTimeStamp]?.gribFrames} />
                </div>
                <div style={{display: 'flex', flexDirection: 'row', padding: '30px', width: '100%', height: '20%'}}>
                    <div style={{
                        width: '20%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex'
                    }}>
                        <DatePicker date={date} setDate={(date) => {
                            reset()
                            setDate(date)
                        }}/> &nbsp;
                        {currentTimeStamp ? new Date(currentTimeStamp).toUTCString().slice(16, 22) : ''} {playbackSpeed > 0 && `(${playbackSpeed}x)`}
                    </div>
                    <Slider
                        min={timestamps.reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)}
                        max={timestamps.reduce((a, b) => Math.max(a, b), Number.MIN_VALUE)}
                        value={[isDragging ? dragValue : currentTimeStamp]}
                        style={{width: '60%', margin: 'auto'}}
                        onValueChange={([v]) => {
                            if (timestamps.length) {
                                setIsDragging(true);
                                setDragValue(v);
                                const closest = timestamps.reduce((best, t) =>
                                    Math.abs(t - v) < Math.abs(best - v) ? t : best
                                );
                                setCurrentTimeStampIndex(timestamps.indexOf(closest));
                            }
                        }}
                        onValueCommit={() => {
                            setIsDragging(false);
                        }}
                    />
                    <div style={{
                        width: '20%',
                        display: 'flex',
                        flexDirection: 'row',
                        paddingLeft: '5%',
                        paddingRight: '5%'
                    }}>
                        {playbackSpeed === 0 ?
                            <Button disabled={currentTimeStampIndex <= 0} style={{margin: 'auto'}} variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentTimeStampIndex(Math.max(0, currentTimeStampIndex - 1))}>
                                <ArrowLeftIcon/>
                            </Button> :
                            <Button disabled={playbackSpeed <= 1} style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setPlaybackSpeed(playbackSpeed / 2)}>
                                <RewindIcon/>
                            </Button>}
                        <Button style={{margin: 'auto'}}
                                variant="outline" size="icon"
                                onClick={() => {
                                    setPlaybackSpeed(playbackSpeed > 0 ? 0 : 1)
                                }}>
                            {playbackSpeed === 0 ? <PlayIcon/> : <PauseIcon/>}
                        </Button>
                        {playbackSpeed === 0 ?
                            <Button disabled={currentTimeStampIndex + 1 >= timestamps.length - 1}
                                    style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setCurrentTimeStampIndex(Math.min(currentTimeStampIndex + 1, timestamps.length - 1))}>
                                <ArrowRightIcon/>
                            </Button> :
                            <Button disabled={playbackSpeed >= 16} style={{margin: 'auto'}}
                                    variant="outline" size="icon"
                                    onClick={() => setPlaybackSpeed(playbackSpeed * 2)}>
                                <FastForwardIcon/>
                            </Button>}
                    </div>
                </div>
            </div>
        </div>
    );
}
