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
