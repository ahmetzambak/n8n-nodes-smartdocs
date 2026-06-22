import type { INodeProperties } from 'n8n-workflow';

function makeOps(resource: string, label: string): INodeProperties[] {
	return [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resource] } },
			options: [
				{ name: 'Create', value: 'create', action: `Create a ${label}` },
				{ name: 'Delete', value: 'delete', action: `Delete a ${label}` },
				{ name: 'Get Many', value: 'getAll', action: `Get many ${label}s` },
				{ name: 'Update', value: 'update', action: `Update a ${label}` },
			],
			default: 'getAll',
		},
	];
}

function makeFields(resource: string, label: string): INodeProperties[] {
	return [
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { resource: [resource], operation: ['create', 'update'] } },
		},
		{
			displayName: `${label} ID`,
			name: 'itemId',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { resource: [resource], operation: ['delete', 'update'] } },
		},
	];
}

export const templateCategoryOperations = makeOps('templateCategory', 'category');
export const templateCategoryFields = makeFields('templateCategory', 'Category');
export const templateTagOperations = makeOps('templateTag', 'tag');
export const templateTagFields = makeFields('templateTag', 'Tag');
