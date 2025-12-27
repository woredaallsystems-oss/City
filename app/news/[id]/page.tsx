import { getNewsItem } from "@/lib/news";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiArrowLeft, HiCalendar, HiUser, HiPlayCircle } from "react-icons/hi2";
import { format } from "date-fns";
import { Footer } from "@/components/Footer";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const newsItem = await getNewsItem(id);

    if (!newsItem) {
        notFound();
    }

    const rawYoutubeUrl = newsItem.youtube_url?.trim();

    const getYoutubeEmbedUrl = (url: string | undefined): string | null => {
        if (!url) return null;
        try {
            const u = new URL(url);
            if (u.hostname.includes("youtu.be")) {
                // https://youtu.be/VIDEO_ID
                const id = u.pathname.split("/").filter(Boolean)[0];
                return id ? `https://www.youtube.com/embed/${id}` : null;
            }
            if (u.hostname.includes("youtube.com")) {
                const v = u.searchParams.get("v");
                if (v) return `https://www.youtube.com/embed/${v}`;
                // already an embed link
                if (u.pathname.startsWith("/embed/")) {
                    return u.toString();
                }
            }
            return null;
        } catch {
            return null;
        }
    };

    const youtubeEmbedUrl = getYoutubeEmbedUrl(rawYoutubeUrl);

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar Minimal */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        <HiArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="font-bold text-slate-900 truncate max-w-xs md:max-w-md hidden md:block">
                        {publicEnv.NEXT_PUBLIC_WOREDA_NAME}
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-16">
                <article className="max-w-4xl mx-auto px-4 md:px-6">
                    {/* Header */}
                    <header className="mb-10 text-center space-y-6">
                        {/* Meta */}
                        <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <HiCalendar className="w-4 h-4 text-blue-500" />
                                {newsItem.published_at ? format(new Date(newsItem.published_at), "MMMM d, yyyy") : "Draft"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <HiUser className="w-4 h-4 text-purple-500" />
                                Admin
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            {newsItem.title}
                        </h1>

                        {newsItem.summary && (
                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                {newsItem.summary}
                            </p>
                        )}
                    </header>

                    {/* Featured Image */}
                    {newsItem.cover_image_url && (
                        <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl mb-12">
                            <Image
                                src={newsItem.cover_image_url}
                                alt={newsItem.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
                            />
                        </div>
                    )}

                    {/* Photo Gallery */}
                    {newsItem.photos && newsItem.photos.length > 0 && (
                        <div className="mb-12 space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {newsItem.photos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                                    >
                                        <Image
                                            src={photo.image_url}
                                            alt={`${newsItem.title} - Photo ${photo.sort_order + 1}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* YouTube Video */}
                    {youtubeEmbedUrl && (
                        <div className="mb-12 space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
                                <HiPlayCircle className="w-4 h-4" />
                                Watch related video
                            </div>
                            <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                                <iframe
                                    src={youtubeEmbedUrl}
                                    title="YouTube video player"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-lg prose-slate md:prose-xl mx-auto
             prose-headings:font-bold prose-headings:text-slate-900
             prose-p:text-slate-700 prose-p:leading-8
             prose-a:text-blue-600 hover:prose-a:text-blue-500
             prose-img:rounded-2xl prose-img:shadow-lg
           ">
                        {newsItem.content.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>
                </article>
            </main>

            <Footer woredaName={publicEnv.NEXT_PUBLIC_WOREDA_NAME} />
        </div>
    );
}
