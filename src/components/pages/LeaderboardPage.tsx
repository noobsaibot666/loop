import {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {useI18n} from '../../i18n';
import Hero from '../Hero';
import {
  Trophy,
  MapPin,
  Users,
  Zap,
  Globe,
  Filter,
  X,
  ArrowRight,
  ChevronRight,
  Award,
} from 'lucide-react';

type PublicLeaderboardEntry = {
  user_id: string;
  rider_name: string;
  public_proofs: number;
  finished_runs: number;
  rank: number;
  is_community_member?: boolean;
};

type LeaderboardPageProps = {
  publicQuarterLabel: string;
  selectedLeaderboardCountry: string;
  setSelectedLeaderboardCountry: (value: string) => void;
  selectedLeaderboardCity: string;
  setSelectedLeaderboardCity: (value: string) => void;
  selectedLeaderboardCheckpointCount: string;
  setSelectedLeaderboardCheckpointCount: (value: string) => void;
  cityPresets: string[];
  toCitySlug: (value?: string) => string;
  getCityLabel: (value?: string) => string;
  isLoadingPublicLeaderboard: boolean;
  publicLeaderboard: PublicLeaderboardEntry[];
  onOpenRiderProfile: (userId?: string) => void;
  heroImage?: string;
};

const CITY_COUNTRY_MAP: Record<string, string> = {
  amsterdam: 'Netherlands',
  bangkok: 'Thailand',
  barcelona: 'Spain',
  berlin: 'Germany',
  bogota: 'Colombia',
  buenosaires: 'Argentina',
  chicago: 'United States',
  curitiba: 'Brazil',
  guarulhos: 'Brazil',
  krakow: 'Poland',
  london: 'United Kingdom',
  losangeles: 'United States',
  mexico: 'Mexico',
  mexicocity: 'Mexico',
  milan: 'Italy',
  munich: 'Germany',
  newyork: 'United States',
  paris: 'France',
  philadelphia: 'United States',
  sanfrancisco: 'United States',
  santos: 'Brazil',
  saopaulo: 'Brazil',
  seattle: 'United States',
  seoul: 'South Korea',
  taipei: 'Taiwan',
  tokyo: 'Japan',
  vienna: 'Austria',
  warsaw: 'Poland',
};

export default function LeaderboardPage({
  publicQuarterLabel,
  selectedLeaderboardCountry,
  setSelectedLeaderboardCountry,
  selectedLeaderboardCity,
  setSelectedLeaderboardCity,
  selectedLeaderboardCheckpointCount,
  setSelectedLeaderboardCheckpointCount,
  cityPresets,
  toCitySlug,
  getCityLabel,
  isLoadingPublicLeaderboard,
  publicLeaderboard,
  onOpenRiderProfile,
  heroImage,
}: LeaderboardPageProps) {
  const {t} = useI18n();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const countryOptions = useMemo(
    () => [t('continent.americas'), t('continent.europe'), t('continent.asia')],
    [t],
  );
  const filteredCityPresets = useMemo(() => {
    if (!selectedLeaderboardCountry) return cityPresets;
    const group = [
      {
        label: t('continent.americas'),
        names: [
          'Bogota',
          'Buenos Aires',
          'Chicago',
          'Curitiba',
          'Guarulhos',
          'Los Angeles',
          'Mexico City',
          'New York',
          'Philadelphia',
          'San Francisco',
          'Santos',
          'Sao Paulo',
          'Seattle',
        ],
      },
      {
        label: t('continent.europe'),
        names: [
          'Amsterdam',
          'Barcelona',
          'Berlin',
          'Krakow',
          'London',
          'Milan',
          'Munich',
          'Paris',
          'Vienna',
          'Warsaw',
        ],
      },
      {
        label: t('continent.asia'),
        names: ['Bangkok', 'Seoul', 'Taipei', 'Tokyo'],
      },
    ].find(g => g.label === selectedLeaderboardCountry);
    return group
      ? cityPresets.filter(c => group.names.includes(c))
      : cityPresets;
  }, [cityPresets, selectedLeaderboardCountry, t]);
  const cityGroups = useMemo(
    () =>
      [
        {
          label: t('continent.americas'),
          cities: filteredCityPresets
            .filter(city =>
              [
                'Bogota',
                'Buenos Aires',
                'Chicago',
                'Curitiba',
                'Guarulhos',
                'Los Angeles',
                'Mexico City',
                'New York',
                'Philadelphia',
                'San Francisco',
                'Santos',
                'Sao Paulo',
                'Seattle',
              ].includes(city),
            )
            .sort((a, b) => a.localeCompare(b)),
          anchor: 'leaderboard-city-group-americas',
        },
        {
          label: t('continent.europe'),
          cities: filteredCityPresets
            .filter(city =>
              [
                'Amsterdam',
                'Barcelona',
                'Berlin',
                'Krakow',
                'London',
                'Milan',
                'Munich',
                'Paris',
                'Vienna',
                'Warsaw',
              ].includes(city),
            )
            .sort((a, b) => a.localeCompare(b)),
          anchor: 'leaderboard-city-group-europe',
        },
        {
          label: t('continent.asia'),
          cities: filteredCityPresets
            .filter(city =>
              ['Bangkok', 'Seoul', 'Taipei', 'Tokyo'].includes(city),
            )
            .sort((a, b) => a.localeCompare(b)),
          anchor: 'leaderboard-city-group-asia',
        },
      ].filter(group => group.cities.length > 0),
    [filteredCityPresets, t],
  );
  const leaderboardProofs = publicLeaderboard.reduce(
    (sum, entry) => sum + entry.public_proofs,
    0,
  );
  const leaderboardFinishes = publicLeaderboard.reduce(
    (sum, entry) => sum + entry.finished_runs,
    0,
  );
  const activeScopeLabel = selectedLeaderboardCity
    ? getCityLabel(selectedLeaderboardCity)
    : selectedLeaderboardCountry || t('leaderboard.allCitiesLower');

  useEffect(() => {
    if (!showCityPicker) return;

    document.body.classList.add('menu-open-lock');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowCityPicker(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('menu-open-lock');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showCityPicker]);

  return (
    <div className="sequential-layout sub-page page-leaderboard page-stage-enter">
      <Hero
        title={t('leaderboard.title')}
        subtitle={t('leaderboard.subtitle')}
        image={heroImage || ''}
      />

      <section className="builder-grid single reveals">
        <div className="glass-card form-card leaderboard-shell">
          <div className="leaderboard-public-head" id="leaderboard-filter">
            <div className="leaderboard-head-copy">
              <div className="form-title accent-text">
                {publicQuarterLabel || t('leaderboard.currentQuarter')}
              </div>
              <div className="leaderboard-head-scope">
                <span>{t('leaderboard.currentFilter')}</span>
                <strong
                  className="accent-text-glow leaderboard-city-trigger"
                  onClick={() => setShowCityPicker(true)}
                >
                  {activeScopeLabel}
                </strong>
              </div>
            </div>
          </div>
          <div className="leaderboard-country-strip">
            <button
              type="button"
              className={`mini-chip ${selectedLeaderboardCountry === '' ? 'active' : ''}`}
              onClick={() => {
                setSelectedLeaderboardCountry('');
                setSelectedLeaderboardCity('');
              }}
            >
              {t('leaderboard.allContinents')}
            </button>
            {countryOptions.map(country => (
              <button
                key={country}
                type="button"
                className={`mini-chip ${selectedLeaderboardCountry === country ? 'active' : ''}`}
                onClick={() => {
                  setSelectedLeaderboardCountry(country);
                  setSelectedLeaderboardCity('');
                }}
              >
                {country}
              </button>
            ))}
          </div>
          <div className="leaderboard-country-strip wall-checkpoint-strip">
            <button
              type="button"
              className={`mini-chip ${selectedLeaderboardCheckpointCount === '' ? 'active' : ''}`}
              onClick={() => setSelectedLeaderboardCheckpointCount('')}
            >
              {t('common.all')}
            </button>
            {[4, 6, 8, 10, 12, 16].map(count => (
              <button
                key={count}
                type="button"
                className={`mini-chip ${selectedLeaderboardCheckpointCount === String(count) ? 'active' : ''}`}
                onClick={() =>
                  setSelectedLeaderboardCheckpointCount(String(count))
                }
              >
                {t('alleycat.stops', {count})}
              </button>
            ))}
          </div>
          {isLoadingPublicLeaderboard && (
            <div className="status-message">{t('leaderboard.loading')}</div>
          )}
          {!isLoadingPublicLeaderboard && publicLeaderboard.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Zap size={32} className="text-muted" />
              </div>
              <div className="empty-state-text">{t('leaderboard.empty')}</div>
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div className="result-grid result-grid-three leaderboard-summary-grid">
              <div className="leaderboard-stat-card">
                <Users size={16} className="text-muted" />
                <span>{t('leaderboard.rankedRiders')}</span>
                <strong>{publicLeaderboard.length}</strong>
              </div>
              <div className="leaderboard-stat-card leaderboard-stat-card-accent">
                <Zap size={16} className="text-accent" />
                <span>{t('leaderboard.totalProofs')}</span>
                <strong>{leaderboardProofs}</strong>
              </div>
              <div className="leaderboard-stat-card">
                <Trophy size={16} className="text-muted" />
                <span>{t('leaderboard.totalFinishes')}</span>
                <strong>{leaderboardFinishes}</strong>
              </div>
            </div>
          )}
          <div className="leaderboard-community-note">
            {t('leaderboard.communityNote')}
          </div>
          {publicLeaderboard.length > 0 && (
            <div className="winner-callout leaderboard-hero">
              <div className="leaderboard-hero-copy">
                <span className="winner-label">
                  {t('leaderboard.quarterLeader')}
                </span>
                <div className="leaderboard-hero-name">
                  <strong>{publicLeaderboard[0].rider_name}</strong>
                  <div className="achievement-badge gold animated-badge">
                    <Award size={14} />
                    <span>{t('leaderboard.loopLeader')}</span>
                  </div>
                </div>
                <span>
                  {t('leaderboard.proofsFinishes', {
                    proofs: publicLeaderboard[0].public_proofs,
                    finishes: publicLeaderboard[0].finished_runs,
                  })}
                </span>
              </div>
              <div className="leaderboard-hero-stats">
                <div className="leaderboard-hero-chip">
                  <span>{t('leaderboard.leaderShare')}</span>
                  <strong>
                    {Math.max(
                      1,
                      Math.round(
                        (publicLeaderboard[0].public_proofs /
                          Math.max(1, leaderboardProofs)) *
                          100,
                      ),
                    )}
                    %
                  </strong>
                </div>
                <div className="leaderboard-hero-chip">
                  <span>{t('leaderboard.avgProofs')}</span>
                  <strong>
                    {(
                      leaderboardProofs / Math.max(1, publicLeaderboard.length)
                    ).toFixed(1)}
                  </strong>
                </div>
              </div>
            </div>
          )}
          {publicLeaderboard.length > 1 && (
            <div className="leaderboard-podium" id="leaderboard-podium">
              {publicLeaderboard.slice(0, 3).map(entry => (
                <button
                  key={entry.user_id}
                  type="button"
                  className={`podium-card podium-${entry.rank}`}
                  onClick={() => onOpenRiderProfile(entry.user_id)}
                >
                  <div
                    className={`animated-rank-badge rank-${entry.rank} animated-badge ${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : 'bronze'}`}
                  >
                    <Award size={16} />
                  </div>
                  <span className="winner-label">
                    {t('leaderboard.top', {rank: entry.rank})}
                  </span>
                  <strong>{entry.rider_name}</strong>
                  <span>
                    {t('leaderboard.proofsFinishes', {
                      proofs: entry.public_proofs,
                      finishes: entry.finished_runs,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div
              className="leaderboard-list public-board"
              id="leaderboard-list"
            >
              {publicLeaderboard.map(entry => (
                <div
                  key={entry.user_id}
                  className={`leaderboard-row ${entry.rank <= 3 ? `rank-${entry.rank}-row` : ''}`}
                >
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div className="leaderboard-main">
                    <strong>
                      <button
                        className="inline-link-button"
                        type="button"
                        onClick={() => onOpenRiderProfile(entry.user_id)}
                      >
                        {entry.rider_name}
                      </button>
                    </strong>
                    <span>
                      {t('leaderboard.proofsFinishes', {
                        proofs: entry.public_proofs,
                        finishes: entry.finished_runs,
                      })}
                    </span>
                    <div className="leaderboard-meta-chips">
                      {entry.rank === 1 && (
                        <span className="achievement-badge gold animated-badge">
                          <Award size={12} /> {t('leaderboard.loopLeader')}
                        </span>
                      )}
                      {entry.finished_runs > 0 && (
                        <span className="achievement-badge silver">
                          <Zap size={12} /> {t('leaderboard.alleycatWinner')}
                        </span>
                      )}
                      {entry.is_community_member && (
                        <span className="achievement-badge community">
                          <Globe size={12} /> {t('leaderboard.hardChainCrew')}
                        </span>
                      )}
                      <span
                        className={`mini-chip active ${entry.rank <= 3 ? `rank-chip-${entry.rank}` : ''}`}
                      >
                        {t('leaderboard.top', {rank: entry.rank})}
                      </span>
                      {entry.finished_runs > 0 && (
                        <span className="mini-chip">
                          {t('leaderboard.closed', {
                            count: entry.finished_runs,
                          })}
                        </span>
                      )}
                      {entry.public_proofs > 0 && (
                        <span className="mini-chip">
                          {t('leaderboard.posted', {
                            count: entry.public_proofs,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCityPicker &&
        createPortal(
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-city-picker-title"
            onClick={() => setShowCityPicker(false)}
          >
            <div
              className="modal-card"
              onClick={event => event.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title" id="leaderboard-city-picker-title">
                  {t('leaderboard.chooseCity')}
                </div>
                <button
                  className="modal-close"
                  type="button"
                  aria-label={t('common.close')}
                  onClick={() => setShowCityPicker(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-actions city-picker-nav">
                {cityGroups.map(group => (
                  <a
                    key={group.anchor}
                    className="inline-link-button city-picker-anchor"
                    href={`#${group.anchor}`}
                  >
                    {group.label}
                  </a>
                ))}
              </div>
              <div className="modal-actions city-picker-actions">
                <button
                  className={`ghost-button ${selectedLeaderboardCity === '' ? 'active-filter-button' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedLeaderboardCity('');
                    setShowCityPicker(false);
                  }}
                >
                  {t('common.all')}
                </button>
                {cityGroups.map(group => (
                  <div
                    key={group.anchor}
                    className="city-picker-group"
                    id={group.anchor}
                  >
                    <div className="city-picker-group-title">{group.label}</div>
                    <div className="city-picker-group-grid">
                      {group.cities.map(city => (
                        <button
                          key={city}
                          className={`ghost-button ${selectedLeaderboardCity === toCitySlug(city) ? 'active-filter-button' : ''}`}
                          type="button"
                          onClick={() => {
                            const country =
                              CITY_COUNTRY_MAP[toCitySlug(city)] || '';
                            setSelectedLeaderboardCountry(country);
                            setSelectedLeaderboardCity(toCitySlug(city));
                            setShowCityPicker(false);
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setShowCityPicker(false)}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
