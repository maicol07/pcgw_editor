export function useWikitextEditor() {

    /**
     * Inserts text before and after the current selection in a textarea.
     */
    const insertFormatting = (
        textarea: HTMLTextAreaElement | null,
        currentValue: string,
        before: string,
        after: string = '',
        placeholder: string = 'text'
    ): { text: string; newCursorPos: number } | null => {
        if (!textarea) return null;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentValue.substring(start, end) || placeholder;

        const newText = currentValue.substring(0, start) + before + selectedText + after + currentValue.substring(end);
        const newCursorPos = start + before.length + selectedText.length;

        return { text: newText, newCursorPos };
    };

    /**
     * Smart insertion for lists (handles newlines).
     */
    const insertList = (
        textarea: HTMLTextAreaElement | null,
        currentValue: string,
        prefix: string
    ): { text: string; newCursorPos: number } | null => {
        if (!textarea) return null;

        const start = textarea.selectionStart;
        const beforeCursor = currentValue.substring(0, start);
        const afterCursor = currentValue.substring(start);

        // Check if we're at the start of a line
        const lastNewline = beforeCursor.lastIndexOf('\n');
        const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const isStartOfLine = start === currentLineStart || beforeCursor.substring(currentLineStart).trim() === '';

        let newText = '';
        let newCursorPos = 0;

        if (isStartOfLine) {
            newText = beforeCursor + prefix + ' ' + afterCursor;
            newCursorPos = start + prefix.length + 1;
        } else {
            newText = beforeCursor + '\n' + prefix + ' ' + afterCursor;
            newCursorPos = start + prefix.length + 2; // +1 for newline
        }

        return { text: newText, newCursorPos };
    };

    return {
        insertFormatting,
        insertList
    };
}
