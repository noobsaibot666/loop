const QUARTER_NAMES = ["Q1", "Q2", "Q3", "Q4"];

const getQuarterWindow = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const quarterIndex = Math.floor(month / 3);
  const start = new Date(Date.UTC(year, quarterIndex * 3, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, quarterIndex * 3 + 3, 1, 0, 0, 0, 0));
  return {
    start,
    end,
    label: `${QUARTER_NAMES[quarterIndex]} ${year}`,
  };
};

const isInWindow = (value, start, end) => {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
};

const computeTaskStreak = (proofs) => {
  const days = [...new Set((proofs || []).map((proof) => new Date(proof.created_at).toISOString().slice(0, 10)))].sort();
  let best = 0;
  let current = 0;
  let previous = null;

  for (const day of days) {
    const currentTime = Date.parse(`${day}T00:00:00.000Z`);
    if (previous !== null && currentTime - previous === 86400000) current += 1;
    else current = 1;
    previous = currentTime;
    best = Math.max(best, current);
  }

  return best;
};

const deriveBadges = ({ quarterStats, proofs, manifests, challenges }) => {
  const badges = [];
  const proofsByCity = new Map();
  for (const proof of proofs || []) {
    const current = proofsByCity.get(proof.city_name) || 0;
    proofsByCity.set(proof.city_name, current + 1);
  }
  const cityRegular = [...proofsByCity.values()].some((count) => count >= 3);
  const streak = computeTaskStreak(proofs || []);
  const hasChallengeClose = (challenges || []).some((item) => item.status === "finished" && item.source_challenge_id);

  if (streak >= 3) {
    badges.push({
      id: "task-streak",
      label: `${streak}-day streak`,
      description: "Kept proof coming on consecutive days.",
    });
  }
  if ((quarterStats?.finished_runs || 0) > 0) {
    badges.push({
      id: "quarter-finisher",
      label: "Quarter finisher",
      description: "Closed at least one Alleycat this quarter.",
    });
  }
  if (cityRegular) {
    const city = [...proofsByCity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "city";
    badges.push({
      id: "city-regular",
      label: `${city} regular`,
      description: "Posted enough proof in one city to own the patch.",
    });
  }
  if (hasChallengeClose) {
    badges.push({
      id: "challenge-closer",
      label: "Challenge closer",
      description: "Finished a shared Alleycat challenge.",
    });
  }
  if ((quarterStats?.rank || Infinity) <= 3) {
    badges.push({
      id: "top-task-maker",
      label: "Top task maker",
      description: "Currently inside the top 3 for the quarter.",
    });
  }

  return badges;
};

const buildQuarterLeaderboard = ({ proofs, finishedRuns, userLookup }) => {
  const riders = new Map();

  for (const proof of proofs || []) {
    if (!proof.user_id) continue;
    const current = riders.get(proof.user_id) || {
      user_id: proof.user_id,
      rider_name: userLookup?.get(proof.user_id)?.rider_name || proof.rider_name || "Rider",
      public_proofs: 0,
      finished_runs: 0,
      city_name: proof.city_name || "",
    };
    current.public_proofs += 1;
    current.rider_name = current.rider_name || proof.rider_name || "Rider";
    riders.set(proof.user_id, current);
  }

  for (const run of finishedRuns || []) {
    if (!run.user_id) continue;
    const current = riders.get(run.user_id) || {
      user_id: run.user_id,
      rider_name: userLookup?.get(run.user_id)?.rider_name || "Rider",
      public_proofs: 0,
      finished_runs: 0,
      city_name: "",
    };
    current.finished_runs += 1;
    riders.set(run.user_id, current);
  }

  const sorted = [...riders.values()].sort((a, b) => {
    if (b.public_proofs !== a.public_proofs) return b.public_proofs - a.public_proofs;
    if (b.finished_runs !== a.finished_runs) return b.finished_runs - a.finished_runs;
    return String(a.rider_name).localeCompare(String(b.rider_name));
  });

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

export { buildQuarterLeaderboard, deriveBadges, getQuarterWindow, isInWindow };
