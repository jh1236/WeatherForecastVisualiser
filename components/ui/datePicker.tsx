import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {CalendarIcon} from "lucide-react";
import {Calendar} from "@/components/ui/calendar";
import {format} from "date-fns"

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date) => void;
}

export function DatePicker({date, setDate}: DatePickerProps) {

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!date}
                    className="w-[180px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                >
                    <CalendarIcon/>
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-1000">
                <Calendar required mode="single" selected={date} onSelect={setDate}/>
            </PopoverContent>
        </Popover>
    )
}