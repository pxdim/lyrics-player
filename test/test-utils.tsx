import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Config } from '@testing-library/dom';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  config?: Config;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, {
    ...options,
  });
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { expect } from 'vitest';
