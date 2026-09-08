# Legacy: ALDEA soulbound minting site

This directory holds the original contents of this repository: a React/Vite
site for minting paid, non-transferable "$ALMA" reputation NFTs on Cardano
for ALDEA DAO (5 ADA-priced tiers, Aiken smart contracts in the sibling
`AdaSouls/Cardano-Soulbound` repo, CIP-0888).

It predates, and is unrelated to, the ALMA protocol (portable economic
identity for humans, organizations, and agents) described in the current
top-level `README.md` and implemented in `packages/` and `apps/`. It is kept
here, untouched, rather than deleted, in case the Cardano/wallet integration
work is useful later — for example, a Cardano wallet address is exactly the
kind of thing the new protocol models as an identity **controller/binding**
(see the ALMA whitepaper, §3.4), not as the identity mechanism itself.

Nothing in this directory is part of the ALMA protocol implementation.
