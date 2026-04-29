import { ChangeEvent, useRef } from 'react';

interface ImageUploadProps {
  onImageUpload: (base64: string) => void;
  currentImage?: string;
  label: string;
}

export function MediaUpload({ onMediaUpload, currentMedia, label, type }: { onMediaUpload: (base64: string) => void, currentMedia?: string, label: string, type: 'image' | 'video' }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onMediaUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="block text-sm font-medium text-[var(--text-main)]">{label}</label>
      <div 
        className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-md flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg)] hover:border-blue-500 transition-colors relative group"
        onClick={() => fileInputRef.current?.click()}
      >
        {currentMedia ? (
          type === 'video' ? (
            <video src={currentMedia} className="w-full h-full object-cover" muted />
          ) : (
            <img src={currentMedia} alt="Thumbnail preview" className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-sm text-[var(--text-muted)] group-hover:text-blue-500 transition-colors">
            Click to upload {type}
          </span>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={type === 'video' ? "video/*" : "image/*"}
        className="hidden"
      />
    </div>
  );
}

export function ImageUpload({ onImageUpload, currentImage, label }: ImageUploadProps) {
  return <MediaUpload onMediaUpload={onImageUpload} currentMedia={currentImage} label={label} type="image" />;
}
