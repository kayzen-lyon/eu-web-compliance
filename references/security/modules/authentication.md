# Module: user accounts and authentication

Load this module when the site has user accounts, a customer area, an admin back office or a password reset. It completes [../web-baseline.md](../web-baseline.md) sections 3 and 5. Numeric values are in [../anssi-values.md](../anssi-values.md); this file does not repeat them.

## How to use this file

1. Before writing any sign-in code, check whether the framework or a maintained library already provides it (Django auth, Laravel Breeze or Fortify, Rails `has_secure_password`, Devise, Auth.js, Lucia-style session libraries, the CMS's own accounts). Use it and configure it with the values below. Writing your own password hashing or session handling is the riskiest thing an AI assistant can do on a website [ANSSI AI R31].
2. The rules are tagged as in [../web-baseline.md](../web-baseline.md). Sources: `ANSSI MFA` is ANSSI-PG-078 v2.0.
3. The accessibility of the sign-in form (labels, error messages, no cognitive test, paste allowed in password fields) is covered by [../../accessibility/wcag-2.2-additions.md](../../accessibility/wcag-2.2-additions.md). Security must not break it: password managers and paste must keep working.

## 1. Account creation and password policy

- [ ] The minimum password length follows the sensitivity of the account, using the table in [../anssi-values.md](../anssi-values.md) section 4; write the level chosen in the report [ANSSI MFA R21]
- [ ] No short maximum length; accept long passphrases, with a technical cap of several hundred characters [ANSSI MFA R22]
- [ ] Complexity rules allow the widest character set (spaces, accents, symbols) and can be relaxed for long passphrases [ANSSI MFA R23]
- [ ] Strength is checked automatically when a password is created or changed, with a clear message saying what to improve [ANSSI MFA R27]
- [ ] Non-privileged accounts have no forced periodic change; privileged accounts do; any suspected compromise forces a change [ANSSI MFA R24, R25, R26]
- [ ] Password fields allow paste and password managers (`autocomplete="new-password"` or `"current-password"`) [best practice]

## 2. Password storage

- [ ] Passwords are derived with Argon2id or scrypt through a maintained library, with parameters from [../anssi-values.md](../anssi-values.md) section 4 [ANSSI MFA R29]
- [ ] PBKDF2 only where neither is available, with the highest iteration count the server can afford [ANSSI MFA R29-]
- [ ] Each account has its own random salt of 128 bits or more (libraries for Argon2 and scrypt generate it) [ANSSI MFA R28]
- [ ] Stored authentication data (hashes, MFA secrets, recovery codes) is protected in confidentiality and integrity, and access to it is restricted [ANSSI MFA R13]
- [ ] Passwords never appear in logs, error messages, analytics or e-mails [ANSSI MFA R13]

## 3. Sign-in

- [ ] Sign-in happens only over HTTPS [ANSSI MFA R11]
- [ ] Failed attempts are limited over a period of time: a delay that grows (linear or exponential) or a temporary lock, per account and per source [ANSSI MFA R10]
- [ ] A failed multi-factor sign-in does not say which factor failed; the result is shown only after all factors were asked [ANSSI MFA R14]
- [ ] The sign-in, sign-up and reset forms give the same answer whether or not the account exists, so they cannot be used to list accounts [OWASP A07]
- [ ] Sign-in events (success, failure, lock) are recorded with their time, for security monitoring [ANSSI MFA R9]
- [ ] The session identifier is replaced on sign-in, and the session cookie follows [../web-baseline.md](../web-baseline.md) section 3 [OWASP A07]
- [ ] A CAPTCHA, if any, is not the only protection and has an accessible alternative [best practice]

The guide gives no number of attempts or lock duration. Choose them with the owner and write them in the report; a lock must not let an attacker lock out a known user at will, which is why a growing delay is often preferable to a hard lock.

## 4. Sessions

- [ ] An authenticated session has a maximum lifetime, after which the user signs in again [ANSSI MFA R12]
- [ ] Sign-out invalidates the session on the server, not only in the browser [OWASP A07]
- [ ] Sensitive actions (changing the e-mail address or password, deleting the account, paying) ask for the password or a second factor again [OWASP A07]
- [ ] Tokens for single-page apps are kept in `HttpOnly` cookies, not in `localStorage` or `sessionStorage` [ANSSI WEB R23]

The ANSSI guide gives examples, not values: a session that gives access to sensitive data such as banking information should last "a few minutes at most"; an internal network session may last several hours. Agree the idle and absolute lifetimes with the owner.

## 5. Multi-factor authentication

- [ ] Multi-factor authentication is required for administrators and other privileged accounts, and offered to users when accounts hold sensitive data [ANSSI MFA R1]
- [ ] Strong mechanisms, resting on sound cryptography, are preferred (for example FIDO2/WebAuthn security keys or passkeys, one-time password apps) [ANSSI MFA R2]
- [ ] SMS is not used to receive an authentication factor; if no alternative exists for some users, treat it as a weak factor and say so in the report [ANSSI MFA R8]
- [ ] Factors belong to different categories (something you know, something you have, something you are); a password plus a PIN is not multi-factor [ANSSI MFA section 2.4]
- [ ] A biometric factor is never used alone, only together with a strong factor [ANSSI MFA R40, R41]
- [ ] Factors can be revoked (lost phone or key), and the revocation takes effect quickly [ANSSI MFA R18, R19]
- [ ] TOTP secrets and recovery codes come from a robust random generator [ANSSI MFA R5]

## 6. Account recovery

- [ ] A recovery method exists and is adapted to the context; the original password is never sent back in clear [ANSSI MFA R30]
- [ ] A reset link is single-use, expires after a short time agreed with the owner, and carries a random token of 128 bits or more stored hashed on the server [best practice]
- [ ] Using a reset link ends the other sessions of the account and notifies the user by e-mail [best practice]
- [ ] Recovery does not bypass multi-factor authentication for privileged accounts without a human check [best practice]

## 7. Access control

- [ ] Every request to a protected page or API checks on the server that the user is signed in and allowed to act on this specific object [OWASP A01]
- [ ] Roles are checked on the server; the client receives only the data its role may see [OWASP A01]
- [ ] Administration lives on a separate path or subdomain, with its own session cookie path and multi-factor authentication [ANSSI WEB R27, R28]
- [ ] Rate limits apply to sign-in, sign-up, password reset and multi-factor code entry [OWASP A07]

## 8. What to say in the report

List: the library used for hashing and its parameters; the session lifetimes; the attempt-limiting rule; who has multi-factor authentication; the recovery method; the modules generated by AI that touch authentication, marked for human review [ANSSI AI R31].
