import { describe, it, expect, vi, afterEach } from 'vitest';
import { getApiHeaders, API_CONFIG } from '../../../src/config/api';
import pkg from '../../../package.json';

describe('src/config/api.ts', () => {
    const originalProxyPrefix = API_CONFIG.proxyPrefix;

    afterEach(() => {
        // Reset proxyPrefix after each test
        API_CONFIG.proxyPrefix = originalProxyPrefix;
    });

    it('should generate getApiHeaders with correct User-Agent headers', () => {
        const headers = getApiHeaders();
        const expectedUserAgent = `${pkg.name}/${pkg.version} (https://github.com/maicol07/pcgw_editor_2; webmaster@maicol07.it) ofetch/1.5.1`;

        expect(headers).toHaveProperty('User-Agent', expectedUserAgent);
        expect(headers).toHaveProperty('Api-User-Agent', expectedUserAgent);
        expect(headers).not.toHaveProperty('X-Requested-With');
    });

    it('should add X-Requested-With header when using cors-anywhere proxy', () => {
        API_CONFIG.proxyPrefix = 'https://cors-anywhere.herokuapp.com/';
        const headers = getApiHeaders();
        const expectedUserAgent = `${pkg.name}/${pkg.version} (https://github.com/maicol07/pcgw_editor_2; webmaster@maicol07.it) ofetch/1.5.1`;

        expect(headers).toHaveProperty('X-Requested-With', 'XMLHttpRequest');
        expect(headers).toHaveProperty('User-Agent', expectedUserAgent);
        expect(headers).toHaveProperty('Api-User-Agent', expectedUserAgent);
    });
});
