import { Feature } from 'geojson';
export type CoordinatePair = {
  latitude: number;
  longitude: number;
};

export type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type GenerateInput = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoom: number;
};

export type MapDataGroup = CategoryGroup[];

export type CategoryGroup = {
  name: string;
  features: LayerGroup[];
};

export type LayerGroup = {
  name: string;
  features: Feature[];
};

export type TransformedMapDataGroup = TransformedCategoryGroup[];

export type TransformedCategoryGroup = {
  name: string;
  features: TransformedLayerGroup[];
};

export type TransformedLayerGroup = {
  name: string;
  features: TransformedFeature[];
};

export type TransformedFeature = {
  name: string | null;
  geometry: string;
};

export type TileSpec = {
  startCoordinates: CoordinatePair;
  endCoordinates: CoordinatePair;
  startTile: CoordinatePair;
  endTile: CoordinatePair;
  zoom: number;
};

export type TileData = {
  x: number;
  y: number;
  z: number;
};
