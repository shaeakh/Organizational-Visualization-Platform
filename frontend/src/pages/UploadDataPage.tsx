import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  Database, Users, Building2, Loader2, X 
} from 'lucide-react';
import { api } from '../utils/api';

interface UploadStatus {
  users: number;
  departments: number;
  dataSource: string;
}

export const UploadDataPage: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [usersFile, setUsersFile] = useState<File | null>(null);
  const [deptsFile, setDeptsFile] = useState<File | null>(null);
  const [isDraggingUsers, setIsDraggingUsers] = useState(false);
  const [isDraggingDepts, setIsDraggingDepts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usersInputRef = useRef<HTMLInputElement>(null);
  const deptsInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.get<UploadStatus>('/api/upload/status');
      setStatus(data);
    } catch {
      // Ignore initial status fetch error
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDragOver = (e: React.DragEvent, setIsDragging: (v: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, setIsDragging: (v: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent, 
    setFile: (f: File) => void, 
    setIsDragging: (v: boolean) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
    } else {
      setError('Please upload a valid Excel file (.xlsx)');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!usersFile || !deptsFile) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('users', usersFile);
      formData.append('departments', deptsFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(true);
      fetchStatus();
      setUsersFile(null);
      setDeptsFile(null);
      if (usersInputRef.current) usersInputRef.current.value = '';
      if (deptsInputRef.current) deptsInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const FileZone = ({
    title,
    icon: Icon,
    file,
    setFile,
    isDragging,
    setIsDragging,
    inputRef
  }: {
    title: string;
    icon: any;
    file: File | null;
    setFile: (f: File | null) => void;
    isDragging: boolean;
    setIsDragging: (v: boolean) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div 
      className={`relative rounded-xl border-2 border-dashed p-8 transition-all duration-200 flex flex-col items-center justify-center min-h-[250px]
        ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-card hover:border-primary/50'}
        ${file ? 'border-solid border-primary/30 bg-primary/5' : ''}
      `}
      onDragOver={(e) => handleDragOver(e, setIsDragging)}
      onDragLeave={(e) => handleDragLeave(e, setIsDragging)}
      onDrop={(e) => handleDrop(e, (f) => { setFile(f); setError(null); }, setIsDragging)}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFileChange(e, setFile)}
      />
      
      {file ? (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <p className="font-medium text-foreground truncate max-w-full px-4">{file.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatSize(file.size)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); if(inputRef.current) inputRef.current.value=''; }}
            className="mt-4 flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-full hover:bg-destructive/10"
          >
            <X className="w-4 h-4" /> Remove File
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Upload {title} Data</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Drag and drop your .xlsx file here, or click to browse
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Data Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload Excel files to update your organization's hierarchy and employee data.
          </p>
        </div>
        
        {/* Status Cards */}
        {status && (
          <div className="flex gap-4">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{status.users}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Departments</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{status.departments}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">Upload Error</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-emerald-700 dark:text-emerald-400">Upload Successful</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                Data has been successfully updated. The new counts are reflected above.
              </p>
            </div>
            <button onClick={() => setUploadSuccess(false)} className="ml-auto text-emerald-600/70 hover:text-emerald-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <FileZone
            title="Users"
            icon={Users}
            file={usersFile}
            setFile={setUsersFile}
            isDragging={isDraggingUsers}
            setIsDragging={setIsDraggingUsers}
            inputRef={usersInputRef}
          />
          <FileZone
            title="Departments"
            icon={Building2}
            file={deptsFile}
            setFile={setDeptsFile}
            isDragging={isDraggingDepts}
            setIsDragging={setIsDraggingDepts}
            inputRef={deptsInputRef}
          />
        </div>

        <div className="mt-8 flex justify-end pt-6 border-t border-border">
          <button
            onClick={handleUpload}
            disabled={!usersFile || !deptsFile || isUploading}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
              ${(!usersFile || !deptsFile || isUploading) 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-95'
              }
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Replace Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
