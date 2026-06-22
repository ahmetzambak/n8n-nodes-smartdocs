import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

import { smartDocsApiRequest } from './transport';
import { verifyWebhookSignature } from './webhookSignature';

const EVENT_OPTIONS = [
	{ name: 'Signer Completed', value: 'SIGNER_COMPLETED', description: 'A signer has completed signing' },
	{ name: 'Signing Completed', value: 'SIGNING_COMPLETED', description: 'All signers have completed the signing process' },
	{ name: 'Signing Declined', value: 'SIGNING_DECLINED', description: 'A signer declined to sign the document' },
	{ name: 'Signing Expired', value: 'SIGNING_EXPIRED', description: 'The signing process expired before completion' },
	{ name: 'Signing Sent', value: 'SIGNING_SENT', description: 'A signing request was sent to signers' },
	{ name: 'Signing Voided', value: 'SIGNING_VOIDED', description: 'The signing process was voided' },
];

export class SmartDocsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SmartDocs Trigger',
		name: 'smartDocsTrigger',
		icon: 'file:smartDocs.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts a workflow when SmartDocs signing events occur',
		defaults: { name: 'SmartDocs Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'smartDocsApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				// Capture the exact request bytes so HMAC verification runs over what
				// SmartDocs signed (re-serialized JSON would change byte order/spacing).
				rawBody: true,
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: EVENT_OPTIONS,
				default: [],
				required: true,
				description: 'The signing events to subscribe to. Requires the webhooks entitlement (paid plan) on the SmartDocs organization.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				if (!data.endpointId) return false;
				try {
					await smartDocsApiRequest.call(this, 'GET', `/webhooks/${data.endpointId as string}`);
					return true;
				} catch {
					delete data.endpointId;
					delete data.secret;
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events') as string[];
				const endpoint = await smartDocsApiRequest.call(this, 'POST', '/webhooks', {
					url: webhookUrl,
					events,
					description: 'n8n SmartDocs Trigger',
				});
				const data = this.getWorkflowStaticData('node');
				data.endpointId = (endpoint as { id: string }).id;
				data.secret = (endpoint as { secret: string }).secret;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const data = this.getWorkflowStaticData('node');
				if (data.endpointId) {
					try {
						await smartDocsApiRequest.call(this, 'DELETE', `/webhooks/${data.endpointId as string}`);
					} catch {
						// Even if the remote delete fails (e.g. already gone), drop the
						// stored secret + id so a stale secret can't validate deliveries.
						delete data.endpointId;
						delete data.secret;
						return false;
					}
					delete data.endpointId;
					delete data.secret;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headers = this.getHeaderData();
		const data = this.getWorkflowStaticData('node');
		const secret = data.secret as string | undefined;

		const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody
			? (req as unknown as { rawBody: Buffer }).rawBody.toString('utf8')
			: JSON.stringify(this.getBodyData());
		const signature = headers['x-smartdocs-signature'] as string | undefined;
		const nowSec = Math.floor(Date.now() / 1000);

		if (!secret || !signature || !verifyWebhookSignature(secret, signature, rawBody, nowSec)) {
			return { webhookResponse: { statusCode: 401 } };
		}

		const payload = this.getBodyData() as { id?: string };
		// Idempotency: skip if we have already seen this event id.
		const seen = (data.seenIds as string[] | undefined) ?? [];
		if (payload.id && seen.includes(payload.id)) {
			return { webhookResponse: { statusCode: 200 } };
		}
		if (payload.id) {
			seen.push(payload.id);
			data.seenIds = seen.slice(-200); // bounded memory
		}

		return { workflowData: [this.helpers.returnJsonArray([payload])] };
	}
}
