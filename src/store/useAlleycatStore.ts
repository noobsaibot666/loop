import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  MessengerManifest, MessengerRun, AlleycatChallenge, AlleycatChallengeSummary, 
  AlleycatLeaderboardEntry, ProofDraft, MessengerCheckpoint, MessengerProof 
} from "../types";
import { ALLEYCAT_STORAGE_KEY, ALLEYCAT_PROOF_DRAFTS_KEY, API_BASE, PROOF_BUCKET } from "../config";
import { postJSON } from "../utils/routeUtils";
import { supabase } from "../config";

interface AlleycatConfig {
  city: string;
  location: string;
  selectedCoords: { lat: number; lng: number } | null;
  useGhost: boolean;
  difficulty: string;
  style: string;
  checkpointCount: number;
  range: number;
  unit: "km" | "mi";
}

interface AlleycatState {
  config: AlleycatConfig;
  manifest: MessengerManifest | null;
  run: MessengerRun | null;
  challenge: AlleycatChallenge | null;
  challengeSummary: AlleycatChallengeSummary | null;
  leaderboard: AlleycatLeaderboardEntry[];
  shareCode: string;
  shareCodeInput: string;
  
  proofDrafts: Record<string, ProofDraft>;
  proofVisibility: Record<string, boolean>;
  isUploading: Record<string, boolean>;
  isGenerating: boolean;
  isSharing: boolean;
  isLoadingShare: boolean;
  isSuggesting: boolean;
  suggestions: Array<{ label: string; lat: number; lng: number }>;
  status: string;
  
  // Actions
  setConfig: (config: Partial<AlleycatConfig>) => void;
  setManifest: (manifest: MessengerManifest | null) => void;
  setRun: (run: MessengerRun | null) => void;
  setStatus: (status: string) => void;
  setShareCodeInput: (value: string) => void;
  resetState: () => void;
  fetchSuggestions: (text: string) => Promise<void>;

  // API Actions
  generateManifest: (userId: string) => Promise<void>;
  startRun: (manifestId: string) => Promise<void>;
  checkIn: (checkpointId: string) => Promise<void>;
  finishRun: () => Promise<void>;
  abandonRun: () => Promise<void>;
  restartRun: () => Promise<void>;
  uploadProof: (checkpoint: MessengerCheckpoint, file: File | null) => Promise<void>;
  retryProofUploads: () => Promise<void>;
  createShareCode: () => Promise<void>;
  loadShareCode: () => Promise<boolean>;
  fetchLeaderboard: (userId: string) => Promise<void>;
  fetchRunState: (userId: string) => Promise<void>;
}

export const useAlleycatStore = create<AlleycatState>()(
  persist(
    (set, get) => ({
      config: {
        city: "",
        location: "",
        selectedCoords: null,
        useGhost: false,
        difficulty: "medium",
        style: "local",
        checkpointCount: 3,
        range: 5,
        unit: "km",
      },
      manifest: null,
      run: null,
      challenge: null,
      challengeSummary: null,
      leaderboard: [],
      shareCode: "",
      shareCodeInput: "",
      proofDrafts: {},
      proofVisibility: {},
      isUploading: {},
      isGenerating: false,
      isSharing: false,
      isLoadingShare: false,
      isSuggesting: false,
      suggestions: [],
      status: "",

      setConfig: (newConfig) => set((s) => ({ config: { ...s.config, ...newConfig } })),
      setManifest: (manifest) => set({ manifest }),
      setRun: (run) => set({ run }),
      setStatus: (status) => set({ status }),
      setShareCodeInput: (value) => set({ shareCodeInput: value }),
      resetState: () =>
        set({
          manifest: null,
          run: null,
          challenge: null,
          challengeSummary: null,
          leaderboard: [],
          shareCode: "",
          shareCodeInput: "",
          status: "",
          proofDrafts: {},
          proofVisibility: {},
          isUploading: {},
        }),

      fetchSuggestions: async (text) => {
        if (!text || text.length < 3) {
          set({ suggestions: [] });
          return;
        }
        if (get().config.selectedCoords) return;
        set({ isSuggesting: true });
        try {
          const geo = await postJSON<any>("/api/geocode", { text });
          const results =
            geo?.features?.slice(0, 5).map((feature: any) => ({
              label: feature?.properties?.label || feature?.properties?.name || "Unknown",
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0],
            })) || [];
          set({ suggestions: results });
        } catch {
          set({ suggestions: [] });
        } finally {
          set({ isSuggesting: false });
        }
      },

      generateManifest: async (userId) => {
        const { config } = get();
        set({ status: "alleycat.status.building", isGenerating: true });
        try {
          let origin = config.selectedCoords;
          if (!origin) {
            const geo = await postJSON<any>("/api/geocode", { text: config.location });
            const first = geo?.features?.[0];
            if (!first) throw new Error("start area required");
            origin = { lat: first.geometry.coordinates[1], lng: first.geometry.coordinates[0] };
            set((state) => ({
              config: {
                ...state.config,
                selectedCoords: origin,
              },
            }));
          }
          const rangeKm = config.unit === "km" ? config.range : config.range * 1.60934;
          const data = await postJSON<any>("/api/messenger/generate", {
            city: config.city,
            ghost_enabled: config.useGhost,
            difficulty: config.useGhost ? config.difficulty : null,
            style: config.style,
            checkpoint_count: config.checkpointCount,
            range_km: Number(rangeKm.toFixed(1)),
            start_label: config.location,
            start_lat: origin.lat,
            start_lng: origin.lng,
          });
          set({
            manifest: data.manifest,
            run: null,
            challenge: null,
            challengeSummary: null,
            leaderboard: [],
            shareCode: "",
            status: "alleycat.status.loaded",
            isGenerating: false,
            suggestions: [],
          });
        } catch (e) {
          set({ status: "alleycat.status.buildFailed", isGenerating: false });
        }
      },

      startRun: async (manifestId) => {
        try {
          const data = await postJSON<any>("/api/messenger/start", { manifest_id: manifestId });
          set({ 
            run: {
              runId: data.run_id,
              startedAt: data.started_at,
              completedIds: [],
              finishSeconds: null,
              finishedAt: null,
              status: "active",
            },
            status: "alleycat.status.clockLive" 
          });
        } catch (e) {
          set({ status: "alleycat.status.startFailed" });
        }
      },

      checkIn: async (checkpointId) => {
        const { run } = get();
        if (!run) return;
        set({ status: "alleycat.status.checkingLocation" });
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => 
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
          );
          const data = await postJSON<any>("/api/messenger/check-in", {
            run_id: run.runId,
            checkpoint_id: checkpointId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          set({ run: { ...run, completedIds: data.completed_ids }, status: "alleycat.status.checkpointClear" });
        } catch (e) {
          set({ status: "alleycat.status.checkInFailed" });
        }
      },

      finishRun: async () => {
        const { run } = get();
        if (!run) return;
        try {
          const data = await postJSON<any>("/api/messenger/finish", { run_id: run.runId });
          set({ 
            run: { ...run, finishSeconds: data.finish_seconds, finishedAt: data.finished_at, status: "finished" },
            status: "alleycat.status.runClosed"
          });
        } catch (e) {
          set({ status: "alleycat.status.finishFailed" });
        }
      },

      abandonRun: async () => {
        const { run } = get();
        if (!run) return;
        try {
          await postJSON("/api/messenger/abandon", { run_id: run.runId });
          set({ run: { ...run, status: "abandoned", finishedAt: new Date().toISOString() }, status: "alleycat.status.abandoned" });
        } catch (e) {
          set({ status: "alleycat.status.abandonFailed" });
        }
      },

      restartRun: async () => {
        const { manifest, run } = get();
        if (!manifest) return;
        try {
          const data = await postJSON<any>("/api/messenger/restart", { 
            manifest_id: manifest.id, 
            run_id: run?.runId || "" 
          });
          set({
            run: {
              runId: data.run.id,
              startedAt: data.run.started_at,
              completedIds: [],
              finishSeconds: null,
              finishedAt: null,
              status: data.run.status,
            },
            status: "alleycat.status.restarted"
          });
        } catch (e) {
          set({ status: "alleycat.status.restartFailed" });
        }
      },

      uploadProof: async (checkpoint, file) => {
        const { run, proofDrafts, proofVisibility } = get();
        if (!run || !supabase) return;
        
        const checkpointId = checkpoint.id;
        set((s) => ({ isUploading: { ...s.isUploading, [checkpointId]: true } }));
        
        try {
          let draft = proofDrafts[checkpointId];
          if (!draft && file) {
            const ext = file.name.split(".").pop();
            const path = `${checkpointId}-${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file);
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
            draft = {
              runId: run.runId,
              checkpointId,
              storagePath: path,
              publicUrl,
              isPublic: proofVisibility[checkpointId] !== false,
              fileName: file.name
            };
            set(s => ({ proofDrafts: { ...s.proofDrafts, [checkpointId]: draft } }));
          }

          if (draft) {
            const data = await postJSON<any>("/api/messenger/proof", {
              run_id: run.runId,
              checkpoint_id: checkpointId,
              storage_path: draft.storagePath,
              public_url: draft.publicUrl,
              is_public: draft.isPublic,
            });
            // Update run with proofs
            set(s => ({ 
              run: s.run ? { ...s.run, proofs: data.proofs } : null,
              proofDrafts: { ...s.proofDrafts, [checkpointId]: undefined } as any
            }));
          }
        } catch (e) {
          set({ status: "alleycat.status.proofFailed" });
        } finally {
          set((s) => ({ isUploading: { ...s.isUploading, [checkpointId]: false } }));
        }
      },

      retryProofUploads: async () => {
        const { proofDrafts, run } = get();
        if (!run) return;
        const draftIds = Object.keys(proofDrafts);
        if (draftIds.length === 0) return;

        for (const checkpointId of draftIds) {
          const draft = proofDrafts[checkpointId];
          if (!draft) continue;

          try {
            const data = await postJSON<any>("/api/messenger/proof", {
              run_id: run.runId,
              checkpoint_id: checkpointId,
              storage_path: draft.storagePath,
              public_url: draft.publicUrl,
              is_public: draft.isPublic,
            });
            set(s => ({ 
              run: s.run ? { ...s.run, proofs: data.proofs } : null,
              proofDrafts: { ...s.proofDrafts, [checkpointId]: undefined } as any
            }));
          } catch (e) {
            console.warn(`Retry failed for ${checkpointId}`);
          }
        }
      },

      createShareCode: async () => {
        const { manifest } = get();
        if (!manifest) return;
        set({ isSharing: true, status: "" });
        try {
          const data = await postJSON<any>("/api/messenger/share", {
            manifest_id: manifest.id,
          });
          set({
            challenge: data.challenge_id
              ? { id: data.challenge_id, code: data.code, status: "open" }
              : get().challenge,
            shareCode: data.code || get().shareCode,
            status: "share.ready",
          });
        } catch {
          set({ status: "share.createFailed" });
        } finally {
          set({ isSharing: false });
        }
      },

      loadShareCode: async () => {
        const rawCode = get().shareCodeInput.trim().toUpperCase();
        if (!rawCode) return false;
        set({ isLoadingShare: true, status: "" });
        try {
          const data = await postJSON<any>("/api/messenger/share", { code: rawCode });
          set({
            manifest: data.manifest || null,
            run: null,
            challenge: data.challenge_id
              ? { id: data.challenge_id, code: data.source_code || rawCode, status: "open" }
              : null,
            challengeSummary: null,
            leaderboard: [],
            shareCode: data.source_code || rawCode,
            shareCodeInput: rawCode,
            status: "alleycat.status.loaded",
          });
          return true;
        } catch {
          set({ status: "share.loadFailed" });
          return false;
        } finally {
          set({ isLoadingShare: false });
        }
      },

      fetchLeaderboard: async (userId) => {
        const { manifest, challenge } = get();
        if (!manifest && !challenge) return;
        try {
          const data = await postJSON<any>("/api/messenger/leaderboard", {
            challenge_id: challenge?.id || "",
            manifest_id: manifest?.id || "",
          });
          set({ 
            leaderboard: data.leaderboard || [],
            challengeSummary: data.summary || null
          });
        } catch {}
      },

      fetchRunState: async (userId) => {
        const { run } = get();
        if (!run) return;
        try {
          const data = await postJSON<any>("/api/messenger/run-state", { run_id: run.runId });
          set({
            manifest: data.manifest,
            challenge: data.challenge,
            run: {
              runId: data.run.id,
              startedAt: data.run.started_at,
              completedIds: data.run.completed_ids,
              finishSeconds: data.run.finish_seconds,
              finishedAt: data.run.finished_at,
              status: data.run.status,
            }
          });
        } catch {}
      }
    }),
    {
      name: "alleycat-storage",
      partialize: (state) => ({ 
        config: state.config, 
        manifest: state.manifest, 
        run: state.run, 
        challenge: state.challenge,
        shareCode: state.shareCode,
        shareCodeInput: state.shareCodeInput,
        proofDrafts: state.proofDrafts,
        proofVisibility: state.proofVisibility
      }),
    }
  )
);
