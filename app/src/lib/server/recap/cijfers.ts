/**
 * De dia's met cijfers na een recap-ronde: eerst het overzicht van
 * iedereen, dan één persoon per stap, in volgorde van de ranglijst.
 */
import type { CijfersSoort } from '$lib/content/types';
import type { Cijfers } from '$lib/shared/state';
import { publiek, type Analyse } from './analyse';
import { beoordeelVoorspellingen, type Omgeving } from './voorspellingen';
import { VOORSPELLINGEN } from '$lib/content/voorspellingen';

/** Het overzicht, plus één stap per persoon — of per voorspelling. */
export function aantalStappen(soort: CijfersSoort, analyse: Analyse): number {
  return (soort === 'voorspellingen' ? VOORSPELLINGEN.length : analyse.personen.length) + 1;
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
  };
}
