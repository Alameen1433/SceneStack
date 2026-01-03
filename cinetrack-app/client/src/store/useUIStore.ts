import { create } from 'zustand';

export interface ContextMenuItem {
    id: number;
    title: string;
    poster_path: string | null;
    media_type: 'movie' | 'tv';
}

interface ContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    mediaItem: ContextMenuItem | null;
    type: 'desktop' | 'mobile';

    openMenu: (
        event: React.MouseEvent | React.TouchEvent | { clientX: number, clientY: number },
        item: ContextMenuItem,
        type: 'desktop' | 'mobile'
    ) => void;
    closeMenu: () => void;
}

export const useUIStore = create<ContextMenuState>((set) => ({
    isOpen: false,
    position: { x: 0, y: 0 },
    mediaItem: null,
    type: 'desktop',

    openMenu: (event, item, type) => {
        let x = 0;
        let y = 0;

        if ('clientX' in event) {
            x = event.clientX;
            y = event.clientY;
        } else if ('touches' in event && event.touches.length > 0) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        }

        set({
            isOpen: true,
            position: { x, y },
            mediaItem: item,
            type
        });
    },

    closeMenu: () => set({ isOpen: false, mediaItem: null })
}));
