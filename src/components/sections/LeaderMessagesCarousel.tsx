"use client";

import { LeaderRecord } from "@/types";
import { PrincipalMessage } from "./PrincipalMessage";
import { useState, useEffect, useRef } from "react";

interface LeaderMessagesCarouselProps {
    leaders: LeaderRecord[];
}

export function LeaderMessagesCarousel({ leaders }: LeaderMessagesCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll functionality
    useEffect(() => {
        if (leaders.length <= 1 || !isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % leaders.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [leaders.length, isAutoPlaying]);

    // Touch/swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        setIsAutoPlaying(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const currentX = e.touches[0].clientX;
        const diffX = startXRef.current - currentX;

        if (containerRef.current) {
            const translateX = -currentIndex * 100 + (diffX / containerRef.current.offsetWidth) * 100;
            containerRef.current.style.transform = `translateX(${translateX}%)`;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const endX = e.changedTouches[0].clientX;
        const diffX = startXRef.current - endX;
        const threshold = 50; // Minimum swipe distance

        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe left - next
                setCurrentIndex((prev) => (prev + 1) % leaders.length);
            } else {
                // Swipe right - previous
                setCurrentIndex((prev) => (prev - 1 + leaders.length) % leaders.length);
            }
        }

        // Reset transform
        if (containerRef.current) {
            containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
        }

        startXRef.current = null;
        
        // Resume auto-play after 3 seconds
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsAutoPlaying(true);
        }, 3000);
    };

    const scrollToIndex = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 5 seconds
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsAutoPlaying(true);
        }, 5000);
    };

    if (leaders.length === 0) return null;

    if (leaders.length === 1) {
        return <PrincipalMessage principal={leaders[0]} />;
    }

    return (
        <section className="relative overflow-hidden">
            {/* Carousel Container */}
            <div 
                className="relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    ref={containerRef}
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {leaders.map((leader, index) => (
                        <div key={leader.id} className="w-full flex-shrink-0">
                            <PrincipalMessage principal={leader} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Indicator Dots */}
            {leaders.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex justify-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">
                    {leaders.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToIndex(index)}
                            className={`h-3 rounded-full transition-all shadow-lg ${
                                index === currentIndex
                                    ? "w-10 bg-blue-600"
                                    : "w-3 bg-white/80 hover:bg-white"
                            }`}
                            aria-label={`Go to message ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
