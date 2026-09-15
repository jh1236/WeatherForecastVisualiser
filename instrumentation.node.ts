import {CronJob} from 'cron';
import {getWeatherDataFromThredds, inCache} from "@/components/dataManagement/ThreddsDataToWeatherData";

const AMOUNT_OF_DAYS_IN_FUTURE = 5;

const MINUTE_IN_MS = 1000 * 60;
const HOUR_IN_MS = MINUTE_IN_MS * 60;
const DAY_IN_MS = HOUR_IN_MS * 24;

async function loadThreddsDataForDate(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1);
    const day = date.getDate();
    for (const region of ['perth', 'greaterPerth'] as const) {
        if (!await inCache(date, region, false)) {
            console.log(`fetching data for ${date}.`)
            //if the data is not in the cache, fetch it and wait for 5 minutes (to save overloading the server)
            await getWeatherDataFromThredds(year, month, day, region);
            await new Promise((r) => setTimeout(r, 5 * MINUTE_IN_MS));
        } else {
            console.log(`data for ${date} is in cache; skipping...`)
        }
    }

}

async function getDataForComingTimeframe() {
    for (let i = 0; i <= AMOUNT_OF_DAYS_IN_FUTURE; i++) {
        const date = new Date(Date.now() + i * DAY_IN_MS);
        await loadThreddsDataForDate(date);
    }
}

export async function register() {
    if (process.env.NODE_ENV === 'development') {
        // don't run prefetching on dev
        return
    }
    getDataForComingTimeframe();

    CronJob.from({
            cronTime: '0 12 * * * *', // cronTime
            onTick: () => {
                console.log('Downloading data!');
                getDataForComingTimeframe().then(() => console.log('Finished Downloading!'))
            },
            start: true,
            timeZone: 'Australia/Perth'
        }
    );
}