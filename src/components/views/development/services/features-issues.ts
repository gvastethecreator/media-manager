import type { Feature } from '../cards/feature-card';
import type { Issue } from '../cards/issue-card';
import { ServiceStatus } from '../cards/service-card';

export interface ServerAlert {
	createdAt: Date;
	details: string | null;
	id: string;
	level: 'info' | 'warning' | 'error' | 'critical';
	message: string;
	resolved: boolean;
	service: string;
	title: string;
}

export async function getFeatures(): Promise<Feature[]> {
	try {
		const response = await fetch('/api/dev/features');
		if (!response.ok) throw new Error('Failed to fetch features');
		const data = await response.json();

		return data.map((f: any) => ({
			name: f.name,
			description: f.description,
			status: f.status,
			progress: f.progress,
		}));
	} catch (error) {
		console.error('Could not get features:', error);
		return [];
	}
}

export async function getIssues(): Promise<Issue[]> {
	try {
		const response = await fetch('/api/dev/alerts?resolved=false');
		if (!response.ok) throw new Error('Failed to fetch alerts');
		const data: ServerAlert[] = await response.json();

		return data.map((alert) => ({
			id: alert.id,
			title: alert.title,
			description: `${alert.service}: ${alert.message}`,
			status: alert.resolved ? 'resolved' : 'open',
			severity: mapLevelToSeverity(alert.level),
		}));
	} catch (error) {
		console.error('Could not get alerts:', error);
		return [];
	}
}

function mapLevelToSeverity(level: string): 'low' | 'medium' | 'high' | 'critical' {
	switch (level) {
		case 'info':
			return 'low';
		case 'warning':
			return 'medium';
		case 'error':
			return 'high';
		case 'critical':
			return 'critical';
		default:
			return 'medium';
	}
}

export async function getServices(): Promise<Omit<ServiceStatus, 'icon'>[]> {
	return Promise.resolve([
		{
			name: 'File Indexing',
			status: 'online',
			description: 'File scanning and indexing service',
		},
		{
			name: 'Image Processing',
			status: 'online',
			description: 'Image processing and transformation service',
		},
	]);
}
