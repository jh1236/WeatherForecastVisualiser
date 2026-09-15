import {WeatherMenubar} from "@/components/ui/WeatherMenubar";
import {DatePicker} from "@/components/ui/datePicker";
import {Slider} from "@/components/ui/slider";
import {Button} from "@/components/ui/button";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    FastForwardIcon,
    PauseIcon,
    PlayIcon,
    RewindIcon,
    TriangleAlert
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useDataFromSettingsSource} from "@/components/dataManagement/DataCollection";

import "@/components/pages/homepage.module.css"
import dynamic from "next/dynamic";
import {useTimeInUserUnits} from "@/components/unitsUtils";
import {useInterval, useSessionStorage} from "react-use";
import {Dialog, DialogContent, DialogDescription, DialogOverlay, DialogTitle} from "@/components/ui/dialog";
import {useTheme} from "next-themes";

const WeatherMap = dynamic(
    () => import('@/components/weatherRenderers/WeatherMap').then(mod => mod.WeatherMap),
    {ssr: false}
);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function HomePage() {
    const [dateInUTC, setDateInUTC] = useSessionStorage<number | undefined>('date', undefined);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);
    //we check mounted here to save a hydration error
    const date = useMemo(() => mounted ? new Date(dateInUTC ?? 0) : new Date(0), [dateInUTC, mounted]);
    const {data, reset, populated, error} = useDataFromSettingsSource(date);
    const timeFormatter = useTimeInUserUnits()
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const timestamps = useMemo(() => data?.times ? Object.keys(data.times).map(it => Number(it)).toSorted((a, b) => a - b) : [], [data]);
    const [currentTimeStampIndex, setCurrentTimeStampIndex] = useState(0);
    const currentTimeStamp = useMemo(() => timestamps[currentTimeStampIndex], [currentTimeStampIndex, timestamps]);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(0);
    const [endDate, setEndDate] = useState<Date>();
    const {resolvedTheme} = useTheme();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const out = new Date(Date.now())
        out.setDate(out.getDate() + 4)

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEndDate(out)
    }, []);

    useEffect(() => {
        if (!dateInUTC) {
            setDateInUTC(Date.now());
        }
    }, [dateInUTC, setDateInUTC]);

    useInterval(() => {
        setCurrentTimeStampIndex((currentTimeStampIndex + 1) % timestamps.length)
    }, playbackSpeed !== 0 ? 1200 / playbackSpeed : null)


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

                <Dialog open={!!(error && !errorDismissed)} onOpenChange={open => open || setErrorDismissed(true)}>
                    <DialogOverlay style={{zIndex: 99998}}></DialogOverlay>
                    <DialogContent style={{zIndex: 99999}}>

                        <DialogTitle style={{textAlign: 'center', fontSize: '1.5em'}}><TriangleAlert
                            size={26} style={{display: 'inline', marginRight: 5, verticalAlign: 'middle'}}/>A server
                            error has occurred</DialogTitle>
                        <DialogDescription>
                            <style>
                                .visiblelink {'{'}
                                color: {resolvedTheme === 'dark' ? 'lightblue' : '#0000AA'};
                                text-decoration: underline;
                                {'}'}
                            </style>
                            <p style={{textAlign: 'center', fontSize: '1.1em', marginBottom: 5}}><b>The
                                backend hosted at <a className="visiblelink"
                                                     href="http://boreas.mywire.org:8080/thredds">http://boreas.mywire.org:8080/thredds</a> is
                                currently down! For a demonstration of the program, click <a
                                    href="#"
                                    className="visiblelink"
                                    onClick={() => {
                                        setErrorDismissed(true)
                                        setDateInUTC(new Date(2026, 1, 2).getTime())
                                    }}
                                >here</a>.</b>
                            </p>

                        </DialogDescription>
                    </DialogContent>
                </Dialog>

                <WeatherMap playbackSpeed={playbackSpeed} data={data} populated={populated} error={error}
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
                <DatePicker
                    startDate={new Date(2025, 12, 8)}
                    endDate={endDate}
                    shouldDisableDate={
                        day => day.getTime() - Date.now() > DAY_IN_MS * 5
                    }
                    date={date} setDate={(date) => {
                    reset()
                    setDateInUTC(date.getTime())
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
                        <Button disabled={mounted && currentTimeStampIndex <= 0} style={{margin: 'auto'}}
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentTimeStampIndex(Math.max(0, currentTimeStampIndex - 1))}>
                            <ArrowLeftIcon/>
                        </Button> :
                        <Button disabled={mounted && playbackSpeed <= 1} style={{margin: 'auto'}}
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
                        <Button disabled={mounted && currentTimeStampIndex + 1 >= timestamps.length - 1}
                                style={{margin: 'auto'}}
                                variant="outline" size="icon"
                                onClick={() => setCurrentTimeStampIndex(Math.min(currentTimeStampIndex + 1, timestamps.length - 1))}>
                            <ArrowRightIcon/>
                        </Button> :
                        <Button disabled={mounted && playbackSpeed >= 16} style={{margin: 'auto'}}
                                variant="outline" size="icon"
                                onClick={() => setPlaybackSpeed(playbackSpeed * 2)}>
                            <FastForwardIcon/>
                        </Button>}
                </div>
            </div>
        </div>
    </div>
}