"use client"

import {CartesianGrid, Line, LineChart, XAxis, YAxis} from "recharts"

import {Card, CardContent,} from "@/components/ui/card"
import {type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,} from "@/components/ui/chart"
import {WeatherData, WeatherDataPointKey} from "@/components/types";
import {LatLngBounds} from "leaflet";
import {
    getValueRangeForData,
    getWeatherDataPointForPoint,
    WeatherDataPointValues
} from "@/components/dataManagement/DataProcessing";
import {Dispatch, SetStateAction, useMemo, useState} from "react";
import {camelCaseToTitleCase, latLngToDMS, roundTo} from "@/components/utilities";
import {magnitude} from "@/components/vectorUtils";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {COLORS, MapGraphPointer} from "@/components/weatherRenderers/PointGrapher/PointsGrapher";
import {Button} from "@/components/ui/button";
import {Minus} from "lucide-react";


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
    blue: '#005fbd',
    red: '#ab1115',
    green: '#2e8e33',
    orange: '#e37001',
    pink: '#c959cb',
}

type GraphDataPoint = { [key in DataKey]?: number };

function getDataFromWeatherDataPoint(data: WeatherDataPointValues | undefined): GraphDataPoint {
    const out: GraphDataPoint = {};
    if (!data) return out;
    if (data.temperature) {
        out.temperature = data.temperature
    }
    if (data.oceanTemperature) {
        out.oceanTemperature = data.oceanTemperature
    }

    const {windU, windV, currentU, currentV} = data
    if (windU && windV) {
        out.windSpeed = magnitude([windU, windV])
    }

    if (currentU && currentV) {
        out.current = magnitude([currentU, currentV])
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
    const [dataKey, setDataKey] = useState<DataKey | 'all'>('temperature')
    const valueRanges = useMemo(() => getValueRangeForData(data).map(getDataFromWeatherDataPoint), [data])
    const nextFreeColor = COLORS.find(it => !points.map(p => p.color).includes(it))!
    console.log(valueRanges)
    const chartData =
        Object.values(data.times)
            .map(it =>
                points
                    .map(point => ({
                            time: new Date(it.time).toISOString().split("T")[1].split(".")[0].replace(/:00$/, ''),
                            data: getDataFromWeatherDataPoint(getWeatherDataPointForPoint(it.gribFrames, point.pos)),
                        })
                    )
            )

    const shorterNames = points.length >= 3

    return (
        <Card style={{padding: 0}}>
            <CardContent className="w-full leaflet-control">
                <Tabs style={{width: '100%', marginTop: '0'}} defaultValue={'0'}>
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
                    {chartData[0].length > 1 && <TabsContent value="compare" style={{marginBottom: 6}}>
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
                                data={chartData}
                            >
                                <CartesianGrid vertical={false}/>
                                <XAxis
                                    dataKey={(datum: typeof chartData[0]) => datum[0].time}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis
                                    tickLine={false}
                                    tickFormatter={it => roundTo(it, 1).toString()}
                                    axisLine={false}
                                    width='auto'
                                    tickMargin={8}
                                    domain={dataKey !== 'all' ? valueRanges.map((it, i) => Math.round(it[dataKey]! - Math.pow(-1, i) * 2)) : undefined}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel/>}
                                />
                                {points.map((point, i) =>
                                    <Line
                                        key={i}
                                        dataKey={(datum: typeof chartData[0]) => datum[i].data[dataKey as DataKey]}
                                        type="linear"
                                        stroke={COLOR_TO_HEX[point.color]}
                                        strokeWidth={2}
                                        dot={false}
                                    />
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
                                }}>
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
                                                    {(Object.keys(chartData[0][i].data ?? {}) as DataKey[]).map(it =>
                                                        <SelectItem key={it}
                                                                    value={it}>{camelCaseToTitleCase(it)}</SelectItem>
                                                    )}
                                                    <SelectItem value="all">All</SelectItem>

                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {points.length > 1 && <Button variant="ghost"
                                                                  size="icon"
                                                                  style={{float: 'right'}}
                                                                  onClick={
                                                                      () => setPoints(prev => prev.filter((_, it) => it !== i))
                                                                  }><Minus/></Button>}
                                </div>
                                <i style={{color: 'gray'}}>At {latLngToDMS(point.pos)}</i>
                            </div>
                            <ChartContainer config={chartConfig} style={{margin: '0 auto'}}>
                                <LineChart
                                    accessibilityLayer
                                    data={chartData}
                                >
                                    <CartesianGrid vertical={false}/>
                                    <XAxis
                                        dataKey={(datum: typeof chartData[0]) => datum[i].time}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        tickFormatter={it => roundTo(it, 1).toString()}
                                        axisLine={false}
                                        width='auto'
                                        tickMargin={8}
                                        domain={dataKey !== 'all' ? valueRanges.map((it, i) => Math.round(it[dataKey]! - Math.pow(-1, i) * 2)) : undefined}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel/>}
                                    />
                                    {dataKey === 'all' ? Object.keys(chartData[0][i].data).map((it, idx) =>
                                            <Line
                                                key={it}
                                                dataKey={(datum: typeof chartData[0]) => datum[i].data[it as DataKey]}
                                                type="linear"
                                                stroke={COLORS[idx]}
                                                strokeWidth={2}
                                                dot={false}
                                            />) :
                                        <Line
                                            dataKey={(datum: typeof chartData[0]) => datum[i].data[dataKey]}
                                            type="linear"
                                            stroke={COLOR_TO_HEX[point.color]}
                                            strokeWidth={2}
                                            dot={false}
                                        />}
                                </LineChart>
                            </ChartContainer>
                        </TabsContent>
                    ))}
                </Tabs>

            </CardContent>
        </Card>
    )
}
