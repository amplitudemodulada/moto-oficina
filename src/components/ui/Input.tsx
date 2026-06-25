import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({ label, error, helpText, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm
          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helpText && !error && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm
          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
