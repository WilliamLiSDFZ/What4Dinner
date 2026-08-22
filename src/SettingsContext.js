import { createContext } from 'react'

// { settings, setSettings, loading, error } for the family-scoped settings.
// Provided by Layout for the same reason as UserContext: /callback renders
// outside Layout, before a token exists, and a 401 there would bounce the user
// back to login mid sign-in.
export const SettingsContext = createContext()
