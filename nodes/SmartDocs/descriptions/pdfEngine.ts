import type { INodeProperties } from 'n8n-workflow';

export const pdfEngineOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pdfEngine'] } },
		options: [{ name: 'List Fonts', value: 'listFonts', action: 'List available fonts' }],
		default: 'listFonts',
	},
];

export const pdfEngineFields: INodeProperties[] = [];
