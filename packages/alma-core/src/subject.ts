import { z } from "zod";
import { unwrap } from "./errors.js";
import {
  SUBJECT_TYPES,
  type SubjectType,
  formatIdentifier,
  randomLocalId,
} from "./identifier.js";

/**
 * A controller or binding: a mechanism that currently controls or
 * represents a Subject, but is not the Subject's identity itself. See the
 * ALMA whitepaper §3.4 — an identifier is stable; controllers/bindings
 * (a DID, a wallet, an on-chain registry entry, a communication endpoint)
 * are free to change completely without the identifier changing.
 */
export const CONTROLLER_TYPES = ["did", "wallet", "erc8004", "endpoint", "other"] as const;
export type ControllerType = (typeof CONTROLLER_TYPES)[number];

export const controllerSchema = z.object({
  type: z.enum(CONTROLLER_TYPES),
  value: z.string().min(1),
  label: z.string().min(1).optional(),
});
export type Controller = z.infer<typeof controllerSchema>;

export const SUBJECT_STATUSES = ["active", "suspended", "retired"] as const;
export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];

/**
 * The minimal identity record. Everything else (delegations, credentials,
 * reputation evidence, relationships) is queried separately, not embedded,
 * so the core identity record stays small and cheap to resolve.
 */
export const almaIdentitySchema = z.object({
  id: z.string().min(1),
  subjectType: z.enum(SUBJECT_TYPES),
  displayName: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  status: z.enum(SUBJECT_STATUSES),
  /** The Principal this Subject represents, if any (almost always set for agents). */
  principal: z.string().min(1).optional(),
  controllers: z.array(controllerSchema).default([]),
});
export type AlmaIdentity = z.infer<typeof almaIdentitySchema>;

export interface CreateIdentityInput {
  network?: string;
  subjectType: SubjectType;
  displayName: string;
  /**
   * Explicit local-id. If omitted, a random one is made.
   *
   * An identifier is permanent and public, so it should say nothing
   * about its Subject: not a name, not an email address. A name can
   * change, can be claimed by someone else and, for a person, is personal
   * data; the display name is where it belongs. Pass a local-id only
   * when you have one of your own that is just as opaque.
   */
  localId?: string;
  principal?: string;
  controllers?: Controller[];
}

export function createIdentity(input: CreateIdentityInput): AlmaIdentity {
  const network = input.network ?? "main";
  const localId = input.localId ?? randomLocalId();

  const id = formatIdentifier({ network, subjectType: input.subjectType, localId });

  return unwrap(
    almaIdentitySchema.safeParse({
      id,
      subjectType: input.subjectType,
      displayName: input.displayName,
      createdAt: new Date().toISOString(),
      status: "active",
      principal: input.principal,
      controllers: input.controllers ?? [],
    }),
    "identity"
  );
}
