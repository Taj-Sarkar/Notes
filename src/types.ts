/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockType = 'text' | 'task';

export interface Block {
  id: string; // Unique ID to keep React list rendering reliable and stable
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface Note {
  id: number;
  title: string;
  category: string;
  bg: string;
  dimmed: boolean;
  blocks: Block[];
}

export interface EditorHistoryState {
  title: string;
  blocks: Block[];
}
