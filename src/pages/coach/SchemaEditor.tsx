import { useState, useRef } from 'react'
import {
    IconArrowLeft, IconPlus, IconTrash, IconGripVertical,
    IconChevronDown, IconChevronUp, IconAlertCircle, IconSearch,
    IconX, IconCheck, IconDeviceFloppy,
} from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { EXERCISES_DB } from '../../data/mock'
import type { Program, ProgramDay, ProgramExercise, TargetSet } from '../../types'

// ─────────────────────────────────────────────
// Tipi locali editor
// ─────────────────────────────────────────────

type EditorMode = 'direct' | 'new-version'

// Genera ID temporaneo per nuovi elementi
const tmpId = () => -(Date.now() + Math.random() * 1000 | 0)

function emptyTargetSet(setIndex: number): TargetSet {
    return { setIndex, rpe: 8, reps: 8 }
}

function emptyExercise(exerciseId: number, name: string): ProgramExercise {
    return {
        id: tmpId(), exerciseId, name,
        type: 'weight', sets: 3, reps: 8, duration: null, restSeconds: 90,
        notes: null, diff: 'new', diffItems: [], lastWeight: null, history: [],
        targetSets: [
            { setIndex: 0, rpe: 8, reps: 8 },
            { setIndex: 1, rpe: 8, reps: 8 },
            { setIndex: 2, rpe: 8, reps: 8 },
        ],
        setDiffs: []
    }
}

function emptyDay(dayIndex: number): ProgramDay {
    return {
        id: tmpId(), dayIndex,
        name: `Giorno ${String.fromCharCode(65 + dayIndex)}`,
        focus: '', coachNote: null, exercises: [],
    }
}

// ─────────────────────────────────────────────
// Modal selezione / creazione esercizio
// ─────────────────────────────────────────────

function ExercisePicker({ onSelect, onClose }: {
    onSelect: (id: number, name: string) => void
    onClose: () => void
}) {
    const [search, setSearch] = useState('')
    const [cat, setCat] = useState('tutti')
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [newCat, setNewCat] = useState<typeof EXERCISES_DB[0]['category']>('chest')

    const cats = ['tutti', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core']
    const catLabel: Record<string, string> = {
        tutti: 'Tutti', chest: 'Petto', back: 'Schiena', legs: 'Gambe',
        shoulders: 'Spalle', arms: 'Braccia', core: 'Core',
    }

    const filtered = EXERCISES_DB.filter(e =>
        (cat === 'tutti' || e.category === cat) &&
        e.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                    <IconX size={20} aria-hidden />
                </button>
                <p className="text-[16px] font-medium text-neutral-900 dark:text-neutral-100">
                    Aggiungi esercizio
                </p>
                <button onClick={() => setCreating(v => !v)}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                      border transition-colors
                      ${creating
                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                    <IconPlus size={13} aria-hidden />
                    {creating ? 'Annulla' : 'Crea nuovo'}
                </button>
            </div>

            {/* Form nuovo esercizio */}
            {creating && (
                <div className="px-4 py-4 border-b border-neutral-200 dark:border-neutral-800
                        bg-neutral-50 dark:bg-neutral-900 space-y-3">
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                        placeholder="Nome esercizio..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700
                       bg-white dark:bg-neutral-950 text-[14px] text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-400 outline-none" />
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {(Object.entries(catLabel) as [string, string][]).filter(([k]) => k !== 'tutti').map(([k, v]) => (
                            <button key={k} onClick={() => setNewCat(k as typeof newCat)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors
                            ${newCat === k
                                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={!newName.trim()}
                        onClick={() => {
                            const id = tmpId()
                            onSelect(id, newName.trim())
                        }}
                        className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100
                       text-white dark:text-neutral-900 text-[13px] font-medium
                       disabled:opacity-40 transition-opacity">
                        Crea e aggiungi
                    </button>
                </div>
            )}

            {/* Search + filtro categoria */}
            {!creating && (
                <>
                    <div className="px-4 pt-3 pb-0">
                        <div className="relative mb-3">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                               text-neutral-400 pointer-events-none" aria-hidden />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Cerca..."
                                className="w-full pl-8 pr-4 py-2 rounded-xl border border-neutral-200
                           dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                           text-[13px] text-neutral-900 dark:text-neutral-100
                           placeholder:text-neutral-400 outline-none" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-3">
                            {cats.map(c => (
                                <button key={c} onClick={() => setCat(c)}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors
                              ${cat === c
                                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent'
                                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                                    {catLabel[c]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4">
                        {filtered.map((e, i) => (
                            <button key={e.id} onClick={() => onSelect(e.id, e.name)}
                                className={`w-full flex items-center gap-3 py-3 text-left
                            ${i < filtered.length - 1
                                        ? 'border-b border-neutral-100 dark:border-neutral-800'
                                        : ''}`}>
                                <div className="flex-1">
                                    <p className="text-[14px] text-neutral-900 dark:text-neutral-100">{e.name}</p>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">
                                        {catLabel[e.category]} · {e.type === 'weight' ? 'Con peso' : e.type === 'bodyweight' ? 'Corpo libero' : 'Durata'}
                                    </p>
                                </div>
                                <IconPlus size={15} className="text-neutral-400 shrink-0" aria-hidden />
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-center text-[13px] text-neutral-400 pt-8">Nessun esercizio trovato</p>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Editor singola serie
// ─────────────────────────────────────────────

function TargetSetRow({ ts, isTimed, onChange, onDelete }: {
    ts: TargetSet; isTimed: boolean
    onChange: (updated: TargetSet) => void
    onDelete: () => void
}) {
    const inputCls = `w-full text-center text-[13px] py-1.5 rounded-lg border
    border-neutral-200 dark:border-neutral-700 bg-transparent
    text-neutral-900 dark:text-neutral-100
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
    [&::-webkit-inner-spin-button]:appearance-none`

    return (
        <div className="flex items-center gap-2 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <span className="w-5 text-[12px] text-neutral-400 shrink-0 text-center">
                {ts.setIndex + 1}
            </span>

            {/* Reps o durata */}
            <div className="flex-1">
                <input type="number" inputMode="numeric"
                    value={isTimed ? (ts.duration ?? '') : (ts.reps ?? '')}
                    onChange={e => onChange({
                        ...ts,
                        ...(isTimed ? { duration: Number(e.target.value) } : { reps: Number(e.target.value) })
                    })}
                    placeholder={isTimed ? 'sec' : 'rip'}
                    className={inputCls} />
                <p className="text-[10px] text-neutral-400 text-center mt-0.5">
                    {isTimed ? 'sec' : 'rip'}
                </p>
            </div>

            {/* RPE */}
            <div className="flex-1">
                <input type="number" inputMode="numeric" min={1} max={10}
                    value={ts.rpe}
                    onChange={e => onChange({ ...ts, rpe: Number(e.target.value) })}
                    className={inputCls} />
                <p className="text-[10px] text-neutral-400 text-center mt-0.5">RPE</p>
            </div>

            {/* Peso suggerito */}
            <div className="flex-1">
                <input type="text"
                    value={ts.suggestedWeight ?? ''}
                    onChange={e => onChange({ ...ts, suggestedWeight: e.target.value || undefined })}
                    placeholder="—"
                    className={inputCls} />
                <p className="text-[10px] text-neutral-400 text-center mt-0.5">~kg</p>
            </div>

            {/* Tempo */}
            <div className="flex-1">
                <input type="text"
                    value={ts.tempoPerRep ?? ''}
                    onChange={e => onChange({ ...ts, tempoPerRep: e.target.value || undefined })}
                    placeholder="—"
                    className={inputCls} />
                <p className="text-[10px] text-neutral-400 text-center mt-0.5">tempo</p>
            </div>

            {/* Recupero override */}
            <div className="flex-1">
                <input type="number" inputMode="numeric"
                    value={ts.restSeconds ?? ''}
                    onChange={e => onChange({ ...ts, restSeconds: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="—"
                    className={inputCls} />
                <p className="text-[10px] text-neutral-400 text-center mt-0.5">rec(s)</p>
            </div>

            <button onClick={onDelete}
                className="shrink-0 w-6 h-6 flex items-center justify-center
                   text-neutral-300 hover:text-red-500 transition-colors">
                <IconTrash size={13} aria-hidden />
            </button>
        </div>
    )
}

// ─────────────────────────────────────────────
// Editor singolo esercizio
// ─────────────────────────────────────────────

function ExerciseEditor({ ex, onChange, onDelete }: {
    ex: ProgramExercise
    onChange: (updated: ProgramExercise) => void
    onDelete: () => void
}) {
    const [open, setOpen] = useState(true)
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'

    const updateTargetSet = (i: number, updated: TargetSet) => {
        const ts = ex.targetSets.map((t, idx) => idx === i ? updated : t)
        onChange({ ...ex, targetSets: ts, sets: ts.length })
    }

    const addSet = () => {
        const nextIdx = ex.targetSets.length
        const last = ex.targetSets.at(-1)
        const newTs: TargetSet = { ...emptyTargetSet(nextIdx), ...(last ?? {}), setIndex: nextIdx }
        const ts = [...ex.targetSets, newTs]
        onChange({ ...ex, targetSets: ts, sets: ts.length })
    }

    const removeSet = (i: number) => {
        const ts = ex.targetSets
            .filter((_, idx) => idx !== i)
            .map((t, idx) => ({ ...t, setIndex: idx }))
        onChange({ ...ex, targetSets: ts, sets: ts.length })
    }

    return (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-2">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-3">
                <IconGripVertical size={16} className="text-neutral-300 shrink-0 cursor-grab" aria-hidden />
                <button className="flex-1 text-left" onClick={() => setOpen(v => !v)}>
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {ex.name}
                    </p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">
                        {ex.sets} serie · rec {ex.restSeconds}s
                    </p>
                </button>
                <button onClick={() => setOpen(v => !v)}
                    className="text-neutral-400 shrink-0 p-1">
                    {open ? <IconChevronUp size={15} aria-hidden /> : <IconChevronDown size={15} aria-hidden />}
                </button>
                <button onClick={onDelete}
                    className="text-neutral-300 hover:text-red-500 shrink-0 p-1 transition-colors">
                    <IconTrash size={15} aria-hidden />
                </button>
            </div>

            {open && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-3 py-3 space-y-3">

                    {/* Tipo + recupero default */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <p className="text-[11px] text-neutral-400 mb-1">Tipo</p>
                            <select value={ex.type}
                                onChange={e => onChange({ ...ex, type: e.target.value as ProgramExercise['type'] })}
                                className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700
                           bg-transparent text-[13px] text-neutral-900 dark:text-neutral-100">
                                <option value="weight">Con peso</option>
                                <option value="bodyweight">Corpo libero</option>
                                <option value="timed">Durata</option>
                                <option value="timed_weight">Durata + peso</option>
                            </select>
                        </div>
                        <div className="w-24">
                            <p className="text-[11px] text-neutral-400 mb-1">Rec. default (s)</p>
                            <input type="number" inputMode="numeric" value={ex.restSeconds}
                                onChange={e => onChange({ ...ex, restSeconds: Number(e.target.value) })}
                                className="w-full text-center px-2 py-1.5 rounded-lg border border-neutral-200
                           dark:border-neutral-700 bg-transparent text-[13px]
                           text-neutral-900 dark:text-neutral-100
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                    </div>

                    {/* Nota coach sull'esercizio */}
                    <div>
                        <p className="text-[11px] text-neutral-400 mb-1">Nota coach (visibile al cliente)</p>
                        <textarea value={ex.notes ?? ''}
                            onChange={e => onChange({ ...ex, notes: e.target.value || null })}
                            placeholder="Es: mantieni la schiena piatta..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700
                         bg-transparent text-[13px] text-neutral-900 dark:text-neutral-100
                         placeholder:text-neutral-400 resize-none" />
                    </div>

                    {/* Header colonne serie */}
                    <div>
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">
                            Serie
                        </p>
                        <div className="flex items-center gap-2 pb-1">
                            <span className="w-5" />
                            <span className="flex-1 text-[10px] text-neutral-400 text-center">
                                {isTimed ? 'sec' : 'rip'}
                            </span>
                            <span className="flex-1 text-[10px] text-neutral-400 text-center">RPE</span>
                            <span className="flex-1 text-[10px] text-neutral-400 text-center">~kg</span>
                            <span className="flex-1 text-[10px] text-neutral-400 text-center">tempo</span>
                            <span className="flex-1 text-[10px] text-neutral-400 text-center">rec(s)</span>
                            <span className="w-6" />
                        </div>

                        {ex.targetSets.map((ts, i) => (
                            <TargetSetRow key={i} ts={ts} isTimed={isTimed}
                                onChange={updated => updateTargetSet(i, updated)}
                                onDelete={() => removeSet(i)} />
                        ))}

                        <button onClick={addSet}
                            className="w-full mt-2 py-2 rounded-lg border border-dashed
                         border-neutral-200 dark:border-neutral-700
                         text-[12px] text-neutral-400 hover:text-neutral-600
                         dark:hover:text-neutral-300 transition-colors flex items-center
                         justify-center gap-1.5">
                            <IconPlus size={13} aria-hidden />
                            Aggiungi serie
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Editor giorno
// ─────────────────────────────────────────────

function DayEditor({ day, onChange, onDelete, onAddExercise }: {
    day: ProgramDay
    onChange: (updated: ProgramDay) => void
    onDelete: () => void
    onAddExercise: () => void
}) {
    const [open, setOpen] = useState(true)

    const updateExercise = (i: number, updated: ProgramExercise) => {
        onChange({ ...day, exercises: day.exercises.map((e, idx) => idx === i ? updated : e) })
    }
    const deleteExercise = (i: number) => {
        onChange({ ...day, exercises: day.exercises.filter((_, idx) => idx !== i) })
    }

    return (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-3">
            {/* Header giorno */}
            <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
                <button className="flex-1 text-left" onClick={() => setOpen(v => !v)}>
                    <input
                        type="text" value={day.name}
                        onChange={e => onChange({ ...day, name: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100
                       bg-transparent outline-none border-b border-transparent
                       hover:border-neutral-300 dark:hover:border-neutral-600 focus:border-neutral-400
                       dark:focus:border-neutral-500 transition-colors w-32"
                    />
                    <input
                        type="text" value={day.focus}
                        onChange={e => onChange({ ...day, focus: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        placeholder="Es: Petto / Tricipiti"
                        className="block text-[12px] text-neutral-400 bg-transparent outline-none
                       border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-600
                       focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors
                       placeholder:text-neutral-300 mt-0.5 w-full"
                    />
                </button>
                <button onClick={() => setOpen(v => !v)} className="text-neutral-400 p-1">
                    {open ? <IconChevronUp size={15} aria-hidden /> : <IconChevronDown size={15} aria-hidden />}
                </button>
                <button onClick={onDelete}
                    className="text-neutral-300 hover:text-red-500 transition-colors p-1">
                    <IconTrash size={15} aria-hidden />
                </button>
            </div>

            {open && (
                <div className="px-3 py-3">
                    {/* Nota coach sul giorno */}
                    <textarea value={day.coachNote ?? ''}
                        onChange={e => onChange({ ...day, coachNote: e.target.value || null })}
                        placeholder="Nota per il cliente su questo giorno (opzionale)..."
                        rows={1}
                        className="w-full px-3 py-2 mb-3 rounded-lg border border-neutral-200
                       dark:border-neutral-700 bg-transparent text-[13px]
                       text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-300 resize-none" />

                    {day.exercises.length === 0 && (
                        <p className="text-[13px] text-neutral-400 text-center py-4">
                            Nessun esercizio — aggiungine uno
                        </p>
                    )}

                    {day.exercises.map((ex, i) => (
                        <ExerciseEditor key={ex.id} ex={ex}
                            onChange={updated => updateExercise(i, updated)}
                            onDelete={() => deleteExercise(i)} />
                    ))}

                    <button onClick={onAddExercise}
                        className="w-full py-2.5 rounded-xl border border-dashed
                       border-neutral-200 dark:border-neutral-700
                       text-[13px] text-neutral-500 hover:text-neutral-700
                       dark:hover:text-neutral-300 transition-colors
                       flex items-center justify-center gap-2 mt-1">
                        <IconPlus size={14} aria-hidden />
                        Aggiungi esercizio
                    </button>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// SchemaEditor principale
// ─────────────────────────────────────────────

interface Props {
    program: Program
    mode: EditorMode
    clientName: string
    onBack: () => void
    onSave: (p: Program) => void
}

export function SchemaEditor({ program, mode, clientName, onBack, onSave }: Props) {
    const [draft, setDraft] = useState<Program>(() => ({
        ...program,
        name: mode === 'new-version'
            ? program.name.replace(/Settimana (\d+)/, (_, n) => `Settimana ${Number(n) + 1}`)
            : program.name,
        // deep clone giorni/esercizi per non mutare l'originale
        days: program.days.map(d => ({
            ...d,
            exercises: d.exercises.map(e => ({ ...e, targetSets: [...e.targetSets] })),
        })),
    }))

    const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

    const update = (updated: Program) => {
        setDraft(updated)
        setHasChanges(true)
    }

    const updateDay = (i: number, updated: ProgramDay) => {
        update({ ...draft, days: draft.days.map((d, idx) => idx === i ? updated : d) })
    }

    const deleteDay = (i: number) => {
        update({
            ...draft,
            days: draft.days
                .filter((_, idx) => idx !== i)
                .map((d, idx) => ({ ...d, dayIndex: idx })),
        })
    }

    const addDay = () => {
        update({ ...draft, days: [...draft.days, emptyDay(draft.days.length)] })
    }

    const handleExercisePicked = (exerciseId: number, name: string) => {
        if (pickerDayIdx === null) return
        const ex = emptyExercise(exerciseId, name)
        const day = draft.days[pickerDayIdx]
        updateDay(pickerDayIdx, { ...day, exercises: [...day.exercises, ex] })
        setPickerDayIdx(null)
    }

    const subtitle = mode === 'new-version'
        ? `Nuova versione · ${clientName}`
        : `Modifica diretta · ${clientName}`

    return (
        <>
            <div className="flex flex-col h-full">
                <TopBar
                    title={draft.name}
                    subtitle={subtitle}
                    right={
                        <button onClick={onBack}
                            className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                            <IconArrowLeft size={15} aria-hidden />Indietro
                        </button>
                    }
                />

                {/* Nome scheda + nota generale */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800
                        bg-white dark:bg-neutral-950 space-y-2">
                    <input type="text" value={draft.name}
                        onChange={e => update({ ...draft, name: e.target.value })}
                        className="w-full text-[16px] font-medium text-neutral-900 dark:text-neutral-100
                       bg-transparent outline-none border-b border-transparent
                       hover:border-neutral-300 dark:hover:border-neutral-600
                       focus:border-neutral-500 dark:focus:border-neutral-400 transition-colors" />
                    <textarea value={draft.coachNote ?? ''}
                        onChange={e => update({ ...draft, coachNote: e.target.value || null })}
                        placeholder="Nota generale per il cliente (opzionale)..."
                        rows={1}
                        className="w-full text-[13px] text-neutral-600 dark:text-neutral-400
                       bg-transparent outline-none resize-none
                       placeholder:text-neutral-300 dark:placeholder:text-neutral-600" />
                </div>

                {mode === 'new-version' && (
                    <div className="mx-4 mt-3 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl
                          flex items-start gap-2">
                        <IconAlertCircle size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden />
                        <p className="text-[12px] text-blue-700 dark:text-blue-300 leading-snug">
                            Stai creando una nuova versione. La scheda attuale diventerà storico e verrà generato il diff automaticamente al salvataggio.
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {draft.days.map((day, i) => (
                        <DayEditor key={day.id} day={day}
                            onChange={updated => updateDay(i, updated)}
                            onDelete={() => deleteDay(i)}
                            onAddExercise={() => setPickerDayIdx(i)} />
                    ))}

                    <button onClick={addDay}
                        className="w-full py-3 rounded-xl border border-dashed
                       border-neutral-200 dark:border-neutral-700
                       text-[13px] text-neutral-400 hover:text-neutral-600
                       dark:hover:text-neutral-300 transition-colors
                       flex items-center justify-center gap-2 mb-4">
                        <IconPlus size={14} aria-hidden />
                        Aggiungi giorno
                    </button>
                </div>

                {/* Footer salva */}
                <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800
                        bg-white dark:bg-neutral-950">
                    <button
                        onClick={() => onSave(draft)}
                        disabled={!hasChanges}
                        className="w-full py-3 rounded-xl text-[14px] font-medium transition-all
                       flex items-center justify-center gap-2
                       bg-neutral-900 dark:bg-neutral-100
                       text-white dark:text-neutral-900
                       disabled:opacity-40">
                        <IconDeviceFloppy size={16} aria-hidden />
                        {mode === 'new-version' ? 'Salva come nuova versione' : 'Salva modifiche'}
                    </button>
                </div>
            </div>

            {/* Exercise picker fullscreen */}
            {pickerDayIdx !== null && (
                <ExercisePicker
                    onSelect={handleExercisePicked}
                    onClose={() => setPickerDayIdx(null)}
                />
            )}
        </>
    )
}