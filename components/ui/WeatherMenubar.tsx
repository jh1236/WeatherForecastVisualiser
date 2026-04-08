import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarLabel,
    MenubarMenu, MenubarRadioGroup, MenubarRadioItem,
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

export function WeatherMenubar({resetData}: WeatherMenubarProps) {
    const {settings, setSetting} = useSettings()
    const {theme, setTheme} = useTheme()
    return (
        <Menubar style={{width: '100%'}}>
            <MenubarLabel style={{width: '50px'}}><Image src="/icon.png" alt="Website logo" width={20}
                                                         height={20}/></MenubarLabel>
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarLabel>Select Data Source</MenubarLabel>
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.dataSource === 'netCDF'}
                                             onSelect={() => {
                                                 resetData()
                                                 setSetting("dataSource", "netCDF")
                                             }}>
                            From THREDDS Server
                        </MenubarCheckboxItem>
                        <MenubarCheckboxItem checked={settings.dataSource === 'grib'}
                                             onSelect={() => {
                                                 resetData()
                                                 setSetting("dataSource", "grib")
                                             }}>
                            GRIB File Upload
                        </MenubarCheckboxItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarLabel>Thredds Settings</MenubarLabel>
                        <MenubarRadioGroup value={settings.region}
                                           onValueChange={value => {
                                               resetData()
                                               setSetting('region', (value as Settings['region']))
                                           }}>
                            <MenubarRadioItem
                                disabled={settings.dataSource === 'grib'}
                                value="perth"
                            >Perth</MenubarRadioItem>
                            <MenubarRadioItem
                                disabled={settings.dataSource === 'grib'}
                                value="greaterPerth"
                            >Greater Perth Region</MenubarRadioItem>
                            <MenubarRadioItem
                                disabled={settings.dataSource === 'grib'}
                                value="greatBarrierReef"
                            >Great Barrier Reef</MenubarRadioItem>
                        </MenubarRadioGroup>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarLabel>Units</MenubarLabel>
                        <MenubarSub>
                            <MenubarSubTrigger inset>
                                Wind speed
                            </MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarRadioGroup value={settings.speedUnit}
                                                   onValueChange={value => {
                                                       setSetting('speedUnit', (value as Settings['speedUnit']))
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
                                </MenubarRadioGroup>
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarGroup>
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
                                min={20}
                                value={[settings["windColors.count"]]}
                                max={60}
                                step={5}
                                onValueChange={([v]) => setSetting("windColors.count", v)}></Slider>
                        </MenubarItem>
                        {settings["windColors.count"] > 40 &&
                            <MenubarLabel style={{fontWeight: 600, color: 'darkred', fontSize: 8}}>
                                Values over 40 may impact performance!
                            </MenubarLabel>}
                        <MenubarLabel inset>
                            Opacity: {round(100 * settings["windColors.opacity"])}%
                        </MenubarLabel>
                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider style={{width: '120px'}} min={0} value={[settings["windColors.opacity"]]} max={1}
                                    step={0.05} onValueChange={([v]) => setSetting("windColors.opacity", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarLabel>Temperature Colors</MenubarLabel>
                        <MenubarLabel inset>
                            Resolution: {settings["temperatureColors.count"]}
                        </MenubarLabel>

                        <MenubarItem inset onSelect={e => e.preventDefault()}>
                            <Slider
                                style={{width: '120px',}}
                                min={20}
                                value={[settings["temperatureColors.count"]]}
                                max={60}
                                step={5}
                                onValueChange={([v]) => setSetting("temperatureColors.count", v)}></Slider>
                        </MenubarItem>
                        {settings["temperatureColors.count"] > 40 &&
                            <MenubarLabel style={{fontWeight: 600, color: 'darkred', fontSize: 8}}>
                                Values over 40 may impact performance!
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
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent className="w-44">
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.displayWindScale}
                                             onSelect={() => setSetting('displayWindScale', !settings.displayWindScale)}>Wind
                            Color Scale</MenubarCheckboxItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.displayTempScale}
                                             onSelect={() => setSetting('displayTempScale', !settings.displayTempScale)}>Temp
                            Color Scale</MenubarCheckboxItem>
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