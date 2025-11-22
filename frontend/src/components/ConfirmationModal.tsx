import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200">
                    {/* Header */}
                    <div className={`p-6 border-b-2 ${type === 'danger' ? 'bg-red-50 border-red-200' :
                            type === 'warning' ? 'bg-amber-50 border-amber-200' :
                                'bg-blue-50 border-blue-200'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100' :
                                        type === 'warning' ? 'bg-amber-100' :
                                            'bg-blue-100'
                                    }`}>
                                    <AlertTriangle className={`h-6 w-6 ${type === 'danger' ? 'text-red-600' :
                                            type === 'warning' ? 'text-amber-600' :
                                                'text-blue-600'
                                        }`} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{title}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`px-6 py-2.5 text-white rounded-lg font-semibold transition-colors ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
