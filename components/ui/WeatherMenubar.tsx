import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger
} from "./menubar";
import {Settings, useSettings} from "@/components/settings";
import Image from "next/image";
import {Slider} from "@/components/ui/slider";
import {useTheme} from "next-themes";
import {round} from "@floating-ui/utils";

interface WeatherMenubarProps {
    resetData: () => void
}

function uncamelCase(s: string) {
    return s.slice(0, 1).toUpperCase() + s.slice(1).replace(/([A-Z]+)/g, ' $1')
}

interface MenubarEnablerParams {
    settings: Settings;
    setSetting: <K extends keyof Settings>(setting: K, value: Settings[K]) => void;
    settingName: keyof Settings;
}

function MenubarEnabler({settings, setSetting, settingName}: MenubarEnablerParams) {
    return <MenubarCheckboxItem checked={settings[settingName] as boolean}
                                onSelect={e => {
                                    setSetting(settingName, !settings[settingName])
                                    e.preventDefault()
                                }}>
        {uncamelCase(settingName.split(".enabled")[0])}
    </MenubarCheckboxItem>;
}

const MIN_GRID_RESOLUTION = 40
const WARN_GRID_RESOLUTION = 100
const MAX_GRID_RESOLUTION = 130

export function WeatherMenubar({resetData}: WeatherMenubarProps) {
    const {settings, setSetting} = useSettings()
    const {theme, resolvedTheme, setTheme} = useTheme()
    return (
        <Menubar style={{width: '100%'}}>
            <MenubarLabel style={{width: '50px'}}><Image src="/icon.png" alt="Website logo" width={30}
                                                         height={30}/></MenubarLabel>
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarLabel>Select Data Region</MenubarLabel>
                    <MenubarGroup>
                        <MenubarRadioGroup value={settings.region}
                                           onValueChange={value => {
                                               resetData()
                                               setSetting('region', (value as Settings['region']))
                                           }}>
                            <MenubarRadioItem
                                value="perth"
                            >Perth</MenubarRadioItem>
                            <MenubarRadioItem
                                value="greaterPerth"
                            >Greater Perth Region</MenubarRadioItem>
                            {/*<MenubarRadioItem*/}
                            {/*    disabled={settings.dataSource === 'grib'}*/}
                            {/*    value="greatBarrierReef"*/}
                            {/*>Great Barrier Reef</MenubarRadioItem>*/}
                        </MenubarRadioGroup>
                    </MenubarGroup>
                    <MenubarLabel>Other Settings</MenubarLabel>
                    <MenubarCheckboxItem checked={settings.showObscureUnits}
                                         onCheckedChange={() => setSetting('showObscureUnits', !settings.showObscureUnits)}>Show
                        Obscure Units</MenubarCheckboxItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Units</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>

                        <MenubarLabel>
                            Wind speed
                        </MenubarLabel>

                        <MenubarRadioGroup value={settings.windSpeedUnit}
                                           onValueChange={value => {
                                               setSetting('windSpeedUnit', (value as Settings['windSpeedUnit']))
                                           }}>
                            <MenubarRadioItem
                                value="m/s"
                            >Metres per Second</MenubarRadioItem>
                            <MenubarRadioItem
                                value="kt"
                            >Knots</MenubarRadioItem>
                            <MenubarRadioItem
                                value="km/h"
                            >Kilometres per Hour</MenubarRadioItem>
                            {settings.showObscureUnits && <MenubarRadioItem
                                value="mph"
                            >Miles per Hour</MenubarRadioItem>}
                            {settings.showObscureUnits && <MenubarRadioItem
                                value="c"
                            >Fractional Speed of Light</MenubarRadioItem>}
                        </MenubarRadioGroup>
                        <MenubarLabel>
                            Current speed
                        </MenubarLabel>

                        <MenubarRadioGroup value={settings.currentSpeedUnit}
                                           onValueChange={value => {
                                               setSetting('currentSpeedUnit', (value as Settings['currentSpeedUnit']))
                                           }}>
                            <MenubarRadioItem
                                value="m/s"
                            >Metres per Second</MenubarRadioItem>
                            <MenubarRadioItem
                                value="kt"
                            >Knots</MenubarRadioItem>
                            <MenubarRadioItem
                                value="km/h"
                            >Kilometres per Hour</MenubarRadioItem>
                            {settings.showObscureUnits && <MenubarRadioItem
                                value="mph"
                            >Miles per Hour</MenubarRadioItem>}
                            {settings.showObscureUnits && <MenubarRadioItem
                                value="c"
                            >Fractional Speed of Light</MenubarRadioItem>}
                        </MenubarRadioGroup>
                        <MenubarLabel>
                            Temperature
                        </MenubarLabel>

                        <MenubarRadioGroup value={settings.temperatureUnit}
                                           onValueChange={value => {
                                               setSetting('temperatureUnit', (value as Settings['temperatureUnit']))
                                           }}>
                            <MenubarRadioItem
                                value="C"
                            >Celsius</MenubarRadioItem>
                            {settings.showObscureUnits && <MenubarRadioItem
                                value="K"
                            >Kelvin</MenubarRadioItem>}
                            <MenubarRadioItem
                                value="F"
                            >Fahrenheit</MenubarRadioItem>
                        </MenubarRadioGroup>
                    </MenubarGroup>
                    <MenubarLabel>
                        Time
                    </MenubarLabel>

                    <MenubarCheckboxItem checked={settings["24HourTime"]}
                                         onCheckedChange={() => setSetting('24HourTime', !settings['24HourTime'])}>Use
                        24 Hour Time</MenubarCheckboxItem>

                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Renderers</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarLabel>Wind Renderers</MenubarLabel>
                        <MenubarEnabler settings={settings} setSetting={setSetting}
                                        settingName="windParticles.enabled"/>
                        <MenubarEnabler settings={settings} setSetting={setSetting} settingName="windBarbs.enabled"/>
                        <MenubarEnabler settings={settings} setSetting={setSetting} settingName="windColors.enabled"/>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarLabel>Temperature Renderers</MenubarLabel>
                        <MenubarEnabler settings={settings} setSetting={setSetting}
                                        settingName="temperatureColors.enabled"/>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarLabel>Ocean Renderers</MenubarLabel>
                        <MenubarEnabler settings={settings} setSetting={setSetting}
                                        settingName="currentArrows.enabled"/>
                        <MenubarEnabler settings={settings} setSetting={setSetting}
                                        settingName="currentParticles.enabled"/>
                        <MenubarEnabler settings={settings} setSetting={setSetting}
                                        settingName="oceanTemperatureColors.enabled"/>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Wind</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarLabel>Wind Barbs</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["windBarbs.count"]}
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>

                            <Slider style={{width: '120px'}} min={10} value={[settings["windBarbs.count"]]} max={40}
                                    step={5} onValueChange={([v]) => setSetting("windBarbs.count", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarLabel>Wind Colors</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["windColors.count"]}
                        </MenubarLabel>

                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider
                                style={{width: '120px',}}
                                min={MIN_GRID_RESOLUTION}
                                value={[settings["windColors.count"]]}
                                max={MAX_GRID_RESOLUTION}
                                step={5}
                                onValueChange={([v]) => setSetting("windColors.count", v)}></Slider>
                        </MenubarItem>
                        {settings["windColors.count"] >= WARN_GRID_RESOLUTION &&
                            <MenubarLabel style={{
                                fontWeight: 600,
                                color: resolvedTheme === 'dark' ? 'red' : 'darkred',
                                fontSize: 8
                            }}>
                                Values over {WARN_GRID_RESOLUTION} may impact performance!
                            </MenubarLabel>}
                        <MenubarLabel inset>
                            Opacity: {round(100 * settings["windColors.opacity"])}%
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider style={{width: '120px'}} min={0} value={[settings["windColors.opacity"]]} max={1}
                                    step={0.05} onValueChange={([v]) => setSetting("windColors.opacity", v)}></Slider>
                        </MenubarItem>
                        <MenubarCheckboxItem checked={settings.displayWindScale}
                                             onSelect={() => setSetting('displayWindScale', !settings.displayWindScale)}>Show
                            Color Scale</MenubarCheckboxItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Ocean</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarLabel>Current Arrows</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["currentArrows.count"]}
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>

                            <Slider style={{width: '120px'}} min={10} value={[settings["currentArrows.count"]]} max={70}
                                    step={5} onValueChange={([v]) => setSetting("currentArrows.count", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarLabel>Ocean Temperature Colors</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["oceanTemperatureColors.count"]}
                        </MenubarLabel>

                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider
                                style={{width: '120px',}}
                                min={MIN_GRID_RESOLUTION}
                                value={[settings["oceanTemperatureColors.count"]]}
                                max={MAX_GRID_RESOLUTION}
                                step={5}
                                onValueChange={([v]) => setSetting("oceanTemperatureColors.count", v)}></Slider>
                        </MenubarItem>
                        {settings["oceanTemperatureColors.count"] >= WARN_GRID_RESOLUTION &&
                            <MenubarLabel style={{
                                fontWeight: 600,
                                color: resolvedTheme === 'dark' ? 'red' : 'darkred',
                                fontSize: 8
                            }}>
                                Values over {WARN_GRID_RESOLUTION} may impact performance!
                            </MenubarLabel>}
                        <MenubarLabel inset>
                            Opacity: {round(100 * settings["oceanTemperatureColors.opacity"])}%
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider style={{width: '120px'}} min={0}
                                    value={[settings["oceanTemperatureColors.opacity"]]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={([v]) => setSetting("oceanTemperatureColors.opacity", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Temperature</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarLabel>Temperature Colors</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["temperatureColors.count"]}
                        </MenubarLabel>

                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider
                                style={{width: '120px',}}
                                min={MIN_GRID_RESOLUTION}
                                value={[settings["temperatureColors.count"]]}
                                max={MAX_GRID_RESOLUTION}
                                step={5}
                                onValueChange={([v]) => setSetting("temperatureColors.count", v)}></Slider>
                        </MenubarItem>
                        {settings["temperatureColors.count"] >= WARN_GRID_RESOLUTION &&
                            <MenubarLabel style={{
                                fontWeight: 600,
                                color: resolvedTheme === 'dark' ? 'red' : 'darkred',
                                fontSize: 8
                            }}>
                                Values over {WARN_GRID_RESOLUTION} may impact performance!
                            </MenubarLabel>}
                        <MenubarLabel inset>
                            Opacity: {round(100 * settings["temperatureColors.opacity"])}%
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider style={{width: '120px'}} min={0} value={[settings["temperatureColors.opacity"]]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={([v]) => setSetting("temperatureColors.opacity", v)}></Slider>
                        </MenubarItem>
                        <MenubarGroup>
                            <MenubarCheckboxItem checked={settings.displayTempScale}
                                                 onSelect={() => setSetting('displayTempScale', !settings.displayTempScale)}>Show
                                Color Scale</MenubarCheckboxItem>
                        </MenubarGroup>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Graphs</MenubarTrigger>
                <MenubarContent className="w-44">
                    <MenubarCheckboxItem checked={settings.displayDataPickerPoints}
                                         onSelect={() => setSetting('displayDataPickerPoints', !settings.displayDataPickerPoints)}>Graph
                        Data at Point</MenubarCheckboxItem>
                    <MenubarCheckboxItem checked={!settings.forceGraphsToZero}
                                         onSelect={() => setSetting('forceGraphsToZero', !settings.forceGraphsToZero)}>Allow
                        Non-Zero Y Axis</MenubarCheckboxItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent className="w-44">
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.displayDataArea}
                                             onSelect={() => setSetting('displayDataArea', !settings.displayDataArea)}>Demarcate
                            Data Bounds</MenubarCheckboxItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.showDataOnMouseOver}
                                             onSelect={() => setSetting('showDataOnMouseOver', !settings.showDataOnMouseOver)}>Show
                            Data on Mouseover</MenubarCheckboxItem>
                        <MenubarCheckboxItem checked={settings.interpolateDataMouseOver}
                                             onSelect={() => setSetting('interpolateDataMouseOver', !settings.interpolateDataMouseOver)}>Interpolate
                            Mouseover Data</MenubarCheckboxItem>

                    </MenubarGroup>
                    <MenubarGroup className="w-80">
                        <MenubarSub>
                            <MenubarSubTrigger inset className="w-40">Dark Mode</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarGroup>
                                    <MenubarCheckboxItem checked={theme === 'system'}
                                                         onSelect={() => setTheme('system')}>System</MenubarCheckboxItem>
                                    <MenubarCheckboxItem checked={theme === 'light'}
                                                         onSelect={() => setTheme('light')}>Light</MenubarCheckboxItem>
                                    <MenubarCheckboxItem checked={theme === 'dark'}
                                                         onSelect={() => setTheme('dark')}>Dark</MenubarCheckboxItem>
                                </MenubarGroup>
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}