import { type Temporal } from "@js-temporal/polyfill";

const InvalidTimeZone: Temporal.TimeZoneProtocol = {
  id: "",
  getOffsetNanosecondsFor: () => Number.NaN,
  getPossibleInstantsFor: () => [],
};

const InvalidCalendar: Temporal.CalendarProtocol = {
  id: "",
  year: () => Number.NaN,
  month: () => Number.NaN,
  monthCode: () => "",
  day: () => Number.NaN,
  era: () => "",
  eraYear: () => Number.NaN,
  dayOfWeek: () => Number.NaN,
  dayOfYear: () => Number.NaN,
  daysInMonth: () => Number.NaN,
  daysInWeek: () => Number.NaN,
  daysInYear: () => Number.NaN,
  weekOfYear: () => Number.NaN,
  yearOfWeek: () => Number.NaN,
  monthsInYear: () => Number.NaN,
  inLeapYear: () => false,
  yearMonthFromFields: () => null as any,
  dateFromFields: () => null as any,
  monthDayFromFields: () => null as any,
  dateAdd: () => null as any,
  dateUntil: () => null as any,
  fields: () => [],
  mergeFields: () => ({}),
};

const InvalidDuration: Temporal.Duration = {
  sign: 0,
  blank: true,
  years: Number.NaN,
  months: Number.NaN,
  weeks: Number.NaN,
  days: Number.NaN,
  hours: Number.NaN,
  minutes: Number.NaN,
  seconds: Number.NaN,
  milliseconds: Number.NaN,
  microseconds: Number.NaN,
  nanoseconds: Number.NaN,
  negated: () => InvalidDuration,
  abs: () => InvalidDuration,
  add: () => InvalidDuration,
  with: () => InvalidDuration,
  subtract: () => InvalidDuration,
  round: () => InvalidDuration,
  total: () => Number.NaN,
  toJSON: () => "Invalid duration",
  [Symbol.toStringTag]: "Temporal.Duration",
  valueOf: undefined as never,
};

const InvalidInstant: Temporal.Instant = {
  epochSeconds: Number.NaN,
  epochMilliseconds: Number.NaN,
  epochMicroseconds: BigInt(0),
  epochNanoseconds: BigInt(0),
  equals: () => false,
  add: () => InvalidInstant,
  subtract: () => InvalidInstant,
  round: () => InvalidInstant,
  until: () => InvalidDuration,
  since: () => InvalidDuration,
  toJSON: () => "Invalid date",
  toZonedDateTime: () => InvalidZonedDateTime,
  toZonedDateTimeISO: () => InvalidZonedDateTime,
  [Symbol.toStringTag]: "Temporal.Instant",
  valueOf: undefined as never,
};

const InvalidIsoFields: Temporal.ZonedDateTimeISOFields = {
  isoYear: Number.NaN,
  isoMonth: Number.NaN,
  isoDay: Number.NaN,
  isoHour: Number.NaN,
  isoMinute: Number.NaN,
  isoSecond: Number.NaN,
  isoMillisecond: Number.NaN,
  isoMicrosecond: Number.NaN,
  isoNanosecond: Number.NaN,
  offset: "",
  timeZone: "",
  calendar: "",
};

const InvalidDateTimeFactory = <T extends string>(toStringTag: T) => ({
  era: "",
  eraYear: Number.NaN,
  year: Number.NaN,
  month: Number.NaN,
  monthCode: "",
  day: Number.NaN,
  hour: Number.NaN,
  minute: Number.NaN,
  second: Number.NaN,
  millisecond: Number.NaN,
  microsecond: Number.NaN,
  nanosecond: Number.NaN,
  timeZoneId: "",
  calendarId: "",
  dayOfWeek: Number.NaN,
  dayOfYear: Number.NaN,
  daysInMonth: Number.NaN,
  daysInWeek: Number.NaN,
  daysInYear: Number.NaN,
  weekOfYear: Number.NaN,
  monthsInYear: Number.NaN,
  yearOfWeek: Number.NaN,
  hoursInDay: Number.NaN,
  inLeapYear: false,
  offset: "",
  offsetNanoseconds: Number.NaN,
  epochSeconds: Number.NaN,
  epochMilliseconds: Number.NaN,
  epochMicroseconds: BigInt(0),
  epochNanoseconds: BigInt(0),
  equals: () => false,
  getTimeZone: () => InvalidTimeZone,
  getCalendar: () => InvalidCalendar,
  toJSON: () => "Invalid date",
  toInstant: () => InvalidInstant,
  until: () => InvalidDuration,
  since: () => InvalidDuration,
  getISOFields: () => InvalidIsoFields,
  toZonedDateTime: () => InvalidZonedDateTime,
  toPlainDate: () => InvalidPlainDate,
  toPlainMonthDay: () => InvalidPlainMonthDay,
  toPlainTime: () => InvalidPlainTime,
  toPlainYearMonth: () => InvalidYearMonth,
  toPlainDateTime: () => InvalidPlainDateTime,
  valueOf: undefined as never,
  [Symbol.toStringTag]: toStringTag,
});

const InvalidPlainDateTime: Temporal.PlainDateTime = {
  ...InvalidDateTimeFactory("Temporal.PlainDateTime"),
  with: () => InvalidPlainDateTime,
  withPlainDate: () => InvalidPlainDateTime,
  withCalendar: () => InvalidPlainDateTime,
  withPlainTime: () => InvalidPlainDateTime,
  add: () => InvalidPlainDateTime,
  subtract: () => InvalidPlainDateTime,
  round: () => InvalidPlainDateTime,
};

const InvalidPlainDate: Temporal.PlainDate = {
  ...InvalidDateTimeFactory("Temporal.PlainDate"),
  with: () => InvalidPlainDate,
  withCalendar: () => InvalidPlainDate,
  add: () => InvalidPlainDate,
  subtract: () => InvalidPlainDate,
};

const InvalidPlainMonthDay: Temporal.PlainMonthDay = {
  ...InvalidDateTimeFactory("Temporal.PlainMonthDay"),
  with: () => InvalidPlainMonthDay,
};

const InvalidPlainTime: Temporal.PlainTime = {
  ...InvalidDateTimeFactory("Temporal.PlainTime"),
  with: () => InvalidPlainTime,
  add: () => InvalidPlainTime,
  subtract: () => InvalidPlainTime,
  round: () => InvalidPlainTime,
};

const InvalidYearMonth: Temporal.PlainYearMonth = {
  ...InvalidDateTimeFactory("Temporal.PlainYearMonth"),
  with: () => InvalidYearMonth,
  add: () => InvalidYearMonth,
  subtract: () => InvalidYearMonth,
};

const InvalidZonedDateTime: Temporal.ZonedDateTime = {
  ...InvalidDateTimeFactory("Temporal.ZonedDateTime"),
  with: () => InvalidZonedDateTime,
  withPlainDate: () => InvalidZonedDateTime,
  withCalendar: () => InvalidZonedDateTime,
  withPlainTime: () => InvalidZonedDateTime,
  withTimeZone: () => InvalidZonedDateTime,
  add: () => InvalidZonedDateTime,
  subtract: () => InvalidZonedDateTime,
  round: () => InvalidZonedDateTime,
  startOfDay: () => InvalidZonedDateTime,
};

export default InvalidZonedDateTime;
