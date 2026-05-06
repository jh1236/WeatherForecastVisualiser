"use client"

import {CartesianGrid, Legend, Line, LineChart, XAxis, YAxis} from "recharts"

import {Card, CardContent,} from "@/components/ui/card"
import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"
import {WeatherData, WeatherDataPointKey} from "@/components/types";
import {LatLngBounds} from "leaflet";
import {getWeatherDataPointForPoint, WeatherDataPointValues} from "@/components/dataManagement/DataProcessing";
import {Dispatch, ReactNode, SetStateAction, useMemo, useState} from "react";
import {camelCaseToTitleCase, latLngToDMS, roundTo} from "@/components/utilities";
import {magnitude} from "@/components/vectorUtils";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {COLORS, MapGraphPointer} from "@/components/weatherRenderers/PointGrapher/PointsGrapher";
import {Button} from "@/components/ui/button";
import {Minus} from "lucide-react";
import {useTheme} from "next-themes";
import {to12HourTime, useUserUnits, useTimeInUserUnits, useFormatUserUnits} from "@/components/unitsUtils";
import {useSettings} from "@/components/settings";


type DataKey =
    Exclude<WeatherDataPointKey, 'windU' | 'windV' | 'currentU' | 'currentV'>
    | 'current'
    | 'windSpeed';

interface ChartLineLinearProps {
    data: WeatherData;
    points: MapGraphPointer[];
    setPoints: Dispatch<SetStateAction<MapGraphPointer[]>>;
    viewportBounds: LatLngBounds;
}

const COLOR_TO_HEX: { [key in typeof COLORS[number]]: string } = {
    blue: '#337fd9',
    red: '#ab1115',
    green: '#2e8e33',
    orange: '#e37001',
    pink: '#c959cb',
}

type GraphDataPoint = { [key in DataKey]?: number };

function getDataFromWeatherDataPoint(data: WeatherDataPointValues | undefined, formatter: (type: DataKey, v: number) => number): GraphDataPoint {
    const out: GraphDataPoint = {};
    if (!data) return out;
    if (data.temperature) {
        out.temperature = formatter('temperature', data.temperature)
    }
    if (data.oceanTemperature) {
        out.oceanTemperature = formatter('temperature', data.oceanTemperature)
    }

    const {windU, windV, currentU, currentV} = data
    if (windU && windV) {
        out.windSpeed = formatter('windSpeed', magnitude([windU, windV]))
    }

    if (currentU && currentV) {
        out.current = formatter('current', magnitude([currentU, currentV]))
    }
    return out
}

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig


export function ChartLineLinear({data, points, viewportBounds, setPoints}: ChartLineLinearProps) {
    const [dataKey, setDataKey] = useState<DataKey>('temperature')
    const {settings} = useSettings()
    const dataToUserUnits = useUserUnits()
    const formatData = useFormatUserUnits()
    const timeConverter = useTimeInUserUnits()
    const [tab, setTab] = useState<string>('0')
    const nextFreeColor = COLORS.find(it => !points.map(p => p.color).includes(it))!
    const chartData =
        useMemo(() =>
            Object.values(data.times)
                .map(it => ({
                        time: new Date(it.time).toISOString().split("T")[1].split(".")[0].replace(/:00$/, ''),
                        points: points.map(point => ({
                            point, data: getDataFromWeatherDataPoint(getWeatherDataPointForPoint(it.gribFrames, point.pos), dataToUserUnits)
                        }))
                    })
                ), [data.times, points, dataToUserUnits])

    const shorterNames = points.length >= 3

    const compareData = useMemo(() => chartData.map(timeSlot => Object.assign({time: timeSlot.time}, Object.fromEntries(timeSlot.points.map(p => [latLngToDMS(p.point.pos, true), {
        data: p.data[dataKey],
        color: p.point.color
    }])))), [chartData, dataKey])

    return (
        <Card style={{padding: 0}}>
            <CardContent className="w-full leaflet-control h-full">
                <Tabs style={{width: '100%', marginTop: '0'}} defaultValue={'0'} value={tab} onValueChange={setTab}>
                    <TabsList>
                        {points.length > 1 && <TabsTrigger value="compare">Compare</TabsTrigger>}

                        {points.map((point, i) => (
                            <TabsTrigger value={i.toString()}
                                         key={i}>{camelCaseToTitleCase(point.color)}{!shorterNames && ' point'}</TabsTrigger>
                        ))}
                        {points.length < 5 && <TabsTrigger value={points.length.toString()} onClick={() => {
                            setPoints([...points, {pos: viewportBounds.getCenter(), color: nextFreeColor}])
                        }}>+</TabsTrigger>}
                    </TabsList>
                    {chartData[0].points.length > 1 && <TabsContent value="compare" style={{marginBottom: 6}}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'left',
                                alignItems: 'center',
                                width: '100%',
                                marginTop: 0
                            }}
                        >
                            <p style={{margin: 15, fontSize: '1.2em'}}>Data for </p>
                            <Select value={dataKey}
                                    onValueChange={(v: DataKey) => setDataKey(v)}>
                                <SelectTrigger style={{fontSize: '1.2em'}}
                                               className="w-[200px] ">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent style={{zIndex: 10000}}>
                                    <SelectGroup>
                                        {(['temperature', 'oceanTemperature', 'windSpeed', 'current']).map(it =>
                                            <SelectItem key={it}
                                                        value={it}>{camelCaseToTitleCase(it)}</SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <ChartContainer config={chartConfig} style={{margin: '0 auto'}}>
                            <LineChart
                                accessibilityLayer
                                data={compareData}
                            >
                                <CartesianGrid vertical={false}/>
                                <XAxis
                                    dataKey={(datum: typeof compareData[0]) => datum.time}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(i) => timeConverter(i)}
                                />
                                <YAxis
                                    tickLine={false}
                                    tickFormatter={it => formatData(dataKey, it)}
                                    axisLine={false}
                                    width='auto'
                                    tickMargin={8}
                                    domain={([dataMin, dataMax]) => {
                                        const range = dataMax - dataMin
                                        return [dataMin < 0 ?
                                            dataMin :
                                            settings.forceGraphsToZero ?
                                                0 :
                                                Math.max(0, dataMin - 0.1 * range),
                                            dataMax + 0.1 * range]
                                    }}
                                />
                                <Legend
                                />
                                {Object.entries(compareData[0]).filter(([it]) => it !== 'time').map(([key, value], i) =>
                                    <Line
                                        key={i}
                                        name={camelCaseToTitleCase(key)}
                                        dataKey={(datum: typeof compareData[0]) => datum[key].data}
                                        stroke={COLOR_TO_HEX[(value as { color: typeof COLORS[0] }).color]}
                                        type="linear"
                                        strokeWidth={2}
                                        dot={false}
                                    >
                                        <ChartTooltip
                                            content={<ChartTooltipContent
                                                labelFormatter={timeConverter as (label: ReactNode) => string}
                                                valueFormatter={(value) => formatData(dataKey, value as number)}/>}
                                        />
                                    </Line>
                                )}
                            </LineChart>
                        </ChartContainer>
                    </TabsContent>}
                    {points.map((point, i) => (
                        <TabsContent value={i.toString()} key={i} style={{marginBottom: 6}}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-evenly',
                                    alignItems: 'center',
                                    width: '100%',
                                    marginTop: 0
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                        marginTop: 0
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'left',
                                            alignItems: 'center',
                                            width: '100%',
                                            marginTop: 0
                                        }}>
                                        <p style={{margin: 15, fontSize: '1.2em'}}>Data for </p>
                                        <Select value={dataKey}
                                                onValueChange={(v: DataKey) => setDataKey(v)}>
                                            <SelectTrigger style={{fontSize: '1.2em'}}
                                                           className="w-[200px] ">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent style={{zIndex: 10000}}>
                                                <SelectGroup>
                                                    {(Object.keys(chartData[0].points[0].data ?? {})).map(it =>
                                                        <SelectItem key={it}
                                                                    value={it}>{camelCaseToTitleCase(it)}</SelectItem>
                                                    )}

                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {points.length > 1 &&
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            style={{float: 'right'}}
                                            onClick={
                                                () => {
                                                    setPoints(prev => prev.filter((_, it) => it !== i))
                                                    setTab(Math.max(i - 1, 0).toString())
                                                }}
                                        >
                                            <Minus/>
                                        </Button>
                                    }
                                </div>
                                <i style={{color: 'gray'}}>At {latLngToDMS(point.pos)}</i>
                            </div>
                            <ChartContainer config={chartConfig} style={{margin: '0 auto'}}>
                                <LineChart
                                    responsive
                                    accessibilityLayer
                                    data={chartData.map(it => ({time: it.time, data: it.points[i].data}))}
                                >
                                    <CartesianGrid vertical={false}/>
                                    <XAxis
                                        dataKey={(datum) => datum.time}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(i) => timeConverter(i)}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        tickFormatter={it => formatData(dataKey as DataKey, it)}
                                        axisLine={false}
                                        width='auto'
                                        tickMargin={8}
                                        domain={([dataMin, dataMax]) => {
                                            const range = dataMax - dataMin
                                            return [dataMin < 0 ?
                                                dataMin :
                                                settings.forceGraphsToZero ?
                                                    0 :
                                                    Math.max(0, dataMin - 0.1 * range),
                                                dataMax + 0.1 * range]
                                        }}
                                    />
                                    <Line
                                        dataKey={(datum) => datum.data[dataKey]}
                                        type="linear"
                                        stroke={COLOR_TO_HEX[point.color]}
                                        strokeWidth={2}
                                        dot={false}
                                    >
                                        <ChartTooltip
                                            content={<ChartTooltipContent
                                                labelFormatter={timeConverter as (label: ReactNode) => string}
                                                valueFormatter={(value) => formatData(dataKey, value as number)}/>}
                                        />
                                    </Line>
                                </LineChart>
                            </ChartContainer>
                        </TabsContent>
                    ))}
                </Tabs>

            </CardContent>
        </Card>
    )
}
