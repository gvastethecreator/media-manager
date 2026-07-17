#!/usr/bin/env bun

import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { STRONG_RELATION_CATALOG } from "../../src/lib/drizzle/schema/relations/catalog";
import { resolveDatabasePath } from "./database-safety";

export type OrphanPolicy = "auto-delete-link" | "manual-reconcile" | "quarantine";

type RelationBase = {
	childTable: string;
	idColumn?: string;
	name: string;
	policy: OrphanPolicy;
};

export type DirectRelationContract = RelationBase & {
	childColumn: string;
	kind: "direct";
	parentColumn?: string;
	parentTable: string;
};

export type CompositeRelationContract = RelationBase & {
	childColumns: readonly string[];
	kind: "composite";
	parentColumns: readonly string[];
	parentTable: string;
};

export type PolymorphicRelationContract = RelationBase & {
	childColumn: string;
	discriminatorColumn: string;
	ignoredDiscriminators?: readonly string[];
	kind: "polymorphic";
	targets: Readonly<Record<string, string>>;
};

export type RelationContract = DirectRelationContract | CompositeRelationContract | PolymorphicRelationContract;

export type OrphanFinding = {
	count: number;
	name: string;
	policy: OrphanPolicy;
	reason?: string;
	status: "orphaned" | "uninspectable";
	technicalIds: string[];
};

const junctions: Array<[string, string, string]> = STRONG_RELATION_CATALOG.map((relation) => [
	relation.tableName,
	relation.leftTable,
	relation.rightTable,
]);

const folderChildren = ["Audio", "Document", "File", "File3D", "Image", "JsonFile", "Video"];
const hierarchyTables = [
	"Character",
	"Collection",
	"Concept",
	"Folder",
	"Place",
	"Prompt",
	"Tag",
	"Wildcard",
	"WorldItem",
];

const canonicalEntityTargets = {
	image: "Image",
	video: "Video",
	audio: "Audio",
	document: "Document",
	jsonFile: "JsonFile",
	file3d: "File3D",
	album: "Album",
	collection: "Collection",
	folder: "Folder",
	group: "Group",
	tag: "Tag",
	character: "Character",
	place: "Place",
	worldItem: "WorldItem",
	concept: "Concept",
	property: "Property",
	prompt: "Prompt",
	note: "Note",
	wildcard: "Wildcard",
} as const;

const mediaEntityTargets = {
	image: "Image",
	video: "Video",
	audio: "Audio",
	document: "Document",
	jsonFile: "JsonFile",
	file3d: "File3D",
} as const;

const aggregateEntityTargets = {
	folder: "Folder",
	collection: "Collection",
	album: "Album",
	tag: "Tag",
	group: "Group",
} as const;

const direct = (
	childTable: string,
	childColumn: string,
	parentTable: string,
	policy: OrphanPolicy,
	idColumn = "id",
): DirectRelationContract => ({
	kind: "direct",
	childColumn,
	childTable,
	idColumn,
	name: `${childTable}.${childColumn}->${parentTable}.id`,
	parentTable,
	policy,
});

const polymorphic = (
	childTable: string,
	discriminatorColumn: string,
	childColumn: string,
	targets: Readonly<Record<string, string>>,
	policy: OrphanPolicy,
	idColumn = "id",
	ignoredDiscriminators: readonly string[] = [],
): PolymorphicRelationContract => ({
	kind: "polymorphic",
	childColumn,
	childTable,
	discriminatorColumn,
	idColumn,
	ignoredDiscriminators,
	name: `${childTable}.${childColumn}->${discriminatorColumn} target`,
	policy,
	targets,
});

const composite = (
	childTable: string,
	childColumns: readonly string[],
	parentTable: string,
	parentColumns: readonly string[],
	policy: OrphanPolicy,
	idColumn = "id",
): CompositeRelationContract => ({
	kind: "composite",
	childColumns,
	childTable,
	idColumn,
	name: `${childTable}.(${childColumns.join(",")})->${parentTable}.(${parentColumns.join(",")})`,
	parentColumns,
	parentTable,
	policy,
});

export const RELATION_CATALOG: RelationContract[] = [
	...junctions.flatMap(([childTable, leftTable, rightTable]) => [
		direct(childTable, "A", leftTable, "auto-delete-link", "rowid"),
		direct(childTable, "B", rightTable, "auto-delete-link", "rowid"),
	]),
	...folderChildren.map((childTable) => direct(childTable, "folderId", "Folder", "manual-reconcile")),
	...hierarchyTables.map((table) => direct(table, "parentId", table, "manual-reconcile")),
	direct("Settings", "profileId", "Profile", "quarantine"),
	direct("Profile", "settingsId", "Settings", "quarantine"),
	direct("Profile", "imageId", "UploadedImage", "manual-reconcile"),
	direct("UploadedImage", "imageId", "Image", "manual-reconcile"),
	direct("FileStats", "fileId", "Image", "manual-reconcile"),
	direct("Image", "noteId", "Note", "manual-reconcile"),
	direct("Image", "assetId", "Asset", "manual-reconcile"),
	direct("SourceFile", "assetId", "Asset", "manual-reconcile"),
	direct("SourceFile", "rootId", "MediaRoot", "manual-reconcile"),
	direct("SourceFile", "folderId", "Folder", "manual-reconcile"),
	direct("Asset", "primarySourceFileId", "SourceFile", "manual-reconcile"),
	composite("Asset", ["id", "primarySourceFileId"], "SourceFile", ["assetId", "id"], "manual-reconcile"),
	direct("Favorite", "profileId", "Profile", "quarantine"),
	polymorphic("Favorite", "entityType", "entityId", canonicalEntityTargets, "quarantine"),
	polymorphic("Thumbnail", "entityType", "entityId", mediaEntityTargets, "auto-delete-link"),
	polymorphic("Metadata", "entityType", "entityId", canonicalEntityTargets, "manual-reconcile"),
	polymorphic("Activity", "entityType", "entityId", { image: "Image" }, "manual-reconcile", "id", ["general"]),
	polymorphic("EntityAggregates", "entityType", "entityId", aggregateEntityTargets, "manual-reconcile", "entityId"),
];

function quoteIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function tableExists(database: Database, tableName: string): boolean {
	const statement = database.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?");
	try {
		return Boolean(statement.get(tableName));
	} finally {
		statement.finalize();
	}
}

function columnExists(database: Database, tableName: string, columnName: string): boolean {
	if (!tableExists(database, tableName)) return false;
	const statement = database.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
	try {
		return (statement.all() as Array<{ name: string }>).some((column) => column.name === columnName);
	} finally {
		statement.finalize();
	}
}

function technicalHash(relationName: string, source: string): string {
	return createHash("sha256").update(`${relationName}\0${source}`).digest("hex").slice(0, 24);
}

function uninspectable(relation: RelationContract, reason: string): OrphanFinding {
	return {
		count: 0,
		name: relation.name,
		policy: relation.policy,
		reason,
		status: "uninspectable",
		technicalIds: [],
	};
}

function validateDirectContract(database: Database, relation: DirectRelationContract): string | null {
	if (!tableExists(database, relation.childTable)) return `missing-child-table:${relation.childTable}`;
	if (!tableExists(database, relation.parentTable)) return `missing-parent-table:${relation.parentTable}`;
	for (const [table, column] of [
		[relation.childTable, relation.childColumn],
		[relation.parentTable, relation.parentColumn ?? "id"],
		[relation.childTable, relation.idColumn ?? "rowid"],
	] as const) {
		if (column !== "rowid" && !columnExists(database, table, column)) return `missing-column:${table}.${column}`;
	}
	return null;
}

function inspectDirectRelation(
	database: Database,
	relation: DirectRelationContract,
	sampleLimit: number,
): OrphanFinding | null {
	const invalidReason = validateDirectContract(database, relation);
	if (invalidReason) return uninspectable(relation, invalidReason);

	const childTable = quoteIdentifier(relation.childTable);
	const parentTable = quoteIdentifier(relation.parentTable);
	const childColumn = quoteIdentifier(relation.childColumn);
	const parentColumn = quoteIdentifier(relation.parentColumn ?? "id");
	const technicalSource =
		relation.idColumn && relation.idColumn !== "rowid"
			? `CAST(child.${quoteIdentifier(relation.idColumn)} AS TEXT)`
			: "CAST(child.rowid AS TEXT)";
	const where = `child.${childColumn} IS NOT NULL AND parent.${parentColumn} IS NULL`;
	const join = `LEFT JOIN ${parentTable} parent ON child.${childColumn} = parent.${parentColumn}`;
	const countStatement = database.prepare(`SELECT count(*) AS count FROM ${childTable} child ${join} WHERE ${where}`);
	const sampleStatement = database.prepare(
		`SELECT ${technicalSource} AS technicalSource FROM ${childTable} child ${join}
		 WHERE ${where} ORDER BY technicalSource LIMIT ?`,
	);
	try {
		const count = Number((countStatement.get() as { count: number }).count);
		if (count === 0) return null;
		const samples = sampleStatement.all(sampleLimit) as Array<{ technicalSource: string }>;
		return {
			count,
			name: relation.name,
			policy: relation.policy,
			status: "orphaned",
			technicalIds: samples.map((row) => technicalHash(relation.name, row.technicalSource)),
		};
	} finally {
		countStatement.finalize();
		sampleStatement.finalize();
	}
}

function validateCompositeContract(database: Database, relation: CompositeRelationContract): string | null {
	if (!tableExists(database, relation.childTable)) return `missing-child-table:${relation.childTable}`;
	if (!tableExists(database, relation.parentTable)) return `missing-parent-table:${relation.parentTable}`;
	if (relation.childColumns.length === 0 || relation.childColumns.length !== relation.parentColumns.length) {
		return "invalid-composite-arity";
	}
	for (const [table, column] of [
		...relation.childColumns.map((column) => [relation.childTable, column] as const),
		...relation.parentColumns.map((column) => [relation.parentTable, column] as const),
		[relation.childTable, relation.idColumn ?? "rowid"] as const,
	]) {
		if (column !== "rowid" && !columnExists(database, table, column)) return `missing-column:${table}.${column}`;
	}
	return null;
}

function inspectCompositeRelation(
	database: Database,
	relation: CompositeRelationContract,
	sampleLimit: number,
): OrphanFinding | null {
	const invalidReason = validateCompositeContract(database, relation);
	if (invalidReason) return uninspectable(relation, invalidReason);

	const childTable = quoteIdentifier(relation.childTable);
	const parentTable = quoteIdentifier(relation.parentTable);
	const technicalSource =
		relation.idColumn && relation.idColumn !== "rowid"
			? `CAST(child.${quoteIdentifier(relation.idColumn)} AS TEXT)`
			: "CAST(child.rowid AS TEXT)";
	const populated = relation.childColumns.map((column) => `child.${quoteIdentifier(column)} IS NOT NULL`).join(" AND ");
	const joinCondition = relation.childColumns
		.map(
			(childColumn, index) =>
				`child.${quoteIdentifier(childColumn)} = parent.${quoteIdentifier(relation.parentColumns[index])}`,
		)
		.join(" AND ");
	const missingParent = `parent.${quoteIdentifier(relation.parentColumns[0])} IS NULL`;
	const join = `LEFT JOIN ${parentTable} parent ON ${joinCondition}`;
	const where = `${populated} AND ${missingParent}`;
	const countStatement = database.prepare(`SELECT count(*) AS count FROM ${childTable} child ${join} WHERE ${where}`);
	const sampleStatement = database.prepare(
		`SELECT ${technicalSource} AS technicalSource FROM ${childTable} child ${join}
		 WHERE ${where} ORDER BY technicalSource LIMIT ?`,
	);
	try {
		const count = Number((countStatement.get() as { count: number }).count);
		if (count === 0) return null;
		const samples = sampleStatement.all(sampleLimit) as Array<{ technicalSource: string }>;
		return {
			count,
			name: relation.name,
			policy: relation.policy,
			status: "orphaned",
			technicalIds: samples.map((row) => technicalHash(relation.name, row.technicalSource)),
		};
	} finally {
		countStatement.finalize();
		sampleStatement.finalize();
	}
}

function validatePolymorphicContract(database: Database, relation: PolymorphicRelationContract): string | null {
	if (!tableExists(database, relation.childTable)) return `missing-child-table:${relation.childTable}`;
	for (const column of [relation.childColumn, relation.discriminatorColumn, relation.idColumn ?? "rowid"]) {
		if (column !== "rowid" && !columnExists(database, relation.childTable, column)) {
			return `missing-column:${relation.childTable}.${column}`;
		}
	}
	for (const parentTable of new Set(Object.values(relation.targets))) {
		if (!tableExists(database, parentTable)) return `missing-parent-table:${parentTable}`;
		if (!columnExists(database, parentTable, "id")) return `missing-column:${parentTable}.id`;
	}
	return null;
}

function inspectPolymorphicRelation(
	database: Database,
	relation: PolymorphicRelationContract,
	sampleLimit: number,
): OrphanFinding | null {
	const invalidReason = validatePolymorphicContract(database, relation);
	if (invalidReason) return uninspectable(relation, invalidReason);

	const childTable = quoteIdentifier(relation.childTable);
	const childColumn = quoteIdentifier(relation.childColumn);
	const discriminatorColumn = quoteIdentifier(relation.discriminatorColumn);
	const technicalSource =
		relation.idColumn && relation.idColumn !== "rowid"
			? `CAST(child.${quoteIdentifier(relation.idColumn)} AS TEXT)`
			: "CAST(child.rowid AS TEXT)";
	let count = 0;
	const rawSamples: string[] = [];

	for (const [discriminator, parentTableName] of Object.entries(relation.targets)) {
		const parentTable = quoteIdentifier(parentTableName);
		const where = `child.${childColumn} IS NOT NULL AND child.${discriminatorColumn} = ? AND parent."id" IS NULL`;
		const join = `LEFT JOIN ${parentTable} parent ON child.${childColumn} = parent."id"`;
		const countStatement = database.prepare(`SELECT count(*) AS count FROM ${childTable} child ${join} WHERE ${where}`);
		const sampleStatement = database.prepare(
			`SELECT ${technicalSource} AS technicalSource FROM ${childTable} child ${join}
			 WHERE ${where} ORDER BY technicalSource LIMIT ?`,
		);
		try {
			count += Number((countStatement.get(discriminator) as { count: number }).count);
			const remaining = Math.max(0, sampleLimit - rawSamples.length);
			if (remaining > 0) {
				const samples = sampleStatement.all(discriminator, remaining) as Array<{ technicalSource: string }>;
				rawSamples.push(...samples.map((row) => row.technicalSource));
			}
		} finally {
			countStatement.finalize();
			sampleStatement.finalize();
		}
	}

	const allowedValues = [...Object.keys(relation.targets), ...(relation.ignoredDiscriminators ?? [])];
	const placeholders = allowedValues.map(() => "?").join(", ");
	const unknownWhere = `child.${childColumn} IS NOT NULL AND (child.${discriminatorColumn} IS NULL OR child.${discriminatorColumn} NOT IN (${placeholders}))`;
	const unknownCountStatement = database.prepare(
		`SELECT count(*) AS count FROM ${childTable} child WHERE ${unknownWhere}`,
	);
	const unknownSampleStatement = database.prepare(
		`SELECT ${technicalSource} AS technicalSource FROM ${childTable} child WHERE ${unknownWhere}
		 ORDER BY technicalSource LIMIT ?`,
	);
	try {
		count += Number((unknownCountStatement.get(...allowedValues) as { count: number }).count);
		const remaining = Math.max(0, sampleLimit - rawSamples.length);
		if (remaining > 0) {
			const samples = unknownSampleStatement.all(...allowedValues, remaining) as Array<{ technicalSource: string }>;
			rawSamples.push(...samples.map((row) => row.technicalSource));
		}
	} finally {
		unknownCountStatement.finalize();
		unknownSampleStatement.finalize();
	}

	if (count === 0) return null;
	return {
		count,
		name: relation.name,
		policy: relation.policy,
		status: "orphaned",
		technicalIds: rawSamples.map((source) => technicalHash(relation.name, source)),
	};
}

function inspectRelation(database: Database, relation: RelationContract, sampleLimit: number): OrphanFinding | null {
	switch (relation.kind) {
		case "direct":
			return inspectDirectRelation(database, relation, sampleLimit);
		case "composite":
			return inspectCompositeRelation(database, relation, sampleLimit);
		case "polymorphic":
			return inspectPolymorphicRelation(database, relation, sampleLimit);
	}
}

export function inspectOrphans(databasePath: string, sampleLimit = 50): OrphanFinding[] {
	const database = new Database(databasePath, { readonly: true, strict: true });
	try {
		return RELATION_CATALOG.map((relation) => inspectRelation(database, relation, sampleLimit)).filter(
			(finding): finding is OrphanFinding => finding !== null,
		);
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

export function hasIntegrityFailures(findings: OrphanFinding[]): boolean {
	return findings.some((finding) => finding.status === "uninspectable" || finding.count > 0);
}

if (import.meta.main) {
	const databaseIndex = process.argv.indexOf("--database");
	const databaseInput = databaseIndex >= 0 ? process.argv[databaseIndex + 1] : process.env.DATABASE_URL;
	if (!databaseInput) {
		console.error("DATABASE_URL o --database es obligatorio; el inventario nunca usa db.sqlite por fallback.");
		process.exitCode = 1;
	} else {
		try {
			const findings = inspectOrphans(resolveDatabasePath(databaseInput));
			console.log(JSON.stringify({ catalogSize: RELATION_CATALOG.length, findings }, null, 2));
			if (hasIntegrityFailures(findings)) process.exitCode = 2;
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		}
	}
}
