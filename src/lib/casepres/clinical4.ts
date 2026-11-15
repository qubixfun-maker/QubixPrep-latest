import type { Kb } from './clinical'
import { KB4A } from './clinical4a'
import { KB4B, KB4C, KB4D } from './clinical4b'
import { KB4E, KB4F } from './clinical4c'
import { KB4G, KB4H, KB4I } from './clinical4d'
import { KB4J } from './clinical4e'
import { KB4K } from './clinical4f'
import { KB4L } from './clinical4g'
import { KB4M, KB4N } from './clinical4h'
import { KB4O } from './clinical4i'

/** Method, purpose and positive/negative meaning for examination findings; used by findKb() to fill what older entries lack. */
export const KB4: Kb[] = [...KB4A, ...KB4B, ...KB4C, ...KB4D, ...KB4E, ...KB4F, ...KB4G, ...KB4H, ...KB4I, ...KB4J, ...KB4K, ...KB4L, ...KB4M, ...KB4N, ...KB4O]
