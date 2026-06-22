import type {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const SMARTDOCS_BASE_URL = 'https://api.smartdocs.de/api/v1';

type Ctx = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export async function smartDocsApiRequest(
	this: Ctx,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject | undefined = undefined,
	qs: IDataObject | undefined = undefined,
	options: Partial<IHttpRequestOptions> = {},
): Promise<any> {
	const requestOptions: IHttpRequestOptions = {
		method,
		baseURL: SMARTDOCS_BASE_URL,
		url: resource,
		json: true,
		...options,
	};
	if (body !== undefined) requestOptions.body = body;
	if (qs !== undefined) requestOptions.qs = qs;

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'smartDocsApi',
			requestOptions,
		);
		// Binary/no-content responses are returned as-is; JSON envelopes are unwrapped.
		if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
			return (response as IDataObject).data;
		}
		return response;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function smartDocsApiRequestAllItems(
	this: Ctx,
	method: IHttpRequestMethods,
	resource: string,
	qs: IDataObject = {},
): Promise<any[]> {
	const items: any[] = [];
	let page = 1;
	let pageSize = 100; // default
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const data = await smartDocsApiRequest.call(this, method, resource, undefined, {
			...qs,
			page,
			pageSize,
		});
		const batch: any[] = Array.isArray(data) ? data : ((data?.items as any[]) ?? []);
		items.push(...batch);

		// Update pageSize from response metadata if present
		if (!Array.isArray(data) && data?.pageSize !== undefined) {
			pageSize = data.pageSize as number;
		}

		const total = Array.isArray(data) ? batch.length : (data?.total as number | undefined);
		if (batch.length < pageSize || (total !== undefined && items.length >= total)) break;
		page += 1;
		if (page > 1000) break; // safety stop
	}
	return items;
}

export interface DownloadTarget {
	property: string;
	url: string;
	fileName: string;
}

export async function downloadToBinary(
	this: IExecuteFunctions,
	targets: DownloadTarget[],
	itemIndex: number,
): Promise<INodeExecutionData> {
	const out: INodeExecutionData = { json: {}, binary: {}, pairedItem: itemIndex };
	for (const t of targets) {
		const buffer = (await this.helpers.httpRequest({ method: 'GET', url: t.url, encoding: 'arraybuffer' })) as Buffer;
		out.binary![t.property] = await this.helpers.prepareBinaryData(Buffer.from(buffer), t.fileName);
	}
	return out;
}

/**
 * Two-step presigned PDF upload: init → PUT bytes to R2 → commit.
 * Returns the committed PDF asset.
 */
export async function uploadPdfAsset(
	this: IExecuteFunctions,
	itemIndex: number,
	binaryPropertyName: string,
): Promise<any> {
	const binary = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const init = await smartDocsApiRequest.call(this, 'POST', '/pdf-assets/uploads', {
		fileName: binary.fileName ?? 'document.pdf',
		sizeBytes: buffer.length,
		contentType: binary.mimeType ?? 'application/pdf',
	});

	// init shape: { uploadId, url, ... }. PUT raw bytes directly to R2 (no auth header).
	await this.helpers.httpRequest({
		method: 'PUT',
		url: init.url,
		body: buffer,
		headers: { 'Content-Type': binary.mimeType ?? 'application/pdf' },
	});

	return smartDocsApiRequest.call(this, 'POST', `/pdf-assets/uploads/${init.uploadId}/commit`);
}
