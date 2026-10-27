import { supabase } from '#lib/utils.js';

/**
 * Extracts the relative storage file path from a Supabase storage URL or path.
 * Returns null if the URL is not hosted on Supabase Storage under the specified bucket.
 */
export function extractStoragePath(url: string, bucket: string = 'articles'): string | null {
	if (!url || typeof url !== 'string') return null;

	try {
		const parsed = new URL(url);
		const pathname = parsed.pathname;
		const markers = [
			`/storage/v1/object/public/${bucket}/`,
			`/storage/v1/object/sign/${bucket}/`,
			`/storage/v1/object/authenticated/${bucket}/`,
			`/storage/v1/object/${bucket}/`
		];

		for (const marker of markers) {
			const idx = pathname.indexOf(marker);
			if (idx !== -1) {
				return decodeURIComponent(pathname.slice(idx + marker.length));
			}
		}

		const bucketPrefix = `/${bucket}/`;
		if (pathname.startsWith(bucketPrefix)) {
			return decodeURIComponent(pathname.slice(bucketPrefix.length));
		}
	} catch {
		const marker = `${bucket}/`;
		if (url.startsWith(marker)) {
			return url;
		}
	}

	return null;
}

/**
 * Deletes an image from Supabase Storage by its public URL or storage path.
 * If the image is external (e.g. Unsplash or external CDN), it safely skips deletion.
 */
export async function deleteImageFromStorage(
	imageUrl: string,
	bucket: string = 'articles'
): Promise<{ success: boolean; error: Error | null }> {
	if (!imageUrl) {
		return { success: true, error: null };
	}

	const filePath = extractStoragePath(imageUrl, bucket);
	if (!filePath) {
		// Not a Supabase storage object in this bucket, skip deletion safely
		return { success: true, error: null };
	}

	try {
		const { error } = await supabase.storage.from(bucket).remove([filePath]);
		if (error) {
			console.error(`Failed to delete storage file "${filePath}" from bucket "${bucket}":`, error);
			return { success: false, error: new Error(error.message) };
		}
		return { success: true, error: null };
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : 'Unknown error deleting file from Supabase storage';
		console.error(`Exception deleting storage file "${filePath}":`, err);
		return { success: false, error: new Error(message) };
	}
}
