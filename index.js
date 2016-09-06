/**
 * fis3-postprocessor-postcss
 * @author jero
 * @date 2016-09-06
 */

var mapGuide = '\n/*# sourceMappingURL={url} */\n';
var postcss = require('postcss');
var autoprefixer = require('autoprefixer');

var def = {
  plugins: [],
  sourceMap: true
};

module.exports = function(content, file, conf) {
  if (file.isCssLike) {
    var opts = fis.util.merge(def, conf);
    var plugins = opts.plugins;

    if (!plugins.length) {
      var config = typeof opts.autoprefixer === 'object' ? opts.autoprefixer : {};
      plugins.push(autoprefixer(config));
    }

    if (!plugins.length) {
      return content;
    }

    var derived = file.derived;
    var mapObj = null;

    if (!derived || !derived.length) {
      derived = file.extras && file.extras.derived;
    }

    if (derived && derived[0] && derived[0].rExt === '.map') {
      try {
        mapObj = JSON.parse(derived[0].getContent());
      } catch (e) {
        fis.log.info(e);
      }
    }

    var ret = postcss(plugins).process(content, {
      map: opts.sourceMap ? {
        annotation: false,
        prev: mapObj ? mapObj : false
      } : false
    });

    content = ret.css;

    // 没有已存在的 source ，那就要自己创建这个文件了
    if (!mapObj && opts.sourceMap) {
      var mapping = fis.file.wrap(file.dirname + '/' + file.filename + file.rExt + '.map');

      mapping.setContent(ret.map.toString('utf8'));

      file.extras = file.extras || {};
      file.extras.derived = file.extras.derived || [];
      file.extras.derived.push(mapping);

      var url = opts.sourceMapRelative ? ('./' + file.basename + '.map') :
        mapping.getUrl(fis.compile.settings.hash, fis.compile.settings.domain);

      content += mapGuide.replace('{url}', url);
    }
  }

  return content;
};
