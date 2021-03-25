function runFootnote() {
    const DOCKVIEW_SUPPRESS_WATERMARK = 'DOCKVIEW_WATERMARK_SUPPRESSED';

    const isSuppressed = !!(window as any)[DOCKVIEW_SUPPRESS_WATERMARK];

    if (!isSuppressed) {
        console.log(
            [
                'dockview: https://github.com/mathuo/dockview for examples and documentation',
                'dockview: https://www.npmjs.com/package/dockview',
                `dockview: To suppress this message set window.${DOCKVIEW_SUPPRESS_WATERMARK}=1 before importing the dockview package`,
                '',
            ].join('\n')
        );
    }
}

runFootnote();
