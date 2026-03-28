import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardComponent from '../components/Card';
import type { Card } from '../lib/types';

jest.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ children }: { children: (provided: Record<string, unknown>, snapshot: Record<string, unknown>) => React.ReactNode }) =>
    children(
      {
        innerRef: () => {},
        draggableProps: { 'data-testid': 'draggable' },
        dragHandleProps: {},
      },
      { isDragging: false }
    ),
}));

const mockCard: Card = {
  id: 1,
  title: 'Test Card',
  content: 'Card description',
  position: 0,
  listId: 1,
};

describe('Card component', () => {
  it('renders card title and content', () => {
    render(
      <CardComponent
        card={mockCard}
        index={0}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('Test Card')).toBeTruthy();
    expect(screen.getByText('Card description')).toBeTruthy();
  });

  it('calls onEdit when clicked', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    render(
      <CardComponent
        card={mockCard}
        index={0}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );

    await user.click(screen.getByText('Test Card'));
    expect(onEdit).toHaveBeenCalledWith(mockCard);
  });
});
