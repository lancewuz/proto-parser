export function copyObjectWithKeys(object: any, keys: string[]) {
  if (!object) return undefined;

  const newObject = {};

  Object.keys(object).forEach((key: string) => {
    if (keys.includes(key)) {
      newObject[key] = object[key];
    }
  });

  return newObject;
}

export function copyMapWithkeys(
  map: Record<string, any>,
  objectKeys: string[],
  mapKeys?: string[]
) {
  if (!map) return undefined;

  const newMap = {};

  Object.keys(map).forEach((mapKey: string) => {
    if (!mapKeys || mapKeys.includes(mapKey)) {
      newMap[mapKey] = copyObjectWithKeys(map[mapKey], objectKeys);
    }
  });

  return newMap;
}
