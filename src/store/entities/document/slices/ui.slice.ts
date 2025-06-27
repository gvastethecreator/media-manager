/**
 * @file Slice de UI para el store de Document.
 * @module store/entities/document/slices/ui
 */
import type { StateCreator } from 'zustand';
import type { DocumentStore, DocumentUIActions, DocumentUIState } from '../types';

const initialState: DocumentUIState = {};

export const createDocumentUISlice: StateCreator<DocumentStore, [], [], DocumentUIState & DocumentUIActions> = () => ({
	...initialState,
});
