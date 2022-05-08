import { PAGES } from '../references/pages';
import { Navigation } from './navigation';

export const Container = (props: { children: React.ReactNode }) => {
    return (
        <main
            style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'row',
            }}
        >
            <div style={{ padding: '20px' }}>
                <Navigation pages={PAGES} />
            </div>
            <div
                style={{ flexGrow: 1, padding: '20px', maxWidth: '1440px' }}
                className="markdown-body"
            >
                {props.children}
            </div>
        </main>
    );
};
