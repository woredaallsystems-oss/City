"use client";


import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HiCheckCircle, HiXCircle, HiPhoto, HiPencilSquare, HiCloudArrowUp, HiSparkles, HiLanguage, HiTrash } from "react-icons/hi2";
import { createNewsItem, updateNewsItem, uploadNewsImage, uploadNewsImages, getNewsPhotos } from "@/lib/news-actions";
import type { NewsRecord } from "@/types";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface NewsFormProps {
    initialData?: NewsRecord;
    onSuccess?: () => void;
}

type Language = 'en' | 'am' | 'or';

export function NewsForm({ initialData, onSuccess }: NewsFormProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(initialData?.cover_image_url || null);
    const [previewPhotos, setPreviewPhotos] = useState<Array<{ file?: File; url: string; isExisting?: boolean }>>([]);
    const [isDragging, setIsDragging] = useState(false);
    // Default new articles to published so they appear on the public homepage
    const [published, setPublished] = useState(initialData?.published ?? true);
    const [activeTab, setActiveTab] = useState<Language>('en');

    // Load existing photos when editing
    useEffect(() => {
        if (initialData?.id) {
            getNewsPhotos(initialData.id).then(photos => {
                setPreviewPhotos(photos.map(photo => ({ url: photo.image_url, isExisting: true })));
            });
        }
    }, [initialData?.id]);

    const t = useTranslations('admin');
    const languages = [
        { id: 'en', label: t('english'), flag: '🇬🇧' },
        { id: 'am', label: t('amharic'), flag: '🇪🇹' },
        { id: 'or', label: t('oromifa'), flag: '🌳' },
    ] as const;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);

        // English
        const title = formData.get("title") as string;
        const summary = formData.get("summary") as string;
        const content = formData.get("content") as string;

        // Amharic
        const title_am = formData.get("title_am") as string;
        const summary_am = formData.get("summary_am") as string;
        const content_am = formData.get("content_am") as string;

        // Oromifa
        const title_or = formData.get("title_or") as string;
        const summary_or = formData.get("summary_or") as string;
        const content_or = formData.get("content_or") as string;

        const youtubeUrlRaw = (formData.get("youtube_url") as string | null) ?? "";
        const youtube_url = youtubeUrlRaw.trim() || undefined;
        const imageFile = formData.get("image") as File;

        try {
            let coverImageUrl = initialData?.cover_image_url;

            if (imageFile && imageFile.size > 0) {
                coverImageUrl = await uploadNewsImage(imageFile);
            }

            // Upload new photos (files that aren't marked as existing)
            const newPhotoFiles = previewPhotos.filter(p => p.file && !p.isExisting).map(p => p.file!);
            const newPhotoUrls = newPhotoFiles.length > 0 ? await uploadNewsImages(newPhotoFiles) : [];
            
            // Combine existing photo URLs (that weren't removed) with new ones
            const existingPhotoUrls = previewPhotos.filter(p => p.isExisting && !p.file).map(p => p.url);
            const allPhotoUrls = [...existingPhotoUrls, ...newPhotoUrls];

            const newsData = {
                title,
                summary,
                content,
                title_am: title_am || undefined,
                content_am: content_am || undefined,
                summary_am: summary_am || undefined,
                title_or: title_or || undefined,
                content_or: content_or || undefined,
                summary_or: summary_or || undefined,
                youtube_url,
                published,
                cover_image_url: coverImageUrl,
                photoUrls: allPhotoUrls,
            };

            if (initialData) {
                await updateNewsItem(initialData.id, newsData);
                setStatus({ type: "success", message: t('newsUpdated') });
            } else {
                await createNewsItem(newsData);
                setStatus({ type: "success", message: t('newsCreated') });
                formRef.current?.reset();
                setPreviewImage(null);
                setPreviewPhotos([]);
                setPublished(true);
            }

            router.refresh();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : t('failedToSave')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            isExisting: false,
        }));
        setPreviewPhotos(prev => [...prev, ...newPhotos]);
    };

    const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            isExisting: false,
        }));
        setPreviewPhotos(prev => [...prev, ...newPhotos]);
    };

    const handleRemovePhoto = (index: number) => {
        setPreviewPhotos(prev => {
            const updated = [...prev];
            // Revoke object URL if it's a new file
            if (updated[index].file) {
                URL.revokeObjectURL(updated[index].url);
            }
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        const newPhotos = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            isExisting: false,
        }));
        setPreviewPhotos(prev => [...prev, ...newPhotos]);
    };

    return (
        <motion.form
            ref={formRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl relative overflow-hidden group"
        >
            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -z-10 group-hover:bg-blue-200/40 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100/40 rounded-full blur-3xl -z-10 group-hover:bg-purple-200/40 transition-colors duration-700" />



            {/* Language Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        type="button"
                        onClick={() => setActiveTab(lang.id as Language)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === lang.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <span className="text-lg">{lang.flag}</span>
                        {lang.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {/* Title Input - English */}
                <div className={`space-y-2 ${activeTab === 'en' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('postTitle')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        defaultValue={initialData?.title}
                        required
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg"
                        placeholder={t('enterHeadline')}
                    />
                </div>

                {/* Title Input - Amharic */}
                <div className={`space-y-2 ${activeTab === 'am' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('postTitleAm')}
                    </label>
                    <input
                        type="text"
                        name="title_am"
                        defaultValue={initialData?.title_am}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg"
                        placeholder={t('enterHeadline')}
                    />
                </div>

                {/* Title Input - Oromifa */}
                <div className={`space-y-2 ${activeTab === 'or' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('postTitleOr')}
                    </label>
                    <input
                        type="text"
                        name="title_or"
                        defaultValue={initialData?.title_or}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg"
                        placeholder={t('enterHeadline')}
                    />
                </div>

                {/* Summary Input - English */}
                <div className={`space-y-2 ${activeTab === 'en' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">{t('summary')}</label>
                    <textarea
                        name="summary"
                        defaultValue={initialData?.summary}
                        rows={2}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg resize-none"
                        placeholder={t('enterSummary')}
                    />
                </div>

                {/* Summary Input - Amharic */}
                <div className={`space-y-2 ${activeTab === 'am' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">{t('summaryAm')}</label>
                    <textarea
                        name="summary_am"
                        defaultValue={initialData?.summary_am}
                        rows={2}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg resize-none"
                        placeholder={t('enterSummary')}
                    />
                </div>

                {/* Summary Input - Oromifa */}
                <div className={`space-y-2 ${activeTab === 'or' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">{t('summaryOr')}</label>
                    <textarea
                        name="summary_or"
                        defaultValue={initialData?.summary_or}
                        rows={2}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg resize-none"
                        placeholder={t('enterSummary')}
                    />
                </div>

                {/* Content Input - English */}
                <div className={`space-y-2 ${activeTab === 'en' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('content')} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        name="content"
                        defaultValue={initialData?.content}
                        required
                        rows={8}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg leading-relaxed"
                        placeholder={t('writeArticle')}
                    />
                </div>

                {/* Content Input - Amharic */}
                <div className={`space-y-2 ${activeTab === 'am' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('contentAm')}
                    </label>
                    <textarea
                        name="content_am"
                        defaultValue={initialData?.content_am}
                        rows={8}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg leading-relaxed"
                        placeholder={t('writeArticle')}
                    />
                </div>

                {/* Content Input - Oromifa */}
                <div className={`space-y-2 ${activeTab === 'or' ? 'block' : 'hidden'}`}>
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                        {t('contentOr')}
                    </label>
                    <textarea
                        name="content_or"
                        defaultValue={initialData?.content_or}
                        rows={8}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-4 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg leading-relaxed"
                        placeholder={t('writeArticle')}
                    />
                </div>

                {/* YouTube Link Input */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                        {t('youtubeLink')}
                    </label>
                    <input
                        type="url"
                        name="youtube_url"
                        defaultValue={initialData?.youtube_url}
                        className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-slate-100 px-5 py-3 text-base font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm focus:shadow-lg"
                        placeholder={t('pasteYoutube')}
                    />
                </div>
            </div>

            {/* Cover Image Upload Area */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                    {t('coverImage')}
                    <HiSparkles className="w-4 h-4 text-yellow-500" />
                </label>

                <div
                    className={`relative group rounded-3xl border-3 border-dashed transition-all duration-300 overflow-hidden min-h-[240px] flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 hover:border-indigo-300'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('image-upload')?.click()}
                >
                    <input
                        id="image-upload"
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    {previewImage ? (
                        <>
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 600px"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <span className="px-6 py-3 bg-white/20 border border-white/40 rounded-full text-white font-bold backdrop-blur-md shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                                    {t('changeImage')}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center p-8 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <HiPhoto className="w-10 h-10 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{t('clickOrDragMap')}</h3>
                                <p className="text-slate-500 mt-1 font-medium">{t('aspectRatioMap')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Multiple Photos Upload Area */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
                    Additional Photos
                    <HiSparkles className="w-4 h-4 text-yellow-500" />
                </label>

                {/* Photo Grid */}
                {previewPhotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                        {previewPhotos.map((photo, index) => (
                            <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 aspect-square">
                                <Image
                                    src={photo.url}
                                    alt={`Photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                >
                                    <HiTrash className="w-4 h-4" />
                                </button>
                                {photo.isExisting && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full">
                                        Existing
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Button */}
                <div
                    className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden min-h-[120px] flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 hover:border-indigo-300'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('photos-upload')?.click()}
                >
                    <input
                        id="photos-upload"
                        type="file"
                        name="photos"
                        accept="image/*"
                        multiple
                        onChange={handlePhotosChange}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center text-center p-6 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <HiPhoto className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Add Photos</h3>
                            <p className="text-slate-500 mt-1 text-sm">Click or drag to upload multiple images</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Publishing Toggle */}
            <div
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer select-none ${published ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-slate-50 border-slate-200'}`}
                onClick={() => setPublished(!published)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${published ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                        {published ? <HiCheckCircle className="w-7 h-7" /> : <HiXCircle className="w-7 h-7" />}
                    </div>
                    <div>
                        <h4 className={`font-bold text-lg ${published ? 'text-green-800' : 'text-slate-700'}`}>
                            {published ? t('publishedLive') : t('draftMode')}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium">
                            {published ? t('visiblePublic') : t('visibleAdmin')}
                        </p>
                    </div>
                </div>
                <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${published ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${published ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                {/* Hidden input for form submission */}
                <input type="hidden" name="published" value={published ? "on" : "off"} />
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-5 text-lg font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    {isSubmitting ? (
                        <>
                            <HiCloudArrowUp className="w-6 h-6 animate-bounce" />
                            <span>{t('processing')}</span>
                        </>
                    ) : (
                        <>
                            <HiPencilSquare className="w-6 h-6" />
                            <span>{initialData ? t('updateArticle') : t('publishArticle')}</span>
                        </>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 border ${status.type === "success"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}
                    >
                        {status.type === "success" ? (
                            <HiCheckCircle className="w-6 h-6 flex-shrink-0" />
                        ) : (
                            <HiXCircle className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="font-bold">{status.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.form>
    );
}
