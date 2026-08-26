import ToastEventBus from 'openvue/toasteventbus';

let lastPermissionDeniedToast = 0;

/**
 * Dispatches a throttled toast notification when PCGW returns a permissiondenied error
 * @param info Optional error message returned from MediaWiki API
 */
export function notifyPermissionDenied(info?: string): void {
    const now = Date.now();
    // Throttle notifications to at most once every 8 seconds to prevent spam
    if (now - lastPermissionDeniedToast < 8000) return;
    lastPermissionDeniedToast = now;

    ToastEventBus.emit('add', {
        severity: 'warn',
        summary: 'Permission Denied',
        detail: info || "Your account lacks the necessary permissions. Make sure your PCGamingWiki Bot Password has all required grants (e.g. 'Run queries' / 'Edit pages').",
        life: 7000
    });
}
