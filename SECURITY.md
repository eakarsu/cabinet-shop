# Security policy

Do not include customer data, credentials, webhook bodies, or exploit details in a public issue. Report suspected vulnerabilities through the repository owner's private security channel.

Supported production releases are those passing the current CI workflow on Node 22 with the checked-in lockfile and PostgreSQL migrations. Dependency audit findings rated high or critical block release. Moderate findings require documented reachability review and an upgrade plan.

Security boundaries include server-side admin checks on every privileged API, customer record ownership checks, persistent rate limits, locked accounts, 12–72 character passwords, distinct production secrets, secure response headers, bounded AI inputs, signed webhook and assistant actions, idempotent integrations, hashed suppression identities, independent outreach review, and immutable audit history. These controls do not replace TLS, database least privilege, secret management, centralized logs, monitoring, backups, or provider-side access policies.

## Current dependency review

Next.js 16.2.10 pins PostCSS 8.4.31, which npm reports under the moderate `GHSA-qx2v-qp2m-jg93` CSS-stringification advisory (the three audit paths are the same transitive package through Next/NextAuth). This application does not accept or stringify user-supplied CSS, PostCSS runs only while building trusted project styles, and the production image contains compiled output. The current stable Next package prevents a lockfile override of its exact internal dependency. CI blocks high/critical findings; upgrade immediately when a stable Next release updates the pin, and reassess if any user-controlled stylesheet feature is introduced.
