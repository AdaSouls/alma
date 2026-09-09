import { useCallback, useEffect, useState } from "react";
import type {
  AlmaIdentity,
  CredentialEvidence,
  Delegation,
  Relationship,
  ReputationEvidence,
} from "@adasouls/alma-core";

/**
 * Everything here lives in the browser's localStorage. This studio is a
 * reference client for the ALMA protocol, not the AdaSouls hosted API —
 * ALMA itself has no database (see the ALMA whitepaper and REPOSITORY.md);
 * a real deployment persists instance data in whatever implementation
 * (e.g. adasouls-api) hosts it.
 */
const STORAGE_KEY = "alma-identity-studio/v1";

/**
 * Illustrative only — NOT an ALMA concept. The real thing this stands in
 * for is an AgentInstance (docs/12-agent-lifecycle.md): a live binding of
 * an AgentDefinition to a runtime session. That's real future protocol
 * surface with its own lifecycle owner (adasouls-api), not something
 * alma-core models today — see docs/MASTER-ROADMAP.md's Phase 3/11 notes.
 * This is just a label + timestamp kept in the browser so the Explorer can
 * demonstrate "a Soul can have zero or one AI agent currently attached."
 */
export interface AgentBinding {
  label: string;
  attachedAt: string;
}

interface StoreShape {
  identities: AlmaIdentity[];
  relationships: Relationship[];
  delegations: Delegation[];
  credentials: CredentialEvidence[];
  reputationEvidence: ReputationEvidence[];
  agentBindings: Record<string, AgentBinding>;
}

const EMPTY: StoreShape = {
  identities: [],
  relationships: [],
  delegations: [],
  credentials: [],
  reputationEvidence: [],
  agentBindings: {},
};

function load(): StoreShape {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      identities: parsed.identities ?? [],
      relationships: parsed.relationships ?? [],
      delegations: parsed.delegations ?? [],
      credentials: parsed.credentials ?? [],
      reputationEvidence: parsed.reputationEvidence ?? [],
      agentBindings: parsed.agentBindings ?? {},
    };
  } catch {
    return EMPTY;
  }
}

function save(state: StoreShape) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private browsing, quota) — the studio
    // still works for the current render, it just won't persist.
  }
}

export function useAlmaStore() {
  const [state, setState] = useState<StoreShape>(() => load());

  useEffect(() => save(state), [state]);

  const addIdentity = useCallback((identity: AlmaIdentity) => {
    setState((s) => ({ ...s, identities: [...s.identities, identity] }));
  }, []);

  const addRelationship = useCallback((relationship: Relationship) => {
    setState((s) => ({ ...s, relationships: [...s.relationships, relationship] }));
  }, []);

  const addDelegation = useCallback((delegation: Delegation) => {
    setState((s) => ({ ...s, delegations: [...s.delegations, delegation] }));
  }, []);

  const replaceDelegation = useCallback((updated: Delegation) => {
    setState((s) => ({
      ...s,
      delegations: s.delegations.map((d) => (d.id === updated.id ? updated : d)),
    }));
  }, []);

  const addCredential = useCallback((credential: CredentialEvidence) => {
    setState((s) => ({ ...s, credentials: [...s.credentials, credential] }));
  }, []);

  const replaceCredential = useCallback((updated: CredentialEvidence) => {
    setState((s) => ({
      ...s,
      credentials: s.credentials.map((c) => (c.id === updated.id ? updated : c)),
    }));
  }, []);

  const addReputationEvidence = useCallback((evidence: ReputationEvidence) => {
    setState((s) => ({ ...s, reputationEvidence: [...s.reputationEvidence, evidence] }));
  }, []);

  const attachAgent = useCallback((identityId: string, label: string) => {
    setState((s) => ({
      ...s,
      agentBindings: {
        ...s.agentBindings,
        [identityId]: { label, attachedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const detachAgent = useCallback((identityId: string) => {
    setState((s) => {
      const rest = Object.fromEntries(
        Object.entries(s.agentBindings).filter(([id]) => id !== identityId)
      );
      return { ...s, agentBindings: rest };
    });
  }, []);

  const resolve = useCallback(
    (id: string) => state.identities.find((i) => i.id === id),
    [state.identities]
  );

  const clearAll = useCallback(() => setState(EMPTY), []);

  return {
    ...state,
    addIdentity,
    addRelationship,
    addDelegation,
    replaceDelegation,
    addCredential,
    replaceCredential,
    addReputationEvidence,
    attachAgent,
    detachAgent,
    resolve,
    clearAll,
  };
}
