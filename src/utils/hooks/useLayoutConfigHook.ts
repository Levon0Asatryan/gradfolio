import { useWindowSize } from "rooks";

export const navbarCollapsedDefaultSize = 48;

export const useLayoutConfigHook = (
  collapsedPreferredWidth = navbarCollapsedDefaultSize,
  minPreferredWidth = 220,
  maxPreferredWidth = 420,
  wrapperWidthCoefficient?: number,
) => {
  const [collapsedDefaultSize, minDefaultSize, maxDefaultSize] = [5, 10, 30];

  const { innerWidth } = useWindowSize();

  const width =
    wrapperWidthCoefficient && innerWidth
      ? (wrapperWidthCoefficient / 100) * innerWidth
      : innerWidth;

  const collapsedSize = width ? (collapsedPreferredWidth / width) * 100 : collapsedDefaultSize;

  const min = width ? (minPreferredWidth / width) * 100 : minDefaultSize;

  const max = width ? (maxPreferredWidth / width) * 100 : maxDefaultSize;

  return {
    min,
    max,
    collapsedSize,
  };
};
