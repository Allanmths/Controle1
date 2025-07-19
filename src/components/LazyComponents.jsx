import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt, className, placeholder = '/placeholder.jpg' }) => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [imageRef, setImageRef] = useState();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let observer;
        
        if (imageRef && imageSrc === placeholder) {
            observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setImageSrc(src);
                            observer.unobserve(imageRef);
                        }
                    });
                },
                { threshold: 0.1 }
            );
            
            observer.observe(imageRef);
        }
        
        return () => {
            if (observer && observer.unobserve) {
                observer.unobserve(imageRef);
            }
        };
    }, [imageRef, imageSrc, placeholder, src]);

    return (
        <div className={`relative ${className}`}>
            <img
                ref={setImageRef}
                src={imageSrc}
                alt={alt}
                className={`transition-opacity duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                } ${className}`}
                onLoad={() => setIsLoaded(true)}
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
            )}
        </div>
    );
};

const VirtualizedList = ({ items, renderItem, itemHeight = 60, containerHeight = 400 }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef();

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop);
    };

    return (
        <div
            ref={containerRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div style={{ height: items.length * itemHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, index) =>
                        renderItem(item, startIndex + index)
                    )}
                </div>
            </div>
        </div>
    );
};

export { LazyImage, VirtualizedList };
