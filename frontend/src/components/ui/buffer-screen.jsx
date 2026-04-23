import React from 'react';
import { ShoppingBag, Check, LogOut } from 'lucide-react';

/**
 * A reusable buffer screen component for transitions like login and logout
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether the buffer screen is visible
 * @param {string} props.type - The type of buffer screen ('login', 'logout')
 * @param {string} props.state - The current state ('loading', 'success')
 * @param {number} props.progress - Progress percentage (0-100) for loading state
 */
const BufferScreen = ({ 
  isVisible, 
  type = 'login', 
  state = 'loading', 
  progress = 0 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500 z-50 animate-fadeIn">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center transform transition-all duration-500 max-w-sm w-full mx-4">
        {/* Logo and Brand */}
        <div className="mb-6 flex items-center justify-center">
          <div className={`${type === 'login' ? 'bg-blue-600' : 'bg-gray-700'} p-3 rounded-full`}>
            {type === 'login' ? (
              <ShoppingBag className="h-8 w-8 text-white" />
            ) : (
              <LogOut className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className={`text-2xl font-bold ml-3 ${type === 'login' ? 'text-blue-600' : 'text-gray-700'}`}>
            QuickCart
          </h2>
        </div>
        
        {state === 'loading' && (
          <>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div 
                className={`h-full ${type === 'login' ? 'bg-blue-600' : 'bg-gray-700'} rounded-full`}
                style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
              ></div>
            </div>
            
            {/* Loading Message */}
            <p className="text-lg font-semibold text-gray-800 mb-2">
              {type === 'login' ? 'Logging in...' : 'Logging out...'}
            </p>
            <p className="text-sm text-gray-500 text-center">
              {type === 'login' 
                ? 'Please wait while we securely log you into your account'
                : 'Please wait while we securely log you out of your account'}
            </p>
          </>
        )}
        
        {state === 'success' && (
          <>
            {/* Success Animation */}
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">
              {type === 'login' ? 'Login Successful!' : 'Logout Successful!'}
            </p>
            <p className="text-sm text-gray-500 text-center">
              {type === 'login' 
                ? 'Redirecting you to your dashboard...'
                : 'Thank you for using QuickCart!'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default BufferScreen;