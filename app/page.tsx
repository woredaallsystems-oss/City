import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { NewsSection } from "@/components/sections/NewsSection";
import { LeaderMessagesCarousel } from "@/components/sections/LeaderMessagesCarousel";
import { CommissionMembers } from "@/components/sections/CommissionMembers";
import { Footer } from "@/components/Footer";
import { getLeaders } from "@/lib/leader-actions";
import { publicEnv } from "@/lib/env";
import type { LeaderRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function Home() {
    let allLeaders: LeaderRecord[] = [];
    try {
        allLeaders = await getLeaders();
    } catch (error) {
        console.error("Error fetching leaders:", error);
        allLeaders = [];
    }

    // Find leaders with messages (speech content)
    const leadersWithMessages = allLeaders.filter(leader => {
        return leader.speech || leader.speech_am || leader.speech_or;
    });

    // Sort: Follow the category priority, then sort_order
    const categoryPriority: Record<string, number> = {
        'principal': 1,
        'deputy': 2,
        'secretary': 3,
        'commission-committee': 4,
        'work-leadership': 5,
        'management': 6
    };

    const sortedLeadersWithMessages = leadersWithMessages.sort((a, b) => {
        const priorityA = categoryPriority[a.category] || 99;
        const priorityB = categoryPriority[b.category] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return a.sort_order - b.sort_order;
    });

    // Group leaders by category, maintaining static order of categories we want
    const categoryOrder = [
        'principal',
        'deputy',
        'secretary',
        'commission-committee',
        'work-leadership',
        'management'
    ];

    const categories = categoryOrder.map(id => ({
        id,
        leaders: allLeaders.filter(l => l.category === id)
    }));

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <HeroSection />

            {/* Leader Messages Section - Display any leader with a message (scrollable if multiple) */}
            {sortedLeadersWithMessages.length > 0 && (
                <LeaderMessagesCarousel leaders={sortedLeadersWithMessages} />
            )}

            {/* News Section (Server Component) - Placed right above Members list */}
            <NewsSection />

            {/* Commission Members Section */}
            <CommissionMembers categories={categories} />

            {/* Footer */}
            <Footer woredaName={publicEnv.NEXT_PUBLIC_WOREDA_NAME} />
        </div>
    );
}
