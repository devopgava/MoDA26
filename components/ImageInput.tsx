import React, { useRef } from 'react';

interface ImageInputProps {
  label: string;
  imageSrc: string | null;
  onChange: (base64: string) => void;
  placeholder?: string;
  height?: string;
}

export const ImageInput: React.FC<ImageInputProps> = ({ 
  label, 
  imageSrc, 
  onChange, 
  placeholder = "Subir Imagen",
  height = "h-64"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div 
        className={`relative w-full ${height} border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors group`}
        onClick={() => fileInputRef.current?.click()}
      >
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt="Preview" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium">{placeholder}</span>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {imageSrc && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full">Cambiar Imagen</span>
          </div>
        )}
      </div>
    </div>
  );
};