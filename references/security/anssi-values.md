# Values you must not improvise

TLS versions and cipher suites, key sizes, hash functions, password storage, random values. Each value below was read in the ANSSI guide named next to it and is given with its recommendation identifier. When a guide gives no value, this file says so and marks the value chosen by the skill `[best practice]` with its reason.

## How to use this file

1. Copy values from here, never from memory, from a tutorial or from another skill. A wrong cipher suite or hashing parameter copied into many sites is a real risk.
2. If you need a value that is not in this file, do not invent one: use the library's documented default, say in the report that no ANSSI value exists, and list it as "to confirm".
3. Guides used (texts recorded in [../sources.json](../sources.json); versions and dates in [../regulatory-status.md](../regulatory-status.md) section 4):

| Tag | Guide |
|-----|-------|
| `ANSSI WEB` | ANSSI-PA-009, website security, browser side |
| `ANSSI TLS` | Recommandations de sécurité relatives à TLS (SDE-NT-35) |
| `ANSSI MFA` | ANSSI-PG-078, multi-factor authentication and passwords |
| `ANSSI CRYPTO` | ANSSI-PG-083, choice and sizing of cryptographic mechanisms |

`ANSSI CRYPTO` identifiers are names, not numbers (for example `RègleHachage`); a number after a dot is an item of that rule (`RègleFactorisation.2`). Rules (`Règle…`) are minimums; recommendations (`Reco…`) are the preferred level.

Precedence: on key sizes, PG-083 is more recent than the TLS guide (dates in the status file, section 4) and wins where they differ.

## 1. TLS

### Protocol versions

- [ ] TLS 1.3 supported and preferred; TLS 1.2 accepted provided the rest of the TLS guide is followed [ANSSI TLS R3]
- [ ] SSLv2, SSLv3, TLS 1.0 and TLS 1.1 not used, preferably not even compiled in [ANSSI TLS R4]

### Cipher suites (annex A of the TLS guide)

Recommended for TLS 1.3 (table A.1):

```text
TLS_AES_256_GCM_SHA384        0x1302
TLS_AES_128_GCM_SHA256        0x1301
TLS_AES_128_CCM_SHA256        0x1304
TLS_CHACHA20_POLY1305_SHA256  0x1303
```

Recommended for TLS 1.2 with an ECDSA certificate (table A.2):

```text
TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384        0xC02C
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256        0xC02B
TLS_ECDHE_ECDSA_WITH_AES_256_CCM               0xC0AD
TLS_ECDHE_ECDSA_WITH_AES_128_CCM               0xC0AC
TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256  0xCCA9
```

Recommended for TLS 1.2 with an RSA certificate (table A.3):

```text
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384        0xC030
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256        0xC02F
TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256  0xCCA8
```

The same TLS 1.2 suites in OpenSSL names, as used by nginx and Apache (`ssl_ciphers`, `SSLCipherSuite`), RSA and ECDSA together:

```text
ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-CCM:ECDHE-ECDSA-AES128-CCM:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-CHACHA20-POLY1305
```

The guide's own Apache example (annex B, extract B.2) orders ECDHE before DHE, AES-256 before AES-128 before ChaCha20, SHA-384 before SHA-256, ECDSA before RSA. The OpenSSL names above were matched to the IANA names by the skill; check them with `openssl ciphers -V '<list>'`, which prints each suite's code.

- [ ] TLS 1.2 suites limited to tables A.2 and A.3; the degraded suites of tables A.4 to A.7 only when a documented compatibility need exists [ANSSI TLS R9, R10, R12]
- [ ] Every suite gives forward secrecy: ECDHE, or DHE when ECDHE is impossible [ANSSI TLS R6]
- [ ] Authenticated encryption: GCM or CCM (not CCM-8), ChaCha20-Poly1305 acceptable; CBC only with the `encrypt_then_mac` extension [ANSSI TLS R10, R10-]
- [ ] SHA-2 as the hash function of the suite [ANSSI TLS R11]
- [ ] Several acceptable suites configured, server order preferred when clients are not controlled [ANSSI TLS R12, R13]

### Key exchange groups

- [ ] ECDHE with `secp256r1`, `secp384r1` or `secp521r1`; `x25519` and `x448` acceptable; `brainpoolP256r1`, `brainpoolP384r1`, `brainpoolP512r1` acceptable [ANSSI TLS R7]
- [ ] DHE only as a fallback, with groups of 2048 bits or more from RFC 7919, 3072 bits or more if the data must stay protected beyond 2030 [ANSSI TLS R7-]

### Session and handshake

- [ ] TLS compression disabled [ANSSI TLS R19]
- [ ] Session tickets valid 24 hours at most [ANSSI TLS R20]
- [ ] Secure renegotiation extension always enabled [ANSSI TLS R22]
- [ ] 0-RTT (early data) refused by the server [ANSSI TLS R23]

### Certificates

- [ ] Certificate signature with a SHA-2 function [ANSSI TLS R24]
- [ ] Validity of 3 years at most, and 825 days at most for certificates issued after 1 March 2018 [ANSSI TLS R25]
- [ ] RSA key of 2048 bits at least and ECDSA key of 256 bits at least (curves `secp256r1`, `secp384r1`, `secp521r1`, `brainpoolP256r1`, `brainpoolP384r1`, `brainpoolP512r1`), for protection until 2030; RSA public exponent of 2^16 + 1 or more [ANSSI TLS R26]
- [ ] For a new RSA key, prefer 3072 bits now: PG-083 recommends at least 3072 bits even for use ending before 2030, and makes it the minimum from 2031 [ANSSI CRYPTO RecoFactorisation.1, RègleFactorisation.2]
- [ ] Revocation information present in the certificate (CRL distribution point or AIA), OCSP stapling preferred when the certificate authority offers OCSP [ANSSI TLS R33, R35]
- [ ] Full, ordered certificate chain sent by the server [ANSSI TLS R34]

Certificate lifetimes are usually set by the certificate authority; the 825-day maximum of the TLS guide is a ceiling, not a target.

### HSTS

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` is the guide's example (one year, subdomains included) [ANSSI WEB R2]

The guide gives this as an example of R2, not as a required value. This skill uses one year (`31536000`) as its minimum and requires `includeSubDomains` only once every subdomain is on HTTPS. The guide does not discuss `preload`.

## 2. Hash functions and MACs

- [ ] Hash output of 256 bits or more: SHA2-256 and SHA3-256 conform; SHA-1 and SHA3-224 do not [ANSSI CRYPTO RègleHachage]
- [ ] No hash function with a known partial attack [ANSSI CRYPTO RecoHachage]
- [ ] When post-quantum security is sought (data to protect beyond 2030), hash output of 384 bits or more, for example SHA3-384 [ANSSI CRYPTO RecoPQHachage, RecoSécuLongTerme]
- [ ] MAC tag of 96 bits or more when the mechanism's security does not depend on message size, 128 bits or more otherwise [ANSSI CRYPTO RègleMAC]
- [ ] For subresource integrity (`integrity="…"`), use `sha384` or `sha512`; `sha256` also meets the 256-bit minimum [ANSSI CRYPTO RègleHachage]

Hashing a password is a different problem: see section 4.

## 3. Symmetric and asymmetric keys

- [ ] Symmetric keys of 128 bits at least [ANSSI CRYPTO RègleTailleCléSym]
- [ ] Symmetric keys of 192 bits at least when post-quantum security is sought, so in practice AES-256 for new designs [ANSSI CRYPTO RecoPQTailleCléSym]
- [ ] RSA modulus of 2048 bits at least for use ending by the end of 2030, 3072 bits at least from 2031 [ANSSI CRYPTO RègleFactorisation.1, RègleFactorisation.2]
- [ ] RSA modulus of 3072 bits recommended even for use ending before 2030; public exponent strictly above 2^16 = 65536 and at most 256 bits [ANSSI CRYPTO RecoFactorisation.1, RecoFactorisation.2]
- [ ] Elliptic curves over GF(p) with a subgroup whose order is a multiple of a prime of 250 bits or more; prime order recommended [ANSSI CRYPTO RègleCourbeElliptiqueGFp, RecoCourbeElliptiqueGFp]
- [ ] When a mechanism will be used beyond 1 January 2030, or retroactive attacks are a risk, aim for post-quantum security [ANSSI CRYPTO RecoSécuLongTerme]
- [ ] Use proven mechanisms recognised by the academic community, through maintained libraries; never a home-made construction [ANSSI CRYPTO RecoMécanismesÉprouvés]

A website rarely chooses these values itself: they matter for TLS certificates, signed tokens (JWT), encryption of stored data and webhook signatures. Use the platform's or a maintained library's defaults, then check them against this list.

## 4. Password storage and policy

- [ ] Passwords stored with a memory-hard derivation function such as scrypt or Argon2, tuned to the highest cost that does not hinder legitimate use [ANSSI MFA R29]
- [ ] Where a memory-hard function is not available, PBKDF2 with the highest iteration count that does not hinder legitimate use [ANSSI MFA R29-]
- [ ] A random salt per account, 128 bits long at least [ANSSI MFA R28]
- [ ] No maximum length that prevents passphrases; a technical cap of several hundred characters is acceptable to prevent denial of service [ANSSI MFA R22]
- [ ] Minimum length set according to the sensitivity level, for a 90-character alphabet: 9 to 11 characters (low to medium, about 65 bits), 12 to 14 (medium to strong, about 85 bits), 15 or more (strong to very strong, about 100 bits), with multi-factor authentication recommended at the strong levels [ANSSI MFA R21]
- [ ] Passwords that do not have to be memorised (generated, stored in a password manager): very long, for example more than 20 characters [ANSSI MFA R21]
- [ ] No expiry by default on non-privileged accounts; expiry on privileged accounts; immediate change on suspected compromise [ANSSI MFA R24, R25, R26]
- [ ] Strength checked automatically at creation and renewal [ANSSI MFA R27]

The guide gives **no numeric parameters** for Argon2, scrypt or PBKDF2. When the platform's library has no safe default, this skill takes the minimum configurations of the OWASP Password Storage Cheat Sheet (read on 2026-11-14), marked `[best practice]`:

| Function | Parameters (OWASP minimum) |
|----------|---------------------------|
| Argon2id | m=19456 (19 MiB), t=2, p=1; or m=47104 (46 MiB), t=1, p=1 |
| scrypt | N=2^17 (128 MiB), r=8, p=1 |
| PBKDF2-HMAC-SHA256 (fallback) | 600,000 iterations |

- [ ] When a library offers Argon2id with defaults at or above the table, keep the defaults; raise them if the server allows [best practice]

bcrypt is not named by the ANSSI guide: it is neither memory-hard (R29) nor the PBKDF2 fallback (R29-). On an existing site that uses bcrypt, do not break sign-in: re-hash with Argon2id at the user's next successful sign-in and say so in the report.

## 5. Random values and tokens

- [ ] Anti-CSRF tokens from a cryptographic random generator, with at least 128 bits of entropy, for example 22 random characters from A-Z, a-z, 0-9 [ANSSI WEB R38]
- [ ] Random values for authentication (codes, links, session identifiers) from a robust random generator [ANSSI MFA R5]
- [ ] The generator behind them keeps an internal state of 192 bits at least (256 recommended): in practice, the operating system's generator through `crypto.getRandomValues`, `crypto.randomBytes`, `secrets`, `random_bytes`, never `Math.random`, `rand()` or `uniqid()` [ANSSI CRYPTO RègleArchiGénAléa.3, RecoArchiGénAléa]
- [ ] Session identifiers, password-reset tokens and e-mail confirmation tokens: 128 bits of entropy at least [best practice]

The 128-bit figure for session and reset tokens is the skill's extension of the ANSSI anti-CSRF value (R38) to other bearer secrets; ANSSI gives no specific value for them.

## 6. Session duration

- [ ] Authenticated sessions have a maximum lifetime, after which the user signs in again [ANSSI MFA R12]

The guide gives examples, not a value: a session giving access to sensitive data such as banking information should last "a few minutes at most", while a Kerberos session on an internal network may last several hours. Choose the lifetime with the owner, according to the data behind the session, and write it in the report.
