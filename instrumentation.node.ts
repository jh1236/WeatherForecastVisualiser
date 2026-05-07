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
    for (let i = 0; i < AMOUNT_OF_DAYS_IN_FUTURE; i++) {
        const date = new Date(Date.now() + i * DAY_IN_MS);
        console.log(`Getting Data for ${date.toDateString()}`)
        await loadThreddsDataForDate(date);
    }
}

export function register() {
    getDataForComingTimeframe();

    CronJob.from({
            cronTime: '13 16 * * * *', // cronTime
            onTick: getDataForComingTimeframe,
            start: true,
            utcOffset: 8 * 60
        }
    );
}