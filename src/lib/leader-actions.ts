"use server";

import { getSupabaseServerClient, getCurrentUserWoredaId } from "./supabaseServer";
import { publicEnv } from "./env";
import type { LeaderRecord } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Fetch all leaders for public display
 */
export async function getLeaders(): Promise<LeaderRecord[]> {
    const supabase = await getSupabaseServerClient();
    const woredaId = publicEnv.NEXT_PUBLIC_WOREDA_ID;

    const { data, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("woreda_id", woredaId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching leaders:", error);
        return [];
    }

    return (data as LeaderRecord[]) || [];
}

/**
 * Fetch all leaders for admin (same as public but might differ in future)
 */
export async function getAdminLeaders(): Promise<LeaderRecord[]> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    const { data, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("woreda_id", woredaId)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching admin leaders:", error);
        return [];
    }

    return (data as LeaderRecord[]) || [];
}

/**
 * Get a single leader
 */
export async function getLeader(id: string): Promise<LeaderRecord | null> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return null;
    }

    return (data as LeaderRecord) || null;
}

/**
 * Create a leader
 */
export async function createLeader(args: Omit<LeaderRecord, "id" | "created_at" | "updated_at" | "woreda_id">): Promise<LeaderRecord | null> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    const { data, error } = await supabase
        .from("leaders")
        .insert({
            woreda_id: woredaId,
            ...args
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating leader:", error);
        throw new Error(error.message);
    }

    revalidatePath("/");
    revalidatePath("/admin/leaders");

    return (data as LeaderRecord) || null;
}

/**
 * Update a leader
 */
export async function updateLeader(
    id: string,
    args: Partial<Omit<LeaderRecord, "id" | "created_at" | "updated_at" | "woreda_id">>
): Promise<LeaderRecord | null> {
    const supabase = await getSupabaseServerClient();

    const updates = {
        ...args,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("leaders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating leader:", error);
        throw new Error(error.message);
    }

    revalidatePath("/");
    revalidatePath("/admin/leaders");

    return (data as LeaderRecord) || null;
}

/**
 * Delete a leader
 */
export async function deleteLeader(id: string): Promise<boolean> {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
        .from("leaders")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting leader:", error);
        throw new Error(error.message);
    }

    return true;
}

/**
 * Upload leader image
 */
export async function uploadLeaderImage(file: File): Promise<string> {
    const supabase = await getSupabaseServerClient();
    const woredaId = await getCurrentUserWoredaId();

    // Create a unique file path: woreda_id/leaders-timestamp-filename
    const fileExt = file.name.split('.').pop();
    const fileName = `leaders-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${woredaId}/${fileName}`;

    const { error: uploadError } = await supabase
        .storage
        .from('news') // Reuse 'news' bucket
        .upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw new Error(uploadError.message);
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from('news')
        .getPublicUrl(filePath);

    return publicUrl;
}
