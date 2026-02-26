import React from 'react';

const HeaderLogo: React.FC = () => (
    <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top Center Facet - Dark Blue */}
        <path d="M36 20 H64 L50 43 L36 20 Z" fill="#0f172a" />

        {/* Top Left Facet - Green */}
        <path d="M12 35 L30 18 L32 40 L12 35 Z" fill="#6b8f71" />

        {/* Top Right Facet - Yellow */}
        <path d="M88 35 L70 18 L68 40 L88 35 Z" fill="#f3b45c" />

        {/* Bottom Left Facet - Purple */}
        <path d="M22 46 L47 48 L50 88 L22 46 Z" fill="#ff6b4a" />

        {/* Bottom Right Facet - Cyan */}
        <path d="M78 46 L53 48 L50 88 L78 46 Z" fill="#1b9aaa" />

        <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
    </svg>
);

export default HeaderLogo;
