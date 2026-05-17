import React from 'react';
import {Link} from 'react-router-dom';

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro?: string;
  items?: string[];
  actions?: React.ReactNode;
}

const InfoPage: React.FC<InfoPageProps> = ({
  eyebrow,
  title,
  intro,
  items = [],
  actions,
}) => {
  return (
    <section className="info-page-shell page-stage-enter">
      <div className="info-page-wrap">
        <Link to="/" className="info-page-back">
          ← Back home
        </Link>
        <div className="info-page-card">
          <p className="info-page-eyebrow">{eyebrow}</p>
          <h1 className="info-page-title">{title}</h1>
          {intro ? <p className="info-page-intro">{intro}</p> : null}
          {items.length ? (
            <ul className="info-page-list">
              {items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {actions ? <div className="info-page-actions">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
};

export default InfoPage;
