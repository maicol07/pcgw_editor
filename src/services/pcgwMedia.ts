import { ofetch } from 'ofetch';
import { pcgwAuth } from './pcgwAuth';
import { getWorkerProxyUrl, getDirectApiUrl } from '../config/api';

export interface UploadOptions {
    filename: string;
    text?: string;
    comment?: string;
    ignorewarnings?: boolean;
}

class PCGWMediaService {
    async uploadFile(file: Blob, options: UploadOptions): Promise<any> {
        if (!pcgwAuth.isLoggedIn) {
            throw new Error('User not authenticated with PCGW');
        }

        const formData = new FormData();
        formData.append('cookies', pcgwAuth.sessionCookies);
        formData.append('method', 'POST');
        formData.append('action', 'upload');
        formData.append('filename', options.filename);
        if (options.comment) formData.append('comment', options.comment);
        if (options.text) formData.append('text', options.text);
        if (options.ignorewarnings) formData.append('ignorewarnings', '1');
        formData.append('file', file, options.filename);

        try {
            const result = await ofetch(getWorkerProxyUrl(), {
                method: 'POST',
                body: formData
            });

            return result;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    async checkFileExists(filename: string): Promise<boolean> {
        try {
            const result = await ofetch(getDirectApiUrl(), {
                query: {
                    action: 'query',
                    titles: `File:${filename}`,
                    prop: 'info',
                    format: 'json',
                    origin: '*'
                }
            });
            const pages = result?.query?.pages || {};
            const page = Object.values(pages)[0] as any;
            return page && page.pageid > 0;
        } catch (e) {
            console.error('Failed to check file existence:', e);
            return false;
        }
    }
    async editPage(title: string, text: string, summary: string, baserevid?: number, minor: boolean = false): Promise<any> {
        if (!pcgwAuth.isLoggedIn) {
            throw new Error('User not authenticated with PCGW');
        }

        const token = await pcgwAuth.getCsrfToken();
        if (!token) throw new Error('Could not obtain CSRF token for editing');

        const formData = new FormData();
        formData.append('cookies', pcgwAuth.sessionCookies);
        formData.append('method', 'POST');
        formData.append('action', 'edit');
        formData.append('title', title);
        formData.append('text', text);
        formData.append('summary', summary);
        formData.append('token', token);
        if (baserevid) formData.append('baserevid', baserevid.toString());
        if (minor) formData.append('minor', '1');

        try {
            const result = await ofetch(getWorkerProxyUrl(), {
                method: 'POST',
                body: formData
            });

            if (result?.edit?.result !== 'Success') {
                throw new Error(result?.edit?.info || result?.error?.info || 'Failed to edit page');
            }

            return result;
        } catch (error: any) {
            console.error('Edit failed:', error);
            throw error;
        }
    }
}

export const pcgwMedia = new PCGWMediaService();
