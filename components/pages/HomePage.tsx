import {WeatherMenubar} from "@/components/ui/WeatherMenubar";
import {DatePicker} from "@/components/ui/datePicker";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {ArrowLeftIcon, ArrowRightIcon, FastForwardIcon, PauseIcon, PlayIcon, RewindIcon} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useDataFromSettingsSource} from "@/components/dataManagement/DataCollection";
import {useSettings} from "@/components/settings";

import "@/components/pages/homepage.module.css"
import dynamic from "next/dynamic";

const WeatherMap = dynamic(
    () => import('@/components/weatherRenderers/WeatherMap').then(mod => mod.WeatherMap),
    {ssr: false}
);

export function HomePage() {
    const [date, setDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const {data, reset, populated} = useDataFromSettingsSource(date);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const timestamps = useMemo(() => data.times ? Object.keys(data.times).map(it => Number(it)).toSorted((a, b) => a - b) : [], [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);
    const {settings} = useSettings();

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


    return <div style={{width: '100vw', height: '100vh'}}>
        {populated && <div style={{}}></div>}
        <div style={{width: '100%'}}>
            {mounted && <WeatherMenubar resetData={reset}></WeatherMenubar>}
        </div>
        <div>
            <div style={{width: '100vw', height: '86vh', display: 'flex', flexDirection: 'row'}}>
                <WeatherMap data={data.times?.[currentTimeStamp]} populated={populated} />
            </div>
            <div style={{display: 'flex', flexDirection: 'row', padding: '30px', width: '100%', height: '20%'}}>
                <div style={{
                    width: '20%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>
                    {settings.dataSource === 'netCDF' && <DatePicker date={date} setDate={(date) => {
                        reset()
                        setDate(date)
                    }}/>} &nbsp;
                    {currentTimeStamp ? new Date(currentTimeStamp).toUTCString().slice(settings.dataSource === 'netCDF' ? 16 : 0, 22) : ''} {playbackSpeed > 0 && `(${playbackSpeed}x)`}
                </div>
                <Slider
                    min={timestamps.reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)}
                    max={timestamps.reduce((a, b) => Math.max(a, b), 0)}
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
}