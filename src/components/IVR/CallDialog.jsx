/**
 * CallDialog Component
 * Modal dialog for managing IVR calls
 */

import React, { useState, useEffect } from 'react';
import { X, Phone, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { initiateCall, getCallStatus, validatePhoneNumber, formatPhoneNumber } from '../../services/ivrService';

const CallDialog = ({ isOpen, onClose, defaultCallType = 'recommendations' }) => {
    const { t, i18n } = useTranslation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [callType, setCallType] = useState(defaultCallType);
    const [isProcessing, setIsProcessing] = useState(false);
    const [callStatus, setCallStatus] = useState(null);
    const [callSid, setCallSid] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setPhoneNumber('');
                setCallStatus(null);
                setCallSid(null);
                setCallDuration(0);
            }, 300);
        }
    }, [isOpen]);

    // Poll for call status updates
    useEffect(() => {
        if (!callSid || !['queued', 'ringing', 'in-progress'].includes(callStatus)) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await getCallStatus(callSid);
                if (response.success && response.data) {
                    setCallStatus(response.data.status);
                    if (response.data.duration) {
                        setCallDuration(parseInt(response.data.duration));
                    }

                    // Stop polling if call is completed or failed
                    if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(response.data.status)) {
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('Error fetching call status:', error);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [callSid, callStatus]);

    const handleInitiateCall = async (e) => {
        e.preventDefault();

        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            toast.error(t('ivr.errors.invalidPhone', 'Please enter a valid Indian phone number'));
            return;
        }

        setIsProcessing(true);

        try {
            const formattedNumber = formatPhoneNumber(phoneNumber);
            const response = await initiateCall(formattedNumber, language, callType);

            if (response.success && response.data) {
                setCallSid(response.data.call_sid);
                setCallStatus(response.data.status);
                toast.success(t('ivr.success.callInitiated', 'Call initiated! You will receive a call shortly.'));
            }
        } catch (error) {
            console.error('Error initiating call:', error);
            toast.error(error.message || t('ivr.errors.callFailed', 'Failed to initiate call. Please try again.'));
            setIsProcessing(false);
        } finally {
            if (!callSid) {
                setIsProcessing(false);
            }
        }
    };

    const getStatusIcon = () => {
        switch (callStatus) {
            case 'queued':
            case 'ringing':
            case 'in-progress':
                return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-8 h-8 text-green-500" />;
            case 'failed':
            case 'busy':
            case 'no-answer':
            case 'canceled':
                return <XCircle className="w-8 h-8 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (callStatus) {
            case 'queued':
                return t('ivr.callStatus.queued', 'Initiating call...');
            case 'ringing':
                return t('ivr.callStatus.ringing', 'Phone ringing...');
            case 'in-progress':
                return t('ivr.callStatus.inProgress', 'Connected');
            case 'completed':
                return t('ivr.callStatus.completed', 'Call ended');
            case 'failed':
                return t('ivr.callStatus.failed', 'Call failed');
            case 'busy':
                return t('ivr.callStatus.busy', 'Line busy');
            case 'no-answer':
                return t('ivr.callStatus.noAnswer', 'No answer');
            case 'canceled':
                return t('ivr.callStatus.canceled', 'Call canceled');
            default:
                return '';
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('ivr.callDialog.title', 'Request a Callback')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('ivr.callDialog.subtitle', 'We\'ll call you shortly')}
                        </p>
                    </div>
                </div>

                {/* Call Status Display */}
                {callStatus && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            {getStatusIcon()}
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {getStatusText()}
                            </span>
                        </div>
                        {callDuration > 0 && (
                            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{formatDuration(callDuration)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Form */}
                {!callSid && (
                    <form onSubmit={handleInitiateCall} className="space-y-4">
                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('ivr.callDialog.phoneLabel', 'Phone Number')}
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
                                required
                                disabled={isProcessing}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('ivr.callDialog.phoneHint', 'Enter 10-digit Indian mobile number')}
                            </p>
                        </div>

                        {/* Language */}
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('ivr.callDialog.languageLabel', 'Preferred Language')}
                            </label>
                            <select
                                id="language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                disabled={isProcessing}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                            </select>
                        </div>

                        {/* Call Type */}
                        <div>
                            <label htmlFor="callType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('ivr.callDialog.callTypeLabel', 'What would you like to discuss?')}
                            </label>
                            <select
                                id="callType"
                                value={callType}
                                onChange={(e) => setCallType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                disabled={isProcessing}
                            >
                                <option value="recommendations">{t('ivr.callTypes.recommendations', 'Career Recommendations')}</option>
                                <option value="counseling">{t('ivr.callTypes.counseling', 'General Counseling')}</option>
                                <option value="colleges">{t('ivr.callTypes.colleges', 'College Information')}</option>
                                <option value="content">{t('ivr.callTypes.content', 'Listen to Content')}</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                         text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                         dark:hover:bg-gray-700 transition-colors"
                                disabled={isProcessing}
                            >
                                {t('ivr.callDialog.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 
                         text-white rounded-lg hover:from-green-600 hover:to-emerald-700 
                         transition-all duration-200 font-medium flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('ivr.callDialog.calling', 'Calling...')}
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-4 h-4" />
                                        {t('ivr.callDialog.initiateButton', 'Call Me Now')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Call Complete Actions */}
                {callSid && ['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus) && (
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 
                       dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 
                       transition-colors"
                        >
                            {t('common.close', 'Close')}
                        </button>
                        {callStatus !== 'completed' && (
                            <button
                                onClick={() => {
                                    setCallSid(null);
                                    setCallStatus(null);
                                    setCallDuration(0);
                                }}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 
                         text-white rounded-lg hover:from-green-600 hover:to-emerald-700 
                         transition-all duration-200 font-medium"
                            >
                                {t('ivr.callDialog.tryAgain', 'Try Again')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallDialog;

