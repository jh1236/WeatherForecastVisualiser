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
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger
} from "./menubar";
import {useSettings} from "@/components/settings";
import Image from "next/image";
import {Slider} from "@/components/ui/slider";

export function WeatherMenubar() {
    const {settings, setSetting} = useSettings()
    return (
        <Menubar style={{width: '100%'}}>
            <MenubarLabel><Image src="/icon.png" alt="Website logo" width={20} height={20}/></MenubarLabel>
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarLabel>Select Data Source</MenubarLabel>
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.dataSource === 'netCDF'}
                                             onClick={() => setSetting("dataSource", "netCDF")}>
                            netCDF
                        </MenubarCheckboxItem>
                        <MenubarCheckboxItem checked={settings.dataSource === 'grib'}
                                             onClick={() => setSetting("dataSource", "grib")}>
                            GRIB File Upload
                        </MenubarCheckboxItem>
                        <MenubarItem disabled>New Incognito Window</MenubarItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarSub>
                            <MenubarSubTrigger>Share</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarGroup>
                                    <MenubarItem>Email link</MenubarItem>
                                    <MenubarItem>Messages</MenubarItem>
                                    <MenubarItem>Notes</MenubarItem>
                                </MenubarGroup>
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem>
                            Print... <MenubarShortcut>⌘P</MenubarShortcut>
                        </MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarGroup>
                        <MenubarItem>
                            Set Wind Barb Resolution
                        </MenubarItem>
                        <MenubarLabel>{settings["windBarbs.count"]}</MenubarLabel>
                        <MenubarItem>
                            <Slider style={{width: '160px'}} min={10} value={[settings["windBarbs.count"]]} max={40} step={5} onValueChange={([v]) => setSetting("windBarbs.count", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarGroup>
                        <MenubarItem>
                            Set Wind Color Resolution
                        </MenubarItem>
                        <MenubarLabel>{settings["windColors.count"]}</MenubarLabel>
                        <MenubarItem>
                            <Slider style={{width: '160px'}} min={20} value={[settings["windColors.count"]]} max={70} step={5} onValueChange={([v]) => setSetting("windColors.count", v)}></Slider>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarSub>
                            <MenubarSubTrigger>Find</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarGroup>
                                    <MenubarItem>Search the web</MenubarItem>
                                </MenubarGroup>
                                <MenubarSeparator/>
                                <MenubarGroup>
                                    <MenubarItem>Find...</MenubarItem>
                                    <MenubarItem>Find Next</MenubarItem>
                                    <MenubarItem>Find Previous</MenubarItem>
                                </MenubarGroup>
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem>Cut</MenubarItem>
                        <MenubarItem>Copy</MenubarItem>
                        <MenubarItem>Paste</MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent className="w-44">
                    <MenubarGroup>
                        <MenubarCheckboxItem checked={settings.displayColorScale}
                                             onClick={() => setSetting('displayColorScale', !settings.displayColorScale)}>Wind
                            Color Scale</MenubarCheckboxItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem inset>
                            Reload <MenubarShortcut>⌘R</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem disabled inset>
                            Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
                        </MenubarItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem inset>Toggle Fullscreen</MenubarItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem inset>Hide Sidebar</MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>Profiles</MenubarTrigger>
                <MenubarContent>
                    <MenubarRadioGroup value="benoit">
                        <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                        <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                        <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem inset>Edit...</MenubarItem>
                    </MenubarGroup>
                    <MenubarSeparator/>
                    <MenubarGroup>
                        <MenubarItem inset>Add Profile...</MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}