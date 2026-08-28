/**
 * engine/ReelRenderer.tsx
 *
 * Given a ReelSpec, resolves mode + background, builds the (always-emerald brand)
 * theme, and renders the matching template. Single entry point per composition.
 *
 * COLOR: brand emerald only. The sole variation is mode (dark default / light).
 * mode resolves as: spec.mode → else seeded (most reels dark; ~1 in 4 light).
 *
 * To add a template: import it and add a case to the switch.
 */

import React from 'react';
import { ReelSpec } from '../specs/schema';
import { buildTheme } from '../theme/buildTheme';
import { brandPalette } from '../theme/palettes';
import { Background, BACKGROUND_VARIANTS, BackgroundVariant } from './Background';
import { SeededRandom } from './seed';
import { CounterHero } from '../templates/CounterHero';
import { StatPunch } from '../templates/StatPunch';
import { ProductDemo } from '../templates/ProductDemo';
import { KineticStatement } from '../templates/KineticStatement';
import { CallFlow } from '../templates/CallFlow';
import { BeforeAfter } from '../templates/BeforeAfter';
import { StatementStack } from '../templates/StatementStack';
import { DashboardShowcase } from '../templates/DashboardShowcase';

export const ReelRenderer: React.FC<{ spec: ReelSpec }> = ({ spec }) => {
  const rng = new SeededRandom(spec.seed);

  // Mode: explicit, else seeded. Keep dark dominant (light ~25% for variety).
  const mode: 'dark' | 'light' = spec.mode ?? (rng.next() < 0.25 ? 'light' : 'dark');
  const palette = brandPalette(mode);
  const theme = buildTheme(mode, palette);

  // Background variant: explicit, else seeded.
  const background: BackgroundVariant = spec.background ?? rng.pick(BACKGROUND_VARIANTS);

  switch (spec.template) {
    case 'CounterHero':
      return <CounterHero spec={spec} theme={theme} background={background} />;
    case 'StatPunch':
      return <StatPunch spec={spec} theme={theme} background={background} />;
    case 'ProductDemo':
      return <ProductDemo spec={spec} theme={theme} background={background} />;
    case 'KineticStatement':
      return <KineticStatement spec={spec} theme={theme} background={background} />;
    case 'CallFlow':
      return <CallFlow spec={spec} theme={theme} background={background} />;
    case 'BeforeAfter':
      return <BeforeAfter spec={spec} theme={theme} background={background} />;
    case 'StatementStack':
      return <StatementStack spec={spec} theme={theme} background={background} />;
    case 'DashboardShowcase':
      return <DashboardShowcase spec={spec} theme={theme} background={background} />;
    // TODO: QuestionHook, SplitContrast, LogoAssembly.
    default:
      return <CounterHero spec={spec} theme={theme} background={background} />;
  }
};
