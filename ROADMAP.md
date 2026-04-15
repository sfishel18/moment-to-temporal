# moment-to-temporal Coverage Roadmap

This document tracks the full Moment.js API surface, what this codemod currently supports, and a prioritized plan for adding coverage. Each item is a discrete, checkable task.

---

## Current Coverage

The codemod today handles the following Moment.js methods:

| Category   | Method                                      | Temporal Equivalent                                                         | Notes                                          |
| ---------- | ------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| Parse      | `moment()`                                  | `Temporal.Now.zonedDateTimeISO()`                                           |                                                |
| Parse      | `moment(string)`                            | `new Temporal.ZonedDateTime(toEpochNanos(s), Temporal.Now.timeZoneId())`    |                                                |
| Parse      | `moment(string, format)`                    | `new Temporal.ZonedDateTime(toEpochNanos(s,f), Temporal.Now.timeZoneId())`  |                                                |
| Parse      | `moment(string, [formats])`                 | `new Temporal.ZonedDateTime(toEpochNanos(s,fs), Temporal.Now.timeZoneId())` |                                                |
| Parse      | `moment(number)`                            | `new Temporal.ZonedDateTime(toEpochNanos(n), Temporal.Now.timeZoneId())`    | Epoch milliseconds                             |
| Manipulate | `.add(amount, unit)` / `.add({})`           | `.add({ [unit]: amount })`                                                  |                                                |
| Manipulate | `.subtract(amount, unit)` / `.subtract({})` | `.subtract({ [unit]: amount })`                                             |                                                |
| Manipulate | `.startOf(unit)`                            | `.round({ smallestUnit, roundingMode: 'floor' })`                           | Only `second`–`day`; not `week`/`month`/`year` |
| Manipulate | `.endOf(unit)`                              | `.round({ smallestUnit, roundingMode: 'ceil' }).subtract({ ms: 1 })`        | Only `second`–`day`; not `week`/`month`/`year` |
| Display    | `.toDate()`                                 | `toLegacyDate(zdt)` (runtime helper)                                        | `isBreaking: true`                             |
| Display    | `.toISOString()`                            | `.toInstant().round(...).toString().replace(...)`                           | `isBreaking: true`                             |
| Display    | `.format(formatString)`                     | `toFormattedString(zdt, fmt)` (runtime helper)                              | `isBreaking: true`                             |

### Known Limitations in Current Coverage

- `startOf` / `endOf` fail for `week`, `month`, `year` (Temporal `.round()` does not support calendar units)
- `quarter` and `isoWeek` units are not recognized anywhere
- `moment()` with 3+ arguments is not supported
- Only chains containing at least one `isBreaking: true` method are transformed

---

## Phase 1 — High-Value Display & Output Methods

**Priority:** P0 — most frequently used after what is already covered  
**Theme:** Methods that produce a primitive value from a Moment chain. All are `isBreaking: true` and belong in `src/transformations/display.ts`.

- [ ] **`.valueOf()`** → `.epochMilliseconds`
  - Effort: S
  - `isBreaking: true` — returns a number
  - Moment's `.valueOf()` returns epoch milliseconds; `ZonedDateTime.epochMilliseconds` is a direct equivalent
  - Also handles implicit numeric coercion (`+moment()`)

- [ ] **`.unix()`** → `Math.floor(zdt.epochMilliseconds / 1000)`
  - Effort: S
  - `isBreaking: true` — returns epoch seconds as a number
  - Can be emitted as an inline expression; no runtime helper needed

- [ ] **`.toString()`** → `.toString()`
  - Effort: S
  - `isBreaking: true` — returns a string
  - Moment's `.toString()` produces an RFC 2822-ish string; Temporal's produces RFC 9557 (ISO 8601 with annotations). Accept the format difference and emit `.toString()` directly, or add a runtime helper for strict parity.

- [ ] **`.toJSON()`** → `.toInstant().toString()`
  - Effort: S
  - `isBreaking: true` — returns a UTC ISO 8601 string (same output as `.toISOString()`)
  - Reuse the existing `toISOString` processor logic

- [ ] **`.clone()`** → identity pass-through
  - Effort: S
  - `isBreaking: false` — returns a Temporal object
  - Temporal objects are immutable, so `.clone()` is semantically a no-op; the processor returns the preceding expression unchanged

- [ ] **`.diff(other, unit?, float?)`** → `zdt.since(other).total({ unit })`
  - Effort: M
  - `isBreaking: true` — returns a number
  - Handle: no-unit default (milliseconds), unit conversion map, optional float truncation (default is floor)
  - The `other` argument may itself be a `moment()` expression — use a runtime helper that accepts either a Temporal `ZonedDateTime` or a legacy `Date`/number so the `other` side does not need to be transformed in lockstep

---

## Phase 2 — Query & Comparison Methods

**Priority:** P0 — very common in application conditionals  
**Theme:** Boolean-returning methods. All are `isBreaking: true` and belong in `src/transformations/display.ts` (or a new `src/transformations/query.ts`).

The `other` argument in each of these may be a `moment()` expression. As with `.diff()`, a runtime helper approach is recommended: accept either a `ZonedDateTime` or a legacy value.

- [ ] **`.isBefore(other, unit?)`** → `Temporal.ZonedDateTime.compare(zdt, other) < 0`
  - Effort: M
  - When `unit` is provided, both sides must be truncated to that unit before comparing
  - Add runtime helper: `isBefore(zdt, other, unit?)`

- [ ] **`.isAfter(other, unit?)`** → `Temporal.ZonedDateTime.compare(zdt, other) > 0`
  - Effort: M
  - Same unit-truncation logic as `isBefore`

- [ ] **`.isSame(other, unit?)`** → `Temporal.ZonedDateTime.compare(zdt, other) === 0`
  - Effort: M
  - Same unit-truncation logic as `isBefore`

- [ ] **`.isSameOrBefore(other, unit?)`** → `Temporal.ZonedDateTime.compare(zdt, other) <= 0`
  - Effort: M
  - Compound of `isSame` + `isBefore`; share runtime helper

- [ ] **`.isSameOrAfter(other, unit?)`** → `Temporal.ZonedDateTime.compare(zdt, other) >= 0`
  - Effort: M
  - Compound of `isSame` + `isAfter`; share runtime helper

- [ ] **`.isBetween(start, end, unit?, inclusivity?)`** → range comparison
  - Effort: L
  - Inclusivity string can be `'()'`, `'[]'`, `'[)'`, `'(]'` — needs dedicated runtime helper
  - Add runtime helper: `isBetween(zdt, start, end, unit?, inclusivity?)`

- [ ] **`.isValid()`** → check against `InvalidZonedDateTime` sentinel
  - Effort: S
  - `isBreaking: true` — returns a boolean
  - The runtime already ships `InvalidZonedDateTime`; emit a runtime helper or inline `instanceof` check

---

## Phase 3 — Getter & Setter Accessors

**Priority:** P1 — common but more varied usage  
**Theme:** Moment methods that act as getters (no args) or setters (one arg). A single chain processor per method handles both modes by inspecting `path.value.arguments.length`.

### Unit Getters (`isBreaking: true` — return a number)

- [ ] **`.year()`** → `.year`
  - Effort: S

- [ ] **`.month()`** → `.month - 1`
  - Effort: S
  - Moment months are 0-indexed; Temporal months are 1-indexed — emit `zdt.month - 1`

- [ ] **`.date()`** → `.day`
  - Effort: S

- [ ] **`.day()`** → `zdt.dayOfWeek % 7`
  - Effort: S
  - Moment: 0=Sunday–6=Saturday; Temporal: 1=Monday–7=Sunday — apply modulo conversion

- [ ] **`.hour()`** → `.hour`
  - Effort: S

- [ ] **`.minute()`** → `.minute`
  - Effort: S

- [ ] **`.second()`** → `.second`
  - Effort: S

- [ ] **`.millisecond()`** → `.millisecond`
  - Effort: S

- [ ] **`.dayOfYear()`** → `.dayOfYear`
  - Effort: S

- [ ] **`.isoWeekday()`** → `.dayOfWeek`
  - Effort: S
  - Both use 1=Monday–7=Sunday; direct map

- [ ] **`.isoWeek()`** → `.weekOfYear`
  - Effort: S

- [ ] **`.week()`** → `.weekOfYear`
  - Effort: S
  - For ISO 8601 calendar these are the same; locale-aware weeks would require additional runtime logic

- [ ] **`.weekday()`** → locale-aware day-of-week index
  - Effort: M
  - Locale-dependent; may need `Intl.Locale.prototype.getWeekInfo()` to determine the first day of the week

- [ ] **`.daysInMonth()`** → `.daysInMonth`
  - Effort: S

- [ ] **`.isLeapYear()`** → `.inLeapYear`
  - Effort: S

- [ ] **`.quarter()`** → `Math.ceil(zdt.month / 3)`
  - Effort: S

### Unit Setters (`isBreaking: false` — return a Temporal object)

- [ ] **`.year(n)`** → `.with({ year: n })`
  - Effort: S

- [ ] **`.month(n)`** → `.with({ month: n + 1 })`
  - Effort: S
  - Moment is 0-indexed; add 1 for Temporal

- [ ] **`.date(n)`** → `.with({ day: n })`
  - Effort: S

- [ ] **`.hour(n)`** → `.with({ hour: n })`
  - Effort: S

- [ ] **`.minute(n)`** → `.with({ minute: n })`
  - Effort: S

- [ ] **`.second(n)`** → `.with({ second: n })`
  - Effort: S

- [ ] **`.millisecond(n)`** → `.with({ millisecond: n })`
  - Effort: S

### Generic Accessors

- [ ] **`.get(unit)`** → dispatch to the appropriate property
  - Effort: M
  - Add runtime helper: `getUnit(zdt, unit)` — maps Moment unit strings to the correct `ZonedDateTime` property, applying index conversions where needed

- [ ] **`.set(unit, value)` / `.set(object)`** → `.with(...)` with unit mapping
  - Effort: M
  - Add runtime helper: `setUnit(zdt, unit, value)` — maps Moment unit strings to `.with()` keys, applying index conversions where needed
  - Object form (`moment().set({ year: 2025, month: 0 })`) should be handled inline by converting each key

---

## Phase 4 — Extended Parsing & Timezone

**Priority:** P1 — important for codebases that use UTC or timezone-aware logic  
**Theme:** Additional `moment()` factory patterns and timezone mode methods.

### Additional Parse Patterns

Extensions to `processMomentFnCall` in `src/transformations/parse.ts`:

- [ ] **`moment(Date)`** → `date.toTemporalInstant().toZonedDateTimeISO(Temporal.Now.timeZoneId())`
  - Effort: M
  - Detect a `Date`-typed argument via AST heuristics (e.g., `new Date(...)`, identifier known to be a `Date`)
  - `Date.prototype.toTemporalInstant()` is the canonical bridge method

- [ ] **`moment(moment)`** → identity pass-through
  - Effort: S
  - Cloning a Moment; Temporal is immutable so this resolves to the same expression

- [ ] **`moment({year, month, day, ...})`** → `Temporal.ZonedDateTime.from({ timeZone: ..., year, month: month+1, day, ... })`
  - Effort: M
  - Must remap Moment's 0-indexed `month` to Temporal's 1-indexed `month`
  - Handle partial objects (omitted fields default to current date/time in Moment)

### Static Factory: `moment.unix()`

- [ ] **`moment.unix(seconds)`** → `Temporal.Instant.fromEpochMilliseconds(seconds * 1000).toZonedDateTimeISO(Temporal.Now.timeZoneId())`
  - Effort: M
  - `moment.unix()` is a static method call on the `moment` namespace, not a chain method — requires a separate visitor in `transform.ts` (alongside the existing `moment()` call visitor) that detects `moment.unix(...)` call expressions

### UTC Mode Factory: `moment.utc()`

- [ ] **`moment.utc()`** → `Temporal.Now.zonedDateTimeISO('UTC')`
  - Effort: L
  - Requires a new visitor to find `moment.utc(...)` member-expression calls
  - All downstream chain processors should work unchanged since they operate on the `ZonedDateTime` expression regardless of timezone

- [ ] **`moment.utc(string)` / `moment.utc(string, format)` / `moment.utc(number)`**
  - Effort: L
  - Same as the regular parse patterns but substitute `'UTC'` for `Temporal.Now.timeZoneId()`

### Timezone Switching (chain methods)

- [ ] **`.utc()`** → `.withTimeZone('UTC')`
  - Effort: M
  - `isBreaking: false` — returns a Temporal object
  - Add to `src/transformations/manipulate.ts`

- [ ] **`.local()`** → `.withTimeZone(Temporal.Now.timeZoneId())`
  - Effort: M
  - `isBreaking: false`
  - Add to `src/transformations/manipulate.ts`

- [ ] **`.utcOffset()`** (getter, no args) → `zdt.offsetNanoseconds / 6e10`
  - Effort: M
  - `isBreaking: true` — returns offset in minutes (matching Moment's return type)

- [ ] **`.utcOffset(value)`** (setter, one arg) → `.withTimeZone(offsetString)`
  - Effort: M
  - `isBreaking: false`
  - Needs to convert a numeric minute offset or `±HH:mm` string to a valid IANA offset identifier

### Fix `startOf` / `endOf` for Calendar Units

The current `.round()`-based implementation does not support `week`, `month`, or `year`. These require a different approach using `.with()` and `.startOfDay()`:

- [ ] **`startOf('month')`** → `zdt.with({ day: 1 }).startOfDay()`
  - Effort: M

- [ ] **`startOf('year')`** → `zdt.with({ month: 1, day: 1 }).startOfDay()`
  - Effort: M

- [ ] **`startOf('week')`** → subtract `(dayOfWeek - 1)` days then `.startOfDay()`
  - Effort: L
  - Locale-aware: Moment uses locale's first day of week. Default to ISO (Monday) and document the limitation.
  - Needs a runtime helper since the day offset is a runtime value

- [ ] **`endOf('month')`** → `zdt.with({ day: zdt.daysInMonth, hour: 23, minute: 59, second: 59, millisecond: 999 })`
  - Effort: M
  - `daysInMonth` is a runtime value — needs a runtime helper

- [ ] **`endOf('year')`** → `zdt.with({ month: 12, day: 31, hour: 23, minute: 59, second: 59, millisecond: 999 })`
  - Effort: M

- [ ] **`endOf('week')`** → advance to end-of-week day + set time to `23:59:59.999`
  - Effort: L
  - Same locale concerns as `startOf('week')`

### Quarter Unit Support

- [ ] **Add `quarter` / `Q` to the unit conversion map for `add` / `subtract`**
  - Effort: M
  - Convert to `{ months: n * 3 }`; no Temporal native quarter concept exists

- [ ] **`startOf('quarter')`** → `zdt.with({ month: (Math.ceil(zdt.month / 3) - 1) * 3 + 1, day: 1 }).startOfDay()`
  - Effort: M

- [ ] **`endOf('quarter')`** → compute last month of quarter, last day of that month
  - Effort: M
  - Needs a runtime helper since `daysInMonth` for the target month is a runtime value

---

## Phase 5 — Relative Time & Serialization

**Priority:** P2 — useful but typically UI-layer code  
**Theme:** Human-readable relative time strings and alternative serialization formats.

### Relative Time Display

These require runtime helpers. `Intl.RelativeTimeFormat` (available in all modern environments) is the recommended foundation. All are `isBreaking: true`.

- [ ] **`.fromNow(suffix?)`** → `relativeTimeFromNow(zdt)`
  - Effort: L
  - Returns a string like "2 hours ago" or "in 3 days"
  - Runtime helper: compute diff against `Temporal.Now.zonedDateTimeISO()`, pick the most appropriate unit, format with `Intl.RelativeTimeFormat`

- [ ] **`.from(other, suffix?)`** → `relativeTimeFrom(zdt, other)`
  - Effort: L
  - Same as `fromNow` but relative to `other` instead of now

- [ ] **`.toNow(suffix?)`** → `relativeTimeToNow(zdt)`
  - Effort: L
  - Inverse phrasing of `fromNow` — Moment returns "in 2 hours" vs `fromNow`'s "2 hours ago"

- [ ] **`.to(other, suffix?)`** → `relativeTimeTo(zdt, other)`
  - Effort: L
  - Inverse phrasing of `from`

- [ ] **`.calendar(referenceDay?, formats?)`** → `calendarDisplay(zdt, ref?)`
  - Effort: L
  - Returns strings like "Today at 2:30 PM", "Yesterday at 10:00 AM", "Last Monday at 6:00 PM"
  - Requires runtime helper; locale-aware via `Intl`

### Additional Serialization

- [ ] **`.toObject()`** → `{ years, months, date, hours, minutes, seconds, milliseconds }`
  - Effort: M
  - `isBreaking: true` — returns a plain object with Moment-compatible keys
  - Runtime helper to build the object: note `month` is 0-indexed in Moment's output and the key is `months` (plural)

- [ ] **`.toArray()`** → `[year, month-1, day, hour, minute, second, millisecond]`
  - Effort: M
  - `isBreaking: true` — returns an array
  - Can be emitted as an inline array expression

- [ ] **`.inspect()`** → debug string
  - Effort: S
  - Low priority; mainly used in REPL contexts

---

## Phase 6 — Duration Support

**Priority:** P2 — large scope; a separate subsystem  
**Theme:** `moment.duration()` and its method chain, mapping to `Temporal.Duration`.

This phase requires:

- A new visitor to detect `moment.duration(...)` call expressions
- A new set of chain processors for duration methods
- New runtime helpers for duration formatting

### Duration Creation

- [ ] **`moment.duration(number, unit)`** → `Temporal.Duration.from({ [unit]: number })`
  - Effort: L
  - New static-method visitor in `transform.ts`; unit conversion map applies

- [ ] **`moment.duration(string)`** → `Temporal.Duration.from(isoString)`
  - Effort: M
  - ISO 8601 duration strings (`P1Y2M3DT4H`) map directly

- [ ] **`moment.duration(object)`** → `Temporal.Duration.from(mappedObject)`
  - Effort: M
  - Key mapping from Moment's unit names to Temporal's (e.g., `minutes` → `minutes`, `M` → `months`)

### Duration Instance Methods

- [ ] **`.as(unit)`** → `duration.total({ unit })`
  - Effort: M
  - `Temporal.Duration.total()` requires `relativeTo` for calendar units (`years`, `months`, `weeks`) — emit a runtime helper that provides a default `relativeTo` when needed

- [ ] **`.get(unit)`** → property access (`.hours`, `.minutes`, `.seconds`, etc.)
  - Effort: S
  - Map Moment unit strings to `Temporal.Duration` property names

- [ ] **`.asMilliseconds()`** / **`.asSeconds()`** / **`.asMinutes()`** / **`.asHours()`** / **`.asDays()`** / **`.asWeeks()`** / **`.asMonths()`** / **`.asYears()`** → `duration.total({ unit })`
  - Effort: M

- [ ] **`.milliseconds()`** / **`.seconds()`** / **`.minutes()`** / **`.hours()`** / **`.days()`** / **`.months()`** / **`.years()`** (component getters) → property access
  - Effort: S

- [ ] **`.add(duration)`** → `duration.add(other)`
  - Effort: M
  - Temporal requires `relativeTo` for calendar duration arithmetic; emit a runtime helper

- [ ] **`.subtract(duration)`** → `duration.subtract(other)`
  - Effort: M

- [ ] **`.toISOString()`** → `duration.toString()`
  - Effort: S

- [ ] **`.humanize(suffix?)`** → `Intl.DurationFormat` (where available) or runtime helper
  - Effort: L
  - Returns strings like "a few seconds", "2 hours", "a month"
  - `Intl.DurationFormat` is Stage 4 but not yet universally available; provide a runtime fallback

- [ ] **`moment.isDuration(obj)`** → `obj instanceof Temporal.Duration`
  - Effort: S

---

## Phase 7 — Static Utility Methods

**Priority:** P3 — niche usage  
**Theme:** Static methods on the `moment` namespace object.

- [ ] **`moment.max(...moments)`** → select the latest `ZonedDateTime`
  - Effort: M
  - Runtime helper: `maxZonedDateTime(...zdts)` using `Temporal.ZonedDateTime.compare`

- [ ] **`moment.min(...moments)`** → select the earliest `ZonedDateTime`
  - Effort: M
  - Runtime helper: `minZonedDateTime(...zdts)` using `Temporal.ZonedDateTime.compare`

- [ ] **`moment.isMoment(obj)`** → `obj instanceof Temporal.ZonedDateTime`
  - Effort: S

- [ ] **`moment.isDate(obj)`** → `obj instanceof Date`
  - Effort: S
  - No Temporal involvement; pure inline replacement

---

## Out of Scope

The following Moment.js features are not planned for this codemod. They either have no meaningful Temporal equivalent, require runtime locale data that cannot be statically transformed, or belong to a separate library.

| Feature                                                             | Reason                                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `moment.locale()`, `moment.defineLocale()`, `moment.updateLocale()` | Runtime locale configuration; no static transform is possible                                                          |
| `moment.localeData()`, `moment.months()`, `moment.weekdays()`       | Requires CLDR locale data; callers should use `Intl` APIs directly                                                     |
| `moment.tz()` (moment-timezone)                                     | Separate library; would require its own codemod                                                                        |
| `moment.parseZone()`                                                | Preserves input offset; niche use case. `Temporal.ZonedDateTime.from(str, { offset: 'use' })` is the manual equivalent |
| Plugin ecosystem (Twix, Recur, Business, etc.)                      | Third-party; out of scope                                                                                              |
| `moment.HTML5_FMT.*` constants                                      | Static string constants, not method calls; no transform is needed                                                      |
| Dynamic format strings (e.g., `moment().format(variable)`)          | Cannot be statically analyzed; the existing `toFormattedString` runtime helper already handles this at runtime         |
| Strict mode flag (`moment(str, fmt, true)`)                         | The third boolean argument to `moment()` is not yet supported in parsing                                               |

---

## Architectural Notes for Contributors

### The `isBreaking` Constraint

A chain is only transformed if it contains at least one processor with `isBreaking: true`. This is a fundamental design decision: the codemod only transforms chains that produce a concrete non-Moment value (a primitive, a `Date`, or a plain object/array).

- Methods that return a primitive or non-Temporal value should be `isBreaking: true`
- Methods that return a date/time object should be `isBreaking: false`
- A chain like `moment().add(1, 'day')` alone will **not** be transformed — it must end with a breaking call such as `.toDate()` or `.valueOf()`

When adding a new processor, always ask: does this method return a Moment-like object (non-breaking) or a primitive/concrete value (breaking)?

### How to Add a New Method

1. Load the `add-chain-processor` skill for step-by-step instructions
2. Load the `write-test-cases` skill for test conventions
3. If a runtime helper is needed, load the `add-runtime-utility` skill

### Handling Dual Getter/Setter Methods

Many Moment methods (`.year()`, `.month()`, etc.) behave differently based on whether arguments are passed:

- **No arguments → getter** (`isBreaking: true`; returns a number)
- **One argument → setter** (`isBreaking: false`; returns a Temporal object)

A single chain processor entry handles both modes by inspecting `path.value.arguments.length` to select the appropriate output AST.

### The `startOf` / `endOf` Calendar-Unit Problem

The current implementation uses `ZonedDateTime.round()`, which only works for time-granularity units (`second` through `day`). For `week`, `month`, and `year`, the correct approach uses `.with()` and `.startOfDay()`:

```js
// startOf('month')
zdt.with({ day: 1 }).startOfDay();

// startOf('year')
zdt.with({ month: 1, day: 1 }).startOfDay();

// endOf('month') — daysInMonth is a runtime value, so a helper is required
endOfMonth(zdt); // runtime helper: zdt.with({ day: zdt.daysInMonth, hour: 23, minute: 59, second: 59, millisecond: 999 })

// endOf('year')
zdt.with({
  month: 12,
  day: 31,
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
});
```

### Handling the `other` Argument in Comparison/Diff Methods

Methods like `.diff(other)`, `.isBefore(other)`, and `.isBetween(start, end)` take another date expression as an argument. That argument may itself be a `moment()` chain. The recommended approach is a runtime helper that accepts either a `Temporal.ZonedDateTime` or a legacy `Date`/number, so the inner expression does not need to be co-transformed with the outer chain:

```js
// moment(a).diff(moment(b), 'days')  →
diffZonedDateTimes(zdtA, moment(b), "days");
// The runtime helper accepts Temporal ZonedDateTime or legacy Date/moment on either side
```

This avoids the complexity of recursive chain co-transformation, at the cost of the inner `moment(b)` call remaining untransformed until its own chain is resolved.

### The Quarter Unit Gap

Temporal has no native quarter concept. Quarter arithmetic should always be converted to months:

```js
// add(1, 'quarter')  →  .add({ months: 1 * 3 })
// startOf('quarter') →  compute first month of quarter, then startOf('month') logic
```
