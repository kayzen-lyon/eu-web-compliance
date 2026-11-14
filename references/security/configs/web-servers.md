# nginx, Apache httpd and Caddy

Configurations implementing the shared header set and the TLS values of [../anssi-values.md](../anssi-values.md). Read [../headers-configs.md](../headers-configs.md) first for the CSP strategy and the verification steps.

## How to use this file

1. Copy the block for your server. Replace `example.org`, certificate paths and the CSP origins marked "adapt".
2. These servers send the same CSP to every response. That suits static files (strict policy or hashes). If an application behind the server renders pages and needs a nonce, let the application set the CSP and remove it from the server block, or the browser will apply both policies.
3. The blocks are illustrations of the values to reach; merge them into the existing configuration rather than replacing it.

## nginx

Two traps specific to nginx:

- `add_header` sends the header only on success and redirect status codes unless `always` is given; error pages would go out without protection. Every line below uses `always`.
- A `location` block that contains any `add_header` loses all the `add_header` lines of the `server` block. Either repeat the security headers in that location, put them in an included file, or (nginx 1.29.3 and later) set `add_header_inherit merge;`.

```nginx
# /etc/nginx/snippets/security-headers.conf  (included in each server and in any
# location that has its own add_header)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
# adapt: add third-party origins only when the site uses them
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.org;                      # adapt
    server_tokens off;                            # no version in Server header or error pages
    return 301 https://$host$request_uri;         # nothing is served over HTTP
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;                                     # nginx 1.25.1+; older versions: "listen 443 ssl http2;"
    server_name example.org;                      # adapt
    server_tokens off;

    ssl_certificate     /etc/ssl/example.org/fullchain.pem;   # adapt; full ordered chain (ANSSI TLS R34)
    ssl_certificate_key /etc/ssl/example.org/privkey.pem;     # adapt

    ssl_protocols TLSv1.3 TLSv1.2;                # ANSSI TLS R3, R4
    # TLS 1.2 suites of tables A.2 and A.3 (ANSSI TLS guide, annex A).
    # TLS 1.3 suites stay at the OpenSSL default, which must be a subset of table A.1:
    # check with "openssl ciphers -s -tls1_3 -V".
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-CCM:ECDHE-ECDSA-AES128-CCM:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;                 # ANSSI TLS R13 (default is off)
    ssl_session_tickets off;                      # simplest way to meet ANSSI TLS R20 (tickets 24 h at most)
    ssl_session_cache shared:TLS:10m;
    ssl_session_timeout 1h;
    ssl_early_data off;                           # ANSSI TLS R23 (already the default)
    # OCSP stapling (ANSSI TLS R35) only if the certificate authority provides OCSP:
    # ssl_stapling on;
    # ssl_stapling_verify on;

    include /etc/nginx/snippets/security-headers.conf;

    root /var/www/example.org;                    # adapt
    autoindex off;                                # no directory listing

    location / {
        try_files $uri $uri/ =404;
    }

    # Never serve dotfiles (.env, .git) or backups.
    location ~ /\.(?!well-known) { deny all; }
    location ~* \.(bak|old|orig|swp|sql|log)$ { deny all; }
}
```

Notes:

- `ssl_protocols TLSv1.2 TLSv1.3` is the nginx default since 1.23.4. Writing it explicitly keeps it if an older include sets something else.
- The `Content-Type` charset for HTML comes from `charset utf-8;` in the `http` or `server` block, if the files do not declare it themselves.
- Behind a proxy or load balancer that terminates TLS, the TLS settings belong to that component; the headers can stay here.

## Apache httpd 2.4

`Header always set` sends the header on error pages too (the default table, `onsuccess`, does not). `ServerTokens` applies to the whole server, not per virtual host. Requires `mod_headers`, `mod_ssl`, `mod_rewrite` or `mod_alias`.

```apache
# Global (httpd.conf or conf-enabled/security.conf)
# Server: Apache, without version (default is Full)
ServerTokens Prod
# no version footer on error pages (already the default)
ServerSignature Off
TraceEnable Off

<VirtualHost *:80>
    # adapt
    ServerName example.org
    # adapt; nothing is served over HTTP
    Redirect permanent / https://example.org/
</VirtualHost>

<VirtualHost *:443>
    # adapt
    ServerName example.org
    # adapt
    DocumentRoot /var/www/example.org

    SSLEngine on
    # adapt
    SSLCertificateFile    /etc/ssl/example.org/fullchain.pem
    # adapt
    SSLCertificateKeyFile /etc/ssl/example.org/privkey.pem

    # ANSSI TLS R3, R4
    SSLProtocol -all +TLSv1.3 +TLSv1.2
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-CCM:ECDHE-ECDSA-AES128-CCM:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-CHACHA20-POLY1305
    SSLCipherSuite TLSv1.3 TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256
    # ANSSI TLS R13 (default off)
    SSLHonorCipherOrder on
    # ANSSI TLS R19 (default off)
    SSLCompression off
    # ANSSI TLS R22
    SSLInsecureRenegotiation off
    # ANSSI TLS R20; httpd 2.4.11+
    SSLSessionTickets off
    # OCSP stapling (ANSSI TLS R35), if the certificate authority provides OCSP:
    # SSLUseStapling on   (and SSLStaplingCache in the global context)

    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    # adapt: add third-party origins only when the site uses them
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Resource-Policy "same-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header always unset X-Powered-By
    Header unset X-Powered-By

    # adapt
    <Directory /var/www/example.org>
        # no directory listing
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    <FilesMatch "^\.|\.(bak|old|orig|swp|sql|log)$">
        Require all denied
    </FilesMatch>
</VirtualHost>
```

Notes:

- `X-Powered-By` is usually added by PHP or an application behind Apache; `expose_php = Off` in `php.ini` stops PHP from sending it at the source. Both `unset` lines are needed because headers set by a backend can sit in either internal table.
- The TLS 1.3 suite line uses the three suites of table A.1 that OpenSSL enables; `TLS_AES_128_CCM_SHA256` is also allowed by the guide and can be appended.
- On shared hosting where only `.htaccess` is available, the `Header always set` lines work there if `mod_headers` is enabled and `AllowOverride` permits `FileInfo`; the TLS lines do not, and stay with the host.

## Caddy

Caddy serves every site over HTTPS and redirects HTTP to HTTPS by default. Its default protocols are TLS 1.2 minimum and TLS 1.3 maximum. Its list of supported TLS 1.2 suites includes CBC suites with SHA-1 and a 3DES suite, which the ANSSI guide excludes (R10, R11), so set the TLS 1.2 suites explicitly. Caddy cannot customise TLS 1.3 suites and does not support CCM.

```caddyfile
example.org {                                    # adapt
    root * /var/www/example.org                  # adapt
    file_server

    tls {
        protocols tls1.2 tls1.3                  # ANSSI TLS R3, R4
        # TLS 1.2 suites of tables A.2 and A.3 that Caddy supports
        ciphers TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        # adapt: add third-party origins only when the site uses them
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Content-Type-Options "nosniff"
        Cross-Origin-Opener-Policy "same-origin"
        Cross-Origin-Resource-Policy "same-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        -Server
        -X-Powered-By
    }
}
```

Notes:

- A header line without prefix replaces the value; a `-` prefix deletes the header. When a reverse-proxied application also sets a header, use `defer` in the block so Caddy's values are applied last.
- Session tickets, compression and 0-RTT are handled by Caddy's TLS stack; the Caddy documentation read for this file does not describe them. List them as "to verify with an external TLS test" in the report.
