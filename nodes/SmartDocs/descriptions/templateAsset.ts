import type { INodeProperties } from 'n8n-workflow';

export const templateAssetOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['templateAsset'] } },
		options: [
			{ name: 'Delete', value: 'delete', action: 'Delete a template asset' },
			{ name: 'Get', value: 'get', action: 'Get a template asset' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many template assets' },
			{ name: 'Get Source URL', value: 'sourceUrl', action: 'Get a presigned source URL' },
			{ name: 'Get Source URLs', value: 'sourceUrls', action: 'Get presigned source urls for many assets' },
			{ name: 'Upload', value: 'upload', action: 'Upload a template asset image' },
		],
		default: 'upload',
	},
];

export const templateAssetFields: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property that holds the image to upload',
		displayOptions: { show: { resource: ['templateAsset'], operation: ['upload'] } },
	},
	{
		displayName: 'Template Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the template asset',
		displayOptions: { show: { resource: ['templateAsset'], operation: ['delete', 'get', 'sourceUrl'] } },
	},
	{
		displayName: 'Force Delete',
		name: 'force',
		type: 'boolean',
		default: false,
		description: 'Whether to delete even if templates still reference the asset',
		displayOptions: { show: { resource: ['templateAsset'], operation: ['delete'] } },
	},
	{
		displayName: 'Asset IDs',
		name: 'ids',
		type: 'string',
		default: '',
		description: 'Comma-separated template asset IDs',
		displayOptions: { show: { resource: ['templateAsset'], operation: ['sourceUrls'] } },
	},
];
