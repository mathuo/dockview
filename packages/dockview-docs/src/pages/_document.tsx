import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="true"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                {/* <link
                    rel="stylesheet"
                    href="https://unpkg.com/dracula-prism/dist/css/dracula-prism.css"
                /> */}
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
