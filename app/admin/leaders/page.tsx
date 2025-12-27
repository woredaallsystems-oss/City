import Link from "next/link";
import { getAdminLeaders, deleteLeader } from "@/lib/leader-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadersList } from "@/components/admin/LeadersList";
import { HiPlus } from "react-icons/hi2";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminLeadersPage() {
    const leaders = await getAdminLeaders();

    async function deleteLeaderAction(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        await deleteLeader(id);
        revalidatePath("/admin/leaders");
        revalidatePath("/"); // Also revalidate homepage since it displays leaders
    }

    return (
        <div className="space-y-8">
            <AdminPageHeader
                icon="users"
                titleKey="leadersManagement"
                descriptionKey="leadersDescription"
                gradient="from-blue-600 to-purple-600"
            />

            <div className="flex justify-end">
                <Link href="/admin/leaders/new" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30">
                    <HiPlus className="w-5 h-5" />
                    Add New Member
                </Link>
            </div>

            <LeadersList leaders={leaders} deleteLeaderAction={deleteLeaderAction} />
        </div>
    )
}
