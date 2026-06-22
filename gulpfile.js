const { src, dest } = require('gulp');
function buildIcons() {
  return src('nodes/**/*.{png,svg}').pipe(dest('dist/nodes')).on('end', () => {});
}
exports['build:icons'] = buildIcons;
