export type StrongRelationContext = "organization" | "taxonomy" | "worldbuilding";

export interface StrongRelationDefinition {
	readonly context: StrongRelationContext;
	readonly leftTable: string;
	readonly rightTable: string;
	readonly tableName: string;
}

/**
 * Authoritative catalog for authored many-to-many relations.
 *
 * Every entry is materialized as an A/B junction with a unique pair, a B-side
 * inverse-query index and cascading foreign keys. Runtime and tooling consume
 * this catalog instead of maintaining parallel, incomplete inventories.
 */
export const STRONG_RELATION_CATALOG = [
	{ context: "worldbuilding", leftTable: "Album", rightTable: "Place", tableName: "_AlbumToPlace" },
	{ context: "worldbuilding", leftTable: "Character", rightTable: "Place", tableName: "_CharacterToPlace" },
	{ context: "organization", leftTable: "Group", rightTable: "Album", tableName: "_GroupToAlbum" },
	{ context: "organization", leftTable: "Group", rightTable: "Image", tableName: "_GroupToImage" },
	{ context: "taxonomy", leftTable: "Group", rightTable: "Tag", tableName: "_GroupToTag" },
	{ context: "organization", leftTable: "Group", rightTable: "Video", tableName: "_GroupToVideo" },
	{ context: "organization", leftTable: "Image", rightTable: "Album", tableName: "_ImageToAlbum" },
	{ context: "worldbuilding", leftTable: "Image", rightTable: "Character", tableName: "_ImageToCharacter" },
	{ context: "organization", leftTable: "Image", rightTable: "Collection", tableName: "_ImageToCollection" },
	{ context: "worldbuilding", leftTable: "Image", rightTable: "Concept", tableName: "_ImageToConcept" },
	{ context: "taxonomy", leftTable: "Image", rightTable: "Note", tableName: "_ImageToNote" },
	{ context: "worldbuilding", leftTable: "Image", rightTable: "Place", tableName: "_ImageToPlace" },
	{ context: "taxonomy", leftTable: "Image", rightTable: "Prompt", tableName: "_ImageToPrompt" },
	{ context: "taxonomy", leftTable: "Image", rightTable: "Property", tableName: "_ImageToProperty" },
	{ context: "taxonomy", leftTable: "Image", rightTable: "Tag", tableName: "_ImageToTag" },
	{ context: "taxonomy", leftTable: "Image", rightTable: "Wildcard", tableName: "_ImageToWildcard" },
	{ context: "worldbuilding", leftTable: "Image", rightTable: "WorldItem", tableName: "_ImageToWorldItem" },
	{ context: "organization", leftTable: "Video", rightTable: "Album", tableName: "_VideoToAlbum" },
	{ context: "worldbuilding", leftTable: "Video", rightTable: "Character", tableName: "_VideoToCharacter" },
	{ context: "organization", leftTable: "Video", rightTable: "Collection", tableName: "_VideoToCollection" },
	{ context: "worldbuilding", leftTable: "Video", rightTable: "Concept", tableName: "_VideoToConcept" },
	{ context: "taxonomy", leftTable: "Video", rightTable: "Note", tableName: "_VideoToNote" },
	{ context: "worldbuilding", leftTable: "Video", rightTable: "Place", tableName: "_VideoToPlace" },
	{ context: "taxonomy", leftTable: "Video", rightTable: "Prompt", tableName: "_VideoToPrompt" },
	{ context: "taxonomy", leftTable: "Video", rightTable: "Property", tableName: "_VideoToProperty" },
	{ context: "taxonomy", leftTable: "Video", rightTable: "Tag", tableName: "_VideoToTag" },
	{ context: "taxonomy", leftTable: "Video", rightTable: "Wildcard", tableName: "_VideoToWildcard" },
	{ context: "worldbuilding", leftTable: "Video", rightTable: "WorldItem", tableName: "_VideoToWorldItem" },
] as const satisfies readonly StrongRelationDefinition[];

export type FlexibleRelationPolicy = "append-only" | "canonical" | "manual" | "rebuildable";

export interface FlexibleRelationDefinition {
	readonly policy: FlexibleRelationPolicy;
	readonly rationale: string;
	readonly tableName: string;
}

/** Polymorphism is limited to operational records whose target families are intentionally heterogeneous. */
export const FLEXIBLE_RELATION_CATALOG = [
	{
		policy: "append-only",
		rationale: "Audit history must survive target deletion and can also describe non-entity system events.",
		tableName: "Activity",
	},
	{
		policy: "rebuildable",
		rationale: "Counts and sizes are derived caches rebuilt from typed source tables.",
		tableName: "EntityAggregates",
	},
	{
		policy: "canonical",
		rationale: "Per-profile preference spans all supported entity families and owns a bounded type discriminator.",
		tableName: "Favorite",
	},
	{
		policy: "manual",
		rationale:
			"User-defined key/value metadata intentionally spans entity families and is preserved for reconciliation.",
		tableName: "Metadata",
	},
	{
		policy: "rebuildable",
		rationale: "Derived previews span media families and can be regenerated after target deletion.",
		tableName: "Thumbnail",
	},
	{
		policy: "rebuildable",
		rationale:
			"File-backed taxonomy content is canonical on disk; this table is its searchable operational projection.",
		tableName: "TaxonomyArtifact",
	},
] as const satisfies readonly FlexibleRelationDefinition[];
