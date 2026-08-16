import { Files, Folder, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { normalizeSafePreviewImageUrl } from '@/lib/media/preview-url';
import { cn } from '@/lib/utils';
import type { BrowserItem } from '../types/item.types';

interface FolderBrowserVisualProps {
	className?: string;
	compact?: boolean;
	isActive?: boolean;
	item: BrowserItem;
}

const PREVIEW_TRANSFORMS = {
	default: [
		'rotate(-9deg) translate(-22%, -8%)',
		'rotate(-2deg) translate(-6%, -2%)',
		'rotate(7deg) translate(16%, -4%)',
	],
	hover: [
		'rotate(-15deg) translate(-34%, -18%)',
		'rotate(-5deg) translate(-8%, -9%)',
		'rotate(12deg) translate(22%, -14%)',
	],
} as const;

function extractPreviewImages(item: BrowserItem) {
	const raw = item.raw as { recentImages?: BrowserItem['recentImages'] } | undefined;
	const candidates = item.recentImages ?? raw?.recentImages ?? [];
	const previews = candidates
		.map((image, index) => ({
			id: image?.id ?? `folder-preview-${index}`,
			url: normalizeSafePreviewImageUrl(image?.thumbnailUrl ?? image?.thumbnail),
		}))
		.filter((image): image is { id: string; url: string } => image.url !== null)
		.slice(0, PREVIEW_TRANSFORMS.default.length);

	if (previews.length > 0) {
		return previews;
	}

	const fallback = normalizeSafePreviewImageUrl(item.thumbnailUrl);
	if (!fallback) {
		return [];
	}

	const isFolderPreviewFallback = /\/api\/folders\/.+\/preview/i.test(fallback);
	const totalItems = item.totalItems ?? 0;
	if (isFolderPreviewFallback && totalItems <= 0) {
		return [];
	}

	return [
		{
			id: 'folder-preview-fallback',
			url: fallback,
		},
	];
}

export const FolderBrowserVisual = memo(function FolderBrowserVisual({
	item,
	compact = false,
	isActive = false,
	className,
}: FolderBrowserVisualProps) {
	const accentColor = item.color || 'var(--entity-folder)';
	const previews = useMemo(() => extractPreviewImages(item), [item]);
	const count = item.totalItems ?? 0;
	const FolderIcon = isActive ? FolderOpen : Folder;

	return (
		<div
			className={cn('relative h-full w-full overflow-hidden', className)}
			style={{ '--folder-accent': accentColor } as React.CSSProperties}
		>
			<div className="absolute inset-0 bg-linear-to-br from-black/10 via-transparent to-black/30" />

			<div
				className={cn(
					'absolute left-[12%] top-[10%] rounded-t-2xl border border-white/12',
					compact ? 'h-[18%] w-[34%]' : 'h-[16%] w-[30%]'
				)}
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--folder-accent) 88%, white 12%) 0%, color-mix(in oklch, var(--folder-accent) 72%, white 28%) 100%)',
					boxShadow: '0 8px 20px color-mix(in oklch, var(--folder-accent) 22%, transparent)',
				}}
			/>

			<div
				className={cn(
					'absolute inset-x-[8%] rounded-[1.4rem] border border-white/12',
					compact ? 'bottom-[10%] top-[20%]' : 'bottom-[10%] top-[22%]'
				)}
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--folder-accent) 90%, white 10%) 0%, color-mix(in oklch, var(--folder-accent) 72%, black 28%) 100%)',
					boxShadow:
						'0 16px 32px color-mix(in oklch, var(--folder-accent) 24%, transparent), inset 0 1px 0 rgb(255 255 255 / 0.18)',
				}}
			/>

			<div className={cn('absolute inset-x-[14%]', compact ? 'bottom-[22%] top-[26%]' : 'bottom-[20%] top-[30%]')}>
				{previews.length > 0 ? (
					previews.map((preview, index) => (
						<div
							className={cn(
								'absolute left-1/2 top-1/2 overflow-hidden rounded-xl border border-white/15 bg-white shadow-xl transition-transform duration-dt-fast ease-dt-out',
								compact ? 'h-[76%] w-[62%]' : 'h-[82%] w-[68%]'
							)}
							key={preview.id}
							style={{
								transform: `translate(-50%, -50%) ${PREVIEW_TRANSFORMS.default[index]}`,
								zIndex: index + 1,
							}}
						>
							<div
								className="absolute inset-0 bg-cover bg-center"
								style={{ backgroundImage: `url("${preview.url}")` }}
							/>
							<div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-black/16" />
						</div>
					))
				) : (
					<div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/12 text-white/82">
						<FolderIcon size={compact ? 16 : 26} strokeWidth={1.8} />
					</div>
				)}
			</div>

			<div
				className={cn(
					'absolute inset-x-[9%] rounded-[1.35rem] border border-white/18 backdrop-blur-[1.5px]',
					compact ? 'bottom-[10%] top-[30%]' : 'bottom-[10%] top-[32%]'
				)}
				style={{
					background:
						'linear-gradient(180deg, color-mix(in oklch, var(--folder-accent) 34%, white 66%) 0%, color-mix(in oklch, var(--folder-accent) 46%, white 54%) 100%)',
					opacity: 0.72,
				}}
			/>

			<div
				className={cn(
					'absolute left-[14%] top-[17%] flex items-center gap-1.5 text-white drop-shadow-sm',
					compact && 'top-[15%]'
				)}
			>
				{item.emoji ? (
					<span className={cn('leading-none', compact ? 'text-[10px]' : 'text-xs')}>{item.emoji}</span>
				) : (
					<FolderIcon size={compact ? 11 : 14} strokeWidth={1.8} />
				)}
				{!compact && (
					<span className="max-w-38 truncate font-semibold text-[10px] uppercase tracking-[0.16em] text-white/88">
						{item.name}
					</span>
				)}
			</div>

			{count > 0 && (
				<div
					className={cn(
						'absolute left-[14%] rounded-full border border-white/15 bg-black/35 font-medium text-white shadow-lg backdrop-blur-sm',
						compact ? 'bottom-[13%] px-1.5 py-0.5 text-[8px]' : 'bottom-[14%] px-2 py-1 text-[11px]'
					)}
				>
					<span className="flex items-center gap-1">
						<Files size={compact ? 8 : 11} />
						{count}
					</span>
				</div>
			)}

			{!compact && previews.length === 0 && (
				<div className="absolute right-[14%] bottom-[14%] rounded-full border border-white/15 bg-white/12 px-2 py-1 text-[10px] text-white/88 shadow-lg backdrop-blur-sm">
					<ImageIcon size={10} className="inline-block" />
				</div>
			)}

			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-dt-fast ease-dt-out group-hover:opacity-100">
				{PREVIEW_TRANSFORMS.hover.map((transform, index) => (
					<div
						className={cn('absolute left-1/2 top-[46%] rounded-xl', compact ? 'h-[58%] w-[46%]' : 'h-[64%] w-[52%]')}
						key={`hover-${transform}`}
						style={{
							transform: `translate(-50%, -50%) ${transform}`,
							zIndex: index + 1,
							boxShadow: '0 10px 24px rgb(0 0 0 / 0.14)',
						}}
					/>
				))}
			</div>
		</div>
	);
});
