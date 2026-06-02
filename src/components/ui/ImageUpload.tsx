"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";

interface ImageUploadProps {
  bucket: "produtos" | "produtoras";
  path: string;
  onUpload: (url: string) => void;
  defaultValue?: string;
}

export default function ImageUpload({
  bucket,
  path,
  onUpload,
  defaultValue,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    // Validações
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato não suportado. Use JPG, PNG ou WEBP");
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      // Upload para o Supabase
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onUpload(publicUrl);
    } catch (err: any) {
      console.error("Erro no upload:", err);
      setError("Falha ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-none transition-colors h-48 flex flex-col items-center justify-center gap-2 cursor-pointer group
          ${previewUrl ? "border-sand" : "border-sand hover:border-espresso/30"}
          ${error ? "border-red-300" : ""}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {previewUrl ? (
          <>
            <div className="absolute inset-0 bg-cream/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <Upload className="text-espresso/60" size={24} />
            </div>
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 z-20 bg-white/80 p-1 hover:bg-white transition-colors text-espresso"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-espresso/30 group-hover:text-espresso/50">
            {isUploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Upload size={24} strokeWidth={1.5} />
            )}
            <div className="text-center px-4">
              <p className="font-sans text-xs tracking-wide">
                {isUploading ? "Enviando..." : "Clique para enviar ou arraste a imagem"}
              </p>
              <p className="font-sans text-[0.65rem] text-espresso/25 mt-1">
                JPG, PNG ou WEBP · máx. 5 MB
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-terracota transition-all duration-300" style={{ width: `${progress}%` }} />
        )}
      </div>
      
      {error && (
        <p className="mt-2 font-sans text-[0.65rem] text-red-500 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
}
