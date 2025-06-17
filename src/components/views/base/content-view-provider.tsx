'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { FileItem } from '@/types/file-item';
import type { BaseContentProps } from './types';

type ContentViewContextProps = BaseContentProps;

const ContentViewContext = createContext<ContentViewContextProps | undefined>(undefined);

interface ContentViewProviderProps extends ContentViewContextProps {
	children: React.ReactNode;
}

export function ContentViewProvider({
	children,
	items,
	isLoading,
	error,
	toggleItemSelection,
	currentContainerId,
	containerName,
	setCurrentContainer,
	emptyState,
	onItemClick,
	onItemDoubleClick,
	onRefresh,
}: ContentViewProviderProps) {
	const handleToggleItemSelection = useCallback(
		(item: FileItem, isMultiSelect: boolean) => {
			if (toggleItemSelection) {
				toggleItemSelection(item, isMultiSelect);
			}
		},
		[toggleItemSelection]
	);

	const value = useMemo(
		() => ({
			items,
			isLoading,
			error,
			toggleItemSelection: handleToggleItemSelection,
			currentContainerId,
			containerName,
			setCurrentContainer,
			emptyState,
			onItemClick,
			onItemDoubleClick,
			onRefresh,
		}),
		[
			items,
			isLoading,
			error,
			handleToggleItemSelection,
			currentContainerId,
			containerName,
			setCurrentContainer,
			emptyState,
			onItemClick,
			onItemDoubleClick,
			onRefresh,
		]
	);

	return <ContentViewContext.Provider value={value}>{children}</ContentViewContext.Provider>;
}

export function useContentView() {
	const context = useContext(ContentViewContext);
	if (context === undefined) {
		throw new Error('useContentView must be used within a ContentViewProvider');
	}
	return context;
}
