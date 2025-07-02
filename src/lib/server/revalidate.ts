export function revalidatePath(_path: string): void {
    if (process.env.NODE_ENV === 'development') {
        console.info(`[revalidate] ${_path}`);
    }
}

export function unstable_cache<T extends (...args: any[]) => Promise<any> | any>(fn: T): T {
    return ((...args: Parameters<T>) => fn(...args)) as T;
}
