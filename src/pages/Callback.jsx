import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCode } from '../api'

// OAuth landing route. The auth service redirects here as
// /callback?code=<short-lived code>; we exchange it for the real 60-minute
// token, persist that, and send the user into the app.
export default function Callback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = params.get('code')
    if (!code) {
      navigate('/', { replace: true })
      return
    }
    let active = true
    exchangeCode(code)
      .then((token) => {
        if (!active) return
        localStorage.setItem('auth_token', token)
        navigate('/', { replace: true })
      })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [navigate, params])

  if (error) {
    return <p className="menu-status menu-error">Sign-in failed: {error}</p>
  }
  return <p className="menu-status">Signing you in…</p>
}
