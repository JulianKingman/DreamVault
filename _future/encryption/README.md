# Future: Application-Layer Encryption

These files implement encryption features that were built but never integrated
into production code paths. They are preserved here for future use.

## Files

- `crypto.ts` — AES-256-GCM per-field encryption using react-native-aes-gcm-crypto.
  Master key stored in SecureStore with biometric gating.
- `crypto-kyber.ts` — ML-KEM 768 (NIST post-quantum standard) key encapsulation.
  Designed to wrap the AES master key before syncing to iCloud.

## When to revisit

If Dream Vault needs:
- Local database encryption → see `specs/sqlcipher-migration.md` (preferred approach)
- End-to-end encrypted sync independent of Apple → integrate these files into `utils/sync.ts`

## Dependencies required

To use these files, re-add:
- `react-native-aes-gcm-crypto` (for crypto.ts)
- `crystals-kyber-js` (for crypto-kyber.ts)
