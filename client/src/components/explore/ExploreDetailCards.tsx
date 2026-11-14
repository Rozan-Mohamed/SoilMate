'use client';

import { BarChart3, CalendarRange, Droplets, ShieldAlert } from 'lucide-react';
import type { DetailLayer } from '@/components/explore/detail';
import { formatDay, formatNdvi } from '@/lib/explore/format';
import type {
  OverviewHeat,
  OverviewLandRisk,
  OverviewMonth,
  OverviewSoilMoisture,
  OverviewTile,
} from '@/lib/explore/types';
import { en } from '@/strings/en';
import { GlossaryText } from './GlossaryText';

type TileProps = {
  tiles: OverviewTile[];
  onOpenDetails?: (layer: DetailLayer) => void;
};

/** The four stat tiles of the selected area. */
export function ExploreStatTiles({ tiles, onOpenDetails }: TileProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <article key={tile.id} className="rounded-card bg-card p-4 shadow-card">
          <p className="text-xs font-bold text-ink-soft">
            <GlossaryText text={tile.label} />
          </p>
          <p className="mt-1 text-2xl font-extrabold text-deep">
            {tile.display}
            {tile.chip ? (
              <span className="ml-2 text-xs font-bold text-primary">{tile.chip.label}</span>
            ) : null}
          </p>
          {tile.id === 'crop_greenness' && onOpenDetails && (
            <button
              type="button"
              onClick={() => onOpenDetails('crop-health')}
              className="mt-2 text-xs font-extrabold text-primary underline underline-offset-2 hover:text-deep"
            >
              {en.explore.map.openDetails}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

export function ExploreHeatCard({ heat }: { heat: OverviewHeat }) {
  return (
    <Card
      title={heat.title}
      Icon={BarChart3}
      footer={
        <p className="text-xs text-ink-soft">{heat.source}</p>
      }
    >
      <dl className="grid grid-cols-2 gap-3">
        <Value label={en.explore.heat.averageHigh} value={`${heat.avgHighC} °C`} />
        <Value label={en.explore.heat.averageLow} value={`${heat.avgLowC} °C`} />
        <Value
          label={en.explore.heat.hottestDay}
          value={`${heat.hottestDay.tmaxC} °C`}
          hint={formatDay(heat.hottestDay.date)}
        />
        <Value label={en.explore.heat.daysPerYear} value={String(heat.heatDaysPerYear)} />
        <Value
          label={en.explore.heat.longestSpell}
          value={`${heat.longestHotSpell.days} ${en.explore.heat.days}`}
          hint={formatDay(heat.longestHotSpell.from)}
        />
        <Value
          label={en.explore.heat.trend}
          value={`${heat.trendPerDecadeC > 0 ? '+' : ''}${heat.trendPerDecadeC} °C`}
        />
      </dl>
      <p className="mt-3 text-xs text-ink-soft">{en.explore.notes.heatCaveat}</p>
    </Card>
  );
}

export function ExploreMonthsCard({ months }: { months: OverviewMonth[] }) {
  return (
    <Card title={en.explore.months.title} Icon={CalendarRange}>
      {months.length === 0 ? (
        <p className="text-sm text-ink-soft">{en.explore.empty.noMonths}</p>
      ) : (
        <ul className="space-y-2">
          {months.map((month) => (
            <li key={month.short} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-sm font-bold text-deep">{month.short}</span>
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: month.fillHex }}
              />
              <span className="text-sm font-extrabold text-ink">{formatNdvi(month.ndvi)}</span>
              <span className="text-xs text-ink-soft">{en.explore.months.ndvi}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ExploreMoistureCard({ soilMoisture }: { soilMoisture: OverviewSoilMoisture }) {
  return (
    <Card title={en.explore.moisture.title} Icon={Droplets}>
      <Needle
        label={en.explore.moisture.satellite}
        stateLabel={soilMoisture.satellite.label}
        needle={soilMoisture.satellite.needle}
        confidence={soilMoisture.confidenceLabels.satellite}
      />
      <Needle
        label={en.explore.moisture.model}
        stateLabel={soilMoisture.model.label}
        needle={soilMoisture.model.needle}
        confidence={soilMoisture.confidenceLabels.model}
        className="mt-4"
      />

      <p className="mt-4 text-sm text-ink-soft">{soilMoisture.texts.satelliteLine}</p>
      <p className="mt-1 text-sm text-ink-soft">{soilMoisture.texts.modelLine}</p>
      <p className="mt-2 text-sm text-ink-soft">{soilMoisture.texts.last12Line}</p>

      {soilMoisture.texts.disagreeNote && (
        <p className="mt-3 rounded-2xl bg-peach-soft px-3 py-2 text-sm font-semibold text-peach-ink">
          {soilMoisture.texts.disagreeNote}
        </p>
      )}

      {soilMoisture.texts.needleNote && (
        <p className="mt-3 text-xs text-ink-soft">{soilMoisture.texts.needleNote}</p>
      )}
    </Card>
  );
}

export function ExploreRiskCard({
  landRisk,
  onOpenDetails,
}: {
  landRisk: OverviewLandRisk;
  onOpenDetails?: (layer: DetailLayer) => void;
}) {
  return (
    <Card
      title={landRisk.title}
      Icon={ShieldAlert}
      footer={
        <>
          <p className="text-xs text-ink-soft">{landRisk.notice}</p>
          <p className="mt-1 text-xs font-bold text-primary">
            {en.explore.notes.differentMethods}
          </p>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-full"
          style={{ background: landRisk.levelHex }}
        />
        <p className="text-2xl font-extrabold text-deep">
          {landRisk.score}
          <span className="text-sm font-bold text-ink-soft">
            {' '}
            {en.explore.risk.outOf(landRisk.scaleMax)}
          </span>
        </p>
        <span className="rounded-full bg-mint-2 px-2.5 py-1 text-xs font-extrabold text-deep">
          {landRisk.level}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {landRisk.indicators.map((indicator) => (
          <li key={indicator.id} className="rounded-xl bg-mint-2/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-deep">{indicator.label}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-primary">
                {indicator.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">{indicator.text}</p>
          </li>
        ))}
      </ul>

      {onOpenDetails && (
        <button
          type="button"
          onClick={() => onOpenDetails('land-risk')}
          className="mt-3 text-xs font-extrabold text-primary underline underline-offset-2 hover:text-deep"
        >
          {en.explore.map.openDetails}
        </button>
      )}
    </Card>
  );
}

function Card({
  title,
  Icon,
  children,
  footer,
}: {
  title: string;
  Icon: typeof BarChart3;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-2 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-base font-extrabold text-deep">{title}</h3>
      </div>

      <div className="mt-3 flex-1">{children}</div>

      {footer && <div className="mt-3 border-t border-mint-3 pt-3">{footer}</div>}
    </article>
  );
}

function Value({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-bold text-ink-soft">{label}</dt>
      <dd className="text-lg font-extrabold text-deep">{value}</dd>
      {hint && <dd className="text-xs text-ink-soft">{hint}</dd>}
    </div>
  );
}

function Needle({
  label,
  stateLabel,
  needle,
  confidence,
  className = '',
}: {
  label: string;
  stateLabel: string;
  needle: number;
  confidence?: string;
  className?: string;
}) {
  const position = Math.min(100, Math.max(0, needle));

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-deep">{label}</p>
        <p className="text-sm font-extrabold text-primary">{stateLabel}</p>
      </div>

      <div className="relative mt-2 h-2.5 rounded-full bg-mint-3">
        <span
          aria-hidden="true"
          className="absolute -top-1 size-4 rounded-full border-2 border-white bg-primary shadow-card"
          style={{ left: `calc(${position}% - 8px)` }}
        />
      </div>

      <p className="mt-1 text-xs text-ink-soft">
        {en.explore.moisture.rank}
        {confidence ? ` · ${confidence}` : ''}
      </p>
    </div>
  );
}
