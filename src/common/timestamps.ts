// These columns come back as UTC text with no zone; new Date(value) would read them as local time.
export const parseUtcTimestamp = (value: string): Date => new Date(`${value.replace(" ", "T")}Z`);
