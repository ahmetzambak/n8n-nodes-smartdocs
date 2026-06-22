import { createHmac } from 'node:crypto';
import { SmartDocsTrigger } from './SmartDocsTrigger.node';

const RAW_BODY_STRING = '{"id":"evt_1","type":"signing.completed","data":{"signingProcess":{"id":"sp_1"}}}';
const PARSED_PAYLOAD = JSON.parse(RAW_BODY_STRING) as { id: string; type: string; data: object };
const SECRET = 'whsec_test';

function buildHeader(secret: string, rawBody: string, tSec?: number): string {
	const t = tSec ?? Math.floor(Date.now() / 1000);
	const digest = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
	return `t=${t},v1=${digest}`;
}

function makeCtx(overrides: {
	secret?: string | undefined;
	seenIds?: string[];
	header?: string;
	rawBody?: string;
	payload?: object;
}): any {
	const {
		secret,
		seenIds = [],
		header = buildHeader(SECRET, RAW_BODY_STRING),
		rawBody = RAW_BODY_STRING,
		payload = PARSED_PAYLOAD,
	} = overrides;

	const staticData: Record<string, any> = { seenIds };
	if (secret !== undefined) staticData.secret = secret;

	return {
		getRequestObject: () => ({ rawBody: Buffer.from(rawBody) }),
		getHeaderData: () => ({ 'x-smartdocs-signature': header }),
		getWorkflowStaticData: (_scope: string) => staticData,
		getBodyData: () => payload,
		helpers: {
			returnJsonArray: (d: any) => (Array.isArray(d) ? d : [{ json: d }]),
		},
	};
}

describe('SmartDocsTrigger.webhook()', () => {
	it('returns workflowData for a valid signed request', async () => {
		const ctx = makeCtx({ secret: SECRET });
		const result = await new SmartDocsTrigger().webhook.call(ctx);
		expect(result).not.toHaveProperty('webhookResponse');
		expect(result).toHaveProperty('workflowData');
		const emitted = (result.workflowData as any[][])[0];
		expect(emitted).toEqual([PARSED_PAYLOAD]);
	});

	it('returns 401 when no secret is stored', async () => {
		const ctx = makeCtx({ secret: undefined, seenIds: [] });
		const result = await new SmartDocsTrigger().webhook.call(ctx);
		expect(result).toEqual({ webhookResponse: { statusCode: 401 } });
	});

	it('returns 401 for a tampered signature (wrong digest)', async () => {
		const badHeader = buildHeader(SECRET, RAW_BODY_STRING).replace(/v1=[0-9a-f]+/, 'v1=' + 'a'.repeat(64));
		const ctx = makeCtx({ secret: SECRET, header: badHeader });
		const result = await new SmartDocsTrigger().webhook.call(ctx);
		expect(result).toEqual({ webhookResponse: { statusCode: 401 } });
	});

	it('returns 200 (no workflowData) for a duplicate event id', async () => {
		const ctx = makeCtx({ secret: SECRET, seenIds: ['evt_1'] });
		const result = await new SmartDocsTrigger().webhook.call(ctx);
		expect(result).toEqual({ webhookResponse: { statusCode: 200 } });
		expect(result).not.toHaveProperty('workflowData');
	});
});
