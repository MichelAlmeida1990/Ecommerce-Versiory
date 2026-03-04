import React, { useState } from 'react';

interface ProductMediaShowcaseProps {
    mainImage: string;
    allImages?: string[];
    productName: string;
}

const ProductMediaShowcase: React.FC<ProductMediaShowcaseProps> = ({
    mainImage,
    allImages = [],
    productName
}) => {
    const [activeImage, setActiveImage] = useState(mainImage);

    // Garantir que a imagem principal esteja na lista se não estiver
    const gallery = Array.from(new Set([mainImage, ...allImages])).filter(Boolean);

    if (gallery.length <= 1) {
        return (
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-4">
                <img src={mainImage} alt={productName} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <img
                    src={activeImage}
                    alt={productName}
                    className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300"
                />
            </div>

            <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
                {gallery.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveImage(img)}
                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${activeImage === img
                                ? 'border-versiory-coral scale-105 shadow-sm'
                                : 'border-slate-100 hover:border-slate-300 opacity-70 hover:opacity-100'
                            }`}
                    >
                        <img src={img} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProductMediaShowcase;
