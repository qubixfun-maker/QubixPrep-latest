import { FlaskConical, Stethoscope, Pill, Siren, MessagesSquare, Scissors, Droplets, Activity, Layers, type LucideIcon } from 'lucide-react'

// Config stores icon names as strings; add the lucide icon here when a new feature uses a new one.
const ICONS: Record<string, LucideIcon> = {
  FlaskConical,
  Stethoscope,
  Pill,
  Siren,
  MessagesSquare,
  Scissors,
  Droplets,
  Activity,
}

export function getFeatureIcon(name: string): LucideIcon {
  return ICONS[name] || Layers
}
