// `timestamp(6)` columns come back from the database as text with no time zone, e.g. "2026-10-02 03:35:35.06348".
// The app writes them with toISOString(), which is UTC, and Postgres drops the "Z" when it stores them. So read them
// back as UTC: a plain `new Date(value)` would treat them as the server's local time and be hours off.
export const parseUtcTimestamp = (value: string): Date => new Date(`${value.replace(" ", "T")}Z`);
