import type { DiffStatus } from '../../types'

interface Props {
    status: DiffStatus
    compact?: boolean  // solo pallino, no testo
}

const config: Record<DiffStatus, { label: string; classes: string; dot: string }> = {
    new: { label: 'Nuovo', classes: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
    modified: { label: 'Modificato', classes: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
    removed: { label: 'Rimosso', classes: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
    unchanged: { label: 'Invariato', classes: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400' },
}

export function DiffBadge({ status, compact = false }: Props) {
    const c = config[status]
    if (status === 'unchanged') return null

    if (compact) {
        return (
            <span
                className={`inline-block w-2 h-2 rounded-full ${c.dot}`}
                title={c.label}
            />
        )
    }

    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.classes}`}>
            {c.label}
        </span>
    )
}