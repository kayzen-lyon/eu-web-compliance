# Module: CMS (WordPress, Drupal, Joomla and similar)

Load this module when the site runs on a content management system, or when you find `wp-config.php`, a Drupal `settings.php`, a Joomla `configuration.php`, or a hosted CMS. It completes [../web-baseline.md](../web-baseline.md).

## How to use this file

1. The outline follows the ANSSI sheet "Les Essentiels : Mise en œuvre sécurisée d'un CMS" (source `anssi-cms`; version and date in [../../regulatory-status.md](../../regulatory-status.md) section 4). That sheet has ten unnumbered good practices, most of which point to other ANSSI guides. Each rule below is tagged with the guide the sheet points to when that guide is part of this skill; the others are tagged `[best practice]`. Because the sheet's practices are unnumbered, a rule is not tagged with the sheet itself.
2. Most CMS risk comes from extensions and themes, default accounts and delayed updates, not from the core.
3. Header and TLS settings for the server in front of the CMS are in [../headers-configs.md](../headers-configs.md). A plugin can set headers when the server cannot be configured; the ANSSI web guide cites this option for WordPress and Drupal (section 5.3.2) without endorsing any plugin.

## 1. Choice and installation

- [ ] The CMS offer (self-hosted or hosted) was chosen against the criteria of this module: updates, extension policy, multi-factor authentication, header control [best practice]
- [ ] HTTPS is enabled following the TLS guide's configuration examples, and checked with an automated configuration test [ANSSI WEB R1]
- [ ] The default user created at installation (usually an administrator) is disabled or removed, and every default value (accounts, secrets, table prefix where relevant) is changed [ANSSI MFA R38]
- [ ] Secrets in the configuration file (database password, salts and keys) are unique to this site and kept out of the repository [OWASP A07]

## 2. Extensions and themes

- [ ] Extensions and themes are limited to what the site uses; unused ones, including those shipped with the CMS, are deleted, not only deactivated [ANSSI WEB R61]
- [ ] Each extension and theme is actively maintained and comes from the CMS's official directory or a vendor whose updates are followed [ANSSI WEB R62]
- [ ] Extensions, themes and the core are listed with their versions and kept up to date; known vulnerabilities are followed for each [ANSSI WEB R62]
- [ ] The core and third-party extensions are never edited; changes go into a child theme or a custom extension [ANSSI WEB R63]
- [ ] Before an extension goes to production, it is studied and tested on four points: it works and fits the setup; its origin is known and it is listed on the CMS's official site; it has no unresolved security issue and does not weaken the site's protections; it is maintained and does not block CMS updates [ANSSI WEB section 6.2]

The ANSSI sheet does not set a delay for applying updates. Agree one with the owner (security updates of the core and extensions within days, not months) and write it in the report.

## 3. Administration and authentication

- [ ] Multi-factor authentication is enabled for every account that can administer or publish on the site [ANSSI MFA R1]
- [ ] The CMS (or an extension) limits sign-in attempts, gives error messages that do not reveal which part failed, enforces the password policy and stores passwords as [../anssi-values.md](../anssi-values.md) section 4 requires [ANSSI MFA R10, R14, R21, R29]
- [ ] Administrators use dedicated accounts for administration, distinct from their day-to-day editor accounts [best practice]
- [ ] The administration area is reached over HTTPS only and, where the platform allows, on its own subdomain or path with its own session cookie [ANSSI WEB R27, R28]
- [ ] The in-dashboard code editor is disabled (on WordPress, `define('DISALLOW_FILE_EDIT', true);` in `wp-config.php`) so a stolen admin session cannot change PHP code [best practice]

Renaming or hiding the admin URL is not in the ANSSI sheet. It reduces noise from automated scans but protects nothing on its own; never present it as a security measure.

## 4. Browser-side protections

- [ ] HSTS, Content Security Policy and secure session cookies are in place, as the web guide recommends [ANSSI WEB R2, R14, R30]
- [ ] The CMS's session cookies carry `Secure`, `HttpOnly` and `SameSite` (check them with the header checker after sign-in) [ANSSI WEB R31, R30, R33]
- [ ] The CSP is tested with the theme and every extension in Report-Only mode first: CMS themes and page builders often rely on inline scripts and styles [ANSSI WEB R15]

When an extension needs `'unsafe-inline'` or `'unsafe-eval'`, report the extension by name as the reason, with the severity of [../headers-baseline.json](../headers-baseline.json), and suggest replacing it.

## 5. Exposure and runtime

- [ ] Network flows between the CMS and the Internet, and open ports, are limited to what is needed; the hosting is protected against denial of service [best practice]
- [ ] Features that fetch external content (link previews, remote media, pingbacks, remote XML-RPC calls) are disabled unless used [best practice]
- [ ] The runtime (PHP or other), the database account and the operating system follow least privilege: the CMS's database account has rights on its own database only, and the web server cannot write to code folders [best practice]
- [ ] Directory listing is off, and configuration files, backups, `.git` and dumps are not reachable over HTTP [ANSSI WEB R60]
- [ ] Production shows no debug output (on WordPress, `WP_DEBUG` and `WP_DEBUG_DISPLAY` off) [ANSSI WEB R59]

## 6. Logs and backups

- [ ] The CMS's logs (sign-ins, failed sign-ins, changes of users and roles, extension changes) are collected and watched, with alerts [OWASP A09]
- [ ] Site content and CMS configuration (database export and configuration files) are backed up, and a restore has been tested [best practice]

The ANSSI sheet gives no backup frequency or retention; agree them with the owner.

## 7. In the report

List: the CMS and version, every extension and theme with its version and maintenance status, who has multi-factor authentication, the update policy agreed, how headers are set (server or extension), and the items left to the host or owner (TLS, backups, logs, network).
