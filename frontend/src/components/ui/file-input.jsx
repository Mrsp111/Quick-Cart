import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Upload } from "lucide-react";

const FileInput = React.forwardRef(({ className, onFileSelected, label, buttonText = "Upload", accept = "image/*", preview, ...props }, ref) => {
  const fileInputRef = React.useRef(null);
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (onFileSelected) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <div className="flex flex-col space-y-2">
        {preview ? (
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="border border-dashed rounded-md aspect-video flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-2 border">
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500">Drop your image here, or browse</p>
              <p className="text-xs text-gray-400">JPEG, PNG are allowed</p>
            </div>
          </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
        >
          {buttonText}
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          {...props}
        />
      </div>
    </div>
  );
});

FileInput.displayName = "FileInput";

export { FileInput };