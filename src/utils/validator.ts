export const isPort = (port: string) =>
  isInt(Number(port), { max: 65535, min: 0 });
export const isURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};
export const isEmpty = (value: string) => value.length !== 0;

//https://github.com/validatorjs/validator.js/blob/f92c08b6692f011eaaafa613493d2190d30a40b3/src/lib/isInt.js#L6
function isInt(num: number, options: { min: number; max: number }) {
  options = options || {};

  // Get the regex to use for testing, based on whether
  // leading zeroes are allowed or not.
  let regex = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;

  // Check min/max/lt/gt
  let minCheckPassed = num >= options.min;
  let maxCheckPassed = num <= options.max;

  return regex.test(num.toString()) && minCheckPassed && maxCheckPassed;
}
