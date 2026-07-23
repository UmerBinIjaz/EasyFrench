"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

export interface Testimonial {
    id: string
    name: string
    role: string
    text: string
    avatar: string | null
    rating: number
    color: string | null
}

const isAvatarImage = (avatar: string | null) => {
    if (!avatar) return false
    return avatar.startsWith("/") || /^https?:\/\//i.test(avatar) || /^data:image\//i.test(avatar)
}

const getAvatarFallback = (testimonial: Testimonial) => {
    return testimonial.avatar && !isAvatarImage(testimonial.avatar)
        ? testimonial.avatar
        : testimonial.name.substring(0, 2).toUpperCase()
}

/**
 * Responsive testimonials slider.
 * - Desktop (lg+): 3 cards per view
 * - Tablet (md): 2 cards per view
 * - Mobile: 1 card per view
 *
 * Features: prev/next arrows, dot indicators, autoplay (pauses on hover),
 * touch/drag swipe, and keyboard navigation.
 */
export default function TestimonialsSlider({ testimonials }: { testimonials: Testimonial[] }) {
    const [index, setIndex] = useState(0)
    const [perView, setPerView] = useState(3)
    const [paused, setPaused] = useState(false)
    const trackRef = useRef<HTMLDivElement>(null)
    const touchStartX = useRef<number | null>(null)

    const total = testimonials.length

    // Determine how many cards are visible based on viewport width.
    useEffect(() => {
        const updatePerView = () => {
            const w = window.innerWidth
            if (w >= 1024) setPerView(3)
            else if (w >= 768) setPerView(2)
            else setPerView(1)
        }
        updatePerView()
        window.addEventListener("resize", updatePerView)
        return () => window.removeEventListener("resize", updatePerView)
    }, [])

    const maxIndex = Math.max(0, total - perView)

    // Clamp index when perView changes (e.g. on resize).
    useEffect(() => {
        setIndex((prev) => Math.min(prev, Math.max(0, total - perView)))
    }, [perView, total])

    const goNext = useCallback(() => {
        setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, [maxIndex])

    const goPrev = useCallback(() => {
        setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    }, [maxIndex])

    // Autoplay
    useEffect(() => {
        if (paused || total <= perView) return
        const id = setInterval(() => {
            setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
        }, 4500)
        return () => clearInterval(id)
    }, [paused, maxIndex, perView, total])

    // Keyboard navigation when the slider area is focused.
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") goNext()
        if (e.key === "ArrowLeft") goPrev()
    }

    // Touch / drag swipe handlers.
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 40) {
            if (delta < 0) goNext()
            else goPrev()
        }
        touchStartX.current = null
    }

    if (total === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No testimonials available yet.</p>
            </div>
        )
    }

    const slidePct = 100 / perView
    const translateX = -(index * slidePct)

    return (
        <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonials"
        >
            {/* Track */}
            <div
                className="overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div
                    ref={trackRef}
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(${translateX}%)` }}
                >
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="shrink-0 grow-0"
                            style={{ width: `${slidePct}%` }}
                            aria-roledescription="slide"
                        >
                            <div className="h-full px-2 sm:px-2.5">
                                <div className="h-full p-5 sm:p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
                                    <div className="flex gap-1 mb-3 sm:mb-4">
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const isFilled = i < Math.min(Math.max(t.rating, 0), 5)
                                            return (
                                                <Star
                                                    key={i}
                                                    className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isFilled ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                                                />
                                            )
                                        })}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 italic">
                                        &ldquo;{t.text}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        {isAvatarImage(t.avatar) ? (
                                            <div
                                                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-cover bg-center bg-gray-100 shrink-0"
                                                style={{ backgroundImage: `url(${t.avatar})` }}
                                                aria-label={`${t.name} avatar`}
                                            />
                                        ) : (
                                            <div
                                                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0"
                                                style={{ backgroundColor: t.color || "#1a237e" }}
                                            >
                                                {getAvatarFallback(t)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{t.name}</p>
                                            <p className="text-gray-400 text-[10px] sm:text-xs truncate">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            {total > perView && (
                <>
                    {/* Arrows */}
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous testimonials"
                        className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-[#1a237e] hover:border-[#1a237e] transition-colors"
                    >
                        <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next testimonials"
                        className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-[#1a237e] hover:border-[#1a237e] transition-colors"
                    >
                        <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>

                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                aria-current={i === index}
                                className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-[#1a237e]" : "w-2 bg-gray-300 hover:bg-gray-400"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
