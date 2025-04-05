// Create a new FileUpload component

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { X, Upload, File, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string[];
}

export default function FileUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 5, // 5MB
  accept = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']
}: FileUploadProps) {
  const [files, setFiles] = useState<Array<File & { preview?: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + files.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    const oversizedFiles = acceptedFiles.filter(
      file => file.size > maxSize * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      setUploadError(`Some files exceed the ${maxSize}MB size limit`);
      return;
    }

    setUploadError(null);

    // Create preview for images
    const newFiles = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined
      })
    );

    // Simulate upload progress
    newFiles.forEach(file => {
      let progress = 0;
      const intervalId = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(intervalId);
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      }, 200);
    });

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    onUpload([...files, ...acceptedFiles]);
  }, [files, maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSize * 1024 * 1024,
    accept: accept.reduce((obj, curr) => {
      obj[curr] = [];
      return obj;
    }, {} as Record<string, string[]>)
  });

  const removeFile = (name: string) => {
    setFiles(files.filter(file => file.name !== name));
    const newUploadProgress = { ...uploadProgress };
    delete newUploadProgress[name];
    setUploadProgress(newUploadProgress);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/20 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
          <Upload className="h-8 w-8 mb-2" />
          <p className="text-sm">
            Drag & drop files here, or click to select files
          </p>
          <p className="text-xs">
            {`Max ${maxFiles} files, up to ${maxSize}MB each`}
          </p>
          <p className="text-xs">
            Supported formats: Images, PDF, Word, Excel
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="text-destructive text-sm">
          {uploadError}
        </div>
      )}

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-sm">Uploaded Files</h4>
            {files.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-muted/50 rounded-lg p-3 flex items-center"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {file.preview ? (
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-background">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onLoad={() => {
                          URL.revokeObjectURL(file.preview!);
                        }}
                      />
                    </div>
                  ) : (
                    <File className="h-10 w-10 p-2 rounded-md bg-background" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(file.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-full mt-1">
                      <div className="flex items-center">
                        <Progress value={uploadProgress[file.name] || 0} className="h-1.5 flex-1" />
                        <span className="text-xs ml-2 w-8 text-right">
                          {uploadProgress[file.name] === 100 ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            `${uploadProgress[file.name] || 0}%`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}