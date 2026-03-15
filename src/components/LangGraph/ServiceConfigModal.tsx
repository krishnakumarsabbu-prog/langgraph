import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs } from '../ui/tabs';
import toast from 'react-hot-toast';

interface ServiceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ServiceConfig) => void;
  initialConfig: ServiceConfig;
  initialInputs: Record<string, any>;
}

export interface ServiceConfig {
  requestBody: string;
  headers: Array<{ key: string; value: string }>;
  authType: 'none' | 'bearer' | 'basic' | 'oauth2' | 'api-key';
  authConfig: {
    bearerToken?: string;
    basicUsername?: string;
    basicPassword?: string;
    oauth2ClientId?: string;
    oauth2ClientSecret?: string;
    oauth2TokenUrl?: string;
    oauth2Scope?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
  };
  tlsConfig: {
    enabled: boolean;
    verifyCertificate: boolean;
    clientCertificate?: string;
    clientKey?: string;
    clientCertificatePath?: string;
    clientKeyPath?: string;
  };
  timeout: number;
  retryConfig: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

export const ServiceConfigModal: React.FC<ServiceConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  initialInputs,
}) => {
  const [config, setConfig] = useState<ServiceConfig>(initialConfig);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'headers' | 'auth' | 'tls' | 'advanced'>('request');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const getFieldPaths = (obj: any, prefix = 'input'): string[] => {
    let paths: string[] = [];
    for (const key in obj) {
      const newPath = `${prefix}.${key}`;
      paths.push(newPath);
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        paths = paths.concat(getFieldPaths(obj[key], newPath));
      }
    }
    return paths;
  };

  const fieldPaths = getFieldPaths(initialInputs);

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const handleDrop = (e: React.DragEvent, fieldName: 'requestBody' | string) => {
    e.preventDefault();
    if (draggedField) {
      const cursorPosition = (e.target as HTMLTextAreaElement).selectionStart || 0;
      const currentValue = fieldName === 'requestBody' ? config.requestBody : '';
      const textBefore = currentValue.substring(0, cursorPosition);
      const textAfter = currentValue.substring(cursorPosition);
      const newText = `${textBefore}{${draggedField}}${textAfter}`;

      if (fieldName === 'requestBody') {
        setConfig({ ...config, requestBody: newText });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addHeader = () => {
    setConfig({
      ...config,
      headers: [...config.headers, { key: '', value: '' }],
    });
  };

  const removeHeader = (index: number) => {
    setConfig({
      ...config,
      headers: config.headers.filter((_, i) => i !== index),
    });
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...config.headers];
    newHeaders[index][field] = value;
    setConfig({ ...config, headers: newHeaders });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleFileUpload = async (file: File, type: 'certificate' | 'key') => {
    const isKey = type === 'key';
    const setLoading = isKey ? setUploadingKey : setUploadingCert;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-certificate`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      if (isKey) {
        setConfig({
          ...config,
          tlsConfig: {
            ...config.tlsConfig,
            clientKey: result.content,
            clientKeyPath: result.filePath,
          }
        });
        toast.success('Private key uploaded successfully');
      } else {
        setConfig({
          ...config,
          tlsConfig: {
            ...config.tlsConfig,
            clientCertificate: result.content,
            clientCertificatePath: result.filePath,
          }
        });
        toast.success('Certificate uploaded successfully');
      }
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'certificate');
    }
    e.target.value = '';
  };

  const handleKeyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'key');
    }
    e.target.value = '';
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999]">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="bg-white border-b border-gray-300 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Configure Service Request</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/4 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Available Fields</h3>
            <p className="text-sm text-gray-600 mb-6">Drag fields to the inputs on the right</p>
            <div className="space-y-3">
              {fieldPaths.map((field) => (
                <div
                  key={field}
                  draggable
                  onDragStart={() => handleDragStart(field)}
                  onDragEnd={handleDragEnd}
                  className="bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-mono cursor-move hover:bg-gray-100 hover:border-gray-500 transition-all shadow-md hover:shadow-lg"
                >
                  {field}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {(['request', 'headers', 'auth', 'tls', 'advanced'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-semibold text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'request' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Request Body</h3>
                <p className="text-sm text-gray-600">
                  Drop fields here or type manually. Use single braces {'{'} and {'}'} to wrap field references.
                </p>
                <textarea
                  value={config.requestBody}
                  onChange={(e) => setConfig({ ...config, requestBody: e.target.value })}
                  onDrop={(e) => handleDrop(e, 'requestBody')}
                  onDragOver={handleDragOver}
                  className="w-full h-96 px-6 py-4 text-base font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white resize-none"
                  placeholder='{\n  "key": "{input.field.name}",\n  "value": "static value"\n}'
                />
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">HTTP Headers</h3>
                  <Button
                    onClick={addHeader}
                    className="bg-gray-700 hover:bg-gray-800 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Header
                  </Button>
                </div>
                <div className="space-y-3">
                  {config.headers.map((header, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Header Name"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Header Value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {config.headers.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No headers added yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Authentication</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Auth Type</label>
                  <select
                    value={config.authType}
                    onChange={(e) => setConfig({ ...config, authType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="oauth2">OAuth 2.0</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>

                {config.authType === 'bearer' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bearer Token</label>
                    <input
                      type="password"
                      placeholder="Enter bearer token"
                      value={config.authConfig.bearerToken || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        authConfig: { ...config.authConfig, bearerToken: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                )}

                {config.authType === 'basic' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        placeholder="Enter username"
                        value={config.authConfig.basicUsername || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, basicUsername: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={config.authConfig.basicPassword || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, basicPassword: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </>
                )}

                {config.authType === 'oauth2' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID</label>
                      <input
                        type="text"
                        placeholder="Enter client ID"
                        value={config.authConfig.oauth2ClientId || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, oauth2ClientId: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret</label>
                      <input
                        type="password"
                        placeholder="Enter client secret"
                        value={config.authConfig.oauth2ClientSecret || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, oauth2ClientSecret: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Token URL</label>
                      <input
                        type="text"
                        placeholder="https://oauth.example.com/token"
                        value={config.authConfig.oauth2TokenUrl || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, oauth2TokenUrl: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Scope (optional)</label>
                      <input
                        type="text"
                        placeholder="read write"
                        value={config.authConfig.oauth2Scope || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, oauth2Scope: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </>
                )}

                {config.authType === 'api-key' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Header Name</label>
                      <input
                        type="text"
                        placeholder="X-API-Key"
                        value={config.authConfig.apiKeyHeader || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, apiKeyHeader: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter API key"
                        value={config.authConfig.apiKeyValue || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          authConfig: { ...config.authConfig, apiKeyValue: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'tls' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">TLS/SSL Configuration</h3>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="tlsEnabled"
                    checked={config.tlsConfig.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      tlsConfig: { ...config.tlsConfig, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-gray-700 rounded focus:ring-gray-400"
                  />
                  <label htmlFor="tlsEnabled" className="text-sm font-semibold text-gray-700">
                    Enable TLS/SSL
                  </label>
                </div>

                {config.tlsConfig.enabled && (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="verifyCert"
                        checked={config.tlsConfig.verifyCertificate}
                        onChange={(e) => setConfig({
                          ...config,
                          tlsConfig: { ...config.tlsConfig, verifyCertificate: e.target.checked }
                        })}
                        className="w-4 h-4 text-gray-700 rounded focus:ring-gray-400"
                      />
                      <label htmlFor="verifyCert" className="text-sm font-semibold text-gray-700">
                        Verify Server Certificate
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Client Certificate
                      </label>

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Certificate File Path
                        </label>
                        <input
                          type="text"
                          placeholder="/path/to/certificate.pem"
                          value={config.tlsConfig.clientCertificatePath || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            tlsConfig: { ...config.tlsConfig, clientCertificatePath: e.target.value }
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Upload Certificate File
                          </label>
                          <input
                            type="file"
                            id="cert-file-upload"
                            accept=".pem,.crt,.cer"
                            onChange={handleCertificateFileSelect}
                            className="hidden"
                            disabled={uploadingCert}
                          />
                          <label
                            htmlFor="cert-file-upload"
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                              uploadingCert
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                          >
                            {uploadingCert ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                Upload File
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Or Paste Certificate (PEM format)
                        </label>
                        <textarea
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                          value={config.tlsConfig.clientCertificate || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            tlsConfig: { ...config.tlsConfig, clientCertificate: e.target.value }
                          })}
                          className="w-full h-32 px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Client Private Key
                      </label>

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Private Key File Path
                        </label>
                        <input
                          type="text"
                          placeholder="/path/to/private-key.pem"
                          value={config.tlsConfig.clientKeyPath || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            tlsConfig: { ...config.tlsConfig, clientKeyPath: e.target.value }
                          })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Upload Private Key File
                          </label>
                          <input
                            type="file"
                            id="key-file-upload"
                            accept=".pem,.key"
                            onChange={handleKeyFileSelect}
                            className="hidden"
                            disabled={uploadingKey}
                          />
                          <label
                            htmlFor="key-file-upload"
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                              uploadingKey
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                          >
                            {uploadingKey ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                Upload File
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Or Paste Private Key (PEM format)
                        </label>
                        <textarea
                          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                          value={config.tlsConfig.clientKey || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            tlsConfig: { ...config.tlsConfig, clientKey: e.target.value }
                          })}
                          className="w-full h-32 px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Advanced Settings</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timeout (milliseconds)
                  </label>
                  <input
                    type="number"
                    value={config.timeout}
                    onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 30000 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="retryEnabled"
                    checked={config.retryConfig.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      retryConfig: { ...config.retryConfig, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-gray-700 rounded focus:ring-gray-400"
                  />
                  <label htmlFor="retryEnabled" className="text-sm font-semibold text-gray-700">
                    Enable Retry on Failure
                  </label>
                </div>

                {config.retryConfig.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        value={config.retryConfig.maxRetries}
                        onChange={(e) => setConfig({
                          ...config,
                          retryConfig: { ...config.retryConfig, maxRetries: parseInt(e.target.value) || 3 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Retry Delay (milliseconds)
                      </label>
                      <input
                        type="number"
                        value={config.retryConfig.retryDelay}
                        onChange={(e) => setConfig({
                          ...config,
                          retryConfig: { ...config.retryConfig, retryDelay: parseInt(e.target.value) || 1000 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose} className="px-6 py-3 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 text-base"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
