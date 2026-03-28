import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../lib/auth';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

import HomePage from '../app/page';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form by default', async () => {
    renderWithAuth(<HomePage />);
    const heading = await waitFor(() => screen.getByText('Kanban Board'));
    expect(heading).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter password')).toBeTruthy();
  });

  it('toggles to register form', async () => {
    const user = userEvent.setup();
    renderWithAuth(<HomePage />);

    await waitFor(() => screen.getByText('Kanban Board'));
    const registerLink = screen.getByText('Register');
    await user.click(registerLink);

    const buttons = screen.getAllByRole('button');
    const registerBtn = buttons.find((b) => b.textContent === 'Register');
    expect(registerBtn).toBeTruthy();
  });
});
