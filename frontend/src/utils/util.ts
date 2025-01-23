import {FilterQuery} from "../api/apiTypes.ts";

/**
 * Generates an array of timestamps based on the duration of each data element.
 * @param data - Array of data elements with a `duration` field.
 * @param start - The starting date.
 * @returns An array of timestamps.
 */
export function getDurationTimestamps<T extends { duration: number }>(data: T[], start: Date): number[] {
    const timestamps: number[] = [];
    for (let i = 0; i < data.length; i++) {
        timestamps.push(
            (data[i].duration + (i === 0 ? start.getMilliseconds() : timestamps[i - 1])) % 1000
        );
    }
    return timestamps;
}


/**
 * Constructs a URL with query parameters based on the provided filter properties.
 * @param url - The base URL to which query parameters will be appended.
 * @param props - An object containing key-value pairs of query parameters.
 * @returns The full URL with appended query parameters as a string.
 */
export function constructUrl(url: string, props: FilterQuery): string {
    const newUrl = new URL(url);

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(props)) {
        if (value) {
            params.set(key, value.toString());
        }
    }

    return newUrl + '?' + params.toString();
}