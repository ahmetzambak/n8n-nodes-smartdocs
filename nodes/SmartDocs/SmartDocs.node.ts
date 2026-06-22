import FormData from 'form-data';
import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';

import { smartDocsApiRequest, smartDocsApiRequestAllItems, uploadPdfAsset, downloadToBinary, SMARTDOCS_BASE_URL } from './transport';
import { pdfAssetOperations, pdfAssetFields } from './descriptions/pdfAsset';
import { pdfEngineOperations, pdfEngineFields } from './descriptions/pdfEngine';
import { signingProcessOperations, signingProcessFields } from './descriptions/signingProcess';
import { templateOperations, templateFields } from './descriptions/template';
import { templateAssetOperations, templateAssetFields } from './descriptions/templateAsset';
import { templateCategoryOperations, templateCategoryFields, templateTagOperations, templateTagFields } from './descriptions/templateTaxonomy';
import { webhookOperations, webhookFields } from './descriptions/webhook';
import { getTemplates, getWebhookEndpoints } from './methods/loadOptions';

export class SmartDocs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SmartDocs',
		name: 'smartDocs',
		icon: 'file:smartDocs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Automate SmartDocs document-signing workflows',
		defaults: { name: 'SmartDocs' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'smartDocsApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'PDF Asset', value: 'pdfAsset' },
					{ name: 'PDF Engine', value: 'pdfEngine' },
					{ name: 'Signing Process', value: 'signingProcess' },
					{ name: 'Template', value: 'template' },
					{ name: 'Template Asset', value: 'templateAsset' },
					{ name: 'Template Category', value: 'templateCategory' },
					{ name: 'Template Tag', value: 'templateTag' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'signingProcess',
			},
			...pdfAssetOperations,
			...pdfAssetFields,
			...pdfEngineOperations,
			...pdfEngineFields,
			...signingProcessOperations,
			...signingProcessFields,
			...templateOperations,
			...templateFields,
			...templateAssetOperations,
			...templateAssetFields,
			...templateCategoryOperations,
			...templateCategoryFields,
			...templateTagOperations,
			...templateTagFields,
			...webhookOperations,
			...webhookFields,
		],
	};

	methods = { loadOptions: { getTemplates, getWebhookEndpoints } };

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				if (resource === 'pdfAsset') {
					responseData = await executePdfAsset.call(this, operation, i);
				} else if (resource === 'pdfEngine') {
					responseData = await executePdfEngine.call(this, operation, i);
				} else if (resource === 'signingProcess') {
					responseData = await executeSigningProcess.call(this, operation, i);
				} else if (resource === 'template') {
					responseData = await executeTemplate.call(this, operation, i);
				} else if (resource === 'templateAsset') {
					responseData = await executeTemplateAsset.call(this, operation, i);
				} else if (resource === 'templateCategory') {
					responseData = await executeTaxonomy.call(this, 'template-categories', operation, i);
				} else if (resource === 'templateTag') {
					responseData = await executeTaxonomy.call(this, 'template-tags', operation, i);
				} else if (resource === 'webhook') {
					responseData = await executeWebhook.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`);
				}

				// Binary download branches
				const wantsBinary = this.getNodeParameter('download', i, false) as boolean;
				if (wantsBinary && resource === 'pdfAsset' && operation === 'sourceUrl') {
					const sourceUrl = responseData.url ?? responseData.sourceUrl ?? responseData.source?.url;
					if (!sourceUrl) throw new NodeOperationError(this.getNode(), 'No source URL returned for the PDF asset');
					returnData.push(await downloadToBinary.call(this, [{ property: 'data', url: sourceUrl, fileName: responseData.fileName ?? 'document.pdf' }], i));
					continue;
				}
				if (wantsBinary && resource === 'signingProcess' && operation === 'getFiles') {
					const targets: Array<{ property: string; url: string; fileName: string }> = [];
					if (responseData.signedPdfUrl ?? responseData.signedPdf?.url) targets.push({ property: 'signedPdf', url: responseData.signedPdfUrl ?? responseData.signedPdf.url, fileName: 'signed.pdf' });
					if (responseData.certificateUrl ?? responseData.certificate?.url) targets.push({ property: 'certificate', url: responseData.certificateUrl ?? responseData.certificate.url, fileName: 'certificate.pdf' });
					if (targets.length === 0) throw new NodeOperationError(this.getNode(), 'No signed files available to download yet (the signing process may not be COMPLETED)');
					returnData.push(await downloadToBinary.call(this, targets, i));
					continue;
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}

async function executeSigningProcess(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	if (operation === 'create') {
		const body: IDataObject = {
			sourcePdfAssetId: this.getNodeParameter('sourcePdfAssetId', i) as string,
			subject: this.getNodeParameter('subject', i) as string,
			dispatchMode: this.getNodeParameter('dispatchMode', i) as string,
			expiresAt: this.getNodeParameter('expiresAt', i) as string,
			signers: jsonParse(this.getNodeParameter('signers', i) as string),
			fields: jsonParse(this.getNodeParameter('fields', i) as string),
		};
		const extra = this.getNodeParameter('additionalCreateFields', i, {}) as IDataObject;
		if (extra.message) body.message = extra.message;
		if (extra.authPolicy) body.authPolicy = extra.authPolicy;
		if (extra.metadata) body.metadata = jsonParse(extra.metadata as string);
		return smartDocsApiRequest.call(this, 'POST', '/signing-processes', body);
	}

	const processId = this.getNodeParameter('processId', i, '') as string;

	if (operation === 'get') return smartDocsApiRequest.call(this, 'GET', `/signing-processes/${processId}`);
	if (operation === 'void') return smartDocsApiRequest.call(this, 'POST', `/signing-processes/${processId}/void`);
	if (operation === 'regenerateCertificate') return smartDocsApiRequest.call(this, 'POST', `/signing-processes/${processId}/regenerate-certificate`);
	if (operation === 'extend') return smartDocsApiRequest.call(this, 'POST', `/signing-processes/${processId}/extend`, { expiresAt: this.getNodeParameter('expiresAt', i) as string });
	// Task 6 wires the 'download' boolean param here to stream the signed PDF + certificate into binary properties.
	if (operation === 'getFiles') return smartDocsApiRequest.call(this, 'GET', `/signing-processes/${processId}/files`);

	if (operation === 'resendInvite' || operation === 'kioskStart' || operation === 'identityProof') {
		const signerId = this.getNodeParameter('signerId', i) as string;
		const path = operation === 'resendInvite' ? 'resend-invite' : operation === 'kioskStart' ? 'kiosk-start' : 'identity-proof';
		return smartDocsApiRequest.call(this, 'POST', `/signing-processes/${processId}/signers/${signerId}/${path}`);
	}

	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		if (returnAll) return smartDocsApiRequestAllItems.call(this, 'GET', '/signing-processes', filters);
		const limit = this.getNodeParameter('limit', i) as number;
		const data = await smartDocsApiRequest.call(this, 'GET', '/signing-processes', undefined, { ...filters, page: 1, pageSize: limit });
		return Array.isArray(data) ? data : (data?.items ?? []);
	}

	throw new NodeOperationError(this.getNode(), `Unsupported signingProcess operation: ${operation}`);
}

async function executeTemplate(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		if (returnAll) return smartDocsApiRequestAllItems.call(this, 'GET', '/templates', filters);
		const limit = this.getNodeParameter('limit', i) as number;
		const data = await smartDocsApiRequest.call(this, 'GET', '/templates', undefined, { ...filters, page: 1, pageSize: limit });
		return Array.isArray(data) ? data : (data?.items ?? []);
	}

	if (operation === 'create') {
		const body: IDataObject = {
			kind: this.getNodeParameter('kind', i) as string,
			name: this.getNodeParameter('name', i) as string,
			...jsonParse(this.getNodeParameter('definition', i) as string),
		};
		return smartDocsApiRequest.call(this, 'POST', '/templates', body);
	}

	const id = this.getNodeParameter('templateId', i) as string;

	if (operation === 'get') return smartDocsApiRequest.call(this, 'GET', `/templates/${id}`);
	if (operation === 'delete') return smartDocsApiRequest.call(this, 'DELETE', `/templates/${id}`);
	if (operation === 'publish') return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/publish`);
	if (operation === 'archive') return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/archive`);
	if (operation === 'unarchive') return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/unarchive`);
	if (operation === 'updateDraft') return smartDocsApiRequest.call(this, 'PATCH', `/templates/${id}/draft`, jsonParse(this.getNodeParameter('definition', i) as string) as IDataObject);
	if (operation === 'previewRender') return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/preview-render`, { data: jsonParse(this.getNodeParameter('renderData', i) as string) as IDataObject });
	if (operation === 'previewDraft') return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/preview-draft`, jsonParse(this.getNodeParameter('draftPreview', i) as string) as IDataObject);

	if (operation === 'startSigning' || operation === 'kioskSession') {
		const extra = this.getNodeParameter('startFields', i, {}) as IDataObject;
		const body: IDataObject = {
			signers: jsonParse(this.getNodeParameter('signers', i) as string),
			expiresAt: this.getNodeParameter('expiresAt', i) as string,
		};
		if (extra.data) body.data = jsonParse(extra.data as string);
		if (extra.fieldPrefills) body.fieldPrefills = jsonParse(extra.fieldPrefills as string);
		if (extra.metadata) body.metadata = jsonParse(extra.metadata as string);
		if (extra.policy) body.policy = extra.policy;
		if (extra.subject) body.subject = extra.subject;
		if (extra.message) body.message = extra.message;
		const path = operation === 'startSigning' ? 'start-signing' : 'kiosk-session';
		return smartDocsApiRequest.call(this, 'POST', `/templates/${id}/${path}`, body);
	}

	throw new NodeOperationError(this.getNode(), `Unsupported template operation: ${operation}`);
}

async function executeTemplateAsset(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	if (operation === 'upload') {
		const prop = this.getNodeParameter('binaryPropertyName', i) as string;
		const binary = this.helpers.assertBinaryData(i, prop);
		const buffer = await this.helpers.getBinaryDataBuffer(i, prop);
		// IHttpRequestOptions.body accepts FormData; use it for multipart (formData key
		// is on the deprecated IRequestOptions, not IHttpRequestOptions in this version).
		const form = new FormData();
		form.append('file', buffer, {
			filename: binary.fileName ?? 'asset.png',
			contentType: binary.mimeType ?? 'image/png',
		});
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'smartDocsApi', {
			method: 'POST',
			baseURL: SMARTDOCS_BASE_URL,
			url: '/template-assets',
			body: form,
			headers: form.getHeaders(),
		});
		return (response as IDataObject)?.data ?? response;
	}
	if (operation === 'getAll') return smartDocsApiRequestAllItems.call(this, 'GET', '/template-assets', {});
	if (operation === 'sourceUrls') {
		const ids = (this.getNodeParameter('ids', i) as string)
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		return smartDocsApiRequest.call(this, 'POST', '/template-assets/source-urls', { ids });
	}
	const id = this.getNodeParameter('assetId', i) as string;
	if (operation === 'get') return smartDocsApiRequest.call(this, 'GET', `/template-assets/${id}`);
	if (operation === 'sourceUrl') return smartDocsApiRequest.call(this, 'GET', `/template-assets/${id}/source-url`);
	if (operation === 'delete') {
		const force = this.getNodeParameter('force', i) as boolean;
		return smartDocsApiRequest.call(this, 'DELETE', `/template-assets/${id}`, undefined, force ? { force: true } : undefined);
	}
	throw new NodeOperationError(this.getNode(), `Unsupported templateAsset operation: ${operation}`);
}

async function executeTaxonomy(this: IExecuteFunctions, base: string, operation: string, i: number): Promise<any> {
	if (operation === 'getAll') return smartDocsApiRequest.call(this, 'GET', `/${base}`);
	if (operation === 'create') return smartDocsApiRequest.call(this, 'POST', `/${base}`, { name: this.getNodeParameter('name', i) as string });
	const id = this.getNodeParameter('itemId', i) as string;
	if (operation === 'update') return smartDocsApiRequest.call(this, 'PATCH', `/${base}/${id}`, { name: this.getNodeParameter('name', i) as string });
	if (operation === 'delete') return smartDocsApiRequest.call(this, 'DELETE', `/${base}/${id}`);
	throw new NodeOperationError(this.getNode(), `Unsupported taxonomy operation: ${operation}`);
}

async function executeWebhook(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	if (operation === 'getAll') return smartDocsApiRequest.call(this, 'GET', '/webhooks');
	if (operation === 'create') {
		const body: IDataObject = {
			url: this.getNodeParameter('url', i) as string,
			events: this.getNodeParameter('events', i) as string[],
		};
		const description = this.getNodeParameter('description', i, '') as string;
		if (description) body.description = description;
		return smartDocsApiRequest.call(this, 'POST', '/webhooks', body);
	}
	const id = this.getNodeParameter('webhookId', i) as string;
	if (operation === 'get') return smartDocsApiRequest.call(this, 'GET', `/webhooks/${id}`);
	if (operation === 'update') return smartDocsApiRequest.call(this, 'PATCH', `/webhooks/${id}`, this.getNodeParameter('updateFields', i, {}) as IDataObject);
	if (operation === 'delete') return smartDocsApiRequest.call(this, 'DELETE', `/webhooks/${id}`);
	if (operation === 'rotateSecret') return smartDocsApiRequest.call(this, 'POST', `/webhooks/${id}/rotate-secret`);
	if (operation === 'listDeliveries') return smartDocsApiRequest.call(this, 'GET', `/webhooks/${id}/deliveries`);
	const deliveryId = this.getNodeParameter('deliveryId', i, '') as string;
	if (operation === 'getDelivery') return smartDocsApiRequest.call(this, 'GET', `/webhooks/${id}/deliveries/${deliveryId}`);
	if (operation === 'redeliver') return smartDocsApiRequest.call(this, 'POST', `/webhooks/${id}/deliveries/${deliveryId}/redeliver`);
	throw new NodeOperationError(this.getNode(), `Unsupported webhook operation: ${operation}`);
}

async function executePdfAsset(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	if (operation === 'upload') {
		const prop = this.getNodeParameter('binaryPropertyName', i) as string;
		return uploadPdfAsset.call(this, i, prop);
	}
	if (operation === 'getAll') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		if (returnAll) return smartDocsApiRequestAllItems.call(this, 'GET', '/pdf-assets', {});
		const limit = this.getNodeParameter('limit', i) as number;
		const data = await smartDocsApiRequest.call(this, 'GET', '/pdf-assets', undefined, { page: 1, pageSize: limit });
		return Array.isArray(data) ? data : (data?.items ?? []);
	}
	const id = this.getNodeParameter('assetId', i) as string;
	if (operation === 'get') return smartDocsApiRequest.call(this, 'GET', `/pdf-assets/${id}`);
	if (operation === 'delete') return smartDocsApiRequest.call(this, 'DELETE', `/pdf-assets/${id}`);
	if (operation === 'parse') return smartDocsApiRequest.call(this, 'GET', `/pdf-assets/${id}/parse`);
	if (operation === 'processingStatus') return smartDocsApiRequest.call(this, 'GET', `/pdf-assets/${id}/processing`);
	if (operation === 'retryProcessing') return smartDocsApiRequest.call(this, 'POST', `/pdf-assets/${id}/processing/retry`);
	if (operation === 'artifactUrls') return smartDocsApiRequest.call(this, 'GET', `/pdf-assets/${id}/artifact-urls`);
	if (operation === 'sourceUrl') return smartDocsApiRequest.call(this, 'GET', `/pdf-assets/${id}/source-url`);
	throw new NodeOperationError(this.getNode(), `Unsupported pdfAsset operation: ${operation}`);
}

async function executePdfEngine(this: IExecuteFunctions, operation: string, _i: number): Promise<any> {
	if (operation === 'listFonts') return smartDocsApiRequest.call(this, 'GET', '/pdf-engine/fonts');
	throw new NodeOperationError(this.getNode(), `Unsupported pdfEngine operation: ${operation}`);
}
