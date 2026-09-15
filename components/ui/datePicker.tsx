import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {CalendarIcon} from "lucide-react";
import {Calendar} from "@/components/ui/calendar";
import {format} from "date-fns"
import {useEffect, useState} from "react";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date) => void;
    shouldDisableDate?: (date: Date) => boolean;
    endDate?: Date;
    startDate?: Date;
}

export function DatePicker({date, setDate, shouldDisableDate, endDate, startDate}: DatePickerProps) {


    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!date}
                    className="w-[200px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                >
                    <CalendarIcon/>
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-1000">
                <Calendar
                    endMonth={endDate}
                    startMonth={startDate}
                    captionLayout="dropdown"
                    required
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    shouldDisable={
                        shouldDisableDate ? (day) => shouldDisableDate(day.date) : undefined
                    }
                />
            </PopoverContent>
        </Popover>
    )
}