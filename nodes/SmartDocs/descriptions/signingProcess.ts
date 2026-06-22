import type { INodeProperties } from 'n8n-workflow';

export const signingProcessOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['signingProcess'] } },
		options: [
			{ name: 'Attach Identity Proof', value: 'identityProof', action: 'Attach signer identity proof' },
			{ name: 'Create', value: 'create', action: 'Create a signing process', description: 'Create an ad-hoc signing process from a stored PDF asset' },
			{ name: 'Extend', value: 'extend', action: 'Extend a signing process expiry' },
			{ name: 'Get', value: 'get', action: 'Get a signing process' },
			{ name: 'Get Files', value: 'getFiles', action: 'Get signed files and certificate links' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many signing processes' },
			{ name: 'Kiosk Start Signer', value: 'kioskStart', action: 'Mint a kiosk token for a signer' },
			{ name: 'Regenerate Certificate', value: 'regenerateCertificate', action: 'Regenerate the completion certificate' },
			{ name: 'Resend Signer Invite', value: 'resendInvite', action: 'Resend a signer invite' },
			{ name: 'Void', value: 'void', action: 'Void a signing process' },
		],
		default: 'create',
	},
];

const idField: INodeProperties = {
	displayName: 'Signing Process ID',
	name: 'processId',
	type: 'string',
	required: true,
	default: '',
	displayOptions: { show: { resource: ['signingProcess'], operation: ['get', 'getFiles', 'void', 'extend', 'regenerateCertificate', 'resendInvite', 'kioskStart', 'identityProof'] } },
};

const signerIdField: INodeProperties = {
	displayName: 'Signer ID',
	name: 'signerId',
	type: 'string',
	required: true,
	default: '',
	displayOptions: { show: { resource: ['signingProcess'], operation: ['resendInvite', 'kioskStart', 'identityProof'] } },
};

export const signingProcessFields: INodeProperties[] = [
	idField,
	signerIdField,
	// --- Create ---
	{
		displayName: 'Source PDF Asset ID',
		name: 'sourcePdfAssetId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Dispatch Mode',
		name: 'dispatchMode',
		type: 'options',
		options: [
			{ name: 'Email', value: 'EMAIL' },
			{ name: 'Kiosk', value: 'KIOSK' },
			{ name: 'Current User', value: 'CURRENT_USER' },
		],
		default: 'EMAIL',
		required: true,
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Expires At',
		name: 'expiresAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Signers',
		name: 'signers',
		type: 'json',
		default: '[]',
		description: 'Array of signer definitions: [{ "signOrder": 1, "name": "...", "email": "...", "phoneE164": "...", "roleLabel": "...", "linkedUserId": "...", "locale": "de|en" }]. signOrder is required per signer.',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'json',
		default: '[]',
		description: 'Array of field definitions: [{ "assignedSignerSignOrder": 1, "type": "SIGNATURE|TEXT|DATE|CHECKBOX", "label": "...", "page": 0, "x": 0, "y": 0, "w": 0, "h": 0, "required": true }]',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalCreateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['signingProcess'], operation: ['create'] } },
		options: [
			{ displayName: 'Auth Policy', name: 'authPolicy', type: 'options', options: [ { name: 'AES OTP', value: 'AES_OTP' }, { name: 'SES Link Only', value: 'SES_LINK_ONLY' } ], default: 'AES_OTP' },
			{ displayName: 'Message', name: 'message', type: 'string', default: '' },
			{ displayName: 'Metadata (JSON)', name: 'metadata', type: 'json', default: '{}' },
		],
	},
	// --- Extend ---
	{
		displayName: 'New Expiry',
		name: 'expiresAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['extend'] } },
	},
	// --- Get Files download toggle ---
	{
		displayName: 'Download Files',
		name: 'download',
		type: 'boolean',
		default: false,
		description: 'Whether to download the signed PDF + certificate bytes into binary properties (otherwise returns the presigned URLs as JSON)',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['getFiles'] } },
	},
	// --- Get Many filters + pagination ---
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['signingProcess'], operation: ['getAll'], returnAll: [false] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['signingProcess'], operation: ['getAll'] } },
		options: [
			{ displayName: 'Dispatch Mode', name: 'dispatchMode', type: 'string', default: '' },
			{ displayName: 'Origin', name: 'origin', type: 'string', default: '' },
			{ displayName: 'Search', name: 'search', type: 'string', default: '' },
			{ displayName: 'Status', name: 'status', type: 'string', default: '' },
			{ displayName: 'Template ID', name: 'templateId', type: 'string', default: '' },
		],
	},
];
