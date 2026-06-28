export type PersonaId = 'elena' | 'marcus';

export interface PersonaProfile {
  id: PersonaId;
  displayName: string;
  shortName: string;
  role: string;
  lab: string;
  initials: string;
  avatarClass: string;
}

export const PERSONAS: Record<PersonaId, PersonaProfile> = {
  elena: {
    id: 'elena',
    displayName: 'Dr. Elena Vance',
    shortName: 'Elena',
    role: 'Wet-lab scientist',
    lab: 'Vance Lab',
    initials: 'EV',
    avatarClass: 'bg-brand-600',
  },
  marcus: {
    id: 'marcus',
    displayName: 'Marcus Chen',
    shortName: 'Marcus',
    role: 'Computational biologist',
    lab: 'Bioinformatics Core',
    initials: 'MC',
    avatarClass: 'bg-violet-600',
  },
};

export const DEFAULT_PERSONA_ID: PersonaId = 'elena';

export const DEFAULT_ACTOR = PERSONAS.elena.displayName;
export const PROTOCOL_AUTHOR = PERSONAS.marcus.displayName;

export function getPersona(id: PersonaId): PersonaProfile {
  return PERSONAS[id];
}

export function otherPersonaId(id: PersonaId): PersonaId {
  return id === 'elena' ? 'marcus' : 'elena';
}
