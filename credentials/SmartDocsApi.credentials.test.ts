import { SmartDocsApi } from './SmartDocsApi.credentials';

describe('SmartDocsApi credential', () => {
	const cred = new SmartDocsApi();

	it('has the expected name and a password apiKey field', () => {
		expect(cred.name).toBe('smartDocsApi');
		const apiKey = cred.properties.find((p) => p.name === 'apiKey');
		expect(apiKey).toBeDefined();
		expect(apiKey?.typeOptions?.password).toBe(true);
	});

	it('injects the API key as the X-API-Key header', () => {
		expect(cred.authenticate.properties.headers?.['X-API-Key']).toBe('={{$credentials.apiKey}}');
	});

	it('tests against the production /templates endpoint', () => {
		expect(cred.test.request.baseURL).toBe('https://api.smartdocs.de/api/v1');
		expect(cred.test.request.url).toBe('/templates');
	});
});
