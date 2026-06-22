import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmartDocsApi implements ICredentialType {
	name = 'smartDocsApi';

	displayName = 'SmartDocs API';

	documentationUrl = 'https://docs.smartdocs.de';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Organization-scoped SmartDocs API key (starts with sdk_live_). Create one in SmartDocs under Settings → API Keys.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.smartdocs.de/api/v1',
			url: '/templates',
		},
	};
}
