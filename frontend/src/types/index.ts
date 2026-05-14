export type Role = 'client' | 'coach'
export type ExerciseType = 'weight' | 'bodyweight' | 'timed' | 'timed_weight'
export type DiffStatus = 'new' | 'modified' | 'removed' | 'unchanged'

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

export interface Exercise {
  id: number
  name: string
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
  type: ExerciseType
}

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

export interface ProgramExercise {
  id: number
  exerciseId: number
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

export interface ProgramDay {
  id: number
  dayIndex: number
  name: string
  focus: string
  exercises: ProgramExercise[]
  coachNote: string | null
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

// --- Workout ---

export interface WorkoutSetState {
  completed: boolean
  actualReps: string
  actualWeight: string   // solo numero, unità fissa kg
  actualRir: string
  note: string           // nota salvabile dal cliente su questa serie
}

export interface WorkoutExerciseState {
  sets: WorkoutSetState[]
  note: string           // nota generale sull'esercizio
}

export interface WorkoutSession {
  id: number
  programId: number
  programDayId: number
  programName: string
  dayName: string
  date: string
  durationSeconds: number
  exercises: {
    programExerciseId: number
    sets: WorkoutSetState[]
    note: string
  }[]
  generalNote: string
}

export interface Client {
  id: number
  name: string
  initials: string
  colorBg: string
  colorText: string
  activeProgramName: string | null
  lastSessionDate: string | null
  isActive: boolean
}