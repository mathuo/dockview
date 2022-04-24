import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Container } from '../components/container';
import { AppProps } from 'next/app';
import '../styles/globals.css';
import { CodeBlock } from '../components/code';
import { MDXProvider } from '@mdx-js/react';

const components = {
    code: CodeBlock,
} as any;

const MyApp = (props: AppProps) => {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <MDXProvider components={components}>
                <Header />
                <Container>
                    <props.Component {...props.pageProps} />
                </Container>
                <Footer />
            </MDXProvider>
        </div>
    );
};

export default MyApp;
