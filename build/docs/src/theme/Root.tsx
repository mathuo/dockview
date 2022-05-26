import React from 'react';
import { RecoilRoot } from 'recoil';

// Default implementation, that you can customize
export default function Root({ children }) {
    return <RecoilRoot>{children}</RecoilRoot>;
}
