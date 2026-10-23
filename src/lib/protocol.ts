export type FieldType = 'text' | 'textarea' | 'link' | 'image';
export interface Field {
	id: string;
	type: FieldType;
	label: string;
	value: string;
	maxLength?: number;
}
export type ChildMessage =
	| {
			channel: 'visual-editor-sdk';
			version: 1;
			type: 'EDITOR_READY';
			siteId: string;
			fields: Field[];
	  }
	| {
			channel: 'visual-editor-sdk';
			version: 1;
			type: 'CONTENT_SELECTED';
			siteId: string;
			field: Field;
	  }
	| { channel: 'visual-editor-sdk'; version: 1; type: 'PONG'; siteId: string }
	| {
			channel: 'visual-editor-sdk';
			version: 1;
			type: 'SDK_ERROR';
			siteId: string;
			message: string;
	  }
	| {
			channel: 'visual-editor-sdk';
			version: 1;
			type: 'DESELECT';
			siteId?: string;
	  };
export type ParentMessage =
	| { channel: 'visual-editor-sdk'; version: 1; type: 'PING' }
	| { channel: 'visual-editor-sdk'; version: 1; type: 'SET_EDIT_MODE'; enabled: boolean }
	| { channel: 'visual-editor-sdk'; version: 1; type: 'UPDATE_PREVIEW'; id: string; value: string }
	| { channel: 'visual-editor-sdk'; version: 1; type: 'RESTORE_PREVIEW'; id: string }
	| { channel: 'visual-editor-sdk'; version: 1; type: 'RESTORE_ALL_PREVIEWS' };
export function isChildMessage(value: unknown): value is ChildMessage {
	if (!value || typeof value !== 'object') return false;
	const d = value as Record<string, unknown>;
	if (d.channel !== 'visual-editor-sdk' || d.version !== 1 || typeof d.type !== 'string')
		return false;
	if (d.type === 'EDITOR_READY') return typeof d.siteId === 'string' && Array.isArray(d.fields);
	if (d.type === 'CONTENT_SELECTED') {
		const f = d.field as Record<string, unknown> | undefined;
		return (
			typeof d.siteId === 'string' &&
			!!f &&
			typeof f.id === 'string' &&
			typeof f.type === 'string' &&
			typeof f.label === 'string' &&
			typeof f.value === 'string'
		);
	}
	if (d.type === 'PONG') return typeof d.siteId === 'string';
	if (d.type === 'SDK_ERROR') return typeof d.siteId === 'string' && typeof d.message === 'string';
	if (d.type === 'DESELECT') return true;
	return false;
}
export function parentMessage<T extends ParentMessage['type']>(
	type: T,
	payload: Omit<Extract<ParentMessage, { type: T }>, 'channel' | 'version' | 'type'> = {} as never
): Extract<ParentMessage, { type: T }> {
	return { channel: 'visual-editor-sdk', version: 1, type, ...payload } as Extract<
		ParentMessage,
		{ type: T }
	>;
}
