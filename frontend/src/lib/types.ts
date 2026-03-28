export interface Card {
  id: number;
  title: string;
  content: string | null;
  position: number;
  listId: number;
}

export interface List {
  id: number;
  title: string;
  position: number;
  boardId: number;
  cards: Card[];
}

export interface Board {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  lists: List[];
}
