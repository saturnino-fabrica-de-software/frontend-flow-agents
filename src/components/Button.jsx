import React from 'react';


const Button = ({
  children,
  
  
  disabled = false,
  className = '',
  ...props
}) => {
  

  const baseClasses = 'button';

  return (
    <button
      
      disabled={disabled}
      className={`
        ${baseClasses}
        
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;