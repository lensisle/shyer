export interface Tilemap {
  id: string;
  isTilemap: true;
  resId: string; // sprite sheet id
  x: number;
  y: number;
  tileSize: number;
  sheetColumns: number;
  mapRows: number;
  mapCols: number;
  map: number[][]; // -1 for empty, otherwise tile index in sheet
  visible: boolean;
  update: (dt: number) => void;
}

export function createTilemap(
  id: string,
  resId: string,
  x: number,
  y: number,
  tileSize: number,
  sheetColumns: number,
  map: number[][]
): Tilemap {
  const mapRows = map.length;
  const mapCols = mapRows > 0 ? map[0].length : 0;
  function update(_dt: number) {}
  return {
    id,
    isTilemap: true,
    resId,
    x,
    y,
    tileSize,
    sheetColumns,
    mapRows,
    mapCols,
    map,
    visible: true,
    update,
  };
}
