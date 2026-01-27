"use server";

import { getSupabaseServerClient, getCurrentUserWoredaId } from "./supabaseServer";
import type { NewsRecord, NewsPhotoRecord } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Create a new news item
 */
export async function createNewsItem(args: {
    title: string;
    content: string;
    summary?: string;
    title_am?: string;
    content_am?: string;
    summary_am?: string;
    title_or?: string;
    content_or?: string;
    summary_or?: string;
    cover_image_url?: string;
    youtube_url?: string;
    published: boolean;
    photoUrls?: string[];
}): Promise<NewsRecord | null> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    const { data, error } = await supabase
        .from("news")
        .insert({
            woreda_id: woredaId,
            title: args.title,
            content: args.content,
            summary: args.summary,
            title_am: args.title_am,
            content_am: args.content_am,
            summary_am: args.summary_am,
            title_or: args.title_or,
            content_or: args.content_or,
            summary_or: args.summary_or,
            cover_image_url: args.cover_image_url,
            youtube_url: args.youtube_url,
            published: args.published,
            published_at: args.published ? new Date().toISOString() : null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating news:", error);
        throw new Error(error.message);
    }

    // Save photos if provided
    if (args.photoUrls && args.photoUrls.length > 0) {
        await saveNewsPhotos(data.id, args.photoUrls);
    }

    revalidatePath("/");
    revalidatePath("/admin/news");
    return (data as NewsRecord) || null;
}

/**
 * Update a news item
 */
export async function updateNewsItem(
    id: string,
    args: {
        title: string;
        content: string;
        summary?: string;
        title_am?: string;
        content_am?: string;
        summary_am?: string;
        title_or?: string;
        content_or?: string;
        summary_or?: string;
        cover_image_url?: string;
        youtube_url?: string;
        published?: boolean;
        photoUrls?: string[];
    }
): Promise<NewsRecord | null> {
    const supabase = await getSupabaseServerClient();

    const updates: any = {
        title: args.title,
        content: args.content,
        summary: args.summary,
        title_am: args.title_am,
        content_am: args.content_am,
        summary_am: args.summary_am,
        title_or: args.title_or,
        content_or: args.content_or,
        summary_or: args.summary_or,
        cover_image_url: args.cover_image_url,
        youtube_url: args.youtube_url,
        updated_at: new Date().toISOString(),
    };

    if (args.published !== undefined) {
        updates.published = args.published;
        if (args.published) {
            updates.published_at = new Date().toISOString();
        } else {
            updates.published_at = null;
        }
    }

    const { data, error } = await supabase
        .from("news")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating news:", error);
        throw new Error(error.message);
    }

    // Update photos if provided
    if (args.photoUrls !== undefined) {
        await saveNewsPhotos(id, args.photoUrls);
    }

    revalidatePath("/");
    revalidatePath("/admin/news");
    return (data as NewsRecord) || null;
}

/**
 * Delete a news item
 */
export async function deleteNewsItem(id: string): Promise<boolean> {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

    revalidatePath("/");
    revalidatePath("/admin/news");
    return true;
}

/**
 * Upload news image to Supabase Storage
 */
export async function uploadNewsImage(file: File): Promise<string> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    // Create a unique file path: woreda_id/timestamp-filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${woredaId}/${fileName}`;

    const { error: uploadError } = await supabase
        .storage
        .from('news')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw new Error(uploadError.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('news')
        .getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Upload multiple news images to Supabase Storage
 */
export async function uploadNewsImages(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => uploadNewsImage(file));
    return Promise.all(uploadPromises);
}

/**
 * Save news photos to the database
 */
export async function saveNewsPhotos(newsId: string, imageUrls: string[]): Promise<NewsPhotoRecord[]> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    // Delete existing photos for this news item
    await supabase
        .from("news_photos")
        .delete()
        .eq("news_id", newsId);

    if (imageUrls.length === 0) {
        return [];
    }

    // Insert new photos with sort order
    const photosToInsert = imageUrls.map((url, index) => ({
        news_id: newsId,
        woreda_id: woredaId,
        image_url: url,
        sort_order: index,
    }));

    const { data, error } = await supabase
        .from("news_photos")
        .insert(photosToInsert)
        .select();

    if (error) {
        console.error("Error saving news photos:", error);
        throw new Error(error.message);
    }

    return (data as NewsPhotoRecord[]) || [];
}

/**
 * Get photos for a news item
 */
export async function getNewsPhotos(newsId: string): Promise<NewsPhotoRecord[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("news_photos")
        .select("*")
        .eq("news_id", newsId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching news photos:", error);
        return [];
    }

    return (data as NewsPhotoRecord[]) || [];
}

/**
 * Delete a news photo
 */
export async function deleteNewsPhoto(photoId: string): Promise<boolean> {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
        .from("news_photos")
        .delete()
        .eq("id", photoId);

    if (error) {
        console.error("Error deleting news photo:", error);
        throw new Error(error.message);
    }

    return true;
}
