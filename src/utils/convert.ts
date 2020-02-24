export function financial(x: number, fractionDigits = 2) {
  return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
}

export const convertTrafficData = (data: number) => {
  if (data < 1024) return `${financial(data)} B`;
  if (data < 1024 * 1024) return `${financial(data / 1024)} KB`;
  else return `${financial(data / 1024 / 1024)} MB`;
};
