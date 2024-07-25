import { parse, parseISO } from "date-fns";
import { mapFormatString } from "./formatting-utils";

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

export default (
    input?: string | number,
    formatOrFormats?: string | string[]
): BigInt => {
    let epochMilliseconds = Date.now();
    if (typeof input === 'number') {
        epochMilliseconds = input;
    } else if (typeof input === 'string') {
        const formatArray: string[] | undefined = typeof formatOrFormats === 'string' ? [formatOrFormats] : formatOrFormats
        if (!formatArray || formatArray.length === 0) {
            epochMilliseconds = parseISO(input).getTime();
        } else {
            let date = new Date(Number.NaN);
            for (let format of formatArray) {
                date = parse(input, mapFormatString(format), new Date());
                if (isValidDate(date)) {
                    break;
                }
            }
            epochMilliseconds = date.getTime();
        }
    }
    return BigInt(epochMilliseconds * 1e6)
} 