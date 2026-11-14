/**
 * Test fixtures shaped exactly like the responses of the website API
 * (server/). They are used by the Explore Land tests, so the components are
 * checked against the real response shapes and not against a mock of our own.
 */
import type { CenterId } from '@/lib/soilmate/types';

export const CENTERS = [
  {
    id: 'desouk' as const,
    name: 'Desouk',
    nameAr: 'دسوق',
    governorate: 'Kafr El-Sheikh',
    bbox: [30.55, 31.05, 30.75, 31.25] as [number, number, number, number],
    mapCenter: { lat: 31.15, lon: 30.65 },
  },
  {
    id: 'sidi_salem' as const,
    name: 'Sidi Salem',
    nameAr: 'سيدي سالم',
    governorate: 'Kafr El-Sheikh',
    bbox: [30.85, 31.15, 31.1, 31.38] as [number, number, number, number],
    mapCenter: { lat: 31.265, lon: 30.975 },
  },
  {
    id: 'baltim' as const,
    name: 'Baltim',
    nameAr: 'بلطيم',
    governorate: 'Kafr El-Sheikh',
    bbox: [30.98, 31.45, 31.25, 31.65] as [number, number, number, number],
    mapCenter: { lat: 31.55, lon: 31.115 },
  },
];

export const COVERAGE_NOTE = 'We currently cover Desouk, Sidi Salem and Baltim.';

export const LAYERS = [
  { id: 'overview', label: 'Field Overview', order: 1, available: true },
  { id: 'soil_moisture', label: 'Soil Moisture', order: 2, available: true },
  { id: 'crop_health', label: 'Crop Health (NDVI)', order: 3, available: true },
  { id: 'heat_stress', label: 'Heat Stress', order: 4, available: true },
  {
    id: 'erosion_risk',
    label: 'Erosion Risk',
    order: 5,
    available: false,
    unavailableReason: 'Not available yet',
  },
];

export function centersResponse(query = '') {
  const needle = query.trim().toLowerCase();
  const centers = needle
    ? CENTERS.filter((center) => center.name.toLowerCase().includes(needle))
    : CENTERS;

  return { centers, coverageNote: COVERAGE_NOTE };
}

export function mapLayerResponse(layerId: string) {
  if (layerId === 'crop_health') {
    return {
      layerId,
      label: 'Crop Health (NDVI)',
      dataThrough: '2025-06',
      legend: {
        type: 'gradient',
        unit: 'NDVI',
        stops: [
          [0.2, '#C4553B'],
          [0.4, '#E0A93F'],
          [0.6, '#8FB85A'],
          [0.9, '#1F6B45'],
        ],
        items: [
          { id: 'low', label: 'Nearly bare' },
          { id: 'mid', label: 'Moderate green' },
          { id: 'good', label: 'Healthy green' },
        ],
      },
      centers: [
        {
          centerId: 'desouk',
          name: 'Desouk',
          bbox: CENTERS[0].bbox,
          value: 0.56,
          valueLabel: '0.56',
          levelId: 'mid',
          levelLabel: 'Moderate green',
          fillHex: '#9eb555',
          face: 'neutral',
        },
        {
          centerId: 'sidi_salem',
          name: 'Sidi Salem',
          bbox: CENTERS[1].bbox,
          value: 0.62,
          valueLabel: '0.62',
          levelId: 'good',
          levelLabel: 'Healthy green',
          fillHex: '#89b459',
          face: 'happy',
        },
        {
          centerId: 'baltim',
          name: 'Baltim',
          bbox: CENTERS[2].bbox,
          value: 0.55,
          valueLabel: '0.55',
          levelId: 'mid',
          levelLabel: 'Moderate green',
          fillHex: '#9eb555',
          face: 'neutral',
        },
      ],
    };
  }

  if (layerId === 'soil_moisture') {
    return {
      layerId,
      label: 'Soil Moisture',
      dataThrough: '2025-06',
      legend: {
        type: 'categories',
        unit: 'Needle (0–100)',
        items: [
          { id: 'dry', label: 'Drier than usual', hex: '#D9B26F' },
          { id: 'normal', label: 'About usual', hex: '#A8D5A2' },
          { id: 'wet', label: 'Wetter than usual', hex: '#8EC5E8' },
          { id: 'no_data', label: 'No data', hex: '#CFCFCF' },
        ],
      },
      centers: [
        {
          centerId: 'desouk',
          name: 'Desouk',
          bbox: CENTERS[0].bbox,
          value: 9,
          valueLabel: '9',
          levelId: 'dry',
          levelLabel: 'Drier than usual',
          fillHex: '#D9B26F',
          modelState: 'wet',
          modelNeedle: 91,
        },
      ],
    };
  }

  if (layerId === 'heat_stress') {
    return {
      layerId,
      label: 'Heat Stress',
      dataThrough: '2025-12',
      legend: { type: 'rank', unit: 'Hot days per year (35 °C+)', items: [] },
      centers: [
        {
          centerId: 'desouk',
          name: 'Desouk',
          bbox: CENTERS[0].bbox,
          value: 119.5,
          valueLabel: '119.5',
          levelId: null,
          levelLabel: null,
          fillHex: null,
        },
      ],
    };
  }

  return {
    layerId: 'overview',
    label: 'Field Overview',
    dataThrough: '2025-12',
    legend: {
      type: 'categories',
      unit: 'Land risk score (1–3)',
      items: [
        { id: 'low', label: 'Low', hex: '#3f7d5c' },
        { id: 'medium', label: 'Medium', hex: '#d9a23b' },
        { id: 'high', label: 'High', hex: '#b8442f' },
      ],
    },
    centers: [
      {
        centerId: 'desouk',
        name: 'Desouk',
        bbox: CENTERS[0].bbox,
        value: 1.75,
        valueLabel: '1.75',
        levelId: 'medium',
        levelLabel: 'Medium',
        fillHex: '#d9a23b',
      },
    ],
  };
}

export function centerOverviewResponse(centerId: CenterId) {
  const center = CENTERS.find((item) => item.id === centerId) ?? CENTERS[0];

  // The three areas do not share their numbers.
  const isDesouk = center.id === 'desouk';
  const ndvi = isDesouk ? 0.56 : center.id === 'sidi_salem' ? 0.62 : 0.55;
  const greenMonths = isDesouk ? 92 : 100;
  const hotDays = isDesouk ? 119.5 : 6.2;
  const smNeedle = isDesouk ? 9 : 36;
  const smState = isDesouk ? 'dry' : 'normal';

  return {
    center: {
      ...center,
      site: { lat: 31.1326, lon: 30.6478, elevationM: 11, slopeDeg: 2.17, coastDistanceKm: 51 },
    },
    dataThrough: {
      cropHealth: '2025-06',
      soilMoisture: '2025-06',
      heatWeather: '2025-12',
      heatSatellite: '2025-06',
    },
    areaWarning: 'These numbers describe the whole area, not your field.',
    tiles: [
      {
        id: 'crop_greenness',
        label: 'Crop greenness (NDVI)',
        value: ndvi,
        display: ndvi.toFixed(2),
        chip: { id: 'mid', label: 'Moderate green' },
      },
      {
        id: 'green_months',
        label: 'Green months (last 12)',
        value: greenMonths,
        display: `${greenMonths}%`,
        chip: null,
      },
      {
        id: 'soil_moisture',
        label: 'Soil moisture (SMAP)',
        value: smState,
        display: isDesouk ? 'Drier than usual' : 'About usual',
        chip: null,
      },
      {
        id: 'hot_days',
        label: 'Hot days per year (35 °C+)',
        value: hotDays,
        display: String(hotDays),
        chip: null,
      },
    ],
    heat: {
      title: 'Typical heat',
      avgHighC: 29.7,
      avgLowC: 16.5,
      hottestDay: { date: '2024-06-14', tmaxC: 46.54 },
      heatDaysPerYear: hotDays,
      longestHotSpell: { days: 76, from: '2021-06-19' },
      trendPerDecadeC: 1,
      source: 'NASA POWER (daily weather)',
    },
    lastMonths: [
      { short: 'Mar', ndvi: 0.79, fillHex: '#49884d' },
      { short: 'Apr', ndvi: 0.53, fillHex: '#abb351' },
      { short: 'May', ndvi: 0.4, fillHex: '#e0a93f' },
      { short: 'Jun', ndvi, fillHex: '#9eb555' },
    ],
    soilMoisture: {
      satellite: {
        state: smState,
        label: isDesouk ? 'Drier than usual' : 'About usual',
        needle: smNeedle,
      },
      model: { state: 'wet', label: 'Wetter than usual', needle: 91 },
      rootZone: { state: 'wet', label: 'Wetter than usual', needle: 82 },
      dryMonthsLast12: { satellite: 11, model: 9 },
      texts: {
        satelliteLine: 'SMAP shows the soil is drier than usual',
        modelLine: 'The POWER model shows the soil is wetter than usual',
        last12Line:
          'In the last 12 months, SMAP showed 11 months drier than usual, and the POWER model showed 9.',
        disagreeNote: 'The two sources disagree this month. Please check your own soil.',
        needleNote: 'The needle shows where this month ranks among the same month in past years.',
      },
      confidenceLabels: {
        satellite: 'Model that uses satellite data (SMAP L4)',
        model: 'Model estimate (POWER)',
      },
    },
    landRisk: {
      title: 'Land risk (desertification screening)',
      score: 1.75,
      scaleMin: 1,
      scaleMax: 3,
      level: 'Medium',
      levelHex: '#d9a23b',
      indicators: [
        { id: 'vegetation', label: 'Vegetation', status: 'Watch', score: 2, text: 'Placeholder text.' },
        { id: 'soil_moisture', label: 'Soil moisture', status: 'Alarming', score: 3, text: 'Placeholder text.' },
        { id: 'heat', label: 'Heat', status: 'Stable', score: 1, text: 'Placeholder text.' },
        {
          id: 'salinity',
          label: 'Coast exposure (distance only)',
          status: 'Stable',
          score: 1,
          text: 'Placeholder text.',
        },
      ],
      notice:
        'A screening result, not a diagnosis. Salinity is not measured, only distance from the coast.',
    },
    disclaimer: 'A helper indicator — it does not replace the farmer’s knowledge.',
    footer:
      'This tool helps you see the picture. Your own decisions, your knowledge of your land, and local agricultural expertise come first.',
  };
}

export function cropHealthDetailResponse(centerId: CenterId) {
  const chartKey = centerId === 'sidi_salem' ? 'Sidi_Salem' : centerId === 'baltim' ? 'Baltim' : 'Desouk';

  return {
    center: {
      id: centerId,
      name: 'Desouk',
      chartKey,
      color: '#9eb555',
      bbox: CENTERS[0].bbox,
      latest: {
        month: '2025-06',
        label: 'June 2025',
        ndvi: 0.562,
        level: { id: 'mid', label: 'Moderate green' },
        anomaly: -0.0017,
        anomaly_word: 'about normal',
        map_fill_hex: '#9eb555',
      },
      summaryCard: {
        lowest_month: { number: 5, name: 'May', ndvi: 0.3999 },
        bare_months_per_year: 0.4,
        green_pct_last12: 92,
        rows: [{ icon: 'eye', text: 'Greenness is about normal (0.00)' }],
        source_tag: 'NASA MODIS · 250 m',
      },
      insights: [
        { id: 'weakest_month', icon: 'warn', text: 'Weakest month: August 2016 (−0.09)' },
        { id: 'ranking', icon: 'podium', text: 'Ranking: Desouk 0.63 › Sidi Salem 0.59 › Baltim 0.54' },
      ],
    },
    charts: {
      A: {
        title: 'The season',
        subtitle: 'average NDVI per month',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        series: {
          Desouk: [0.7991, 0.8091, 0.7358, 0.5192, 0.3999, 0.5637],
          Sidi_Salem: [0.7808, 0.7797, 0.6741, 0.4431, 0.3512, 0.5943],
          Baltim: [0.6264, 0.6512, 0.6191, 0.5143, 0.4229, 0.4932],
        },
        bare_line: 0.4,
      },
      B: {
        title: 'Bare land',
        subtitle: 'months below 0.4',
        labels: [2016, 2017, 2018],
        series: {
          Desouk: [1, 0, 0],
          Sidi_Salem: [3, 2, 2],
          Baltim: [2, 1, 1],
        },
      },
      E: {
        title: 'The trend',
        subtitle: 'yearly average',
        labels: [2016, 2017, 2018],
        series: {
          Desouk: [0.6355, 0.6298, 0.6297],
          Sidi_Salem: [0.5839, 0.584, 0.5895],
          Baltim: [0.5202, 0.5285, 0.5202],
        },
      },
    },
    ui: {
      layer: { id: 'ndvi', label: 'Crop Health (NDVI)' },
      steps: [
        { id: 'summary', title: 'Crop Health' },
        { id: 'chart_A', title: 'When is it green?', type: 'line' },
        { id: 'chart_B', title: 'Bare months', type: 'bar' },
        { id: 'chart_E', title: 'Greener or not?', type: 'line' },
        { id: 'insights', title: 'Quick insights' },
      ],
      chart_axes: {
        A: { y_min: 0.25, y_max: 0.9 },
        B: { y_min: 0, y_max: 4, step: 1 },
        E: { y_min: 0.4, y_max: 0.8 },
      },
    },
    meta: {
      sources: [{ id: 'ndvi', title: 'NDVI — NASA MODIS Terra', detail: 'MOD13Q1 v061 · 16-day · 250 m' }],
      disclaimer: 'A helper indicator — it does not replace the farmer’s knowledge.',
      limits: 'The values describe the whole area, not a single field.',
      thresholds: { bare_below: 0.4, good_from: 0.6 },
    },
    dataThrough: '2025-06',
  };
}

export function soilMoistureDetailResponse(centerId: CenterId) {
  return {
    card: {
      center: centerId,
      last_year: 2025,
      last_month: 6,
      sm_state: 'dry',
      sm_needle: 9,
      model_state: 'wet',
      model_needle: 91,
      root_state: 'wet',
      root_needle: 82,
      dry_months_of_last12_sm: 11,
      dry_months_of_last12_model: 9,
      months_in_window: 12,
    },
    calendar: [
      {
        center: centerId,
        year: 2025,
        month: 5,
        sm_state: 'no_data',
        sm_pct: 50,
        model_state: 'normal',
        model_pct: 60,
        root_state: 'normal',
        root_pct: 60,
        n_in_month: 11,
        agree: true,
      },
      {
        center: centerId,
        year: 2025,
        month: 6,
        sm_state: 'dry',
        sm_pct: 9,
        model_state: 'wet',
        model_pct: 91,
        root_state: 'wet',
        root_pct: 82,
        n_in_month: 11,
        agree: false,
      },
    ],
    typicalYear: [
      { center: centerId, source: 'sm', month: 1, typical: 50.5, low: 44.1, high: 61.8, n_years: 10 },
      { center: centerId, source: 'sm', month: 2, typical: 52.7, low: 46.9, high: 57.6, n_years: 10 },
    ],
    yearsStrip: [
      {
        center: centerId,
        year: 2015,
        months_available: 9,
        dry_months_sm: 2,
        wet_months_sm: 3,
        dry_months_model: 0,
        wet_months_model: 5,
        partial_year: true,
      },
      {
        center: centerId,
        year: 2025,
        months_available: 6,
        dry_months_sm: 5,
        wet_months_sm: 1,
        dry_months_model: 3,
        wet_months_model: 2,
        partial_year: true,
      },
    ],
    agreement: {
      center: centerId,
      months: 123,
      agree_months: 54,
      agree_pct: 44,
      opposite_months: 25,
      chance_pct: 34,
      p_value: 0.0205,
      rank_correlation: 0.17,
      level: 'weak',
      p_adjusted: 0.0615,
    },
    texts: {
      card: {
        title: 'Soil moisture',
        last_reading: 'Latest reading: June 2025',
        satellite_line: 'SMAP shows the soil is drier than usual',
        model_line: 'The POWER model shows the soil is wetter than usual',
        last12_line:
          'In the last 12 months, SMAP showed 11 months drier than usual, and the POWER model showed 9.',
        disagree_note: 'The two sources disagree this month. Please check your own soil.',
        needle_note: 'The needle shows where this month ranks among the same month in past years.',
        area_warning: 'These numbers describe the whole area, not your field.',
      },
      insight1_calendar: {
        question: 'How was the soil each month?',
        answer: 'Each square compares that month with the same month in other years.',
        note: 'A grey square means there is no data.',
      },
      insight2_typical_year: { question: 'What does a typical year look like?', answer: '—', note: '—' },
      insight3_years: { question: 'Which years do we have?', answer: '—', note: '—' },
      insight4_satellite_vs_model: {
        question: 'Do SMAP and the POWER model agree?',
        answer: 'They agree on the shape of the year.',
        numbers: 'They agreed in 54 of 123 months (44%).',
        opposite: 'In 25 months they pointed in opposite directions.',
        possible_reason: 'One possible reason is the difference in resolution.',
        you_row: 'You: look at your own field.',
        level: 'weak',
      },
      insight5_root: { question: 'What about deeper in the soil?', answer: '—', note: '—' },
      report: {
        observed: 'In June 2025, SMAP showed the soil was drier than usual.',
        may_mean: 'The sources disagree, so we cannot say with confidence.',
        to_verify: 'Check the soil in your own field.',
      },
    },
    labels: {
      states: {
        dry: 'Drier than usual',
        normal: 'About usual',
        wet: 'Wetter than usual',
        no_data: 'No data',
      },
      agreementLevels: {
        strong: 'Strong agreement',
        moderate: 'Moderate agreement',
        weak: 'Weak agreement',
      },
      confidence: {
        satellite: 'Model that uses satellite data (SMAP L4)',
        model: 'Model estimate (POWER)',
        no_data: 'Not enough data',
      },
    },
    sources: [
      {
        name: 'NASA SMAP L4 (SPL4SMGP v007)',
        used_for: 'Surface soil moisture, 0-5 cm layer',
        type: 'Land model that uses satellite data (not a direct measurement)',
        period: 'April 2015 to June 2025',
      },
    ],
    limits: ['Each calendar month has only about 10 values, so the split is approximate.'],
    footer: 'This tool helps you see the picture.',
    dataThrough: '2025-06',
  };
}

export function heatStressDetailResponse() {
  return {
    summary: {
      avg_high: 29.7,
      avg_low: 16.5,
      hottest: ['2024-06-14', 46.54],
      coldest: ['2017-01-10', 2.76],
      heat_days_per_year: 119.5,
      per_year: [105, 124, 105],
      per_month: [0, 0, 0.5, 3.4, 12.4, 20.8],
      longest_spell: [76, '2021-06-19'],
      unusual_hot: 142,
      unusual_cool: 72,
      trend_per_decade: 1,
    },
    comparison: {
      agreement: {
        months: 123,
        agree_months: 59,
        agree_pct: 48,
        chance_pct: 34,
        opposite_months: 18,
        level: 'moderate',
        gap_c: -2.2,
      },
      typicalYear: {
        wx: [19.4, 20.8, 24.4, 29, 33.7, 36.7],
        lst: [16.7, 18.5, 22.3, 28.6, 34.9, 35.4],
      },
    },
    texts: {
      q1: 'How did the heat compare each month?',
      a1: 'Each square compares that month with the same month in other years.',
      n1: 'A grey square means there is no data.',
      q2: 'What does a typical year look like?',
      a2: 'Both sources are hottest in summer.',
      n2: 'The weather high peaks in July.',
    },
    defaults: { thresholdC: 35, sigma: 2 },
    labels: {
      agreementLevels: {
        strong: 'Strong agreement',
        moderate: 'Moderate agreement',
        weak: 'Weak agreement',
      },
    },
    limits: ['Heat-stress day here means the daily high reached the threshold (35 °C).'],
    sources: [{ name: 'NASA POWER (daily weather)', used_for: 'Daily highest temperature' }],
    dataThrough: { weather: '2025-12', satellite: '2025-06' },
  };
}

export function landRiskDetailResponse(centerId: CenterId) {
  return {
    point: {
      id: centerId,
      name: 'Desouk',
      lat: 31.1326,
      lon: 30.6478,
      elevation_m: 11,
      slope_deg: 2.17,
      coast: { distance_km: 51, score: 1, status: 'Stable', measured: false },
      risk: {
        score: 1.75,
        scale_min: 1,
        scale_max: 3,
        level: 'Medium',
        level_code: 2,
        n_indicators: 4,
        indicators_used: ['ndvi', 'sm', 'heat', 'coast'],
        thresholds: { low_below: 1.7, medium_below: 2.4 },
      },
      signs: [
        {
          id: 'vegetation',
          question: 'Is vegetation declining?',
          unit: 'NDVI',
          status: 'Watch',
          score: 2,
          text: 'Slight tendency toward weaker vegetation, not statistically confirmed.',
        },
        {
          id: 'soil_moisture',
          question: 'Is the soil drying out?',
          unit: 'm3/m3',
          status: 'Alarming',
          score: 3,
          text: 'Soil moisture has dropped clearly over the years.',
        },
        {
          id: 'heat',
          question: 'Is it getting hotter?',
          unit: '°C',
          status: 'Stable',
          score: 1,
          text: 'Daytime land temperature has not risen in this period.',
        },
        {
          id: 'salinity',
          question: 'Coast exposure (distance only)',
          unit: 'km',
          status: 'Stable',
          score: 1,
          text: 'Salinity is not measured by satellite.',
        },
      ],
      report: {
        observed: ['There is a slight tendency toward weaker vegetation.'],
        meaning: ['A clear fall in soil moisture can point to gradual drying.'],
        verify: ['Whether the point really represents farmland'],
        confidence: 'Medium — the record is only 11 years long',
        summary: 'Desouk: medium desertification risk (score 1.75 of 3, based on 4 indicators).',
      },
    },
    chartCatalog: [
      { order: 1, id: 'risk_gauge', title: 'Desertification risk', type: 'gauge', subtitle: 'Composite score' },
      { order: 2, id: 'land_stress', title: 'Land stress by year', type: 'bar', subtitle: 'Harder than the normal' },
    ],
    statusColors: {
      stable: '#3f7d5c',
      watch: '#d9a23b',
      alarming: '#b8442f',
      low: '#3f7d5c',
      medium: '#d9a23b',
      high: '#b8442f',
    },
    method: {
      period: '2015-01 to 2025-12',
      scoring: 'Each indicator gets 1 (Stable), 2 (Watch) or 3 (Alarming).',
      risk_score: 'Mean of the available indicator scores.',
    },
  };
}
