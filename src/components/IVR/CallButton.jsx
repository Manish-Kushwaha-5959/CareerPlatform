/**
 * CallButton Component
 * Reusable button to initiate IVR calls
 */

import React from 'react';
import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CallButton = ({
    onClick,
    variant = 'floating',
    className = '',
    disabled = false,
    size = 'default'
}) => {
    const { t } = useTranslation();

    if (variant === 'floating') {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
          fixed bottom-6 right-6 z-50
          bg-gradient-to-r from-green-500 to-emerald-600
          hover:from-green-600 hover:to-emerald-700
          text-white rounded-full p-4 shadow-lg
          transition-all duration-200 hover:scale-110
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
                aria-label={t('ivr.callButton', 'Request Callback')}
                title={t('ivr.callButton', 'Request Callback')}
            >
                <Phone className="w-6 h-6" />
            </button>
        );
    }

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        default: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        inline-flex items-center gap-2
        bg-gradient-to-r from-green-500 to-emerald-600
        hover:from-green-600 hover:to-emerald-700
        text-white rounded-lg font-medium
        transition-all duration-200 hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
        >
            <Phone className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
            <span>{t('ivr.callButton', 'Request Callback')}</span>
        </button>
    );
};

export default CallButton;

