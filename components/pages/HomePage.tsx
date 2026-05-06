import {WeatherMenubar} from "@/components/ui/WeatherMenubar";
import {DatePicker} from "@/components/ui/datePicker";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {ArrowLeftIcon, ArrowRightIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useDataFromSettingsSource} from "@/components/dataManagement/DataCollection";

import "@/components/pages/homepage.module.css"
import dynamic from "next/dynamic";
import {useTimeInUserUnits} from "@/components/unitsUtils";

const WeatherMap = dynamic(
    () => import('@/components/weatherRenderers/WeatherMap').then(mod => mod.WeatherMap),
    {ssr: false}
);

export function HomePage() {
    const [date, setDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const {data, reset, populated} = useDataFromSettingsSource(date);
    const timeFormatter = useTimeInUserUnits()
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const timestamps = useMemo(() => data.times ? Object.keys(data.times).map(it => Number(it)).toSorted((a, b) => a - b) : [], [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (playbackSpeed > 0) {
            const timer = setInterval(() => {
                setCurrentTimeStampIndex((currentTimeStampIndex + 1) % timestamps.length);
            }, 1200 / playbackSpeed);
            return () => clearInterval(timer);
        }
    }, [currentTimeStamp, currentTimeStampIndex, playbackSpeed, timestamps])


    return <div style={{
        width: '100svw',
        height: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }}>
        <div style={{width: '100%'}}>
            {mounted && <WeatherMenubar resetData={reset}></WeatherMenubar>}
        </div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', flexDirection: 'column'}}>
            <div style={{width: '100%', flex: 1, display: 'flex', flexDirection: 'row'}}>
                <WeatherMap playbackSpeed={playbackSpeed} data={data} populated={populated}
                            currentTimeStamp={currentTimeStamp}/>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                flexDirection: 'row',
                padding: '12px',
                width: '100%'
            }}>
                <DatePicker date={date} setDate={(date) => {
                    reset()
                    setDate(date)
                }}/>
                <p style={{
                    paddingLeft: 20,
                    paddingRight: 20
                }}>{currentTimeStamp ? timeFormatter(new Date(currentTimeStamp).toUTCString().slice(16, 22)) : ''} {playbackSpeed > 0 && `(${playbackSpeed}x)`}</p>

                <Slider
                    min={timestamps.reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)}
                    max={timestamps.reduce((a, b) => Math.max(a, b), 0)}
                    value={[isDragging ? dragValue : currentTimeStamp]}
                    style={{flex: 1, margin: 'auto'}}
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
}