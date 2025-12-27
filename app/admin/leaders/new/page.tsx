import { LeaderForm } from "@/components/admin/LeaderForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { revalidatePath } from "next/cache";

export default function NewLeaderPage() {
    // Server action for revalidation
    async function revalidateAfterCreate() {
        "use server";
        revalidatePath("/admin/leaders");
        revalidatePath("/");
    }

    return (
        <div className="space-y-8">
            <AdminPageHeader
                icon="plus"
                titleKey="createNewLeader"
                descriptionKey="createNewLeaderDesc"
                gradient="from-green-500 to-emerald-600"
            />
            <div className="max-w-4xl mx-auto">
                <LeaderForm onSuccess={revalidateAfterCreate} />
            </div>
        </div>
    )
}
