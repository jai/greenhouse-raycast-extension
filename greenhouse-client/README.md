# Greenhouse Harvest Client (Read/Write)

Lightweight client for Harvest v1 endpoints. Supports read + write calls by allowing any HTTP method/path and optional `On-Behalf-Of` header.

## Setup
```bash
set -a
source ../.env
set +a
```

## Examples
List open jobs (paginated):
```bash
npm run harvest -- --method GET --path /jobs --params "status=open&per_page=100" --paginate --pretty
```

List users (find your On-Behalf-Of user ID):
```bash
npm run harvest -- --method GET --path /users --params "per_page=100" --paginate --pretty
```

Get a single candidate:
```bash
npm run harvest -- --method GET --path /candidates/123456 --pretty
```

List active applications for a job:
```bash
npm run harvest -- --method GET --path /applications --params "job_id=123456&status=active&per_page=100" --paginate --pretty
```

List stages for a job:
```bash
npm run harvest -- --method GET --path /jobs/123456/stages --paginate --pretty
```

Move an application to another stage (same job):
```bash
npm run harvest -- --method POST --path /applications/987654/move \
  --body '{"from_stage_id":111,"to_stage_id":222}' --on-behalf-of 789 --pretty
```

Advance an application to the next stage:
```bash
npm run harvest -- --method POST --path /applications/987654/advance --on-behalf-of 789 --pretty
```

Generic write (requires Harvest permissions + On-Behalf-Of):
```bash
npm run harvest -- --method POST --path /applications --body '{"candidate_id": 123, "job_id": 456}' --on-behalf-of 789 --pretty
```

Create candidate + application (applications array required by Harvest):
```bash
npm run harvest -- --method POST --path /candidates \
  --body '{"first_name":"Jamie","last_name":"Test","email_addresses":[{"value":"jamie.test@example.com","type":"personal"}],"applications":[{"job_id":123456}]}' \
  --on-behalf-of 789 --pretty
```

Notes:
- Harvest v1 supports read for most resources; write support depends on endpoint permissions and Greenhouse capabilities.
- Use `GREENHOUSE_ON_BEHALF_OF` or `--on-behalf-of` for write operations to set the audit user.
