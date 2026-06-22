import { smartDocsApiRequest, smartDocsApiRequestAllItems, uploadPdfAsset, downloadToBinary, SMARTDOCS_BASE_URL } from './index';

function ctx(responses: any[]) {
	const calls: any[] = [];
	let i = 0;
	return {
		calls,
		helpers: {
			httpRequestWithAuthentication: jest.fn(async function (_cred: string, opts: any) {
				calls.push(opts);
				return responses[i++];
			}),
		},
		getNode: () => ({ name: 'SmartDocs' }),
	} as any;
}

describe('smartDocsApiRequest', () => {
	it('targets the fixed base URL and unwraps the data envelope', async () => {
		const c = ctx([{ success: true, data: { id: 't1' }, timestamp: 'now' }]);
		const result = await smartDocsApiRequest.call(c, 'GET', '/templates/t1');
		expect(c.calls[0].baseURL).toBe(SMARTDOCS_BASE_URL);
		expect(c.calls[0].url).toBe('/templates/t1');
		expect(result).toEqual({ id: 't1' });
	});

	it('passes body and query through', async () => {
		const c = ctx([{ success: true, data: {}, timestamp: 'now' }]);
		await smartDocsApiRequest.call(c, 'POST', '/x', { a: 1 }, { q: 2 });
		expect(c.calls[0].body).toEqual({ a: 1 });
		expect(c.calls[0].qs).toEqual({ q: 2 });
	});

	it('returns non-enveloped responses as-is', async () => {
		const c = ctx([{ fonts: ['Arial'] }]);
		const result = await smartDocsApiRequest.call(c, 'GET', '/pdf-engine/fonts');
		expect(result).toEqual({ fonts: ['Arial'] });
	});
});

describe('smartDocsApiRequestAllItems', () => {
	it('walks pages until a short page is returned', async () => {
		const c = ctx([
			{ success: true, data: { items: [{ id: 1 }, { id: 2 }], total: 3, page: 1, pageSize: 2 }, timestamp: 'n' },
			{ success: true, data: { items: [{ id: 3 }], total: 3, page: 2, pageSize: 2 }, timestamp: 'n' },
		]);
		const all = await smartDocsApiRequestAllItems.call(c, 'GET', '/signing-processes', {});
		expect(all.map((x: any) => x.id)).toEqual([1, 2, 3]);
		expect(c.calls[0].qs.page).toBe(1);
		expect(c.calls[1].qs.page).toBe(2);
	});
});

describe('downloadToBinary', () => {
	it('fetches each url into a binary property', async () => {
		const c: any = {
			helpers: {
				httpRequest: jest.fn(async () => Buffer.from('PDFBYTES')),
				prepareBinaryData: jest.fn(async (buf: Buffer, name: string) => ({ data: buf.toString('base64'), fileName: name })),
			},
		};
		const out = await downloadToBinary.call(c, [{ property: 'signedPdf', url: 'https://r2/x.pdf', fileName: 'x.pdf' }], 0);
		expect(out.binary?.signedPdf).toBeDefined();
		expect(c.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://r2/x.pdf', encoding: 'arraybuffer' }));
	});
});

describe('uploadPdfAsset', () => {
	it('runs init -> PUT (no auth) -> commit and returns the committed asset', async () => {
		const authCalls: any[] = [];
		const putCalls: any[] = [];
		let authIdx = 0;
		const authResponses = [
			{ success: true, data: { uploadId: 'up1', url: 'https://r2.example/put?sig=1' }, timestamp: 'n' },
			{ success: true, data: { id: 'asset1', sha256: 'abc' }, timestamp: 'n' },
		];
		const ctx: any = {
			helpers: {
				assertBinaryData: () => ({ fileName: 'doc.pdf', mimeType: 'application/pdf' }),
				getBinaryDataBuffer: async () => Buffer.from('PDFBYTES'),
				httpRequestWithAuthentication: jest.fn(async function (_c: string, opts: any) {
					authCalls.push(opts);
					return authResponses[authIdx++];
				}),
				httpRequest: jest.fn(async (opts: any) => {
					putCalls.push(opts);
					return undefined;
				}),
			},
			getNode: () => ({ name: 'SmartDocs' }),
		};
		const result = await uploadPdfAsset.call(ctx, 0, 'data');
		expect(authCalls[0].url).toBe('/pdf-assets/uploads');
		expect(authCalls[0].body).toEqual({ fileName: 'doc.pdf', sizeBytes: 8, contentType: 'application/pdf' });
		expect(putCalls[0].method).toBe('PUT');
		expect(putCalls[0].url).toBe('https://r2.example/put?sig=1');
		expect(Buffer.isBuffer(putCalls[0].body)).toBe(true);
		expect(authCalls[1].url).toBe('/pdf-assets/uploads/up1/commit');
		expect(result).toEqual({ id: 'asset1', sha256: 'abc' });
	});
});
