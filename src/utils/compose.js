const compose = (...fns) => args => {
  return fns.reduceRight((val, fn) => {
    return fn(val);
  }, args);
};

export default compose; 