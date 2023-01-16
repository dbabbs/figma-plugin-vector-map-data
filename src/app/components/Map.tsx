import React, { useRef, useEffect } from 'react';
import MapGL from 'react-map-gl';
import { styled } from 'baseui';
import { MAPBOX_TOKEN } from '../../constants';

const Container = styled('div', {
  height: '400px',
  width: '400px',
});

export const Map = ({ viewport, setViewport, setBounds }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) {
      //@ts-ignore
      const mapbox = ref.current.getMap();
      setBounds(mapbox.getBounds());
      // mapbox.showTileBoundaries = true;
    }
  }, [viewport.zoom, viewport.latitude, viewport.longitude, ref.current]);

  return (
    <Container>
      <MapGL
        {...viewport}
        ref={ref}
        width="100%"
        height="100%"
        mapboxApiAccessToken={MAPBOX_TOKEN}
        onViewStateChange={({ viewState }) => setViewport(viewState)}
      />
    </Container>
  );
};
