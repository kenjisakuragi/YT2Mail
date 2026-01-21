'use client';

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlayCircle, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Video } from '@/lib/types';
import useEmblaCarousel from 'embla-carousel-react';

interface VideoCarouselProps {
    videos: Video[];
}

export function VideoCarousel({ videos }: VideoCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

    useEffect(() => {
        if (emblaApi) {
            console.log('Embla initialized!', emblaApi.scrollSnapList());
            emblaApi.on('select', () => console.log('Current index:', emblaApi.selectedScrollSnap()));
        }
    }, [emblaApi]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
        else console.warn('Embla API not ready');
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
        else console.warn('Embla API not ready');
    }, [emblaApi]);

    const getThumbnailUrl = (video: Video) => {
        if (video.thumbnail_url) return video.thumbnail_url;
        if (video.yt_video_id === 'sample') return 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&q=80&w=800';
        return `https://i.ytimg.com/vi/${video.yt_video_id}/maxresdefault.jpg`;
    };

    return (
        <div className="relative group/carousel">
            {/* Left Button */}
            <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-900/80 hover:bg-black/90 text-white rounded-full shadow-lg backdrop-blur-sm -ml-4 md:-ml-6 hidden md:flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer border border-gray-700 hover:border-blue-500"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Button */}
            <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-gray-900/80 hover:bg-black/90 text-white rounded-full shadow-lg backdrop-blur-sm -mr-4 md:-mr-6 hidden md:flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer border border-gray-700 hover:border-blue-500"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Embla Viewport */}
            <div className="overflow-hidden pb-8 -mx-6 px-6 md:mx-0 md:px-0" ref={emblaRef}>
                {/* Embla Container */}
                <div className="flex touch-pan-y -ml-6">
                    {videos.map((video, idx) => (
                        <div key={video.id || idx} className="flex-[0_0_85vw] md:flex-[0_0_400px] min-w-0 pl-6">
                            <div className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col h-full">
                                {/* Thumbnail Area */}
                                <div className="relative aspect-video overflow-hidden bg-gray-900 cursor-pointer">
                                    <img
                                        src={getThumbnailUrl(video)}
                                        alt={video.title}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
                                            <PlayCircle className="w-4 h-4" />
                                            VIDEO ANALYSIS
                                        </div>
                                        <h3 className="text-lg font-bold leading-snug line-clamp-2 md:line-clamp-2 min-h-[3.5em] group-hover:text-blue-300 transition-colors">
                                            {video.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Business Overview</div>
                                            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                                                {video.summary_json?.business_overview}
                                            </p>
                                        </div>
                                        {video.summary_json?.key_metrics && (
                                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                                <div className="text-xs text-gray-500 font-bold mb-1">KEY METRICS</div>
                                                <p className="text-green-400 font-mono text-xs md:text-sm truncate">
                                                    {video.summary_json.key_metrics}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <div className="relative">
                                            <div className="absolute -inset-1 bg-gradient-to-b from-transparent to-gray-800 h-12 -mt-12 w-full"></div>
                                            <Link href="/login" className="block">
                                                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500">
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    完全なレポートを読む
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
