import React from 'react';
import {Coffee, HeartHandshake} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useI18n} from '../i18n';

const CoffeePage: React.FC = () => {
  const {t} = useI18n();

  const supportBullets = [
    t('legal.coffee.item1'),
    t('legal.coffee.item2'),
    t('legal.coffee.item3'),
  ];

  const founders = [
    {
      key: 'alan',
      initials: 'AA',
      name: t('legal.coffee.alan.name'),
      role: t('legal.coffee.alan.role'),
      body: t('legal.coffee.alan.body'),
    },
    {
      key: 'joanna',
      initials: 'JO',
      name: t('legal.coffee.joanna.name'),
      role: t('legal.coffee.joanna.role'),
      body: t('legal.coffee.joanna.body'),
    },
    {
      key: 'emanuel',
      initials: 'EF',
      name: t('legal.coffee.emanuel.name'),
      role: t('legal.coffee.emanuel.role'),
      body: t('legal.coffee.emanuel.body'),
    },
  ];

  const collaborators = [
    '🇧🇷 Bruno Costa',
    '🇩🇪 Lena Bauer',
    '🇵🇱 Marek Nowak',
    '🇪🇸 Lucia Romero',
    '🇫🇷 Jules Martin',
    '🇳🇱 Noor de Vries',
    '🇺🇸 Maya Brooks',
    '🇲🇽 Diego Salazar',
    '🇦🇷 Sofia Acosta',
    '🇯🇵 Haru Tanaka',
    '🇰🇷 Minseo Park',
  ];

  return (
    <section className="info-page-shell coffee-page-shell page-stage-enter">
      <div className="info-page-wrap coffee-page-wrap">
        <section className="how-section">
          <div className="how-section-head">
            <p className="info-page-eyebrow">{t('legal.coffee.eyebrow')}</p>
            <h1 className="coffee-page-title">{t('legal.coffee.title')}</h1>
            <p className="coffee-page-intro">{t('legal.coffee.intro')}</p>
          </div>
        </section>

        <section className="coffee-support-grid">
          <article className="coffee-support-card">
            <div className="how-utility-head coffee-utility-head">
              <span className="how-mode-icon">
                <Coffee size={16} />
              </span>
              <div className="coffee-utility-copy">
                <h2 className="how-utility-title">
                  {t('legal.coffee.supportTitle')}
                </h2>
              </div>
            </div>
            <p className="how-utility-body">{t('legal.coffee.supportBody')}</p>
            <ul className="how-bullet-list how-bullet-list-tight">
              {supportBullets.map(bullet => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <a
              className="primary-button small how-utility-action coffee-support-action"
              href="https://buymeacoffee.com/js4mhwqrdjd"
              target="_blank"
              rel="noreferrer"
            >
              <span>{t('legal.coffee.action')}</span>
            </a>
          </article>

          <article className="coffee-support-card coffee-support-card-note">
            <div className="how-utility-head coffee-utility-head">
              <span className="how-mode-icon">
                <HeartHandshake size={16} />
              </span>
              <div className="coffee-utility-copy">
                <h2 className="how-utility-title">
                  {t('legal.coffee.whyTitle')}
                </h2>
              </div>
            </div>
            <p className="how-utility-body">{t('legal.coffee.whyBody')}</p>
            <p className="coffee-support-note">{t('legal.coffee.whyNote')}</p>
          </article>
        </section>

        <section className="how-section">
          <div className="how-section-head">
            <h2 className="how-section-title">
              {t('legal.coffee.peopleTitle')}
            </h2>
            <p className="how-section-copy">{t('legal.coffee.peopleIntro')}</p>
          </div>

          <div className="coffee-founder-grid">
            {founders.map(founder => (
              <article key={founder.key} className="coffee-founder-card">
                <div className="coffee-founder-photo" aria-hidden="true">
                  <span>{founder.initials}</span>
                </div>
                <div className="coffee-founder-copy">
                  <div className="coffee-founder-head">
                    <h3 className="how-utility-title">{founder.name}</h3>
                    <p className="coffee-founder-role">{founder.role}</p>
                  </div>
                  <p className="how-utility-body">{founder.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section">
          <div className="how-section-head">
            <h2 className="how-section-title">
              {t('legal.coffee.collabTitle')}
            </h2>
            <p className="how-section-copy">{t('legal.coffee.collabIntro')}</p>
          </div>
          <article className="coffee-support-card coffee-collab-note">
            <p className="how-utility-body">{t('legal.coffee.collabBody')}</p>
            <Link
              className="primary-button small how-utility-action coffee-support-action"
              to="/account#account-collaboration"
            >
              <span>{t('legal.coffee.collabAction')}</span>
            </Link>
          </article>
          <div className="coffee-collab-grid">
            {collaborators.map(name => (
              <article key={name} className="coffee-collab-card">
                <span>{name}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default CoffeePage;
