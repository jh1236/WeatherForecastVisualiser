import {CronJob} from 'cron';
import {getWeatherDataFromThredds} from "@/components/dataManagement/ThreddsDataToWeatherData";

const AMOUNT_OF_DAYS_IN_FUTURE = 6;

const DAY_IN_MS = 1000 * 60 * 60 * 24;

async function loadThreddsDataForDate(now: Date) {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1);
    const day = now.getDate();
    for (const region of ['perth', 'greaterPerth'] as const) {
        await getWeatherDataFromThredds(year, month, day, region);
    }

}

async function getDataForComingTimeframe() {
    const tasks = []
    for (let i = 0; i <= AMOUNT_OF_DAYS_IN_FUTURE; i++) {
        const date = new Date(Date.now() + i * DAY_IN_MS);
        tasks.push(loadThreddsDataForDate(date));
    }
    await Promise.all(tasks);
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