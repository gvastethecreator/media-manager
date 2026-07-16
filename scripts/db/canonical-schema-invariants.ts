import type { Database } from 'bun:sqlite';

const MEDIA_CORE_TABLES = ['Asset', 'MediaRoot', 'SourceFile'] as const;

function schemaSql(database: Database, objectType: 'index' | 'table', name: string): string | null {
	const row = database
		.query('SELECT sql FROM sqlite_schema WHERE type = ? AND name = ?')
		.get(objectType, name) as { sql: string | null } | null;
	return row?.sql ?? null;
}

function compactSql(value: string): string {
	return value
		.replaceAll(/--.*$/gm, '')
		.replaceAll(/\/\*[\s\S]*?\*\//g, '')
		.replaceAll(/'(?:''|[^'])*'/g, "''")
		.replaceAll(/[`"[\]\s]/g, '')
		.toLowerCase();
}

type ForeignKeyRow = {
	from: string;
	id: number;
	on_delete: string;
	on_update: string;
	seq: number;
	table: string;
	to: string;
};

function foreignKeyGroups(database: Database, tableName: string): ForeignKeyRow[][] {
	const rows = database.query(`PRAGMA foreign_key_list("${tableName}")`).all() as ForeignKeyRow[];
	const groups = new Map<number, ForeignKeyRow[]>();
	for (const row of rows) groups.set(row.id, [...(groups.get(row.id) ?? []), row]);
	return [...groups.values()].map((group) => group.toSorted((left, right) => left.seq - right.seq));
}

function hasForeignKey(
	database: Database,
	tableName: string,
	expected: Pick<ForeignKeyRow, 'on_delete' | 'on_update' | 'table'> & { columns: Array<[string, string]> }
): boolean {
	return foreignKeyGroups(database, tableName).some(
		(group) =>
			group.length === expected.columns.length &&
			group.every(
				(row, index) =>
					row.table === expected.table &&
					row.from === expected.columns[index][0] &&
					row.to === expected.columns[index][1] &&
					row.on_delete.toUpperCase() === expected.on_delete &&
					row.on_update.toUpperCase() === expected.on_update
			)
	);
}

export function collectCanonicalSchemaInvariantErrors(database: Database): string[] {
	const tableSql = new Map(MEDIA_CORE_TABLES.map((name) => [name, schemaSql(database, 'table', name)]));
	const presentCount = [...tableSql.values()].filter((value) => value !== null).length;
	if (presentCount === 0) return [];

	const errors: string[] = [];
	for (const [name, sql] of tableSql) {
		if (!sql) errors.push(`media_core_missing_table=${name}`);
	}
	if (errors.length > 0) return errors;

	const assetSql = compactSql(tableSql.get('Asset') as string);
	const sourceFileSql = compactSql(tableSql.get('SourceFile') as string);
	const assetOwnerClause =
		'foreignkey(id,primarysourcefileid)referencessourcefile(assetid,id)onupdatecascadeondeleterestrictdeferrableinitiallydeferred';
	const sourceOwnerClause =
		'foreignkey(assetid)referencesasset(id)onupdatecascadeondeletecascadedeferrableinitiallydeferred';
	const assetOwnerExists = hasForeignKey(database, 'Asset', {
		columns: [
			['id', 'assetId'],
			['primarySourceFileId', 'id'],
		],
		on_delete: 'RESTRICT',
		on_update: 'CASCADE',
		table: 'SourceFile',
	});
	const sourceOwnerExists = hasForeignKey(database, 'SourceFile', {
		columns: [['assetId', 'id']],
		on_delete: 'CASCADE',
		on_update: 'CASCADE',
		table: 'Asset',
	});
	if (!(assetOwnerExists && assetSql.includes(assetOwnerClause))) {
		errors.push('asset_primary_source_fk_not_deferred_or_owned');
	}
	if (!(sourceOwnerExists && sourceFileSql.includes(sourceOwnerClause))) {
		errors.push('source_file_asset_fk_not_deferred');
	}

	const locationIndex = schemaSql(database, 'index', 'SourceFile_rootId_relativePath_key');
	if (!locationIndex || !compactSql(locationIndex).includes('(rootid,relativepathcollatenocase)')) {
		errors.push('source_file_location_key_not_nocase');
	}
	return errors;
}

export function assertCanonicalSchemaInvariants(database: Database): void {
	const errors = collectCanonicalSchemaInvariantErrors(database);
	if (errors.length > 0) {
		throw new Error(`El schema viola invariantes canónicos no representables por Drizzle: ${errors.join(', ')}.`);
	}
}
