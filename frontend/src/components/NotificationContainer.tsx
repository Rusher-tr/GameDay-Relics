import { useNotification } from '../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      case 'info':
      default:
        return 'bg-slate-700 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getStyles(notification.type)} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm max-w-xs`}
        >
          <div className="flex-shrink-0">{getIcon(notification.type)}</div>
          <span className="font-medium flex-1">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-auto p-0.5 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
