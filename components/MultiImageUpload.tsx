import React, { useState } from 'react';

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setUploading(true);
    const newImages: string[] = [];

    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height *= MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width *= MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            newImages.push(compressedBase64);
            
            if (newImages.length === filesToProcess.length) {
              onImagesChange([...images, ...newImages]);
              setUploading(false);
            }
          }
        };
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-slate-700">Imagens do Produto</label>
        <span className="text-xs text-slate-500">{images.length}/{maxImages} imagens</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img 
              src={image} 
              alt={`Produto ${index + 1}`} 
              className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Principal
              </span>
            )}
          </div>
        ))}
        
        {images.length < maxImages && (
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg h-32 hover:border-versiory-coral hover:bg-slate-50 transition-all text-center cursor-pointer overflow-hidden group">
            {uploading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-versiory-coral border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-xs font-medium text-slate-600">Adicionar</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>
        )}
      </div>
      
      <p className="text-xs text-slate-500">
        A primeira imagem será usada como imagem principal. Máximo {maxImages} imagens.
      </p>
    </div>
  );
};

export default MultiImageUpload;