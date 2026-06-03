import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// OAuth landing route. The auth service redirects here as
// /callback?code=<jwt>; we persist the token and send the user into the app.
export default function Callback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (code) {
      localStorage.setItem('auth_token', code)
    }
    navigate('/', { replace: true })
  }, [navigate, params])

  return <p className="menu-status">Signing you in…</p>
}
