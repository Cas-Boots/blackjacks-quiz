/**
 * De dia's met cijfers na een recap-ronde: eerst het overzicht van
 * iedereen, dan één persoon per stap, in volgorde van de ranglijst. Bij de
 * sport komt daar als laatste stap "Opvallend" achter, als er iets opvalt.
 */
import type { CijfersSoort } from '$lib/content/types';
import type { Cijfers } from '$lib/shared/state';
import { publiek, type Analyse } from './analyse';
import { opvallend } from './opvallend';
import { beoordeelVoorspellingen, type Omgeving } from './voorspellingen';
import { VOORSPELLINGEN } from '$lib/content/voorspellingen';

/** Het overzicht, plus één stap per persoon — of per voorspelling — en bij de sport de weetjes. */
export function aantalStappen(soort: CijfersSoort, analyse: Analyse): number {
  if (soort === 'voorspellingen') return VOORSPELLINGEN.length + 1;
  const weetjes = soort === 'sport' && opvallend(analyse).length ? 1 : 0;
  return analyse.personen.length + 1 + weetjes;
}

export function cijfersVoor(soort: CijfersSoort, analyse: Analyse, stap: number, omgeving: Omgeving): Cijfers {
  const stappen = aantalStappen(soort, analyse);
  const personen = [...analyse.personen]
    .sort((a, b) =>
      soort === 'sport'
        ? b.sport.totaal - a.sport.totaal || a.naam.localeCompare(b.naam)
        : b.taart.totaal - a.taart.totaal || b.landen.length - a.landen.length || a.naam.localeCompare(b.naam),
    )
    .map(publiek);
  return {
    soort,
    stap: Math.max(0, Math.min(stap, stappen - 1)),
    stappen,
    jaar: analyse.jaar,
    peildatum: analyse.peildatum,
    personen,
    voorspellingen: soort === 'voorspellingen' ? beoordeelVoorspellingen(omgeving) : undefined,
    opvallend: soort === 'sport' && stappen > personen.length + 1 ? opvallend(analyse) : undefined,
  };
}
