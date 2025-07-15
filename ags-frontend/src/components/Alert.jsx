import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

function Alert({ type = 'info', message, onClose, className = '' }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const getAlertStyles = (type) => {
    const baseStyle = {
      backdropFilter: 'blur(16px)',
      border: '1px solid',
      borderRadius: '0.75rem',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          color: 'rgb(187, 247, 208)'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: 'rgb(254, 202, 202)'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          color: 'rgb(254, 240, 138)'
        };
      default: // info
        return {
          ...baseStyle,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          color: 'rgb(191, 219, 254)'
        };
    }
  };

  const Icon = icons[type];

  return (
    <div style={getAlertStyles(type)} className={className}>
      <Icon size={20} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ 
            flexShrink: 0, 
            background: 'none', 
            border: 'none', 
            color: 'inherit', 
            cursor: 'pointer',
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

export default Alert;