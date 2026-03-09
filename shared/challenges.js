const CHALLENGE_EXPIRY_DAYS = 14;

const getChallengeExpiry = (createdAt) => {
  const start = new Date(createdAt).getTime();
  return new Date(start + CHALLENGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
};

const deriveChallengeStatus = (challenge, leaderboard = []) => {
  if (!challenge?.created_at) return "open";
  const expiresAt = getChallengeExpiry(challenge.created_at);
  const hasExpired = Date.now() >= new Date(expiresAt).getTime();
  if (hasExpired) return "expired";

  const hasRivals = leaderboard.length >= 2;
  const hasOpenEntrants = leaderboard.some((entry) => entry.status !== "finished");
  if (hasRivals && !hasOpenEntrants) return "finished";
  return "open";
};

const buildChallengeSummary = ({ challenge, leaderboard = [], userId }) => {
  const status = deriveChallengeStatus(challenge, leaderboard);
  const winner = leaderboard.find((entry) => entry.best_seconds !== null) || null;
  const you = leaderboard.find((entry) => entry.user_id === userId) || null;
  const rivals = leaderboard.filter((entry) => entry.user_id !== userId && entry.best_seconds !== null);
  const nearestRival =
    you && you.best_seconds !== null && rivals.length
      ? [...rivals].sort((left, right) => Math.abs(left.best_seconds - you.best_seconds) - Math.abs(right.best_seconds - you.best_seconds))[0]
      : rivals[0] || null;

  let rivalry = "";
  if (you?.best_seconds !== null && nearestRival?.best_seconds !== null) {
    const delta = you.best_seconds - nearestRival.best_seconds;
    if (delta < 0) rivalry = `You are ahead of ${nearestRival.rider_name} by ${Math.abs(delta)}s.`;
    else if (delta > 0) rivalry = `${nearestRival.rider_name} is ahead of you by ${delta}s.`;
    else rivalry = `You and ${nearestRival.rider_name} are tied right now.`;
  } else if (winner?.user_id === userId) {
    rivalry = "You hold the fastest finished time.";
  } else if (winner) {
    rivalry = `${winner.rider_name} holds the fastest finished time.`;
  } else {
    rivalry = "No finished times yet.";
  }

  return {
    status,
    expires_at: challenge?.created_at ? getChallengeExpiry(challenge.created_at) : null,
    winner_user_id: winner?.user_id || null,
    winner_name: winner?.rider_name || null,
    best_seconds: winner?.best_seconds || null,
    rivalry,
  };
};

export { buildChallengeSummary, CHALLENGE_EXPIRY_DAYS, deriveChallengeStatus, getChallengeExpiry };
