/**
 * Readers for the layer detail responses of the website API (server/).
 *
 * The API returns the data team's content with its own key names (snake_case).
 * These helpers read the keys the API really sends and skip what is missing,
 * so a pop-up never shows a broken number and never invents one.
 */

/** A flat record, or null. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** A list, or an empty list. */
export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** A finite number, or null. */
export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** A non-empty string, or null. */
export function readString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

/** The first of the given keys that carries something readable. */
export function readFirst(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): unknown {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/** The first of the given keys that carries a number. */
export function readNumberFrom(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): number | null {
  return readNumber(readFirst(source, keys));
}

/** The first of the given keys that carries text. */
export function readStringFrom(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  return readString(readFirst(source, keys));
}

export type Pair = {
  label: string;
  value: string;
};

/**
 * A flat record as label/value rows. Used for the blocks the API does not
 * name: whatever the API sends is shown, nothing is added.
 */
export function readPairs(
  source: unknown,
  options: { skip?: string[]; labelFor?: (key: string) => string } = {},
): Pair[] {
  const record = asRecord(source);
  if (!record) return [];

  const skip = new Set(options.skip ?? []);
  const pairs: Pair[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (skip.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object') continue;

    const text = readString(value);
    if (!text) continue;

    pairs.push({ label: options.labelFor ? options.labelFor(key) : key, value: text });
  }

  return pairs;
}

/* ------------------------------------------------------------------ */
/* Crop health                                                         */
/* ------------------------------------------------------------------ */

/** One point of a chart series. `y` is null when the API has no value there. */
export type ChartPoint = {
  x: string;
  y: number | null;
};

export type Series = {
  /** The chart key of the area, e.g. "Desouk". */
  name: string;
  points: ChartPoint[];
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** The x labels of a chart: the API sends them next to the series. */
export function readChartLabels(charts: unknown, chartKey: string): string[] {
  const chart = asRecord(asRecord(charts)?.[chartKey]);
  return asArray(chart?.labels).map((label) => readString(label) ?? '');
}

/**
 * The series of one chart. The API sends the values of every area as plain
 * number arrays and the labels of the x axis next to them.
 */
export function readChartSeries(charts: unknown, chartKey: string): Series[] {
  const chart = asRecord(asRecord(charts)?.[chartKey]);
  if (!chart) return [];

  const labels = asArray(chart.labels).map((label) => readString(label) ?? '');
  const series = asRecord(chart.series);
  if (!series) return [];

  return Object.entries(series)
    .map(([name, values]) => {
      const points = asArray(values).map((value, index) => ({
        x: labels[index] ?? String(index + 1),
        y: readNumber(value),
      }));

      return { name, points };
    })
    .filter((item) => item.points.length > 0);
}

/** The title of a chart, when the API gives one. */
export function readChartTitle(charts: unknown, chartKey: string): string | null {
  const chart = asRecord(asRecord(charts)?.[chartKey]);
  return readStringFrom(chart, ['title', 'label', 'name']);
}

/** The subtitle of a chart, when the API gives one. */
export function readChartSubtitle(charts: unknown, chartKey: string): string | null {
  const chart = asRecord(asRecord(charts)?.[chartKey]);
  return readStringFrom(chart, ['subtitle']);
}

/** The reference line of a chart (the "bare" NDVI line), when there is one. */
export function readChartReference(charts: unknown, chartKey: string): number | null {
  const chart = asRecord(asRecord(charts)?.[chartKey]);
  return readNumberFrom(chart, ['bare_line', 'reference', 'threshold']);
}

/** The fixed axis of a chart, from the `ui` block of the response. */
export function readChartAxis(
  ui: unknown,
  chartKey: string,
): { min: number; max: number } | null {
  const axes = asRecord(asRecord(ui)?.chart_axes);
  const axis = asRecord(axes?.[chartKey]);
  const min = readNumberFrom(axis, ['y_min', 'min']);
  const max = readNumberFrom(axis, ['y_max', 'max']);

  if (min === null || max === null) return null;

  return { min, max };
}

export type Step = {
  id: string;
  title: string;
  type: string | null;
};

/** The steps of the crop health pop-up, from the `ui` block of the response. */
export function readSteps(ui: unknown): Step[] {
  return asArray(asRecord(ui)?.steps).map((step, index) => {
    const record = asRecord(step) ?? {};

    return {
      id: readStringFrom(record, ['id']) ?? `step_${index + 1}`,
      title: readStringFrom(record, ['title']) ?? '',
      type: readStringFrom(record, ['type']),
    };
  });
}

/** The lines of the summary card of the crop health pop-up. */
export function readSummaryRows(summaryCard: unknown): string[] {
  const rows = asArray(asRecord(summaryCard)?.rows);

  return rows
    .map((row) => {
      const record = asRecord(row);
      return readStringFrom(record, ['text', 'line']) ?? (typeof row === 'string' ? row : null);
    })
    .filter((text): text is string => text !== null);
}

/** The green months of the last 12 and the bare months of the summary card. */
export function readSummaryCard(summaryCard: unknown): {
  greenPctLast12: number | null;
  bareMonthsPerYear: number | null;
  lowestMonth: string | null;
  sourceTag: string | null;
} {
  const card = asRecord(summaryCard);

  return {
    greenPctLast12: readNumberFrom(card, ['green_pct_last12']),
    bareMonthsPerYear: readNumberFrom(card, ['bare_months_per_year']),
    lowestMonth: readStringFrom(asRecord(card?.lowest_month), ['name', 'label']),
    sourceTag: readStringFrom(card, ['source_tag']),
  };
}

/** The six insight lines of the crop health pop-up. */
export function readInsights(insights: unknown): string[] {
  return asArray(insights)
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim() === '' ? null : entry;
      return readStringFrom(asRecord(entry), ['text', 'body', 'content']);
    })
    .filter((text): text is string => text !== null);
}

/* ------------------------------------------------------------------ */
/* Soil moisture                                                       */
/* ------------------------------------------------------------------ */

/** One month of the calendar. */
export type CalendarRow = {
  year: number | null;
  month: number | null;
  label: string;
  satellite: string | null;
  model: string | null;
  root: string | null;
  satellitePct: number | null;
  modelPct: number | null;
  agree: boolean | null;
};

/** One month of the calendar. */
export function readCalendarRow(raw: unknown): CalendarRow {
  const record = asRecord(raw);
  const year = readNumberFrom(record, ['year']);
  const month = readNumberFrom(record, ['month']);

  return {
    year,
    month,
    label:
      year !== null && month !== null
        ? `${MONTH_NAMES[month - 1] ?? month} ${year}`
        : (readStringFrom(record, ['label']) ?? ''),
    satellite: readStringFrom(record, ['sm_state', 'smap_state', 'satellite_state']),
    model: readStringFrom(record, ['model_state', 'power_state']),
    root: readStringFrom(record, ['root_state']),
    satellitePct: readNumberFrom(record, ['sm_pct']),
    modelPct: readNumberFrom(record, ['model_pct']),
    agree:
      typeof record?.agree === 'boolean' ? record.agree : null,
  };
}

/** The rows of the calendar, in the order the API sent them. */
export function readCalendar(rows: unknown): CalendarRow[] {
  return asArray(rows).map((row) => readCalendarRow(row));
}

/** One month of the typical year. */
export type TypicalRow = {
  source: string | null;
  month: number | null;
  label: string;
  typical: number | null;
  low: number | null;
  high: number | null;
  years: number | null;
};

/** One month of the typical year. */
export function readTypicalRow(raw: unknown): TypicalRow {
  const record = asRecord(raw);
  const month = readNumberFrom(record, ['month']);

  return {
    source: readStringFrom(record, ['source']),
    month,
    label: month !== null ? (MONTH_NAMES[month - 1] ?? String(month)) : '',
    typical: readNumberFrom(record, ['typical']),
    low: readNumberFrom(record, ['low']),
    high: readNumberFrom(record, ['high']),
    years: readNumberFrom(record, ['n_years']),
  };
}

/** The rows of the typical year. */
export function readTypicalYear(rows: unknown): TypicalRow[] {
  return asArray(rows).map((row) => readTypicalRow(row));
}

/** One year of the years strip. */
export type YearEntry = {
  year: number | null;
  label: string;
  monthsAvailable: number | null;
  drySatellite: number | null;
  wetSatellite: number | null;
  dryModel: number | null;
  wetModel: number | null;
  partial: boolean;
};

/** One year of the years strip. */
export function readYearEntry(raw: unknown): YearEntry {
  const record = asRecord(raw);
  const year = readNumberFrom(record, ['year']);

  return {
    year,
    label: year !== null ? String(year) : (readStringFrom(record, ['label']) ?? ''),
    monthsAvailable: readNumberFrom(record, ['months_available']),
    drySatellite: readNumberFrom(record, ['dry_months_sm']),
    wetSatellite: readNumberFrom(record, ['wet_months_sm']),
    dryModel: readNumberFrom(record, ['dry_months_model']),
    wetModel: readNumberFrom(record, ['wet_months_model']),
    partial: record?.partial_year === true,
  };
}

/** The entries of the years strip. */
export function readYearsStrip(rows: unknown): YearEntry[] {
  return asArray(rows).map((row) => readYearEntry(row));
}

/** The agreement between the satellite and the model. */
export type Agreement = {
  months: number | null;
  agreeMonths: number | null;
  agreePct: number | null;
  oppositeMonths: number | null;
  chancePct: number | null;
  level: string | null;
};

/** The agreement between the satellite and the model. */
export function readAgreement(agreement: unknown): Agreement | null {
  const record = asRecord(agreement);
  if (!record) return null;

  return {
    months: readNumberFrom(record, ['months']),
    agreeMonths: readNumberFrom(record, ['agree_months']),
    agreePct: readNumberFrom(record, ['agree_pct']),
    oppositeMonths: readNumberFrom(record, ['opposite_months']),
    chancePct: readNumberFrom(record, ['chance_pct']),
    level: readStringFrom(record, ['level']),
  };
}

/** A question/answer block of the texts of the API. */
export type TextBlock = {
  question: string | null;
  answer: string | null;
  note: string | null;
};

/** A question/answer block of the texts of the API. */
export function readTextBlock(value: unknown): TextBlock | null {
  const record = asRecord(value);
  if (!record) return null;

  const question = readStringFrom(record, ['question', 'q']);
  const answer = readStringFrom(record, ['answer', 'a']);
  const note = readStringFrom(record, ['note', 'n']);

  if (!question && !answer && !note) return null;

  return { question, answer, note };
}

/** The report of an area: what was observed, what it may mean, what to check. */
export type Report = {
  observed: string[];
  meaning: string[];
  verify: string[];
  confidence: string | null;
  summary: string | null;
};

/** The report of an area. Every part is one line or a list of lines. */
export function readReport(report: unknown): Report | null {
  const record = asRecord(report);
  if (!record) return null;

  const list = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => readString(item))
        .filter((item): item is string => item !== null);
    }

    const single = readString(value);
    return single ? [single] : [];
  };

  return {
    observed: list(record.observed),
    // The atlas report says "meaning" and "verify"; the soil moisture report
    // says "may_mean" and "to_verify".
    meaning: list(readFirst(record, ['meaning', 'may_mean'])),
    verify: list(readFirst(record, ['verify', 'to_verify'])),
    confidence: readStringFrom(record, ['confidence']),
    summary: readStringFrom(record, ['summary']),
  };
}

/** The limits of the data, as the API sends them: a list of sentences. */
export function readLimits(limits: unknown): string[] {
  if (Array.isArray(limits)) {
    return limits
      .map((item) => readString(item))
      .filter((item): item is string => item !== null);
  }

  const single = readString(limits);
  return single ? [single] : [];
}

export type Source = {
  title: string | null;
  detail: string | null;
};

/** The sources of the data, as the API sends them. */
export function readSources(sources: unknown): Source[] {
  return asArray(sources).map((source) => {
    const record = asRecord(source) ?? {};

    return {
      title: readStringFrom(record, ['name', 'title', 'label']),
      detail: readStringFrom(record, ['used_for', 'detail', 'period', 'type']),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Heat stress                                                         */
/* ------------------------------------------------------------------ */

/** The summary of the heat stress of one area. */
export type HeatSummary = {
  avgHigh: number | null;
  avgLow: number | null;
  hottest: { date: string; value: number } | null;
  coldest: { date: string; value: number } | null;
  heatDays: number | null;
  longestSpell: { days: number; from: string } | null;
  unusualHot: number | null;
  unusualCool: number | null;
  trendPerDecade: number | null;
  perYear: number[];
  perMonth: number[];
};

/** The summary of the heat stress of one area. */
export function readHeatSummary(summary: unknown): HeatSummary {
  const record = asRecord(summary) ?? {};

  const pair = (value: unknown): { date: string; value: number } | null => {
    const list = asArray(value);
    const date = readString(list[0]);
    const number = readNumber(list[1]);
    return date !== null && number !== null ? { date, value: number } : null;
  };

  const spell = asArray(record.longest_spell);
  const days = readNumber(spell[0]);
  const from = readString(spell[1]);

  const numbers = (value: unknown) =>
    asArray(value)
      .map((item) => readNumber(item))
      .filter((item): item is number => item !== null);

  return {
    avgHigh: readNumberFrom(record, ['avg_high']),
    avgLow: readNumberFrom(record, ['avg_low']),
    hottest: pair(record.hottest),
    coldest: pair(record.coldest),
    heatDays: readNumberFrom(record, ['heat_days_per_year']),
    longestSpell: days !== null && from !== null ? { days, from } : null,
    unusualHot: readNumberFrom(record, ['unusual_hot']),
    unusualCool: readNumberFrom(record, ['unusual_cool']),
    trendPerDecade: readNumberFrom(record, ['trend_per_decade']),
    perYear: numbers(record.per_year),
    perMonth: numbers(record.per_month),
  };
}

/** The typical year of the heat stress: the weather and the satellite line. */
export function readHeatTypicalYear(typicalYear: unknown): {
  weather: number[];
  satellite: number[];
} | null {
  const record = asRecord(typicalYear);
  if (!record) return null;

  const numbers = (value: unknown) =>
    asArray(value)
      .map((item) => readNumber(item))
      .filter((item): item is number => item !== null);

  const weather = numbers(record.wx);
  const satellite = numbers(record.lst);

  if (weather.length === 0 && satellite.length === 0) return null;

  return { weather, satellite };
}

/* ------------------------------------------------------------------ */
/* Land risk                                                           */
/* ------------------------------------------------------------------ */

/** The status word of one sign of the screening. */
export type Indicator = {
  id: string;
  label: string;
  question: string | null;
  status: string | null;
  score: number | null;
  text: string | null;
};

/** The four signs of the screening. */
export function readIndicators(point: unknown): Indicator[] {
  const record = asRecord(point);
  const raw = readFirst(record, ['signs', 'indicators']);

  return asArray(raw).map((entry, index) => {
    const item = asRecord(entry) ?? {};

    return {
      id: readStringFrom(item, ['id', 'key']) ?? String(index),
      label: readStringFrom(item, ['label', 'name', 'title']) ?? '',
      question: readStringFrom(item, ['question']),
      status: readStringFrom(item, ['status', 'state', 'level']),
      score: readNumberFrom(item, ['score', 'value']),
      text: readStringFrom(item, ['text', 'note', 'description']),
    };
  });
}

/** The screening point of one area. */
export type RiskPoint = {
  score: number | null;
  scaleMin: number | null;
  scaleMax: number | null;
  level: string | null;
  lat: number | null;
  lon: number | null;
};

/** The screening point of one area. */
export function readRiskPoint(point: unknown): RiskPoint | null {
  const record = asRecord(point);
  if (!record) return null;

  const risk = asRecord(record.risk) ?? record;

  return {
    score: readNumberFrom(risk, ['score', 'value']),
    scaleMin: readNumberFrom(risk, ['scale_min', 'scaleMin']),
    scaleMax: readNumberFrom(risk, ['scale_max', 'scaleMax']),
    level: readStringFrom(risk, ['level', 'status']),
    lat: readNumberFrom(record, ['lat']),
    lon: readNumberFrom(record, ['lon']),
  };
}

/** The color of a status, from the `statusColors` of the API. */
export function readStatusColor(statusColors: unknown, status: string | null): string | null {
  if (!status) return null;

  const colors = asRecord(statusColors);
  if (!colors) return null;

  const direct = readString(colors[status]);
  if (direct) return direct;

  const wanted = status.trim().toLowerCase();

  for (const [key, value] of Object.entries(colors)) {
    if (key.toLowerCase() === wanted) return readString(value);
  }

  return null;
}
