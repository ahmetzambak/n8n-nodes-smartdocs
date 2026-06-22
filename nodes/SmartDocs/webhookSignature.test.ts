import { createHmac } from 'node:crypto';
import { verifyWebhookSignature } from './webhookSignature';

function sign(secret: string, ts: number, body: string) {
	const digest = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
	return `t=${ts},v1=${digest}`;
}

describe('verifyWebhookSignature', () => {
	const secret = 'whsec_test';
	const body = '{"id":"evt_1"}';
	const now = 1_700_000_000;

	it('accepts a valid, fresh signature', () => {
		expect(verifyWebhookSignature(secret, sign(secret, now, body), body, now)).toBe(true);
	});
	it('rejects a tampered body', () => {
		expect(verifyWebhookSignature(secret, sign(secret, now, body), '{"id":"evt_2"}', now)).toBe(false);
	});
	it('rejects an expired timestamp beyond tolerance', () => {
		expect(verifyWebhookSignature(secret, sign(secret, now - 10_000, body), body, now)).toBe(false);
	});
	it('rejects a malformed header', () => {
		expect(verifyWebhookSignature(secret, 'garbage', body, now)).toBe(false);
	});
});
