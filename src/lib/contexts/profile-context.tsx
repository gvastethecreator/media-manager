'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import type { User } from '@/lib/types';

type ViewType = 'files' | 'collections' | 'folders' | 'tags';

type ProfileContextType = {
	currentUser: User;
	openProfileSettings: () => void;
	openSettingsTab: (tab: string) => void;
	collections: CollectionBase[];
	folders: FolderBase[];
	tags: TagBase[];
	currentView: ViewType;
	setCurrentView: (view: ViewType) => void;
};

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
