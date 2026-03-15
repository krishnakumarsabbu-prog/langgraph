import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import Editor from '@monaco-editor/react';

interface DecisionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (script: string) => void;
  initialValue: string;
}

export const DecisionConfigModal: React.FC<DecisionConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
}) => {
  const [pythonScript, setPythonScript] = useState(initialValue || '# Write your Python decision logic here\n# Access workflow state via state variable\n# Example: state["field"] == "value"\n');

  useEffect(() => {
    if (isOpen) {
      setPythonScript(initialValue || '# Write your Python decision logic here\n# Access workflow state via state variable\n# Example: state["field"] == "value"\n');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(pythonScript);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999]">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="bg-[#FFCD41] text-gray-900 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Configure Decision Logic</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E6B800] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Python Script</h3>
          <p className="text-sm text-gray-600 mb-4">
            Write Python code to define your decision logic. Use the <code className="bg-gray-100 px-1 rounded">state</code> variable to access workflow data.
          </p>
          <div className="flex-1 border-2 border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={pythonScript}
              onChange={(value) => setPythonScript(value || '')}
              theme="vs-light"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="px-6 py-3 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#FFCD41] hover:bg-[#E6B800] text-gray-900 px-8 py-3 text-base"
          >
            Save Script
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
