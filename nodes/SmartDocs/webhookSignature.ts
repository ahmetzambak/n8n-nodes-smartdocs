import { createHmac, timingSafeEqual } from 'node:crypto';

const HEADER_PATTERN = /^t=(\d+),v1=([0-9a-f]{64})$/;
const DEFAULT_TOLERANCE_SEC = 5 * 60;

export function verifyWebhookSignature(
	secret: string,
	header: string,
	body: string,
	nowSec: number,
	toleranceSec: number = DEFAULT_TOLERANCE_SEC,
): boolean {
	const match = HEADER_PATTERN.exec(header);
	if (!match) return false;
	const timestampSec = parseInt(match[1], 10);
	if (Math.abs(nowSec - timestampSec) > toleranceSec) return false;
	const expected = createHmac('sha256', secret).update(`${timestampSec}.${body}`).digest('hex');
	const a = Buffer.from(expected, 'hex');
	const b = Buffer.from(match[2], 'hex');
	return a.length === b.length && timingSafeEqual(a, b);
}
