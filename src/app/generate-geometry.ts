// import * as d3 from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import { TILE_WIDTH, NEXTZEN_KEY, GROUP_CATEGORIES } from '../constants';

import {
  CoordinatePair,
  GenerateInput,
  LayerGroup,
  CategoryGroup,
  MapDataGroup,
  TileSpec,
  TransformedFeature,
  TransformedMapDataGroup,
  TileData,
} from '../types';

function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

function tile2Lon(tileLon: number, zoom: number): number {
  return +((tileLon * 360) / Math.pow(2, zoom) - 180).toFixed(10);
}

function tile2Lat(tileLat: number, zoom: number): number {
  return +(
    (360 / Math.PI) * Math.atan(Math.pow(Math.E, Math.PI - (2 * Math.PI * tileLat) / Math.pow(2, zoom))) -
    90
  ).toFixed(10);
}

function getUrl({ zoom, x, y, key }: { zoom: number; x: number; y: number; key: string }): string {
  return 'https://tile.nextzen.org/tilezen/vector/v1/all/' + zoom + '/' + x + '/' + y + '.json?api_key=' + key;
}

function getTileSpec({ minLat, maxLat, minLng, maxLng, zoom }: GenerateInput): TileSpec {
  const startTile: CoordinatePair | any = {};
  const endTile: CoordinatePair | any = {};

  const lat1 = lat2tile(minLat, zoom);
  const lat2 = lat2tile(maxLat, zoom);

  const lon1 = lon2tile(minLng, zoom);
  const lon2 = lon2tile(maxLng, zoom);

  if (lat1 > lat2) {
    startTile.latitude = lat2;
    endTile.latitude = lat1;
  } else {
    startTile.latitude = lat1;
    endTile.latitude = lat2;
  }

  if (lon1 > lon2) {
    startTile.longitude = lon2;
    endTile.longitude = lon1;
  } else {
    startTile.longitude = lon1;
    endTile.longitude = lon2;
  }
  const startCoordinates: CoordinatePair = {
    latitude: tile2Lat(startTile.latitude, zoom),
    longitude: tile2Lon(startTile.longitude, zoom),
  };
  const endCoordinates: CoordinatePair = {
    latitude: tile2Lat(endTile.latitude, zoom),
    longitude: tile2Lat(endTile.longitude, zoom),
  };
  return {
    startCoordinates,
    endCoordinates,
    startTile,
    endTile,
    zoom,
  };
}

function getTileNumbers(startTile: CoordinatePair, endTile: CoordinatePair): CoordinatePair[][] {
  const tilesToFetch: CoordinatePair[][] = [];
  for (let j = startTile.latitude; j <= endTile.latitude; j++) {
    const coords: CoordinatePair[] = [];
    for (let i = startTile.longitude; i <= endTile.longitude; i++) {
      coords.push({
        latitude: j,
        longitude: i,
      });
    }
    tilesToFetch.push(coords);
  }
  return tilesToFetch;
}

async function requestMultipleUrls(urls: RequestInfo[]) {
  const promises = urls.map((url) => fetch(url).then((res) => res.json()));
  return await Promise.all(promises);
}

function mergeTileData(tileData: MapDataGroup[]): MapDataGroup {
  const output: MapDataGroup = [];
  const layers: string[] = [...new Set(tileData.map((x) => Object.keys(x)).flat())];
  layers.forEach((layer: String) => {
    output.push({ name: layer, features: [] } as unknown as CategoryGroup);
  });
  tileData.forEach((tile) => {
    Object.keys(tile).forEach((layerKey) => {
      const layers = tile[layerKey];
      let match = output.find((x) => x.name === layerKey);
      if (match) {
        layers.features.forEach((feature) => {
          const kind = feature?.properties?.kind || 'other';
          //@ts-ignore
          match.features.push({ name: kind, features: feature } as LayerGroup);
        });
      }
    });
  });

  output.forEach((group) => {
    const nicelyGrouped = group.features.reduce((input, product) => {
      const { name } = product;
      input[name] = input[name] ?? [];
      input[name].push(product);
      return input;
    }, {});

    group.features = Object.keys(nicelyGrouped).map(
      (key) =>
        ({
          name: key,
          features: nicelyGrouped[key].map((x) => x.features),
        } as LayerGroup)
    );
  });
  return output;
}

function transformCoordinates(data, path): TransformedMapDataGroup {
  data.forEach((categoryArray) => {
    categoryArray.features.forEach((featureArray) => {
      featureArray.features = featureArray.features.map((x) => {
        return { geometry: path(x), name: x.properties?.name ? x.properties.name : null } as TransformedFeature;
      });
    });
  });
  return data;
}

export async function generateGeometry(
  config: GenerateInput
): Promise<{ data: TransformedMapDataGroup; tiles: TileData[] }> {
  const tileSpec: TileSpec = getTileSpec(config);
  const tilesToFetch = getTileNumbers(tileSpec.startTile, tileSpec.endTile);
  const tiles: TileData[] = [];
  let tileUrlsToFetch: string[] = [];
  for (let i = tilesToFetch.length - 1; i >= 0; i--) {
    for (let j = tilesToFetch[0].length - 1; j >= 0; j--) {
      tileUrlsToFetch.push(
        getUrl({
          x: tilesToFetch[i][j].longitude,
          y: tilesToFetch[i][j].latitude,
          zoom: tileSpec.zoom,
          key: NEXTZEN_KEY,
        })
      );
      tiles.push({
        x: tilesToFetch[i][j].longitude,
        y: tilesToFetch[i][j].latitude,
        z: tileSpec.zoom,
      });
    }
  }

  const tileData = await requestMultipleUrls(tileUrlsToFetch);

  const mergedTileData = mergeTileData(tileData).filter((x) => x.name !== 'pois' && x.name !== 'transit');

  const projection = geoMercator()
    .center([tileSpec.startCoordinates.longitude, tileSpec.startCoordinates.latitude])
    .scale(((600000 * TILE_WIDTH) / 57.5) * Math.pow(2, tileSpec.zoom - 16))
    .precision(0.0)
    .translate([0, 0]);

  const path = geoPath(projection);

  const sortOrder = [
    GROUP_CATEGORIES.buildings,
    GROUP_CATEGORIES.roads,
    GROUP_CATEGORIES.landuse,
    GROUP_CATEGORIES.earth,
    GROUP_CATEGORIES.water,
  ];
  const transformedData = transformCoordinates(mergedTileData, path).sort((a, b) => {
    return sortOrder.indexOf(b.name) - sortOrder.indexOf(a.name);
  });

  return { data: transformedData, tiles };
}
