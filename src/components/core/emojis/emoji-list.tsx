import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmojiData, getEmojisByCategory } from './get-emojis';

interface EmojiCategoryProps {
	category: string;
}

const GetEmojis = ({ category }: EmojiCategoryProps) => {
	const emojis = getEmojisByCategory(category as any);
	return (
		<div className="grid grid-cols-8 gap-2">
			{emojis.map((emoji: EmojiData) => (
				<span key={emoji.emoji} className="text-2xl cursor-pointer hover:scale-110 transition-transform">
					{emoji.emoji}
				</span>
			))}
		</div>
	);
};

const list = [
	{
		name: 'Smilies',
		value: 'smilies',
	},
	{
		name: 'Hand gestures',
		value: 'hand-gestures',
	},
	{
		name: 'People',
		value: 'people',
	},
	{
		name: 'People with activities',
		value: 'people-with-activities',
	},
	{
		name: 'People with professions',
		value: 'people-with-professions',
	},
	{
		name: 'Animals',
		value: 'animals',
	},
	{
		name: 'Food',
		value: 'food',
	},
	{
		name: 'Activities',
		value: 'activities',
	},
	{
		name: 'Travel & places',
		value: 'travel-and-places',
	},
	{
		name: 'Objects',
		value: 'objects',
	},
	{
		name: 'Symbols',
		value: 'symbols',
	},
];

const EmojiList = () => {
	return (
		<Tabs defaultValue="smilies" className="items-center justify-center flex flex-col space-y-8 md:max-w-7xl">
			<TabsList className="w-96 md:w-auto touch-none select-none flex justify-start overflow-x-scroll md:overflow-auto overflow-y-hidden scroll-mt-4">
				{list.map((item) => (
					<TabsTrigger key={item.value} value={item.value}>
						{item.name}
					</TabsTrigger>
				))}
			</TabsList>
			{list.map((item) => (
				<TabsContent key={item.value} value={item.value}>
					{<GetEmojis category={item.name.replaceAll(' ', '%20').replaceAll('&', 'and')} />}
				</TabsContent>
			))}
		</Tabs>
	);
};

export default EmojiList;
