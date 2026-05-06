import { PROPERTY_KEYS_DOCKVIEW } from '../../dockview/options';

describe('PROPERTY_KEYS_DOCKVIEW', () => {
    test('includes nonce so framework wrappers (React, Vue) auto-forward it', () => {
        expect(PROPERTY_KEYS_DOCKVIEW).toContain('nonce');
    });
});
