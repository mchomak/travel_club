# 04 — Preview deployment

**Requirements:** R05, R06, R07  
**Blocked by:** 01, 02, 03  
**Zone:** preview release worktree, preview server, verified public ingress  
**Wave:** 3  
**Status:** ready

## What should work

Publish the three completed routes to the Travel Club preview server using the project's documented preview release process. A visitor can open each verified route on a phone, and the final report gives one URL for each variant.

## From the brief

> “залей на сервер”
> “разрешаю тебе зайти на сервер по логину и паролю”
> “дай мне ссылки на каждую версию сайта”

## Implementation notes

- Follow `docs/deployment-preview.md` and the source-free `compose.deploy.yaml` exactly. The user has authorized deployment in the request; do not ask again.
- Do not copy, print, or persist the supplied SSH secret. Use a trusted existing key or another preconfigured non-secret access method. If it does not authenticate, stop with the exact non-secret result; do not stage/push or change the host.
- Keep unrelated dirty workspace changes out of the deployment commit by preparing an isolated clean release worktree containing only the intended variant files. Never force-push.
- Before host changes, verify the pushed revision, hardware/resource and listener baselines, the existing VPN/Telegram listeners, ingress availability, firewall scope, and the documented staging certificate flow. Do not change port 443 or unrelated services.
- Build and load/upload only the documented preview images. If deployment begins, verify the external HTTPS chain and route responses before sharing links.

## Acceptance

- [ ] A clean release contains only the intended mobile-variant route/component changes and passes `git diff --cached --check`; its exact commit is confirmed at `origin/main` before any server changes.
- [ ] SSH access and every deployment prerequisite are verified without exposing credentials; server changes follow the runbook and existing listeners/services remain healthy.
- [ ] The preview HTTPS origin and selected documented port are verified from outside the VPS with normal TLS validation.
- [ ] `/test_15`, `/test_16`, and `/test_17` each return successfully from the verified public origin and are usable at a phone viewport.

## Return

Return three separate verified URLs and non-secret deployment evidence. If a prerequisite fails, mark the ticket blocked, do not claim a deployment, and report the exact blocker.
