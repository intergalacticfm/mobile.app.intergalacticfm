import { describe, it, expect } from 'vitest';

describe('Smoke test', () => {
    it('environment is up', () => {
        // chack that window and document are defined
        expect(typeof window).toBe('object');
        expect(typeof document).toBe('object');
        expect(document.body).not.toBeNull();
    });

    it('basic DOM manipulation works', () => {
        const div = document.createElement('div');
        div.id = 'smokeTestDiv';
        document.body.appendChild(div);
        expect(document.getElementById('smokeTestDiv')).not.toBeNull();
    });
});