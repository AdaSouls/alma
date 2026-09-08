import { useCallback, useEffect, useState } from "react";
import type { AlmaIdentity, CredentialEvidence, Delegation, Relationship } from "@adasouls/alma-core";

/**
 * Everything here lives in the browser's localStorage. This studio is a
 * reference client for the ALMA protocol, not the AdaSouls hosted API —
 * ALMA itself has no database (see the ALMA whitepaper and REPOSITORY.md);
 * a real deployment persists instance data in whatever implementation
 * (e.g. adasouls-api) hosts it.
 */
const STORAGE_KEY = "alma-identity-studio/v1";

interface StoreShape {
  identities: AlmaIdentity[];
  relationships: Relationship[];
  delegations: Delegation[];
  credentials: CredentialEvidence[];
}

const EMPTY: StoreShape = { identities: [], relationships: [], delegations: [], credentials: [] };

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
    resolve,
    clearAll,
  };
}
