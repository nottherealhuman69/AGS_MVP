// Utility function to combine class names
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Common glass effect classes (compatible with older Tailwind)
export const glassStyles = {
  card: 'bg-white bg-opacity-25 backdrop-blur-xl border border-white border-opacity-20 rounded-2xl shadow-xl',
  button: 'bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-opacity-20 hover:scale-105',
  input: 'bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all',
  modal: 'bg-white bg-opacity-25 backdrop-blur-xl border border-white border-opacity-20 rounded-2xl',
}

// Status badge styles
export const badgeStyles = {
  primary: 'bg-blue-500 bg-opacity-20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium',
  success: 'bg-green-500 bg-opacity-20 text-green-300 px-3 py-1 rounded-full text-sm font-medium',
  warning: 'bg-yellow-500 bg-opacity-20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium',
  danger: 'bg-red-500 bg-opacity-20 text-red-300 px-3 py-1 rounded-full text-sm font-medium',
  info: 'bg-purple-500 bg-opacity-20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium',
}

// Alert styles
export const alertStyles = {
  success: 'bg-green-500 bg-opacity-20 border-green-500 border-opacity-30 text-green-100',
  error: 'bg-red-500 bg-opacity-20 border-red-500 border-opacity-30 text-red-100',
  warning: 'bg-yellow-500 bg-opacity-20 border-yellow-500 border-opacity-30 text-yellow-100',
  info: 'bg-blue-500 bg-opacity-20 border-blue-500 border-opacity-30 text-blue-100'
}