---
"@adasouls/alma-core": minor
---

Payment authorizations (`alma-payment-authorization/1`): the issuer's permission for one payment out of an agent's Safe, checked on-chain by the AdaSouls payment module. The issuer signs a 32-byte SHA-256 digest of fields packed as Solidity's `abi.encodePacked` does, so a contract can rebuild it, rather than canonical JSON. New: `paymentAuthorizationSchema`, `paymentAuthorizationDigest`, `signPaymentAuthorization`, `verifyPaymentAuthorization`. Existing envelopes are unchanged.
