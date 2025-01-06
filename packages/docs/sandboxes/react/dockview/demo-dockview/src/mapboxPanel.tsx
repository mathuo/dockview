import { IDockviewPanelProps } from 'dockview';
import * as React from 'react';
import Map from 'react-map-gl';

export const MapboxPanel = (props: IDockviewPanelProps) => {
    React.useEffect(() => {
        const subscription = props.api.onDidLocationChange((e) => {
            const isPopout = e.location.type === 'popout';
        });

        return () => subscription.dispose();
    }, [props.api]);

    return (
        <div style={{ overflow: 'auto', height: '100%' }}>
            <Map
                mapboxAccessToken="pk.eyJ1IjoibWF0aHVvIiwiYSI6ImNrMXo4bnJ1ajA5OXUzaXA5ODg3Nnc1M3YifQ.Il7zfYd-sZ113W6Fmmagjg"
                initialViewState={{
                    longitude: -122.4,
                    latitude: 37.8,
                    zoom: 14,
                }}
                style={{ width: 600, height: 400 }}
                mapStyle="mapbox://styles/mapbox/streets-v9"
            />
        </div>
    );
};
