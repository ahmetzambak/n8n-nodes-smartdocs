import FormData from 'form-data';
import { SmartDocs } from './SmartDocs.node';

/**
 * Unit tests for the templateAsset 'upload' operation.
 *
 * The upload sends binary data via multipart/form-data. In the installed
 * version of n8n-workflow, IHttpRequestOptions.body accepts FormData, so we
 * construct a FormData instance and pass it as body (the formData key lives on
 * the deprecated IRequestOptions, not IHttpRequestOptions in this version).
 * The multipart field name is 'file' (matches FileInterceptor('file') on the API).
 */

function makeCtx(
	authResponse: any,
	binaryData: { fileName?: string; mimeType?: string },
	buffer: Buffer,
) {
	const authCalls: any[] = [];
	return {
		authCalls,
		ctx: {
			getInputData: () => [{ json: {} }],
			getNodeParameter: (name: string, _i: number, def?: any) => {
				if (name === 'resource') return 'templateAsset';
				if (name === 'operation') return 'upload';
				if (name === 'binaryPropertyName') return 'data';
				return def;
			},
			continueOnFail: () => false,
			getNode: () => ({ name: 'SmartDocs' }),
			helpers: {
				assertBinaryData: jest.fn(() => binaryData),
				getBinaryDataBuffer: jest.fn(async () => buffer),
				httpRequestWithAuthentication: jest.fn(async function (_cred: string, opts: any) {
					authCalls.push(opts);
					return authResponse;
				}),
				constructExecutionMetaData: jest.fn((items: any[], _meta: any) => items),
				returnJsonArray: jest.fn((data: any) => (Array.isArray(data) ? data : [{ json: data }])),
			},
		} as any,
	};
}

describe('executeTemplateAsset – upload', () => {
	it('sends body as FormData with multipart field name "file"', async () => {
		const buffer = Buffer.from('IMGBYTES');
		// Spy on FormData.prototype.append BEFORE executing so we capture the call
		const appendSpy = jest.spyOn(FormData.prototype, 'append');

		const { authCalls, ctx } = makeCtx(
			{ success: true, data: { id: 'ta1', fileName: 'logo.png' }, timestamp: 'now' },
			{ fileName: 'logo.png', mimeType: 'image/png' },
			buffer,
		);

		const node = new SmartDocs();
		await node.execute.call(ctx);

		expect(authCalls).toHaveLength(1);
		const opts = authCalls[0];

		// Must use FormData body for multipart
		expect(opts.body).toBeInstanceOf(FormData);

		// Must target correct endpoint
		expect(opts.method).toBe('POST');
		expect(opts.url).toBe('/template-assets');

		// Verify append was called with field name 'file', the buffer, and correct options
		expect(appendSpy).toHaveBeenCalledWith(
			'file',
			buffer,
			expect.objectContaining({ filename: 'logo.png', contentType: 'image/png' }),
		);

		appendSpy.mockRestore();
	});

	it('falls back to "asset.png" / "image/png" when binary metadata is missing', async () => {
		const buffer = Buffer.from('IMGBYTES');
		const appendSpy = jest.spyOn(FormData.prototype, 'append');

		const { authCalls, ctx } = makeCtx(
			{ success: true, data: { id: 'ta2' }, timestamp: 'now' },
			{ fileName: undefined, mimeType: undefined },
			buffer,
		);

		const node = new SmartDocs();
		await node.execute.call(ctx);

		expect(authCalls).toHaveLength(1);
		expect(appendSpy).toHaveBeenCalledWith(
			'file',
			buffer,
			expect.objectContaining({ filename: 'asset.png', contentType: 'image/png' }),
		);

		appendSpy.mockRestore();
	});

	it('unwraps the data envelope from the response', async () => {
		const buffer = Buffer.from('IMGBYTES');
		const appendSpy = jest.spyOn(FormData.prototype, 'append');

		const { ctx } = makeCtx(
			{ success: true, data: { id: 'ta3', url: 'https://cdn/ta3.png' }, timestamp: 'now' },
			{ fileName: 'img.png', mimeType: 'image/png' },
			buffer,
		);

		const node = new SmartDocs();
		const result = await node.execute.call(ctx);

		// The envelope must be unwrapped: json holds the data payload, not { success, data, timestamp }
		expect(result[0][0].json).toEqual({ id: 'ta3', url: 'https://cdn/ta3.png' });

		appendSpy.mockRestore();
	});
});
