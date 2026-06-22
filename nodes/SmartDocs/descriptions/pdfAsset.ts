import type { INodeProperties } from 'n8n-workflow';

export const pdfAssetOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pdfAsset'] } },
		options: [
			{ name: 'Delete', value: 'delete', action: 'Delete a PDF asset' },
			{ name: 'Get', value: 'get', action: 'Get a PDF asset' },
			{ name: 'Get Artifact URLs', value: 'artifactUrls', action: 'Get presigned artifact urls' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many PDF assets' },
			{ name: 'Get Processing Status', value: 'processingStatus', action: 'Get processing status' },
			{ name: 'Get Source URL', value: 'sourceUrl', action: 'Get a presigned source URL' },
			{ name: 'Parse', value: 'parse', action: 'Get parsed page info' },
			{ name: 'Retry Processing', value: 'retryProcessing', action: 'Retry failed processing' },
			{ name: 'Upload', value: 'upload', action: 'Upload a PDF asset' },
		],
		default: 'upload',
	},
];

const idOps = ['get', 'delete', 'parse', 'processingStatus', 'retryProcessing', 'sourceUrl', 'artifactUrls'];

export const pdfAssetFields: INodeProperties[] = [
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property that holds the PDF to upload',
		displayOptions: { show: { resource: ['pdfAsset'], operation: ['upload'] } },
	},
	{
		displayName: 'PDF Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['pdfAsset'], operation: idOps } },
	},
	{
		displayName: 'Download File',
		name: 'download',
		type: 'boolean',
		default: false,
		description: 'Whether to download the source bytes into a binary property (otherwise returns the URL JSON)',
		displayOptions: { show: { resource: ['pdfAsset'], operation: ['sourceUrl'] } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['pdfAsset'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['pdfAsset'], operation: ['getAll'], returnAll: [false] } },
	},
];
