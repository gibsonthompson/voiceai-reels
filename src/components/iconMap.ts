/**
 * components/iconMap.ts
 *
 * Resolves spec IconName strings → lucide-react components, so ReelSpec stays
 * pure data (no imports), which keeps specs generatable / serializable.
 * Extend this map (and the IconName union in schema.ts) together.
 */

import {
  DollarSign, Users, TrendingUp, Phone, PhoneCall, Building, Gift, Banknote,
  Sparkles, Zap, Calendar, CheckCircle2, ArrowUpRight, Bot, Clock, LucideIcon,
} from 'lucide-react';
import { IconName } from '../specs/schema';

export const ICONS: Record<IconName, LucideIcon> = {
  DollarSign, Users, TrendingUp, Phone, PhoneCall, Building, Gift, Banknote,
  Sparkles, Zap, Calendar, CheckCircle2, ArrowUpRight, Bot, Clock,
};

export function resolveIcon(name?: IconName): LucideIcon {
  return (name && ICONS[name]) || Sparkles;
}
