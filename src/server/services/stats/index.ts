/**
 * Barrel export para módulos de stats service
 */

// Types
export type {
	GeneralStats,
	StatsResponse,
	ExtendedStats,
	CountRow,
	SizeRow,
	MediaCounts,
	OrgCounts,
	WorldCounts,
	SystemCounts,
	SizeSums,
	TopTag,
	EntityWithImageCount,
	CollectionWithData,
	TagWithData,
	EntityWithEmoji,
	EntitySearchResult,
} from './stats.types';

// Constants
export {
	STATS_CACHE_TAG,
	STATS_REVALIDATE_SECONDS,
	statsLogger,
	StatsErrorCode,
	createStatsError,
	type StatsErrorCode as StatsErrorCodeType,
} from './stats.constants';

// Queries
export {
	fetchMediaCounts,
	fetchOrgCounts,
	fetchWorldCounts,
	fetchSystemCounts,
	fetchSizeSums,
	buildDiskUsage,
	formatBytes,
} from './stats.queries';
