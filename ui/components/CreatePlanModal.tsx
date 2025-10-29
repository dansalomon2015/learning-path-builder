import React, { useState, useRef } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { XIcon } from './icons/XIcon';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, level: string) => void;
}

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [creationMode, setCreationMode] = useState<'topic' | 'document'>('topic');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setCreationMode('topic');
    setTitle('');
    setLevel('Beginner');
    setSelectedFile(null);
    setIsProcessing(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetState();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    let planTitle = '';
    if (creationMode === 'topic') {
      planTitle = title;
    } else if (creationMode === 'document' && selectedFile) {
      planTitle = `Learning from ${selectedFile.name}`;
    }

    if (planTitle.trim()) {
      setIsProcessing(true);
      // Simulate AI processing delay
      setTimeout(() => {
        onCreate(planTitle, level);
        handleClose();
      }, 1500);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  const isSubmitDisabled =
    isProcessing ||
    (creationMode === 'topic' && !title.trim()) ||
    (creationMode === 'document' && !selectedFile);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 transform transition-all duration-300 scale-95 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Create a New Learning Plan</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setCreationMode('topic')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${creationMode === 'topic' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              From Topic
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('document')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${creationMode === 'document' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              From Document
            </button>
          </div>

          {creationMode === 'topic' ? (
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Topic / Theme
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Quantum Physics"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Document
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
              />
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                    aria-label="Remove file"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                >
                  <UploadCloudIcon className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-slate-700 font-semibold">
                    Drag & drop or <span className="text-indigo-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, TXT, DOC, DOCX</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1">
              Your Current Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 mb-6">Our AI will generate a set of flashcards tailored to your input.</p>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-4 py-2 w-36 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Generate Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;