import {formatDuration} from '../../utils/routeUtils';
import {useI18n} from '../../i18n';
import Hero from '../Hero';
import {
  User,
  MapPin,
  Zap,
  Trophy,
  Map,
  History,
  LayoutGrid,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle,
  Bike,
} from 'lucide-react';

type WallPost = {
  id: string;
  rider_name: string;
  city_name: string;
  checkpoint_name: string;
  location_label: string;
  bike_name?: string | null;
  bike_ratio?: string | null;
  public_url: string;
  created_at: string;
};

type PublicRiderProfile = {
  profile: {
    user_id: string;
    rider_name: string;
    home_location: string;
    bike_name: string;
    bike_ratio: string;
    is_community_member?: boolean;
  };
  stats: {
    public_proofs: number;
    finished_runs: number;
    cities: number;
    top_city: string;
    best_finish_seconds: number | null;
    quarter_rank: number | null;
    quarter_public_proofs: number;
    shared_challenges: number;
    rivals: number;
    last_active_at: string | null;
    proof_streak_days: number;
  };
  badges: {
    id: string;
    label: string;
    description: string;
  }[];
  recent_proofs: WallPost[];
  recent_runs: {
    id: string;
    city_name: string;
    manifest_title: string;
    finished_at: string;
    finish_seconds: number;
    ghost_delta: number | null;
  }[];
  recent_rivals: {
    user_id: string;
    rider_name: string;
    shared_challenges: number;
    cities: string[];
  }[];
  city_breakdown: {
    city_name: string;
    proof_count: number;
  }[];
  city_clusters: {
    city_name: string;
    proof_count: number;
    posts: WallPost[];
  }[];
  city_context: {
    city_name: string;
    rank: number | null;
    proof_count: number;
    finish_count: number;
    leaders: {
      user_id: string;
      rider_name: string;
      rank: number;
      public_proofs: number;
      finished_runs: number;
    }[];
  } | null;
};

type RiderProfilePageProps = {
  isLoadingPublicRiderProfile: boolean;
  publicRiderProfile: PublicRiderProfile | null;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
  onOpenRiderProfile: (userId?: string) => void;
  heroImage?: string;
};

export default function RiderProfilePage({
  isLoadingPublicRiderProfile,
  publicRiderProfile,
  onOpenWallCity,
  onOpenLeaderboardCity,
  onOpenRiderProfile,
  heroImage,
}: RiderProfilePageProps) {
  const {t, formatDate} = useI18n();
  const getProofLabel = (count: number) =>
    count === 1
      ? t('rider.proofCount', {count})
      : t('rider.proofCountPlural', {count});
  return (
    <div className="sequential-layout sub-page page-profile page-stage-enter">
      <Hero
        title={publicRiderProfile?.profile?.rider_name || t('rider.notFound')}
        subtitle={
          publicRiderProfile?.profile?.home_location || t('rider.subtitle')
        }
        image={heroImage || ''}
        actions={
          publicRiderProfile && (
            <div className="section-jump-strip">
              <a className="mini-chip active" href="#rider-stats">
                {t('rider.jump.stats')}
              </a>
              <a className="mini-chip" href="#rider-cities">
                {t('rider.jump.cities')}
              </a>
              <a className="mini-chip" href="#rider-standing">
                {t('rider.jump.standing')}
              </a>
              <a className="mini-chip" href="#rider-ledger">
                {t('rider.jump.ledger')}
              </a>
              <a className="mini-chip" href="#rider-proof">
                {t('rider.jump.proof')}
              </a>
            </div>
          )
        }
      />

      <section className="builder-grid single reveals">
        <div className="glass-card form-card rider-profile-card">
          {isLoadingPublicRiderProfile && (
            <div className="status-message">{t('rider.loading')}</div>
          )}
          {!isLoadingPublicRiderProfile && !publicRiderProfile && (
            <div className="empty-state">
              <div className="empty-state-title">{t('rider.notFound')}</div>
              <div className="empty-state-body">{t('rider.notFoundBody')}</div>
            </div>
          )}
          {publicRiderProfile && (
            <>
              <div className="rider-profile-hero">
                <div className="rider-profile-head">
                  <div className="rider-profile-title-row">
                    <div>
                      <div className="form-title">
                        {publicRiderProfile.profile.rider_name}
                      </div>
                      <div className="form-subtitle">
                        {publicRiderProfile.profile.home_location ||
                          publicRiderProfile.stats.top_city ||
                          t('rider.noCityTag')}
                      </div>
                    </div>
                    <div className="rider-profile-status-badges">
                      {publicRiderProfile.stats.quarter_rank === 1 && (
                        <div className="achievement-badge gold">
                          <Award size={14} /> {t('leaderboard.loopLeader')}
                        </div>
                      )}
                      {publicRiderProfile.stats.finished_runs > 0 && (
                        <div className="achievement-badge silver">
                          <CheckCircle size={14} />{' '}
                          {t('leaderboard.alleycatWinner')}
                        </div>
                      )}
                      {publicRiderProfile.profile.is_community_member && (
                        <div className="achievement-badge community">
                          <Globe size={14} /> {t('leaderboard.hardChainCrew')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rider-bike-tag">
                    <Bike size={16} />
                    <span>
                      {publicRiderProfile.profile.bike_name ||
                        t('rider.bikeNotSet')}
                    </span>
                    <strong>
                      {publicRiderProfile.profile.bike_ratio ||
                        t('rider.ratioNotSet')}
                    </strong>
                  </div>
                </div>

                {publicRiderProfile.recent_proofs?.[0] && (
                  <div className="rider-feature-card">
                    <img
                      src={publicRiderProfile.recent_proofs[0].public_url}
                      alt={`${publicRiderProfile.recent_proofs[0].checkpoint_name} by ${publicRiderProfile.profile.rider_name}`}
                      className="rider-feature-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="rider-feature-meta">
                      <span>{t('rider.latestWallHit')}</span>
                      <strong>
                        {publicRiderProfile.recent_proofs[0].checkpoint_name}
                      </strong>
                      <em>
                        {publicRiderProfile.recent_proofs[0].city_name} ·{' '}
                        {formatDate(
                          publicRiderProfile.recent_proofs[0].created_at,
                        )}
                      </em>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="result-grid result-grid-four rider-stat-grid"
                id="rider-stats"
              >
                <div className="rider-stat-item">
                  <Zap size={16} className="text-accent" />
                  <span>{t('rider.publicProofs')}</span>
                  <strong>{publicRiderProfile.stats.public_proofs}</strong>
                </div>
                <div className="rider-stat-item">
                  <CheckCircle size={16} />
                  <span>{t('rider.finishedRuns')}</span>
                  <strong>{publicRiderProfile.stats.finished_runs}</strong>
                </div>
                <div className="rider-stat-item">
                  <Award size={16} className="text-gold" />
                  <span>{t('rider.quarterRank')}</span>
                  <strong>
                    {publicRiderProfile.stats.quarter_rank
                      ? `#${publicRiderProfile.stats.quarter_rank}`
                      : '--'}
                  </strong>
                </div>
                <div className="rider-stat-item">
                  <Clock size={16} />
                  <span>{t('rider.bestFinish')}</span>
                  <strong>
                    {publicRiderProfile.stats.best_finish_seconds
                      ? formatDuration(
                          publicRiderProfile.stats.best_finish_seconds,
                        )
                      : '--:--'}
                  </strong>
                </div>
              </div>

              <div className="result-grid result-grid-three rider-stat-grid rider-stat-grid-secondary">
                <div className="rider-stat-item">
                  <Globe size={16} />
                  <span>{t('rider.citiesHit')}</span>
                  <strong>{publicRiderProfile.stats.cities}</strong>
                </div>
                <div className="rider-stat-item">
                  <TrendingUp size={16} />
                  <span>{t('rider.topCity')}</span>
                  <strong>{publicRiderProfile.stats.top_city || '--'}</strong>
                </div>
                <div className="rider-stat-item">
                  <Zap size={16} className="text-accent" />
                  <span>{t('rider.quarterProofs')}</span>
                  <strong>
                    {publicRiderProfile.stats.quarter_public_proofs}
                  </strong>
                </div>
              </div>

              <div className="rider-story-strip">
                <div className="mini-chip active">
                  {publicRiderProfile.stats.quarter_rank
                    ? t('rider.quarterHeat', {
                        rank: publicRiderProfile.stats.quarter_rank,
                      })
                    : t('rider.quarterHeatBuilding')}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.last_active_at
                    ? t('rider.lastActive', {
                        date: formatDate(
                          publicRiderProfile.stats.last_active_at,
                        ),
                      })
                    : t('rider.noRecentRun')}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.top_city
                    ? t('rider.mainLane', {
                        city: publicRiderProfile.stats.top_city,
                      })
                    : t('rider.cityStoryLoading')}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.proof_streak_days > 1
                    ? t('rider.proofStreak', {
                        count: publicRiderProfile.stats.proof_streak_days,
                      })
                    : publicRiderProfile.stats.public_proofs > 0
                      ? t('rider.freshProof')
                      : t('rider.noStreak')}
                </div>
              </div>

              {!!publicRiderProfile.city_breakdown?.length && (
                <>
                  <div className="rider-profile-proof-head" id="rider-cities">
                    <div className="form-title">{t('rider.cityLanes')}</div>
                    <div className="form-subtitle">
                      {t('rider.whereTheyHit')}
                    </div>
                  </div>
                  <div className="rider-city-grid">
                    {publicRiderProfile.city_breakdown.map(city => (
                      <div key={city.city_name} className="rider-city-card">
                        <span className="winner-label">
                          {getProofLabel(city.proof_count)}
                        </span>
                        <strong>{city.city_name}</strong>
                        <div className="rider-city-actions">
                          <button
                            className="ghost-button small"
                            type="button"
                            onClick={() => onOpenWallCity(city.city_name)}
                          >
                            {t('rider.openWall')}
                          </button>
                          <button
                            className="ghost-button small"
                            type="button"
                            onClick={() =>
                              onOpenLeaderboardCity(city.city_name)
                            }
                          >
                            {t('rider.cityBoard')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!!publicRiderProfile.city_clusters?.length && (
                <>
                  <div className="rider-profile-proof-head">
                    <div className="form-title">{t('rider.proofClusters')}</div>
                    <div className="form-subtitle">
                      {t('rider.whereTheyPost')}
                    </div>
                  </div>
                  <div className="rider-cluster-grid">
                    {publicRiderProfile.city_clusters.map(cluster => (
                      <div
                        key={cluster.city_name}
                        className="rider-cluster-card"
                      >
                        <div className="rider-cluster-head">
                          <div>
                            <span className="winner-label">
                              {getProofLabel(cluster.proof_count)}
                            </span>
                            <strong>{cluster.city_name}</strong>
                          </div>
                          <button
                            className="ghost-button small"
                            type="button"
                            onClick={() => onOpenWallCity(cluster.city_name)}
                          >
                            {t('rider.openWall')}
                          </button>
                        </div>
                        <div className="rider-cluster-images">
                          {cluster.posts.map(post => (
                            <img
                              key={post.id}
                              src={post.public_url}
                              alt={`${post.checkpoint_name} in ${cluster.city_name}`}
                              loading="lazy"
                              decoding="async"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {publicRiderProfile.city_context && (
                <>
                  <div className="rider-profile-proof-head" id="rider-standing">
                    <div className="form-title">{t('rider.cityStanding')}</div>
                    <div className="form-subtitle">
                      {t('rider.howTheyStack')}
                    </div>
                  </div>
                  <div className="rider-city-standing-card">
                    <div className="result-grid result-grid-three">
                      <div>
                        <span>{t('rider.lane')}</span>
                        <strong>
                          {publicRiderProfile.city_context.city_name}
                        </strong>
                      </div>
                      <div>
                        <span>{t('rider.quarterRank')}</span>
                        <strong>
                          {publicRiderProfile.city_context.rank
                            ? `#${publicRiderProfile.city_context.rank}`
                            : '--'}
                        </strong>
                      </div>
                      <div>
                        <span>{t('rider.postedClosed')}</span>
                        <strong>
                          {publicRiderProfile.city_context.proof_count} /{' '}
                          {publicRiderProfile.city_context.finish_count}
                        </strong>
                      </div>
                    </div>
                    {!!publicRiderProfile.city_context.leaders?.length && (
                      <div className="rider-city-leaders">
                        {publicRiderProfile.city_context.leaders.map(entry => (
                          <button
                            key={entry.user_id}
                            type="button"
                            className="rider-city-leader"
                            onClick={() => onOpenRiderProfile(entry.user_id)}
                          >
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
                    <div className="rider-city-actions">
                      <button
                        className="ghost-button small"
                        type="button"
                        onClick={() =>
                          onOpenWallCity(
                            publicRiderProfile.city_context?.city_name,
                          )
                        }
                      >
                        {t('rider.openCityWall')}
                      </button>
                      <button
                        className="ghost-button small"
                        type="button"
                        onClick={() =>
                          onOpenLeaderboardCity(
                            publicRiderProfile.city_context?.city_name,
                          )
                        }
                      >
                        {t('rider.openCityBoard')}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {publicRiderProfile.badges?.length > 0 && (
                <div className="badge-list">
                  {publicRiderProfile.badges.map(badge => (
                    <div key={badge.id} className="badge-chip">
                      <strong>{badge.label}</strong>
                      <span>{badge.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head" id="rider-ledger">
                <div className="form-title">{t('rider.runLedger')}</div>
                <div className="form-subtitle">
                  {t('rider.closedRunsGhostGaps')}
                </div>
              </div>
              {!publicRiderProfile.recent_runs?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">
                    {t('rider.noFinishedRuns')}
                  </div>
                </div>
              ) : (
                <div className="history-list rider-run-list">
                  {publicRiderProfile.recent_runs.map(run => (
                    <div key={run.id} className="history-row rider-run-row">
                      <div>
                        <strong>
                          {run.city_name || t('rider.cityFallback')} ·{' '}
                          {run.manifest_title}
                        </strong>
                        <span>{formatDate(run.finished_at)}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{formatDuration(run.finish_seconds)}</strong>
                        <span
                          className={
                            run.ghost_delta !== null && run.ghost_delta <= 0
                              ? 'good-time'
                              : 'slow-time'
                          }
                        >
                          {run.ghost_delta !== null
                            ? t('rider.vsGhost', {
                                delta: `${run.ghost_delta <= 0 ? '-' : '+'}${formatDuration(Math.abs(run.ghost_delta))}`,
                              })
                            : t('rider.noGhostSplit')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head">
                <div className="form-title">{t('rider.riderCircle')}</div>
                <div className="form-subtitle">
                  {t('rider.sharedCodesOnly')}
                </div>
              </div>
              {!publicRiderProfile.recent_rivals?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">
                    {t('rider.noSharedCrew')}
                  </div>
                </div>
              ) : (
                <div className="rider-rival-grid">
                  {publicRiderProfile.recent_rivals.map(rival => (
                    <button
                      key={rival.user_id}
                      type="button"
                      className="rider-rival-card"
                      onClick={() => onOpenRiderProfile(rival.user_id)}
                    >
                      <span className="winner-label">
                        {t('rider.sharedCodesLabel')}
                      </span>
                      <strong>{rival.rider_name}</strong>
                      <em>
                        {t('rider.runsTogether', {
                          count: rival.shared_challenges,
                        })}
                      </em>
                      <span>
                        {rival.cities.join(' · ') || t('rider.noCityTags')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head" id="rider-proof">
                <div className="form-title">{t('rider.recentProof')}</div>
                <div className="form-subtitle">{t('rider.latestHits')}</div>
              </div>
              {!publicRiderProfile.recent_proofs?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">
                    {t('rider.noPublicProof')}
                  </div>
                </div>
              ) : (
                <div className="wall-grid rider-proof-grid">
                  {publicRiderProfile.recent_proofs.map(post => (
                    <div key={post.id} className="glass-card wall-card">
                      <img
                        src={post.public_url}
                        alt={`${post.checkpoint_name} by ${post.rider_name}`}
                        className="wall-image"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="wall-meta">
                        <div className="checkpoint-meta">
                          <span>{t('wall.typeAlleycat')}</span>
                          <span>{post.city_name}</span>
                        </div>
                        <div className="checkpoint-name">{post.rider_name}</div>
                        <div className="wall-detail-grid">
                          <div>
                            <span>{t('wall.location')}</span>
                            <strong>
                              {post.location_label || post.city_name}
                            </strong>
                          </div>
                          <div>
                            <span>{t('wall.date')}</span>
                            <strong>{formatDate(post.created_at)}</strong>
                          </div>
                          <div>
                            <span>{t('wall.bike')}</span>
                            <strong>
                              {post.bike_name ||
                                publicRiderProfile.profile.bike_name ||
                                t('rider.bikeNotSet')}
                            </strong>
                          </div>
                          <div>
                            <span>{t('wall.ratio')}</span>
                            <strong>
                              {post.bike_ratio ||
                                publicRiderProfile.profile.bike_ratio ||
                                t('rider.ratioNotSet')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
