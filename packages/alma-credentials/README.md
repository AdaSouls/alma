# @adasouls/alma-credentials

The credential verification interface for [ALMA](https://github.com/AdaSouls/alma).
ALMA doesn't mandate one verification mechanism — a verifier might check a
W3C VC signature, resolve an SD-JWT issuer key, or query an ERC-8004
registry. This package defines the interface consumers code against.

```bash
npm install @adasouls/alma-credentials
```

```ts
import type { CredentialVerifier } from "@adasouls/alma-credentials";
import { stubVerifier } from "@adasouls/alma-credentials";

const result = await stubVerifier.verifyCredential(credential);
// { status: "verified" | "unverified" | "expired" | "revoked", reason?, verifiedAt }
```

**`stubVerifier` is a reference implementation, not real verification.**
Revoked and expired credentials short-circuit; self-asserted `alma-native`
credentials verify trivially; every other format stays `unverified` until
a real verifier exists for it. Don't treat its `verified` as a
cryptographic guarantee.

## License

MIT
