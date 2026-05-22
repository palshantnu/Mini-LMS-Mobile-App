// No-op babel plugin stub.
// react-native-css-interop@0.2.x includes "react-native-worklets/plugin" which
// is only needed for reanimated 4+. This stub prevents the "Cannot find module"
// error when running on reanimated 3.x.
module.exports = function () {
  return { visitor: {} };
};
