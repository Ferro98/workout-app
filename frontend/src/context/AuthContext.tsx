// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type UserMe } from '../types'
import { authService } from '../api/authService'

interface AuthCtx {
    user: UserMe | null
    loading: boolean
    logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserMe | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function init() {
            try {
                let token = localStorage.getItem('token')

                if (token) {
                    try {
                        const me = await authService.getMe()
                        setUser(me)
                        return
                    } catch (err) {
                        console.warn('[Auth] Il token in memoria è scaduto o non valido. Procedo al re-login...')
                        localStorage.removeItem('token')
                    }
                }

                await authService.login({ username: 'cliente@test.com', password: 'password123' })

                const me = await authService.getMe()
                setUser(me)
            } catch (e) {
                console.error('[Auth] Errore fatale durante l’autenticazione automatica:', e)
                localStorage.removeItem('token')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <Ctx.Provider value={{ user, loading, logout }}>
            {children}
        </Ctx.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}