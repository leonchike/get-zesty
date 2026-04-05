export const useIsProduction = () => {
  return __DEV__ ? false : true;
};
