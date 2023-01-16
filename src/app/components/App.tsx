import React, { useEffect, useState } from 'react';
import { FIGMA_MESSAGES } from '../../constants';
import { generateGeometry } from '../generate-geometry';
import { Map } from './Map';
import { Button, SIZE } from 'baseui/button';
import { styled, useStyletron } from 'baseui';
import { ParagraphSmall, LabelSmall } from 'baseui/typography';
import { FlyToInterpolator } from 'react-map-gl';
import { StyledLink } from 'baseui/link';

import { Bounds } from '../../types';

const AppContainer = styled('div', {
  display: 'grid',
  gridTemplateColumns: '400px 1fr',
});

const SidebarContainer = styled('div', ({ $theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'column',
  borderLeft: `1px solid ${$theme.colors.borderOpaque}`,
}));

const GroupContainer = styled('div', {
  display: 'flex',
  flexDirection: 'column',
});

const ButtonContainer = styled('div', ({ $theme }) => ({
  padding: '12px',
  borderTop: `1px solid ${$theme.colors.borderOpaque}`,
}));

const ListItem = ({ label, value }) => {
  const [, theme] = useStyletron();

  const ListContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
  });

  return (
    <ListContainer>
      <ParagraphSmall color={theme.colors.contentTertiary} margin="0">
        {label}
      </ParagraphSmall>
      {value && <LabelSmall margin="0">{value}</LabelSmall>}
    </ListContainer>
  );
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const App = () => {
  const [, theme] = useStyletron();
  const [viewport, setViewport] = useState({
    latitude: 47.60587238399512,
    longitude: -122.33998833535247,
    zoom: 13,
  });
  const [bounds, _setBounds] = useState<Bounds>({
    minLat: 0,
    maxLat: 0,
    minLng: 0,
    maxLng: 0,
  });
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    const { data, tiles } = await generateGeometry({ ...bounds, zoom: Math.round(viewport.zoom) });
    setLoading(true);
    parent.postMessage({ pluginMessage: { type: FIGMA_MESSAGES.create, payload: { data, tiles } } }, '*');
  };

  function setBounds(_bounds) {
    _setBounds({
      minLat: _bounds._sw.lat,
      maxLat: _bounds._ne.lat,
      minLng: _bounds._sw.lng,
      maxLng: _bounds._ne.lng,
    });
  }

  //Reset map viewport to ensure it stays at a whole level zoom
  const debouncedZoom = useDebounce(viewport.zoom, 300);
  useEffect(() => {
    setViewport((_viewport) => ({
      latitude: _viewport.latitude,
      longitude: _viewport.longitude,
      zoom: Math.round(_viewport.zoom),
      transitionDuration: 200,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }, [debouncedZoom]);

  useEffect(() => {
    window.onmessage = (event) => {
      const { type } = event.data.pluginMessage;
      if (type === FIGMA_MESSAGES.finish) {
        setLoading(false);
      }
    };
  }, []);

  return (
    <AppContainer>
      <Map viewport={viewport} setViewport={setViewport} setBounds={setBounds} />
      <SidebarContainer>
        <GroupContainer>
          <ListItem label="Zoom" value={Math.round(viewport.zoom)} />
          <ListItem label="Latitude" value={viewport.latitude.toFixed(5)} />
          <ListItem label="Longitude" value={viewport.longitude.toFixed(5)} />
        </GroupContainer>
        <GroupContainer>
          <ParagraphSmall margin="12px" color={theme.colors.contentTertiary}>
            Zoom level must be a whole number. Map data via{' '}
            <StyledLink href="https://www.nextzen.org/" target="_blank">
              NextZen
            </StyledLink>
            .
          </ParagraphSmall>
          <ButtonContainer>
            <Button
              overrides={{
                BaseButton: {
                  style: {
                    width: '100%',
                  },
                },
              }}
              size={SIZE.compact}
              onClick={onCreate}
              isLoading={loading}
            >
              Insert Vector Map
            </Button>
          </ButtonContainer>
        </GroupContainer>
      </SidebarContainer>
    </AppContainer>
  );
};

export default App;
