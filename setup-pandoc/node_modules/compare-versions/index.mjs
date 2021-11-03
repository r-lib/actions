export default function compareVersions(v1, v2) {
  // validate input and split into segments
  const n1 = validateAndParseVersion(v1);
  const n2 = validateAndParseVersion(v2);

  // pop off the patch
  const p1 = n1.pop();
  const p2 = n2.pop();

  // validate numbers
  const r = compareSegments(n1, n2);
  if (r !== 0) return r;

  // validate pre-release
  if (p1 && p2) {
    return compareSegments(p1.split('.'), p2.split('.'));
  } else if (p1 || p2) {
    return p1 ? -1 : 1;
  }

  return 0;
}

export const validate = (version) =>
  typeof version === 'string' && semver.test(version);

export const compare = (v1, v2, operator) => {
  // validate input operator
  assertValidOperator(operator);

  // since result of compareVersions can only be -1 or 0 or 1
  // a simple map can be used to replace switch
  const res = compareVersions(v1, v2);

  return operatorResMap[operator].includes(res);
};

const semver =
  /^v?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

const validateAndParseVersion = (v) => {
  if (typeof v !== 'string') {
    throw new TypeError('Invalid argument expected string');
  }
  const match = v.match(semver);
  if (!match) {
    throw new Error(`Invalid argument not valid semver ('${v}' received)`);
  }
  match.shift();
  return match;
};

const tryParse = (v) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? v : n;
};

const forceType = (a, b) =>
  typeof a !== typeof b ? [String(a), String(b)] : [a, b];

const compareStrings = (a, b) => {
  const [ap, bp] = forceType(tryParse(a), tryParse(b));
  if (ap > bp) return 1;
  if (ap < bp) return -1;
  return 0;
};

const compareSegments = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const r = compareStrings(a[i] || 0, b[i] || 0);
    if (r !== 0) return r;
  }
  return 0;
};

const operatorResMap = {
  '>': [1],
  '>=': [0, 1],
  '=': [0],
  '<=': [-1, 0],
  '<': [-1],
};

const allowedOperators = Object.keys(operatorResMap);

const assertValidOperator = (op) => {
  if (typeof op !== 'string') {
    throw new TypeError(
      `Invalid operator type, expected string but got ${typeof op}`
    );
  }
  if (allowedOperators.indexOf(op) === -1) {
    throw new Error(
      `Invalid operator, expected one of ${allowedOperators.join('|')}`
    );
  }
};
