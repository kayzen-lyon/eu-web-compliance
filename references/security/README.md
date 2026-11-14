# Web security

Entry point of the security part of the skill: what it covers, what it does not, and which file to read for each task.

## How to use this file

1. Read the "Legal anchor and baseline" section once, so you describe security rules correctly to the user.
2. Find your task in the table below and read only the files it names.
3. Never write a cryptographic or TLS value from memory: [anssi-values.md](anssi-values.md) holds every value the skill uses, with its source.

## Legal anchor and baseline

The only legal obligation on website security that this skill relies on is **Article 32 of the GDPR** (security of processing): where a site processes personal data, which includes a contact form, an account, or server logs with IP addresses, the controller and processor must implement technical and organisational measures appropriate to the risk. Article 32 does not list the measures. See [../regulatory-status.md](../regulatory-status.md), section 3, for the text in force.

To meet it, the skill applies the recommendations of the French cybersecurity agency (ANSSI) as its **reference baseline**, completed by the OWASP Top 10 where ANSSI is silent. The ANSSI guides state that their recommendations are not normative, and the OWASP Top 10 is an awareness document. So:

- say "the site follows the ANSSI baseline applied by this skill", never "the site is legally compliant";
- a missing ANSSI or OWASP measure is a weakness to fix, not by itself a breach of the law;
- the Cyber Resilience Act is not treated as applying to a website as such ([../regulatory-status.md](../regulatory-status.md), section 4).

Guides used, all recorded in [../sources.json](../sources.json). Their versions and dates are in [../regulatory-status.md](../regulatory-status.md) section 4 (section 3.1 for the GDPR).

| Tag | Document |
|-----|----------|
| `ANSSI WEB` | ANSSI-PA-009, Recommandations pour la mise en œuvre d'un site web : maîtriser les standards de sécurité côté navigateur |
| `ANSSI TLS` | Recommandations de sécurité relatives à TLS |
| `ANSSI MFA` | ANSSI-PG-078, Recommandations relatives à l'authentification multifacteur et aux mots de passe |
| `ANSSI CRYPTO` | ANSSI-PG-083, Règles et recommandations concernant le choix et le dimensionnement des mécanismes cryptographiques |
| `ANSSI AI` | ANSSI-PA-102, Recommandations de sécurité pour un système d'IA générative, section 5.5 |
| `ANSSI CMS` | Les Essentiels : Mise en œuvre sécurisée d'un CMS (used for the outline of [modules/cms.md](modules/cms.md)) |
| `OWASP` | OWASP Top 10, edition named in the status file |
| `GDPR` | Regulation (EU) 2016/679, Article 32 |

## Task → file

| Task | Read |
|------|------|
| Building or changing any website | [web-baseline.md](web-baseline.md) |
| Setting HTTP security headers, HTTPS, TLS on a server or host | [headers-configs.md](headers-configs.md), then the file for the host |
| Checking headers automatically | [headers-baseline.json](headers-baseline.json), used by `scripts/check-security.mjs` |
| Choosing a TLS suite, key size, hash, password hashing parameter or token length | [anssi-values.md](anssi-values.md) |
| User accounts, sign-in, password reset, admin area | [modules/authentication.md](modules/authentication.md) |
| Users can upload files | [modules/file-uploads.md](modules/file-uploads.md) |
| WordPress, Drupal, Joomla or another CMS | [modules/cms.md](modules/cms.md) |
| Code written by an AI assistant (including yours) | [modules/ai-generated-code.md](modules/ai-generated-code.md) |
| Cookies before consent, trackers, consent banner | Not here: the privacy part of the skill decides which cookies may be set; this part decides how they are protected |

## Static site or backend

Most rules apply to every site, including a static site with no server code: HTTPS, HSTS, headers, third-party scripts, dependencies, secrets in the repository, error pages. Rules marked "(backend)" in [web-baseline.md](web-baseline.md), and the modules on authentication and uploads, apply only when there is server code, a database, accounts or an API.

## Not covered

The skill works on the code and configuration of a website. It does not cover, and the final report must list as left to the owner or host:

- infrastructure and network: firewalls, network segmentation, operating system hardening, container and orchestration security, DNS and e-mail security (SPF, DKIM, DMARC);
- the continuous integration chain beyond dependency audit and secret scanning;
- detailed logging architecture, log retention and log transport;
- backups, disaster recovery and availability;
- incident response. Pointer: if a personal data breach occurs, the GDPR sets a notification duty to the supervisory authority (Articles 33 and 34); check the current rules in [../regulatory-status.md](../regulatory-status.md) and involve the data protection officer;
- penetration testing, code audits and security certification;
- NIS2 and sector rules (health data hosting, payment card industry standards, banking).

## Limits of the checks

- [headers-baseline.json](headers-baseline.json) checks response headers and cookies. It cannot judge TLS settings, whether the CSP allowlist is minimal, or the security of server code.
- Passing every automated check does not make a site secure. The report lists what a person must still review: authentication and access-control code, the list of third parties, hosting and TLS, and every module generated by AI that touches sensitive functions.
