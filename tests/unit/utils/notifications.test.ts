import { describe, it, expect, vi, beforeEach } from 'vitest';
import ToastEventBus from 'openvue/toasteventbus';
import { notifyPermissionDenied } from '../../../src/utils/notifications';

vi.mock('openvue/toasteventbus', () => ({
    default: {
        emit: vi.fn()
    }
}));

describe('notifications.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('emits a toast on ToastEventBus when notifyPermissionDenied is called', () => {
        notifyPermissionDenied("You don't have permission to run arbitrary Cargo queries.");
        expect(ToastEventBus.emit).toHaveBeenCalledWith('add', expect.objectContaining({
            severity: 'warn',
            summary: 'Permission Denied',
            detail: "You don't have permission to run arbitrary Cargo queries."
        }));
    });
});
