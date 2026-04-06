'use client';

import "leaflet/dist/leaflet.css";
import {SettingsProvider} from "@/components/settings";
import {HomePage} from "@/components/HomePage";


export default function Home() {
    return (
        <SettingsProvider>
            <HomePage/>
        </SettingsProvider>
    );
}
