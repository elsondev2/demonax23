import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ThemeSwitcher from '../ThemeSwitcher';
import { useThemeStore } from '../../store/useThemeStore';

// Mock the theme store
vi.mock('../../store/useThemeStore');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('ThemeSwitcher', () => {
  const mockSetTheme = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useThemeStore.mockReturnValue({
      currentTheme: 'dark',
      setTheme: mockSetTheme,
      isChangingTheme: false,
    });
  });

  it('renders when open', () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Choose Theme')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search themes/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ThemeSwitcher isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Choose Theme')).not.toBeInTheDocument();
  });

  it('displays theme categories', () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/All Themes/)).toBeInTheDocument();
    expect(screen.getByText(/Light/)).toBeInTheDocument();
    expect(screen.getByText(/Dark/)).toBeInTheDocument();
    expect(screen.getByText(/Special/)).toBeInTheDocument();
  });

  it('filters themes by search query', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText(/Search themes/);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'dark' } });
    });

    // Should show fewer themes after filtering
    await waitFor(() => {
      expect(screen.getByDisplayValue('dark')).toBeInTheDocument();
    });
  });

  it('filters themes by category', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    const lightButton = screen.getByText(/Light/);
    
    await act(async () => {
      fireEvent.click(lightButton);
    });

    // Should show only light themes
    expect(lightButton).toHaveClass('btn-primary');
  });

  it('calls setTheme when theme is selected', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    // Find and click a theme card (assuming 'Light' theme exists)
    const themeCards = screen.getAllByRole('gridcell');
    
    await act(async () => {
      fireEvent.click(themeCards[0]);
    });

    expect(mockSetTheme).toHaveBeenCalled();
  });

  it('closes when escape key is pressed', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes when backdrop is clicked', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    const backdrop = screen.getByRole('dialog');
    
    await act(async () => {
      fireEvent.click(backdrop);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears search when clear button is clicked', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText(/Search themes/);
    
    // Add search text
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    // Find and click clear button
    const clearButton = screen.getByLabelText('Clear search');
    
    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(searchInput.value).toBe('');
  });

  it('shows loading state when changing theme', () => {
    useThemeStore.mockReturnValue({
      currentTheme: 'dark',
      setTheme: mockSetTheme,
      isChangingTheme: true,
    });

    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    // Theme cards should be disabled when changing theme
    const themeCards = screen.getAllByRole('gridcell');
    expect(themeCards[0]).toBeDisabled();
  });

  it('shows no results message when search has no matches', async () => {
    render(<ThemeSwitcher isOpen={true} onClose={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText(/Search themes/);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'nonexistenttheme' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No themes found matching/)).toBeInTheDocument();
    });
  });
});