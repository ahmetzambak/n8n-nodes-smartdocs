import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { smartDocsApiRequestAllItems } from '../transport';

export async function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const templates = await smartDocsApiRequestAllItems.call(this, 'GET', '/templates', {});
	return templates.map((t: any) => ({ name: `${t.name} (${t.id})`, value: t.id }));
}

export async function getWebhookEndpoints(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const endpoints = await smartDocsApiRequestAllItems.call(this, 'GET', '/webhooks', {});
	return endpoints.map((w: any) => ({ name: `${w.url} (${w.id})`, value: w.id }));
}
