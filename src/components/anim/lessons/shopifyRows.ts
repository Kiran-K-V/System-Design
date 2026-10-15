/** The post's arithmetic: units per location times locations, capped at 1,000 rows per item/location pair. */
export const CAP = 1000;
export const uncappedRows = (unitsPerLocation: number, locations: number) => unitsPerLocation * locations;
export const cappedRows = (unitsPerLocation: number, locations: number) => Math.min(unitsPerLocation, CAP) * locations;
