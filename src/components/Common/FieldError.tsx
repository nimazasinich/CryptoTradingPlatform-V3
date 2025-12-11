import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ message }) => (
  <p 
    className="text-xs text-red-400 flex items-start gap-1.5 mt-1"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
    <span>{message}</span>
  </p>
);
