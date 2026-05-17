import React from 'react';
import {Link} from 'react-router-dom';
import {
  Activity,
  Coins,
  MessageCircle,
  MoonStar,
  Route,
  Trophy,
  UserRound,
  Waypoints,
} from 'lucide-react';
import {useI18n} from '../i18n';
import loopCardHero from '../images/hero_7.png';
import streetHuntCardHero from '../images/hero_21.png';
import nightRideCardHero from '../images/hero_24.png';

const HowToPage: React.FC = () => {
  const {t} = useI18n();

  const modeCards = [
    {
      key: 'loop',
      icon: <Route size={16} />,
      image: loopCardHero,
      title: t('legal.how.loop.title'),
      subtitle: t('legal.how.loop.subtitle'),
      bullets: [
        t('legal.how.loop.b1'),
        t('legal.how.loop.b2'),
        t('legal.how.loop.b3'),
      ],
    },
    {
      key: 'street',
      icon: <Waypoints size={16} />,
      image: streetHuntCardHero,
      title: t('legal.how.street.title'),
      subtitle: t('legal.how.street.subtitle'),
      bullets: [
        t('legal.how.street.b1'),
        t('legal.how.street.b2'),
        t('legal.how.street.b3'),
      ],
    },
    {
      key: 'night',
      icon: <MoonStar size={16} />,
      image: nightRideCardHero,
      title: t('legal.how.night.title'),
      subtitle: t('legal.how.night.subtitle'),
      bullets: [
        t('legal.how.night.b1'),
        t('legal.how.night.b2'),
        t('legal.how.night.b3'),
      ],
    },
  ];

  const interactionCards = [
    {
      key: 'wall',
      icon: <Waypoints size={16} />,
      title: t('legal.how.wall.title'),
      body: t('legal.how.wall.body'),
      link: '/wall',
      action: t('legal.how.wall.action'),
    },
    {
      key: 'board',
      icon: <Trophy size={16} />,
      title: t('legal.how.board.title'),
      body: t('legal.how.board.body'),
      link: '/leaderboard',
      action: t('legal.how.board.action'),
    },
    {
      key: 'discord',
      icon: <MessageCircle size={16} />,
      title: t('legal.how.community.title'),
      body: t('legal.how.community.intro'),
      link: '/#community',
      action: t('legal.how.community.action'),
    },
    {
      key: 'strava',
      icon: <Activity size={16} />,
      title: t('legal.how.strava.title'),
      body: t('legal.how.strava.body'),
      link: 'https://www.strava.com/clubs/1474882',
      action: t('legal.how.strava.action'),
    },
  ];

  const creditBullets = [
    t('legal.how.credits.b1'),
    t('legal.how.credits.b2'),
    t('legal.how.credits.b3'),
  ];

  const communityBullets = [
    t('legal.how.community.b1'),
    t('legal.how.community.b2'),
    t('legal.how.community.b3'),
  ];

  return (
    <section className="info-page-shell how-page-shell page-stage-enter">
      <div className="info-page-wrap how-page-wrap">
        <section className="how-section">
          <div className="how-section-head">
            <p className="info-page-eyebrow">{t('legal.how.eyebrow')}</p>
            <h1 className="how-page-title">{t('legal.how.title')}</h1>
            <p className="how-page-intro">{t('legal.how.intro')}</p>
          </div>
        </section>

        <section className="how-section">
          <div className="how-section-head">
            <h2 className="how-section-title">{t('legal.how.modesTitle')}</h2>
            <p className="how-section-copy">{t('legal.how.modesIntro')}</p>
          </div>
          <div className="how-mode-grid">
            {modeCards.map(card => (
              <article
                key={card.key}
                className="how-mode-card"
                style={
                  {
                    '--how-card-image': `url(${card.image})`,
                  } as React.CSSProperties
                }
              >
                <div className="how-mode-card-head">
                  <span className="how-mode-icon">{card.icon}</span>
                  <div className="how-mode-copy">
                    <h3 className="how-mode-title">{card.title}</h3>
                    <p className="how-mode-subtitle">{card.subtitle}</p>
                  </div>
                </div>
                <ul className="how-bullet-list">
                  {card.bullets.map(bullet => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section">
          <div className="how-section-head">
            <h2 className="how-section-title">
              {t('legal.how.interactionTitle')}
            </h2>
            <p className="how-section-copy">
              {t('legal.how.interactionIntro')}
            </p>
          </div>
          <div className="how-utility-grid">
            {interactionCards.map(card => (
              <article key={card.key} className="how-utility-card">
                <div className="how-utility-head">
                  <span className="how-mode-icon">{card.icon}</span>
                  <h3 className="how-utility-title">{card.title}</h3>
                </div>
                <p className="how-utility-body">{card.body}</p>
                {card.link.startsWith('http') ? (
                  <a
                    className="ghost-button small how-utility-action"
                    href={card.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{card.action}</span>
                  </a>
                ) : (
                  <Link
                    className="ghost-button small how-utility-action"
                    to={card.link}
                  >
                    <span>{card.action}</span>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="how-section">
          <div className="how-section-head">
            <h2 className="how-section-title">{t('legal.how.userTitle')}</h2>
            <p className="how-section-copy">{t('legal.how.userIntro')}</p>
          </div>

          <div className="how-stack-grid">
            <article className="how-detail-card">
              <div className="how-utility-head">
                <span className="how-mode-icon">
                  <UserRound size={16} />
                </span>
                <h3 className="how-utility-title">
                  {t('legal.how.account.title')}
                </h3>
              </div>
              <p className="how-utility-body">{t('legal.how.account.body')}</p>
              <Link
                className="ghost-button small how-utility-action"
                to="/account"
              >
                <span>{t('legal.how.account.action')}</span>
              </Link>
            </article>

            <article className="how-detail-card">
              <div className="how-utility-head">
                <span className="how-mode-icon">
                  <Coins size={16} />
                </span>
                <h3 className="how-utility-title">
                  {t('legal.how.credits.title')}
                </h3>
              </div>
              <p className="how-utility-body">{t('legal.how.credits.intro')}</p>
              <ul className="how-bullet-list how-bullet-list-tight">
                {creditBullets.map(bullet => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="how-detail-card how-detail-card-community">
            <div className="how-utility-head">
              <span className="how-mode-icon">
                <MessageCircle size={16} />
              </span>
              <h3 className="how-utility-title">
                {t('legal.how.community.title')}
              </h3>
            </div>
            <p className="how-utility-body">{t('legal.how.community.intro')}</p>
            <ul className="how-bullet-list how-bullet-list-tight">
              {communityBullets.map(bullet => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <a
              className="ghost-button small how-utility-action"
              href="/#community"
            >
              <span>{t('legal.how.community.action')}</span>
            </a>
          </article>
        </section>
      </div>
    </section>
  );
};

export default HowToPage;
