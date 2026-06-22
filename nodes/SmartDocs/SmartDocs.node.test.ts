import { SmartDocs } from './SmartDocs.node';

describe('SmartDocs node description', () => {
	const node = new SmartDocs();

	it('declares the smartDocsApi credential and the signingProcess resource', () => {
		expect(node.description.credentials?.[0].name).toBe('smartDocsApi');
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const values = (resource?.options as any[]).map((o) => o.value);
		expect(values).toContain('signingProcess');
	});

	it('exposes pdfEngine resource with listFonts operation', () => {
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const resourceValues = (resource?.options as any[]).map((o) => o.value);
		expect(resourceValues).toContain('pdfEngine');

		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const pdfEngineOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('pdfEngine'));
		expect(pdfEngineOp).toBeDefined();
		const values = (pdfEngineOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(['listFonts']);
	});

	it('exposes a create operation for signingProcess', () => {
		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const op = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('signingProcess'));
		const values = (op?.options as any[]).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['create', 'get', 'getAll', 'getFiles', 'void']));
	});

	it('registers loadOptions methods', () => {
		expect(typeof (node as any).methods.loadOptions.getTemplates).toBe('function');
	});

	it('exposes template operations', () => {
		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const templateOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('template'));
		const values = (templateOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['startSigning', 'getAll', 'publish']));
	});

	it('exposes templateAsset operations including upload', () => {
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const resourceValues = (resource?.options as any[]).map((o) => o.value);
		expect(resourceValues).toContain('templateAsset');

		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const assetOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('templateAsset'));
		expect(assetOp).toBeDefined();
		const values = (assetOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['upload', 'get', 'getAll', 'delete', 'sourceUrl', 'sourceUrls']));
	});

	it('exposes templateCategory resource with CRUD operations', () => {
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const resourceValues = (resource?.options as any[]).map((o) => o.value);
		expect(resourceValues).toContain('templateCategory');

		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const catOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('templateCategory'));
		expect(catOp).toBeDefined();
		const values = (catOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['create', 'delete', 'getAll', 'update']));
	});

	it('exposes templateTag resource with CRUD operations', () => {
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const resourceValues = (resource?.options as any[]).map((o) => o.value);
		expect(resourceValues).toContain('templateTag');

		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const tagOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('templateTag'));
		expect(tagOp).toBeDefined();
		const values = (tagOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['create', 'delete', 'getAll', 'update']));
	});

	it('exposes webhook resource with management operations', () => {
		const resource = node.description.properties.find((p) => p.name === 'resource');
		const resourceValues = (resource?.options as any[]).map((o) => o.value);
		expect(resourceValues).toContain('webhook');

		const ops = node.description.properties.filter((p) => p.name === 'operation');
		const webhookOp = ops.find((p) => (p.displayOptions?.show as any)?.resource?.includes('webhook'));
		expect(webhookOp).toBeDefined();
		const values = (webhookOp?.options as any[]).map((o) => o.value);
		expect(values).toEqual(
			expect.arrayContaining(['create', 'delete', 'get', 'getAll', 'getDelivery', 'listDeliveries', 'redeliver', 'rotateSecret', 'update']),
		);
	});
});
