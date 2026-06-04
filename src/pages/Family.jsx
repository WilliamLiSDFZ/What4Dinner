import { useTranslation } from 'react-i18next'
import { familyMembers } from '../data'

export default function Family() {
  const { t } = useTranslation()

  return (
    <>
      <h1>{t('family.title')}</h1>
      <div className="family-grid">
        {familyMembers.map((member) => (
          <div className="family-card" key={member.name}>
            <div className="family-avatar">{member.initial}</div>
            <span className="family-name">{member.name}</span>
          </div>
        ))}
        <div className="family-card family-add-card" onClick={() => {}}>
          <div className="family-avatar family-add-avatar"><i className="bi-plus-lg" /></div>
          <span className="family-name">{t('family.addMember')}</span>
        </div>
      </div>
    </>
  )
}
