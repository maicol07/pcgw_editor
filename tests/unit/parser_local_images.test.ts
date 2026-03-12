import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseWikitext } from '../../src/utils/parser';

// Mock the db import
vi.mock('../../src/db', () => ({
    db: {
        localFiles: {
            toArray: vi.fn()
        }
    }
}));

import { db } from '../../src/db';

describe('Local Image Persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should restore localId from Dexie when parsing wikitext', async () => {
        // Prepare mock data
        (db.localFiles.toArray as any).mockResolvedValue([
            { id: 123, name: 'LocalImage.jpg' },
            { id: 456, name: 'OtherImage.png' }
        ]);

        const wikitext = `
==Video==
{{Image|LocalImage.jpg|A local image}}
{{Video|}}
<gallery>
OtherImage.png|Another local
RemoteImage.jpg|A remote image
</gallery>
`;

        const data = await parseWikitext(wikitext);

        // Verify galleries
        expect(data.galleries['video']).toBeDefined();
        expect(data.galleries['video']).toHaveLength(3);

        const localImg = data.galleries['video'].find(img => img.name === 'LocalImage.jpg');
        const otherImg = data.galleries['video'].find(img => img.name === 'OtherImage.png');
        const remoteImg = data.galleries['video'].find(img => img.name === 'RemoteImage.jpg');

        expect(localImg?.localId).toBe(123);
        expect(otherImg?.localId).toBe(456);
        expect(remoteImg?.localId).toBeUndefined();
    });

    it('should ignore localId if no matching file exists in Dexie', async () => {
        (db.localFiles.toArray as any).mockResolvedValue([]);

        const wikitext = `
==Video==
{{Image|SomeImage.jpg}}
`;

        const data = await parseWikitext(wikitext);
        expect(data.galleries['video'][0].localId).toBeUndefined();
    });
});
