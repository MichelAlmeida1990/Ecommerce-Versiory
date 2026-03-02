import React, { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 5 
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            newImages.push(compressedBase64);
            
            if (newImages.length === filesToProcess) {
              onImagesChange([...images, ...newImages]);
            }
          }
        };
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-slate-700">
          Imagens do Produto ({images.length}/{maxImages})
        </label>
        {images.length > 0 && (
          <span className="text-xs text-slate-500">Arraste para reordenar</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedIndex !== null && draggedIndex !== index) {
                moveImage(draggedIndex, index);
              }
              setDraggedIndex(null);
            }}
            className="relative group cursor-move border-2 border-dashed border-slate-300 rounded-xl overflow-hidden hover:border-versiory-coral transition-colors"
          >
            <img
              src={image}
              alt={`Produto ${index + 1}`}
              className="w-full h-32 object-cover"
            />
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-versiory-coral text-white text-xs px-2 py-1 rounded-full font-bold">
                Principal
              </div>
            )}
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-versiory-coral hover:bg-slate-50 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center h-24 text-slate-400">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">Adicionar</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        A primeira imagem será usada como principal. Formatos aceitos: JPG, PNG. Máximo 5 imagens.
      </p>
    </div>
  );
};

export default ImageGallery;