# n8n-nodes-smartdocs

An n8n community node for [SmartDocs](https://smartdocs.de) — automate document-signing workflows directly from n8n.

---

## Installation

In a **self-hosted** n8n instance:

1. Open **Settings → Community Nodes**.
2. Click **Install**.
3. Enter `n8n-nodes-smartdocs` and confirm.
4. Restart n8n when prompted.

> n8n Cloud is not supported for community nodes at the time of writing.

---

## Credentials

1. Log in to your SmartDocs organization and navigate to **Settings → API Keys**.
2. Click **Generate New Key** (requires a **PRO or higher** plan).
3. Copy the key.
4. In n8n, create a new credential of type **SmartDocs API** and paste the key into the **API Key** field.

The base URL is fixed to `https://api.smartdocs.de/api/v1` and cannot be changed from the credential UI. API keys are organization-scoped — no separate organization ID is required.

---

## Operations

The **SmartDocs** action node exposes 8 resources:

### Signing Process

| Operation | Description |
|---|---|
| Attach Identity Proof | Attach a signer identity proof to a signing process |
| Create | Create an ad-hoc signing process from a stored PDF asset |
| Extend | Extend the expiry date of a signing process |
| Get | Retrieve a single signing process |
| Get Files | Retrieve signed file and certificate links (optionally download binaries) |
| Get Many | List signing processes with optional filters and pagination |
| Kiosk Start Signer | Mint a kiosk token for a specific signer |
| Regenerate Certificate | Regenerate the completion certificate for a finished process |
| Resend Signer Invite | Re-send the signing invite to a specific signer |
| Void | Void a signing process |

### Template

| Operation | Description |
|---|---|
| Archive | Archive a template |
| Create | Create a new template (PDF or HTML) |
| Delete | Delete a template |
| Get | Retrieve a single template |
| Get Many | List templates with optional filters and pagination |
| Kiosk Session | Start a kiosk signing session from a template |
| Preview Draft | Render a preview of draft HTML content |
| Preview Render | Render a preview of the published template |
| Publish | Publish a new version of a template |
| Start Signing | Start a signing process from a template |
| Unarchive | Unarchive a template |
| Update Draft | Update the draft of a template |

### PDF Asset

| Operation | Description |
|---|---|
| Delete | Delete a PDF asset |
| Get | Retrieve a single PDF asset |
| Get Artifact URLs | Get presigned artifact URLs for a processed asset |
| Get Many | List PDF assets with pagination |
| Get Processing Status | Get the current processing status of an asset |
| Get Source URL | Get a presigned URL for the original uploaded PDF (optionally download binary) |
| Parse | Get parsed page/field info for the asset |
| Retry Processing | Retry failed processing for an asset |
| Upload | Upload a PDF file as a new asset |

### Template Asset

| Operation | Description |
|---|---|
| Delete | Delete a template asset |
| Get | Retrieve a single template asset |
| Get Many | List template assets |
| Get Source URL | Get a presigned URL for a single asset |
| Get Source URLs | Get presigned URLs for multiple assets (comma-separated IDs) |
| Upload | Upload an image as a template asset |

### Template Category

| Operation | Description |
|---|---|
| Create | Create a category |
| Delete | Delete a category |
| Get Many | List all categories |
| Update | Update a category |

### Template Tag

| Operation | Description |
|---|---|
| Create | Create a tag |
| Delete | Delete a tag |
| Get Many | List all tags |
| Update | Update a tag |

### Webhook

| Operation | Description |
|---|---|
| Create | Create a webhook endpoint |
| Delete | Delete a webhook endpoint |
| Get | Retrieve a single webhook endpoint |
| Get Delivery | Get a specific delivery record |
| Get Many | List webhook endpoints |
| List Deliveries | List delivery records for an endpoint |
| Redeliver | Redeliver a previously delivered event |
| Rotate Secret | Rotate the HMAC signing secret for an endpoint |
| Update | Update a webhook endpoint |

### PDF Engine

| Operation | Description |
|---|---|
| List Fonts | List all fonts available in the SmartDocs PDF engine |

---

## Trigger

The **SmartDocs Trigger** node starts a workflow when a signing event fires. It supports 6 events:

| Event name | Wire name | When it fires |
|---|---|---|
| Signing Sent | `signing.sent` | A signing request was dispatched to signers |
| Signer Completed | `signer.completed` | An individual signer has completed their step |
| Signing Completed | `signing.completed` | All signers have completed the process |
| Signing Declined | `signing.declined` | A signer declined to sign |
| Signing Expired | `signing.expired` | The signing deadline passed before completion |
| Signing Voided | `signing.voided` | The process was manually voided |

**Paid plan required.** The webhooks entitlement is only available on SmartDocs **PRO and higher** plans. The trigger will fail to activate on a free organization.

**Auto-register / auto-deregister.** When you activate a workflow containing this trigger, n8n calls the SmartDocs API to register a webhook endpoint pointed at the n8n webhook URL. When you deactivate the workflow, n8n deregisters the endpoint automatically. You do not need to manage webhook endpoints manually.

**HMAC verification.** Every incoming request is verified against the HMAC-SHA256 signature that SmartDocs sends in the `x-smartdocs-signature` header. Payloads that fail verification are rejected with HTTP 401 before the workflow executes.

---

## Example Workflow

**Goal:** Start a signing process from a template, then automatically download the signed PDF when all signers complete.

1. Add an **HTTP Request** node (or any trigger) that collects the signer details — name, email, and the template ID to use.
2. Add a **SmartDocs** action node:
   - Resource: **Template**
   - Operation: **Start Signing**
   - Set the **Template Name or ID**, **Signers** (JSON array with `roleKey`, `name`, `email`), and **Expires At**.
   - The node returns the new signing process ID.
3. Add a **SmartDocs Trigger** node:
   - Event: **Signing Completed**
   - This node will receive the payload once all signers finish.
4. After the trigger, add another **SmartDocs** action node:
   - Resource: **Signing Process**
   - Operation: **Get Files**
   - Set **Signing Process ID** from `{{ $json.data.signingProcess.id }}` (the trigger payload nests the process under `data.signingProcess`).
   - Enable **Download Files** to receive the signed PDF and certificate as binary properties.
5. Use a **Write Binary File** or **Send Email** node to store or deliver the signed PDF.

---

## Compatibility

- **n8n**: version 1.x and later (uses `n8nNodesApiVersion: 1`).
- **Node.js**: >= 20.

---

## License

[MIT](LICENSE)
