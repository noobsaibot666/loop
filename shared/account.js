const getRiderName = (userId, proofs = []) => {
  const sample = (proofs || []).find((proof) => proof.user_id === userId && proof.rider_name);
  if (sample?.rider_name) return sample.rider_name;
  return `Rider ${String(userId || "").slice(0, 4) || "anon"}`;
};

const buildAlleycatHistory = ({ manifests = [], runs = [], proofs = [] }) =>
  [...manifests]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 8)
    .map((manifest) => {
      const ghostSeconds = typeof manifest.ghost_seconds === "number" && manifest.ghost_seconds > 0 ? manifest.ghost_seconds : null;
      const manifestRuns = runs.filter((run) => run.manifest_id === manifest.id);
      const finishedRuns = manifestRuns.filter((run) => run.status === "finished" && typeof run.finish_seconds === "number");
      const bestRun = [...finishedRuns].sort((left, right) => (left.finish_seconds || 0) - (right.finish_seconds || 0))[0] || null;
      const manifestProofs = proofs
        .filter((proof) => proof.manifest_id === manifest.id)
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .map((proof) => ({
          id: proof.id,
          run_id: proof.run_id || undefined,
          checkpoint_id: proof.checkpoint_id,
          checkpoint_name: proof.checkpoint_name,
          public_url: proof.public_url,
          location_label: proof.location_label,
          is_public: proof.is_public,
          created_at: proof.created_at,
        }));
      const proofCount = manifestProofs.length;
      return {
        id: manifest.id,
        city_name: manifest.city_name,
        manifest_title: manifest.manifest_title,
        difficulty: manifest.difficulty,
        style: manifest.style,
        created_at: manifest.created_at,
        status: bestRun ? "finished" : manifestRuns.length ? "active" : "ready",
        best_seconds: bestRun?.finish_seconds || null,
        ghost_seconds: ghostSeconds,
        ghost_delta: bestRun && ghostSeconds !== null ? bestRun.finish_seconds - ghostSeconds : null,
        proof_count: proofCount,
        proofs: manifestProofs,
        source_challenge_id: manifest.source_challenge_id || null,
      };
    });

const buildChallengeHistory = ({ userId, entries = [], allEntries = [], challenges = [], manifests = [], runs = [] }) =>
  [...entries]
    .sort((left, right) => new Date(right.joined_at).getTime() - new Date(left.joined_at).getTime())
    .slice(0, 8)
    .map((entry) => {
      const challenge = challenges.find((item) => item.id === entry.challenge_id);
      const manifest = manifests.find((item) => item.id === entry.manifest_id);
      const bestRun = runs
        .filter((run) => run.manifest_id === entry.manifest_id && run.status === "finished" && typeof run.finish_seconds === "number")
        .sort((left, right) => (left.finish_seconds || 0) - (right.finish_seconds || 0))[0] || null;
      const rivalCount = allEntries.filter((item) => item.challenge_id === entry.challenge_id && item.user_id !== userId).length;
      return {
        challenge_id: entry.challenge_id,
        code: challenge?.code || "----",
        city_name: manifest?.city_name || "",
        manifest_title: manifest?.manifest_title || "",
        joined_at: entry.joined_at,
        status: bestRun ? "finished" : "open",
        best_seconds: bestRun?.finish_seconds || null,
        rival_count: rivalCount,
      };
    });

const buildSharedRiders = ({ userId, allEntries = [], challenges = [], manifests = [], proofs = [] }) => {
  const userChallengeIds = new Set(allEntries.filter((entry) => entry.user_id === userId).map((entry) => entry.challenge_id));
  const map = new Map();

  for (const entry of allEntries) {
    if (entry.user_id === userId || !userChallengeIds.has(entry.challenge_id)) continue;
    const current = map.get(entry.user_id) || {
      user_id: entry.user_id,
      rider_name: getRiderName(entry.user_id, proofs),
      shared_challenges: 0,
      last_joined_at: entry.joined_at,
      cities: new Set(),
    };
    current.shared_challenges += 1;
    current.last_joined_at = new Date(entry.joined_at) > new Date(current.last_joined_at) ? entry.joined_at : current.last_joined_at;
    const manifest = manifests.find((item) => item.id === entry.manifest_id);
    if (manifest?.city_name) current.cities.add(manifest.city_name);
    map.set(entry.user_id, current);
  }

  return [...map.values()]
    .map((entry) => ({
      user_id: entry.user_id,
      rider_name: entry.rider_name,
      shared_challenges: entry.shared_challenges,
      last_joined_at: entry.last_joined_at,
      cities: [...entry.cities],
    }))
    .sort((left, right) => {
      if (right.shared_challenges !== left.shared_challenges) return right.shared_challenges - left.shared_challenges;
      return new Date(right.last_joined_at).getTime() - new Date(left.last_joined_at).getTime();
    })
    .slice(0, 8);
};

export { buildAlleycatHistory, buildChallengeHistory, buildSharedRiders, getRiderName };
