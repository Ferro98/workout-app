export type Role = 'client' | 'coach'
export type ExerciseType = 'weight' | 'bodyweight' | 'timed' | 'timed_weight'
export type DiffStatus = 'new' | 'modified' | 'removed' | 'unchanged'

// region --- AUTH SCHEMAS ---

export interface LoginPayload {
  username: string; // FastAPI usa 'username' di default per l'OAuth2, anche se è un'email
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'coach'; 
  coachId: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: number;
  email: string;
  name: string;
  role: Role;
}

// region --- STRUTTURE DI SUPPORTO / DIFF / STORICO ---

export interface DiffItem {
  field: string
  label: string
  prev: string | number
  curr: string | number
}

export interface SetDiff {
  setIndex: number
  changes: DiffItem[]   // es. [{field:'reps', label:'Rip', prev:8, curr:9}, ...]
  status: 'modified' | 'added' | 'removed'
}

export interface HistoryEntry {
  date: string
  detail: string
}

// region --- EXERCISE SCHEMAS ---

export interface Exercise {
  id: number
  name: string
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
  type: ExerciseType
}

// region -- PROGRAM / SCHEDA SCHEMAS ---

export interface TargetSet {
  setIndex: number
  rpe: number
  reps?: number           // se omesso, usa ProgramExercise.reps come fallback
  duration?: number       // durata totale serie in secondi
  tempoPerRep?: string    // es. "4-1-2-0" eccentrica-pausa-concentrica-pausa
  suggestedWeight?: string // es. "80" — suggerimento peso del coach
  restSeconds?: number    // override recupero dopo questa serie (sovrascrive restSeconds dell'esercizio)
  note?: string           // nota del coach su questa serie specifica
}

export interface TargetSetCreate {
  setIndex: number
  rpe: number
  reps?: number | null
  duration?: number | null
  tempoPerRep?: string | null
  suggestedWeight?: string | null
  restSeconds?: number | null
  note?: string | null
}

export interface ProgramExercise {
  id: number
  exerciseId: number
  sortOrder: number
  name: string
  type: ExerciseType
  sets: number
  reps: number | null       // default reps (fallback se TargetSet non lo specifica)
  duration: number | null   // default durata in secondi
  restSeconds: number       // recupero default tra serie
  targetSets: TargetSet[]   // uno per serie — fonte di verità
  notes: string | null      // nota del coach sull'esercizio
  diff: DiffStatus
  diffItems: DiffItem[]   // diff campi top-level (es. numero serie cambiato)
  setDiffs:  SetDiff[]    // diff per singola serie
  lastWeight: string | null
  history: HistoryEntry[]
}

export interface ProgramExerciseCreate {
  exerciseId: number
  sortOrder: number           // Aggiunto per allineamento col DB
  sets: number
  reps?: number | null
  duration?: number | null
  restSeconds: number
  notes?: string | null
  targetSets: TargetSetCreate[]
}

export interface ProgramDay {
  id: number
  dayIndex: number
  name: string
  focus: string
  exercises: ProgramExercise[]
  coachNote: string | null
}

export interface ProgramDayCreate {
  dayIndex: number
  name: string
  focus: string
  coachNote?: string | null
  exercises: ProgramExerciseCreate[]
}

export interface Program {
  id: number
  name: string
  clientId: number
  createdAt: string
  isActive: boolean
  coachNote: string | null
  days: ProgramDay[]
}

export interface ProgramCreate {
  name: string
  coachNote?: string | null
  days: ProgramDayCreate[]
  // clientId NON c'è, perché solitamente si passa nell'URL della chiamata API
}

// region --- WORKOUT / SESSION SCHEMAS ---

export interface WorkoutSetState {
  completed: boolean
  actualReps: string
  actualWeight: string   // solo numero, unità fissa kg
  actualRir: string
  note: string | null           // nota salvabile dal cliente su questa serie
}

export interface WorkoutExerciseState {
  programExerciseId: number
  sets: WorkoutSetState[]
  note: string | null           // nota generale sull'esercizio
}

export interface WorkoutSession {
  id: number
  programId: number
  programDayId: number
  programName: string
  dayName: string
  date: string
  durationSeconds: number | null
  exercises: WorkoutExerciseState[]
  generalNote: string | null
}

export interface SessionSetCreate {
  setIndex: number
  completed: boolean
  actualReps?: string | null
  actualWeight?: string | null
  actualRir?: string | null
  note?: string | null
}

export interface SessionExerciseCreate {
  programExerciseId: number
  sets: SessionSetCreate[]
  note?: string | null
}

export interface SessionCreate {
  programId: number
  programDayId: number
  date: string                   // Equivale a started_at
  endedAt?: string | null
  durationSeconds?: number | null
  generalNote?: string | null
  exercises: SessionExerciseCreate[]
}

// endregion

// region --- CLIENT ---

export interface Client {
  id: number
  name: string
  initials: string
  colorBg: string | null
  colorText: string | null
  activeProgramName: string | null
  lastSessionDate: string | null
  isActive: boolean
}