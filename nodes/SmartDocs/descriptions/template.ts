import type { INodeProperties } from 'n8n-workflow';

export const templateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{ name: 'Archive', value: 'archive', action: 'Archive a template' },
			{ name: 'Create', value: 'create', action: 'Create a template' },
			{ name: 'Delete', value: 'delete', action: 'Delete a template' },
			{ name: 'Get', value: 'get', action: 'Get a template' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many templates' },
			{ name: 'Kiosk Session', value: 'kioskSession', action: 'Start a kiosk signing session' },
			{ name: 'Preview Draft', value: 'previewDraft', action: 'Render a preview of draft HTML' },
			{ name: 'Preview Render', value: 'previewRender', action: 'Render a preview of the published template' },
			{ name: 'Publish', value: 'publish', action: 'Publish a template version' },
			{ name: 'Start Signing', value: 'startSigning', action: 'Start signing from a template' },
			{ name: 'Unarchive', value: 'unarchive', action: 'Unarchive a template' },
			{ name: 'Update Draft', value: 'updateDraft', action: 'Update a template draft' },
		],
		default: 'getAll',
	},
];

const templateIdOps = [
	'archive',
	'delete',
	'get',
	'kioskSession',
	'previewDraft',
	'previewRender',
	'publish',
	'startSigning',
	'unarchive',
	'updateDraft',
];

export const templateFields: INodeProperties[] = [
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: { show: { resource: ['template'], operation: templateIdOps } },
	},
	// Create
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		options: [
			{ name: 'HTML', value: 'HTML' },
			{ name: 'PDF', value: 'PDF' },
		],
		default: 'PDF',
		required: true,
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['create'] } },
	},
	{
		displayName: 'Definition (JSON)',
		name: 'definition',
		type: 'json',
		default: '{}',
		description:
			'Full template definition body. Keys: description, categoryId, tagIds, defaultPolicy, allowedPolicies, sourcePdfAssetId (PDF), html/css/sampleData/page (HTML), signerRoles, inputSchema, prefillFields, signingFields. Merged with Kind + Name.',
		displayOptions: { show: { resource: ['template'], operation: ['create', 'updateDraft'] } },
	},
	// Start signing / kiosk session
	{
		displayName: 'Signers',
		name: 'signers',
		type: 'json',
		required: true,
		default: '[]',
		description:
			'Array of runtime signers: [{ "roleKey": "...", "name": "...", "email": "...", "phoneE164": "...", "linkedUserId": "...", "locale": "de|en" }]. roleKey is required per signer.',
		displayOptions: { show: { resource: ['template'], operation: ['startSigning', 'kioskSession'] } },
	},
	{
		displayName: 'Expires At',
		name: 'expiresAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['template'], operation: ['startSigning', 'kioskSession'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'startFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['startSigning', 'kioskSession'] } },
		options: [
			{ displayName: 'Data (Runtime Inputs JSON)', name: 'data', type: 'json', default: '{}' },
			{
				displayName: 'Field Prefills (JSON)',
				name: 'fieldPrefills',
				type: 'json',
				default: '[]',
				description: '[{ "fieldKey": "...", "value": ... }].',
			},
			{ displayName: 'Message', name: 'message', type: 'string', default: '' },
			{ displayName: 'Metadata (JSON)', name: 'metadata', type: 'json', default: '{}' },
			{
				displayName: 'Policy',
				name: 'policy',
				type: 'options',
				default: 'EMAIL_AES_OTP',
				options: [
					{ name: 'Email + AES OTP', value: 'EMAIL_AES_OTP' },
					{ name: 'Email + SES Link Only', value: 'EMAIL_SES_LINK_ONLY' },
					{ name: 'Kiosk + AES OTP', value: 'KIOSK_AES_OTP' },
					{ name: 'Kiosk + SES Link Only', value: 'KIOSK_SES_LINK_ONLY' },
				],
			},
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '' },
		],
	},
	// Preview render data
	{
		displayName: 'Render Data (JSON)',
		name: 'renderData',
		type: 'json',
		default: '{}',
		description: 'Runtime input data to render the published template with',
		displayOptions: { show: { resource: ['template'], operation: ['previewRender'] } },
	},
	{
		displayName: 'Draft Preview (JSON)',
		name: 'draftPreview',
		type: 'json',
		default: '{ "html": "<h1>Hello</h1>" }',
		description:
			'Body for draft preview: { "html": "...", "css": "...", "sampleData": {}, "page": {} }. html is required.',
		displayOptions: { show: { resource: ['template'], operation: ['previewDraft'] } },
	},
	{
		displayName: 'Download PDF',
		name: 'download',
		type: 'boolean',
		default: true,
		description: 'Whether to return the rendered PDF as binary data',
		displayOptions: {
			show: { resource: ['template'], operation: ['previewRender', 'previewDraft'] },
		},
	},
	// Get Many
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['template'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['template'], operation: ['getAll'], returnAll: [false] },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['getAll'] } },
		options: [
			{ displayName: 'Archived', name: 'archived', type: 'boolean', default: false },
			{ displayName: 'Category ID', name: 'categoryId', type: 'string', default: '' },
			{ displayName: 'Search', name: 'search', type: 'string', default: '' },
			{ displayName: 'Status', name: 'status', type: 'string', default: '' },
		],
	},
];
