import React from 'react';
import { CardItem } from '@/components/card-view';

type User = {
  name: string;
  totalImages: number;
  avatar: string;
};

type ProfileContextType = {
  currentUser: User;
  openProfileSettings: () => void;
  openSettingsTab: (tab: string) => void;
  collections: CardItem[];
  folders: CardItem[];
  tags: CardItem[];
  setCurrentView: (view: 'files' | 'collections' | 'folders' | 'tags') => void;
};

export const ProfileContext = React.createContext<ProfileContextType>({
  currentUser: { name: '', totalImages: 0, avatar: '' },
  openProfileSettings: () => {},
  openSettingsTab: () => {},
  collections: [],
  folders: [],
  tags: [],
  setCurrentView: () => {},
});

export const useProfile = () => {
  const context = React.useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};