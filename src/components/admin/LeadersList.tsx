"use client";

import Link from "next/link";
import Image from "next/image";
import { HiPencilSquare, HiTrash, HiUser } from "react-icons/hi2";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { LeaderRecord } from "@/types";

interface LeadersListProps {
    leaders: LeaderRecord[];
    deleteLeaderAction: (formData: FormData) => Promise<void>;
}

export function LeadersList({ leaders, deleteLeaderAction }: LeadersListProps) {
    const t = useTranslations('admin');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'category' | 'name' | 'sort_order'>('category');

    const categories = Array.from(new Set(leaders.map(l => l.category)));

    const categoryLabels: Record<string, string> = {
        'principal': t('catPrincipal'),
        'commission-committee': t('catCommission'),
        'management': t('catManagement'),
        'work-leadership': t('catWorkList'),
        'monitoring-committees': t('catMonitoring'),
    };

    // Helper to check if leader has a message
    const hasMessage = (leader: LeaderRecord) => {
        return !!(leader.speech || leader.speech_am || leader.speech_or);
    };

    const filteredLeaders = selectedCategory === 'all'
        ? leaders
        : leaders.filter(leader => leader.category === selectedCategory);

    const sortedLeaders = [...filteredLeaders].sort((a, b) => {
        // Always prioritize leaders with messages first
        const aHasMessage = hasMessage(a);
        const bHasMessage = hasMessage(b);
        if (aHasMessage && !bHasMessage) return -1;
        if (!aHasMessage && bHasMessage) return 1;

        if (sortBy === 'category') {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.sort_order - b.sort_order;
        } else if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            return a.sort_order - b.sort_order;
        }
    });

    const groupedByCategory = sortedLeaders.reduce((acc, leader) => {
        if (!acc[leader.category]) {
            acc[leader.category] = [];
        }
        acc[leader.category].push(leader);
        return acc;
    }, {} as Record<string, LeaderRecord[]>);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700">{t('filterByCategory')}:</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                        <option value="all">{t('allCategories')}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {categoryLabels[cat] || cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700">{t('sortBy')}:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'category' | 'name' | 'sort_order')}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                        <option value="category">{t('sortCategory')}</option>
                        <option value="name">{t('sortName')}</option>
                        <option value="sort_order">{t('sortOrder')}</option>
                    </select>
                </div>

                <div className="ml-auto text-sm text-slate-600 font-medium">
                    {t('showingMembers', { count: sortedLeaders.length, total: leaders.length })}
                </div>
            </div>

            {/* Grouped Display */}
            {sortBy === 'category' ? (
                <div className="space-y-8">
                    {Object.entries(groupedByCategory).map(([category, categoryLeaders]) => (
                        <div key={category} className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-200">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {categoryLabels[category] || category}
                                </h2>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-bold rounded-full">
                                    {categoryLeaders.length} {categoryLeaders.length === 1 ? t('member') : t('members')}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryLeaders.map(leader => (
                                    <LeaderCard
                                        key={leader.id}
                                        leader={leader}
                                        deleteLeaderAction={deleteLeaderAction}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedLeaders.map(leader => (
                        <LeaderCard
                            key={leader.id}
                            leader={leader}
                            deleteLeaderAction={deleteLeaderAction}
                        />
                    ))}
                </div>
            )}

            {sortedLeaders.length === 0 && (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <HiUser className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-lg font-medium">No leaders found</p>
                    <p className="text-sm">
                        {selectedCategory !== 'all' 
                            ? t('noMembersInCategory', { category: categoryLabels[selectedCategory] || selectedCategory })
                            : 'Add a new member to see them here.'}
                    </p>
                </div>
            )}
        </div>
    );
}

function LeaderCard({ leader, deleteLeaderAction }: { leader: LeaderRecord; deleteLeaderAction: (formData: FormData) => Promise<void> }) {
    const hasMessage = !!(leader.speech || leader.speech_am || leader.speech_or);
    
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative">
            {hasMessage && (
                <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Message
                </div>
            )}
            <div className="relative h-64 w-full bg-slate-100">
                {leader.photo_url ? (
                    <Image 
                        src={leader.photo_url} 
                        alt={leader.name} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <HiUser className="w-20 h-20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h3 className="font-bold text-lg">{leader.name}</h3>
                    <p className="text-sm opacity-90">{leader.title}</p>
                </div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {leader.category.replace(/-/g, ' ')}
                </div>
            </div>

            <div className="p-4 flex items-center justify-between mt-auto bg-slate-50 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-500">
                    Order: {leader.sort_order}
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/leaders/${leader.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <HiPencilSquare className="w-5 h-5" />
                    </Link>
                    <form action={deleteLeaderAction}>
                        <input type="hidden" name="id" value={leader.id} />
                        <button type="submit" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <HiTrash className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

