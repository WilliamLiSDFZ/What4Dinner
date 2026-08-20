import { createContext } from 'react'

// { user, loading, error } for the signed-in profile. Provided by Layout — not
// App — because /callback renders outside Layout, before a token exists, and a
// 401 there would bounce the user back to login mid sign-in.
export const UserContext = createContext()
