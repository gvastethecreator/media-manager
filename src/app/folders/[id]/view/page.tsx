'use client';

import { FolderView } from '@/components/features/views/folder/folder-view';
import { useParams } from 'next/navigation';

export default function FolderPage() {
  const params = useParams();
  const id = params.id as string;

  return <FolderView id={id} />;
}