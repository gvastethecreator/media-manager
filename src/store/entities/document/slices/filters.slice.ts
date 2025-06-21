/**
 * @file Slice de filtros para el store de Document.
 * @module store/entities/document/slices/filters
 */
import type { StateCreator } from 'zustand';
import type { DocumentFilterActions, DocumentFilterState, DocumentStore } from '../types';

const initialState: DocumentFilterState = {};

export const createDocumentFilterSlice: StateCreator<
	DocumentStore,
	[],
	[],
	DocumentFilterState & DocumentFilterActions
> = () => ({
	...initialState,
});

