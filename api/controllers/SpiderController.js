var util = require('util'),
    request = require('request'),
    charset = require('charset'),
    Iconv = require('iconv').Iconv,
    cheerio = require('cheerio');


var log = {
  depth: 2,
  dump: function(){
    var a, args = [].slice.call(arguments); 

    for (u = 0; u < args.length; u++){
      a = args[u];
      if (0 > ['number', 'string'].indexOf(typeof a)){
        args[u] = util.inspect(a, false, log.depth, true);
      }
    }

    console.log.apply(console, args);
  }
};

var appURL = '/surfy/';

module.exports = {

  index: function (req, res) {

    function getHost(location){
      return location.split('\/').shift();
    }

    function getPath(location){
      var pts = location.split('\/');
      pts.shift();
      return pts.join('\/');
    }

    function baseHost(location){
      var host = getHost(location);
      if (!host) return;

      var m = String(host).match(/\b[a-z0-9-]+\.[a-z0-9-]+$/);
      if (m && m.length) return m[0];
    }
    var defaultUrl = 'm.lenta.ru';
    var url = req.url.replace(/^\/surfy\/?/,'')  || defaultUrl;
    console.log(' === baseHost('+url+'): ', baseHost(url))
    var currentHost = getHost(url) || defaultUrl;
    var currentPath = getPath(url);

    console.log(' * req.url', req.url, ' * url:', url, 
      ' * currentHost: ', currentHost, ' * currentPath:', currentPath);

    function iconv(body, fromEnc, toEnc) {
      fromEnc = fromEnc || 'cp1251';
      toEnc = toEnc || 'utf-8';
      var tran = new Iconv(fromEnc,toEnc)

      return tran.convert(body);
    }

    function cleanup(sBody) {
      var rBody = sBody.replace(/[\s\t\r\n]+/mg,' ')
        .replace(/>(\s+)</g,'><')
        .replace(/((?:charset|encoding)\s?=\s?['"]? *)([\w\-]+)/i,'$1utf-8')        
        .replace(/<!--.*?-->/g,'')
        .replace(/<(link|xmeta)[^>]*?>/g,'')
        .replace(/<(script|noscript|style|iframe)[^>]*?>.*?<\/\1>/g,'')
        .replace(/(style|class|color|bgcolor)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g, '')
        .replace(/\s+>/g,'>')
        .replace(/(<img[^]*?src\s?=\s?["']?)((?:https?:)?\/\/|)(\S+)(["']?(?:[^>]*?|)>)/g, 
          function(match,head,protocol,location,tail){
            if (!location) return '';

            if (protocol){
              return (location && baseHost(currentHost) == baseHost(location))? match : ''
            }


            var ret = head + '//' + currentHost + 
              ('/'===location.charAt(0) ? location : '/' + currentPath + '/' + location) + tail;

            console.log(' = ','M:'+match, 'P:'+protocol, 'L:'+location, ' * ret: ', ret);
            return ret;

          })
        .replace(/(<a[^]*?href\s?=\s?["']+)((?:https?:)?\/\/|)(\S+)(["']+(?:[^>]*?|)>)/g, 
          function(match,head,protocol,location,tail){
            var ret = head + appURL + 
              (protocol
                ? getHost(location) +  '\/' + getPath(location)
                : currentHost + location) + tail;
            // console.log(' = ','M:'+match, 'P:'+protocol, 'L:'+location, ' * ret: ', ret);
            return ret;
          })


        return rBody;
    }


    console.log(' * GET:', 'http://' + url);

    request({
        uri: 'http://' + url,
        encoding: null
      }, function(error, response, body) {
        // log.dump('response.headers: ', response.headers);
        var resEnc = charset(response.headers, body);
        // console.log(' charset: ', resEnc);
        if ('utf8' !== resEnc) {
          body = iconv(body, resEnc, 'utf-8');
        }
        var sBody = body.toString();
        if (!body || !sBody) {
          console.log('body is Empty:', body, '; typeof: ', typeof body);
          res.end('failed.')
        }

        var rBody = cleanup(sBody);
        // console.log('\n ======================= \n'+rBody+'\n ======================= \n');

        res.end(rBody);

    });



  }
  
};
