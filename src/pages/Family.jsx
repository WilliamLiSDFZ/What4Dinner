import { useState, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { getFamily } from '../api'
import { UserContext } from '../UserContext'

export default function Family() {
  const { t } = useTranslation()
  const { user } = useContext(UserContext)
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getFamily()
      .then((data) => { if (active) setFamily(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const members = family?.members ?? []

  return (
    <>
      <h1>{t('family.title')}</h1>
      {family?.familyName && <p className="family-subtitle">{family.familyName}</p>}
      {loading && <p className="menu-status">{t('family.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('family.error', { message: error })}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="menu-status">{t('family.empty')}</p>
      )}
      {!loading && !error && (
        <div className="family-grid">
          {members.map((member) => (
            <div className="family-card" key={member.id}>
              <div className="family-avatar">{member.username.charAt(0).toUpperCase()}</div>
              <span className="family-name">{member.username}</span>
              {user && member.id === user.id && <span className="family-you">{t('family.you')}</span>}
            </div>
          ))}
          {/* No endpoint to invite or add a member yet — the card is a placeholder. */}
          <div className="family-card family-add-card" onClick={() => {}}>
            <div className="family-avatar family-add-avatar"><i className="bi-plus-lg" /></div>
            <span className="family-name">{t('family.addMember')}</span>
          </div>
        </div>
      )}
    </>
  )
}
