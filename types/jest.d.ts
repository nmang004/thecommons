// Jest and Testing Library type definitions for TypeScript

/// <reference types="@types/jest" />
/// <reference types="@testing-library/jest-dom" />

// Augment the Jest expect interface to include testing-library/jest-dom matchers
declare namespace jest {
  interface Matchers<R> {
    // testing-library/jest-dom matchers
    toBeInTheDocument(): R
    toBeVisible(): R
    toBeEmptyDOMElement(): R
    toBeInvalid(): R
    toBeRequired(): R
    toBeValid(): R
    toBeDisabled(): R
    toBeEnabled(): R
    toBeChecked(): R
    toBePartiallyChecked(): R
    toHaveAccessibleDescription(text?: string | RegExp): R
    toHaveAccessibleName(text?: string | RegExp): R
    toHaveAttribute(attr: string, value?: string | RegExp): R
    toHaveClass(...classNames: string[]): R
    toHaveFocus(): R
    toHaveFormValues(values: Record<string, any>): R
    toHaveStyle(css: Record<string, any> | string): R
    toHaveTextContent(text: string | RegExp): R
    toHaveValue(value: string | string[] | number): R
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R
    toHaveErrorMessage(text?: string | RegExp): R
  }
}

export {}