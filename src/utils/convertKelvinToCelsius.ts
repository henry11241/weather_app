export function convertKelvinToCelsius(tempInKelven: number): number {
  const tempInCelsius = tempInKelven - 273.15
  return Math.floor(tempInCelsius)
}