// https://kar.kent.ac.uk/32810/2/2012_Bi-symmetric-log-transformation_v5.pdf
// y = sgn(x) * log10(1 + |( x/C)|)
// x = sgn(y) * C * (−1 + 10^|y|)

const C = 1 / Math.log(10);

export default {
  log10(x: number): number {
    return Math.sign(x) * Math.log10(1 + Math.abs(x / C));
  },

  exp10(x: number): number {
    return Math.sign(x) * C * (-1 + 10 ** Math.abs(x));
  },

  ln(x: number): number {
    return Math.sign(x) * Math.log(1 + Math.abs(x / C));
  },

  exp(x: number): number {
    return Math.sign(x) * C * (-1 + Math.exp(Math.abs(x)));
  },
}
