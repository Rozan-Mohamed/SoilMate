import { describe, expect, it } from 'vitest';
import {
  asRecord,
  readAgreement,
  readCalendar,
  readChartAxis,
  readChartSeries,
  readChartTitle,
  readInsights,
  readNumber,
  readReport,
  readRiskPoint,
  readStatusColor,
  readString,
  readSummaryCard,
  readSummaryRows,
  readTextBlock,
  readTypicalYear,
  readYearsStrip,
} from './read';

describe('layer detail readers', () => {
  it('reads only real numbers and real strings', () => {
    expect(readNumber(0.5)).toBe(0.5);
    expect(readNumber('0.5')).toBe(0.5);
    expect(readNumber(Number.NaN)).toBeNull();
    expect(readNumber(null)).toBeNull();
    expect(readString('  Desouk ')).toBe('Desouk');
    expect(readString('')).toBeNull();
    expect(readString(42)).toBe('42');
  });

  it('zips the labels of a chart with the values of every area', () => {
    const series = readChartSeries(
      {
        A: {
          title: 'The season',
          labels: ['Jan', 'Feb'],
          series: {
            Desouk: [0.79, 0.71],
            Sidi_Salem: [0.78, 0.67],
          },
        },
      },
      'A',
    );

    expect(series.map((item) => item.name)).toEqual(['Desouk', 'Sidi_Salem']);
    expect(series[0].points).toEqual([
      { x: 'Jan', y: 0.79 },
      { x: 'Feb', y: 0.71 },
    ]);
    expect(readChartTitle({ A: { title: 'The season' } }, 'A')).toBe('The season');
  });

  it('reads the fixed axis of a chart', () => {
    expect(readChartAxis({ chart_axes: { A: { y_min: 0.25, y_max: 0.9 } } }, 'A')).toEqual({
      min: 0.25,
      max: 0.9,
    });
    expect(readChartAxis({ chart_axes: {} }, 'A')).toBeNull();
  });

  it('reads nothing from a chart the API did not send', () => {
    expect(readChartSeries({}, 'A')).toEqual([]);
    expect(readChartSeries(undefined, 'A')).toEqual([]);
  });

  it('reads the summary card and its lines', () => {
    const card = {
      green_pct_last12: 92,
      bare_months_per_year: 0.4,
      lowest_month: { number: 5, name: 'May', ndvi: 0.3999 },
      rows: [{ icon: 'eye', text: 'Greenness is about normal (0.00)' }],
      source_tag: 'NASA MODIS · 250 m',
    };

    expect(readSummaryCard(card)).toEqual({
      greenPctLast12: 92,
      bareMonthsPerYear: 0.4,
      lowestMonth: 'May',
      sourceTag: 'NASA MODIS · 250 m',
    });
    expect(readSummaryRows(card)).toEqual(['Greenness is about normal (0.00)']);
  });

  it('prints the insight lines as they are', () => {
    expect(readInsights([{ id: 'weakest_month', text: 'Weakest month: August 2016' }])).toEqual([
      'Weakest month: August 2016',
    ]);
    expect(readInsights(['A plain line.'])).toEqual(['A plain line.']);
    expect(readInsights(undefined)).toEqual([]);
  });

  it('reads the calendar of the months', () => {
    const rows = readCalendar([
      { center: 'desouk', year: 2025, month: 6, sm_state: 'dry', model_state: 'wet', agree: false },
      { center: 'desouk', year: 2025, month: 5, sm_state: 'no_data', model_state: 'normal' },
    ]);

    expect(rows[0].label).toBe('Jun 2025');
    expect(rows[0].satellite).toBe('dry');
    expect(rows[0].model).toBe('wet');
    expect(rows[0].agree).toBe(false);
    expect(rows[1].label).toBe('May 2025');
    expect(rows[1].satellite).toBe('no_data');
  });

  it('reads the typical year and the years strip', () => {
    const typical = readTypicalYear([
      { center: 'desouk', source: 'sm', month: 1, typical: 50.5, low: 44.1, high: 61.8, n_years: 10 },
    ]);

    expect(typical[0]).toEqual({
      source: 'sm',
      month: 1,
      label: 'Jan',
      typical: 50.5,
      low: 44.1,
      high: 61.8,
      years: 10,
    });

    const years = readYearsStrip([
      { center: 'desouk', year: 2015, months_available: 9, dry_months_sm: 2, partial_year: true },
    ]);

    expect(years[0]).toEqual({
      year: 2015,
      label: '2015',
      monthsAvailable: 9,
      drySatellite: 2,
      wetSatellite: null,
      dryModel: null,
      wetModel: null,
      partial: true,
    });
  });

  it('reads the agreement of the two sources', () => {
    const agreement = readAgreement({
      months: 123,
      agree_months: 54,
      agree_pct: 44,
      opposite_months: 25,
      chance_pct: 34,
      level: 'weak',
    });

    expect(agreement).toEqual({
      months: 123,
      agreeMonths: 54,
      agreePct: 44,
      oppositeMonths: 25,
      chancePct: 34,
      level: 'weak',
    });
  });

  it('reads a question and answer block and a report', () => {
    const block = readTextBlock({
      question: 'How was the soil each month?',
      answer: 'Each square compares that month with the same month in other years.',
      note: 'A grey square means there is no data.',
    });

    expect(block?.question).toBe('How was the soil each month?');
    expect(block?.note).toBe('A grey square means there is no data.');
    expect(readTextBlock('a string')).toBeNull();

    const report = readReport({
      observed: ['The soil was drier than usual.'],
      meaning: ['The sources disagree.'],
      verify: ['Check your own field.'],
      confidence: 'Medium',
    });

    expect(report?.observed).toEqual(['The soil was drier than usual.']);
    expect(report?.confidence).toBe('Medium');
  });

  it('reads the screening point of the land risk', () => {
    const point = readRiskPoint({
      id: 'desouk',
      lat: 31.1326,
      lon: 30.6478,
      risk: { score: 1.75, scale_min: 1, scale_max: 3, level: 'Medium' },
      signs: [{ id: 'vegetation', question: 'Is vegetation declining?', status: 'Watch', score: 2 }],
    });

    expect(point?.score).toBe(1.75);
    expect(point?.scaleMax).toBe(3);
    expect(point?.level).toBe('Medium');
    expect(point?.lat).toBe(31.1326);
  });

  it('finds the color of a status whatever its case', () => {
    const colors = { stable: '#3f7d5c', watch: '#d9a23b' };

    expect(readStatusColor(colors, 'Watch')).toBe('#d9a23b');
    expect(readStatusColor(colors, 'watch')).toBe('#d9a23b');
    expect(readStatusColor(colors, 'Alarming')).toBeNull();
    expect(readStatusColor(colors, null)).toBeNull();
  });

  it('never reads a value out of a missing block', () => {
    expect(asRecord([1])).toBeNull();
    expect(readSummaryRows(undefined)).toEqual([]);
    expect(readReport(undefined)).toBeNull();
    expect(readAgreement(undefined)).toBeNull();
  });
});
