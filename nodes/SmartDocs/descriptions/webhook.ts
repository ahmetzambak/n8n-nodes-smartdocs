import type { INodeProperties } from 'n8n-workflow';

const EVENT_OPTIONS = [
	{ name: 'Signing Completed', value: 'SIGNING_COMPLETED' },
	{ name: 'Signing Declined', value: 'SIGNING_DECLINED' },
	{ name: 'Signing Expired', value: 'SIGNING_EXPIRED' },
	{ name: 'Signing Sent', value: 'SIGNING_SENT' },
	{ name: 'Signing Voided', value: 'SIGNING_VOIDED' },
	{ name: 'Signer Completed', value: 'SIGNER_COMPLETED' },
];

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhook'] } },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a webhook endpoint' },
			{ name: 'Delete', value: 'delete', action: 'Delete a webhook endpoint' },
			{ name: 'Get', value: 'get', action: 'Get a webhook endpoint' },
			{ name: 'Get Delivery', value: 'getDelivery', action: 'Get a delivery' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many webhook endpoints' },
			{ name: 'List Deliveries', value: 'listDeliveries', action: 'List deliveries' },
			{ name: 'Redeliver', value: 'redeliver', action: 'Redeliver a delivery' },
			{ name: 'Rotate Secret', value: 'rotateSecret', action: 'Rotate the signing secret' },
			{ name: 'Update', value: 'update', action: 'Update a webhook endpoint' },
		],
		default: 'getAll',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['get', 'update', 'delete', 'rotateSecret', 'listDeliveries', 'getDelivery', 'redeliver'],
			},
		},
	},
	{
		displayName: 'Delivery ID',
		name: 'deliveryId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['webhook'], operation: ['getDelivery', 'redeliver'] } },
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: EVENT_OPTIONS,
		default: [],
		required: true,
		displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['webhook'], operation: ['update'] } },
		options: [
			{ displayName: 'Description', name: 'description', type: 'string', default: '' },
			{ displayName: 'Enabled', name: 'enabled', type: 'boolean', default: true },
			{ displayName: 'Events', name: 'events', type: 'multiOptions', options: EVENT_OPTIONS, default: [] },
			{ displayName: 'URL', name: 'url', type: 'string', default: '' },
		],
	},
];
