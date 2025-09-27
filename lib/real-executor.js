const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class RealExecutor {
  async executeReactComponent(projectPath, componentName, description) {
    console.log(chalk.blue(`🎨 Criando componente React: ${componentName}...`));

    const componentDir = path.join(projectPath, 'src', 'components');
    await fs.ensureDir(componentDir);

    // Parse component requirements from description
    const hasVariants = description.toLowerCase().includes('variant');
    const hasTailwind = description.toLowerCase().includes('tailwind');
    const hasOnClick = description.toLowerCase().includes('onclick');

    // Generate component code
    const componentCode = this.generateReactComponent(componentName, {
      hasVariants,
      hasTailwind,
      hasOnClick
    });

    // Write component file
    const componentFile = path.join(componentDir, `${componentName}.jsx`);
    await fs.writeFile(componentFile, componentCode);
    console.log(chalk.green(`✅ Criado: ${componentFile}`));

    // Generate test file
    const testCode = this.generateTestFile(componentName);
    const testFile = path.join(componentDir, `${componentName}.test.jsx`);
    await fs.writeFile(testFile, testCode);
    console.log(chalk.green(`✅ Criado: ${testFile}`));

    // Generate styles if using Tailwind
    if (hasTailwind) {
      const stylesCode = this.generateStyles(componentName);
      const stylesFile = path.join(componentDir, `${componentName}.module.css`);
      await fs.writeFile(stylesFile, stylesCode);
      console.log(chalk.green(`✅ Criado: ${stylesFile}`));
    }

    return {
      success: true,
      filesCreated: hasTailwind ? 3 : 2,
      files: [componentFile, testFile]
    };
  }

  generateReactComponent(name, options) {
    const { hasVariants, hasTailwind, hasOnClick } = options;

    return `import React from 'react';
${hasTailwind ? "import './Button.module.css';" : ''}

const ${name} = ({
  children,
  ${hasOnClick ? 'onClick,' : ''}
  ${hasVariants ? "variant = 'primary'," : ''}
  disabled = false,
  className = '',
  ...props
}) => {
  ${hasVariants && hasTailwind ? `
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };` : ''}

  const baseClasses = '${hasTailwind ?
    'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2' :
    'button'}';

  return (
    <button
      ${hasOnClick ? 'onClick={onClick}' : ''}
      disabled={disabled}
      className={\`
        \${baseClasses}
        ${hasVariants && hasTailwind ? '\\${variants[variant]}' : ''}
        \${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        \${className}
      \`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${name};`;
  }

  generateTestFile(name) {
    return `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ${name} from './${name}';

describe('${name} Component', () => {
  test('renders with children', () => {
    render(<${name}>Click me</${name}>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<${name} onClick={handleClick}>Click me</${name}>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('can be disabled', () => {
    render(<${name} disabled>Disabled</${name}>);
    const button = screen.getByText('Disabled');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
  });
});`;
  }

  generateStyles(name) {
    return `/* Styles for ${name} component */
.button-base {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.button-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.button-secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
}

.button-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}`;
  }
}

module.exports = RealExecutor;