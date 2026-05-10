import { NavLink } from 'react-router-dom'
import {
    IconClipboardList,
    IconPlayerPlay,
    IconHistory,
    IconBarbell,
    IconUser,
    IconUsers,
    IconEdit,
    IconDatabase,
} from '@tabler/icons-react'
import type { Role } from '../../types'

const clientTabs = [
    { to: '/scheda', label: 'Scheda', Icon: IconClipboardList },
    { to: '/workout', label: 'Allena', Icon: IconPlayerPlay },
    { to: '/storico', label: 'Storico', Icon: IconHistory },
    { to: '/esercizi', label: 'Esercizi', Icon: IconBarbell },
    { to: '/profilo', label: 'Profilo', Icon: IconUser },
]

const coachTabs = [
    { to: '/clienti', label: 'Clienti', Icon: IconUsers },
    { to: '/editor', label: 'Schede', Icon: IconEdit },
    { to: '/esercizi', label: 'Esercizi', Icon: IconDatabase },
    { to: '/profilo', label: 'Profilo', Icon: IconUser },
]

interface Props {
    role: Role
}

export function TabBar({ role }: Props) {
    const tabs = role === 'client' ? clientTabs : coachTabs

    return (
        <nav className="flex border-t border-neutral-200 dark:border-neutral-800
                    bg-white dark:bg-neutral-950 pb-safe">
            {tabs.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] transition-colors
             ${isActive
                            ? 'text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Icon size={22} stroke={isActive ? 1.75 : 1.5} aria-hidden />
                            <span className={isActive ? 'font-medium' : ''}>{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}