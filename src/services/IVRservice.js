/**
 * IVR Service for Apni Disha
 * Handles API calls for IVR call functionality
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Initiate an outbound call to user
 * @param {string} phoneNumber - Phone number to call
 * @param {string} language - Language preference ('en' or 'hi')
 * @param {string} callType - Type of call ('recommendations', 'counseling', etc.)
 * @param {object} userData - Additional user data
 * @returns {Promise} Call details including call_sid
 */
export const initiateCall = async (phoneNumber, language = 'en', callType = 'recommendations', userData = {}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/ivr/initiate-call`, {
            phoneNumber,
            language,
            callType,
            userData
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to initiate call';
        throw new Error(errorMessage);
    }
};

/**
 * Get the status of a call
 * @param {string} callSid - Twilio Call SID
 * @returns {Promise} Call status details
 */
export const getCallStatus = async (callSid) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/ivr/call-status/${callSid}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to get call status';
        throw new Error(errorMessage);
    }
};

/**
 * Test if IVR service is configured
 * @returns {Promise} Configuration status
 */
export const testIVRService = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/ivr/test`);
        return response.data;
    } catch (error) {
        return {
            status: 'error',
            configured: false,
            message: error.message
        };
    }
};

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with 91, add +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }

    // If it's 10 digits, assume Indian number
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    // If it already has country code
    if (cleaned.length > 10) {
        return `+${cleaned}`;
    }

    throw new Error('Invalid phone number format');
};

/**
 * Validate Indian phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Whether the number is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
    try {
        const formatted = formatPhoneNumber(phoneNumber);
        // Indian numbers: +91 followed by 10 digits starting with 6-9
        return /^\+91[6-9]\d{9}$/.test(formatted);
    } catch {
        return false;
    }
};

export default {
    initiateCall,
    getCallStatus,
    testIVRService,
    formatPhoneNumber,
    validatePhoneNumber
};
