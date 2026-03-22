('use client');

import { createContext, type ReactNode, useContext, useState } from 'react';
import type { User } from '@/lib/types';
import type { CollectionBase } from '@/types/entities/collection';
import type { FolderBase } from '@/types/entities/folder';
import type { TagBase } from '@/types/entities/tag';

type ViewType = 'files' | 'collections' | 'folders' | 'tags';

interface ProfileContextType {
	collections: CollectionBase[];
	currentUser: User;
	currentView: ViewType;
	folders: FolderBase[];
	openProfileSettings: () => void;
	openSettingsTab: (tab: string) => void;
	setCurrentView: (view: ViewType) => void;
	tags: TagBase[];
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
	const [currentView, setCurrentView] = useState<ViewType>('files');

	const value = {
		currentUser: {
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			totalImages: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		openProfileSettings: () => {},
		openSettingsTab: () => {},
		collections: [],
		folders: [],
		tags: [],
		currentView,
		setCurrentView,
	};

	return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
	const context = useContext(ProfileContext);
	if (context === undefined) {
		throw new Error('useProfile must be used within a ProfileProvider');
	}
	return context;
}
