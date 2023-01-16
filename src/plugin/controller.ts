import { FIGMA_MESSAGES, GROUP_CATEGORIES } from '../constants';

import { TransformedCategoryGroup, TransformedFeature } from '../types';

figma.showUI(__html__, {
  width: 630,
  height: 400,
});
figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

function extractPointCoordinates(path: string) {
  return path
    .split('m')[0]
    .substring(1)
    .split(',')
    .map((x) => +x);
}

function extractFigmaPath(path: string) {
  return (
    path
      //@ts-ignore
      .replaceAll('M', ' M ')
      .replaceAll('L', ' L ')
      .replaceAll('Q', ' Q ')
      .replaceAll('C', ' C ')
      .replaceAll('Z', ' Z ')
      .replaceAll(', ', ' ')
      .replaceAll(',', ' ')
      .trim()
  );
}

figma.ui.onmessage = (msg) => {
  if (msg.type === FIGMA_MESSAGES.create) {
    const {
      payload: { data, tiles },
    } = msg;

    const container = figma.createFrame();
    container.name = `Vector Map Data; Tiles: ${tiles.map(({ x, y, z }) => `[${x}, ${y}, ${z}]`).join(', ')}`;
    container.resize(200, 200);
    container.x = figma.viewport.center.x;
    container.y = figma.viewport.center.y;

    data.forEach((category: TransformedCategoryGroup) => {
      const categoryNodes: GroupNode[] = [];
      category.features.forEach((kind) => {
        const kindNodes: any[] = [];
        kind.features.forEach((feature: TransformedFeature) => {
          if (category.name === GROUP_CATEGORIES.places) {
            if (feature?.name) {
              const node = figma.createText();
              container.appendChild(node);
              kindNodes.push(node);
              node.characters = feature.name;
              node.fontSize = 8;
              node.name = feature?.name ? feature.name : 'Unknown';

              const [x, y] = extractPointCoordinates(feature.geometry);
              node.x = x - node.width / 2;
              node.y = y - node.height / 2;

              node.fills = [{ type: 'SOLID', color: { r: 245 / 255, g: 248 / 255, b: 116 / 255 } }];
              node.strokeWeight = 1;
              node.strokes = [
                {
                  blendMode: 'NORMAL',
                  color: { r: 0, g: 0, b: 0 },
                  opacity: 1,
                  type: 'SOLID',
                  visible: true,
                },
              ];
            }
          } else {
            const node = figma.createVector();
            container.appendChild(node);
            kindNodes.push(node);
            node.name = feature?.name ? feature.name : 'Unknown';
            const figmaPath = extractFigmaPath(feature.geometry);
            try {
              node.vectorPaths = [
                {
                  windingRule: 'NONE',
                  data: figmaPath,
                },
              ];
            } catch (e) {
              // if (kind.kind === 'building') {
              //   console.log('error with ', kind.kind);
              // }
            }

            if (category.name === GROUP_CATEGORIES.buildings) {
              node.strokes = [
                {
                  blendMode: 'NORMAL',
                  color: { r: 236 / 255, g: 0, b: 156 / 255 },
                  opacity: 1,
                  type: 'SOLID',
                  visible: true,
                },
              ];
            } else if (category.name === GROUP_CATEGORIES.landuse) {
              node.strokes = [
                {
                  blendMode: 'NORMAL',
                  color: { r: 0, g: 234 / 255, b: 51 / 255 },
                  opacity: 1,
                  type: 'SOLID',
                  visible: true,
                },
              ];
            } else if (category.name === GROUP_CATEGORIES.earth) {
              node.strokes = [
                {
                  blendMode: 'NORMAL',
                  color: { r: 102 / 255, g: 55 / 255, b: 236 / 255 },
                  opacity: 1,
                  type: 'SOLID',
                  visible: true,
                },
              ];
            }
          }
        });

        const kindGroup: GroupNode = figma.group(kindNodes, container);
        kindGroup.name = kind.name;
        categoryNodes.push(kindGroup);
      });

      if (categoryNodes.length > 0) {
        const categoryGroup = figma.group(categoryNodes, container);
        categoryGroup.name = category.name;
      }
    });

    figma.ui.postMessage({
      type: FIGMA_MESSAGES.finish,
    });
  }
};
