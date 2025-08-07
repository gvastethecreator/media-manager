import {
	Album,
	BookOpen,
	FileText,
	Folder,
	Hash,
	ImageIcon,
	MapPin,
	MessageSquare,
	Music,
	Package,
	Settings,
	Star,
	Tag,
	User,
	Video,
} from 'lucide-react';

/**
 * Obtiene el icono correspondiente según el tipo de entidad
 */
export const getEntityIcon = (entityType: string): React.ComponentType<any> => {
	const iconMap: Record<string, React.ComponentType<any>> = {
		image: ImageIcon,
		video: Video,
		audio: Music,
		document: FileText,
		folder: Folder,
		collection: Album,
		album: Album,
		character: User,
		place: MapPin,
		worldItem: Package,
		concept: BookOpen,
		prompt: MessageSquare,
		tag: Tag,
		property: Hash,
		note: FileText,
		wildcard: Star,
		group: Settings,
	};

	return iconMap[entityType] || FileText;
};
