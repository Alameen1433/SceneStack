import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
    isPreventDefault?: boolean;
    delay?: number;
}

export const useLongPress = (
    onLongPress: (event: React.TouchEvent | React.MouseEvent) => void,
    onClick: () => void,
    { isPreventDefault = true, delay = 500 }: UseLongPressOptions = {}
) => {
    const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const target = useRef<EventTarget>(null);
    const startPoint = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback(
        (event: React.TouchEvent | React.MouseEvent) => {
            if (isPreventDefault && event.target) {
                target.current = event.target;
            }

            if ('touches' in event) {
                startPoint.current = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }

            timeout.current = setTimeout(() => {
                onLongPress(event);
            }, delay);
        },
        [onLongPress, delay, isPreventDefault]
    );

    const move = useCallback((event: React.TouchEvent) => {
        if (!startPoint.current || !timeout.current) return;

        const x = event.touches[0].clientX;
        const y = event.touches[0].clientY;
        const diffX = Math.abs(x - startPoint.current.x);
        const diffY = Math.abs(y - startPoint.current.y);

        if (diffX > 10 || diffY > 10) {
            clear(event, false);
        }
    }, []);

    const clear = useCallback(
        (_event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            timeout.current = undefined;
            startPoint.current = null;
            shouldTriggerClick && onClick();
        },
        [onClick]
    );

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onTouchMove: (e: React.TouchEvent) => move(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e)
    };
};
