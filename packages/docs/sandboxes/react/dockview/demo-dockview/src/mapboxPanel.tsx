import { IDockviewPanelProps } from 'dockview-react';
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
                mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN ?? ''}
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
