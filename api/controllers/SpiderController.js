var util = require('util'),
    request = require('request'),
    charset = require('charset'),
    url = require('url'),
    cheerio = require('cheerio'),
    Iconv = require('iconv').Iconv;
    // entities = require('entities');


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



function iconv(body, fromEnc, toEnc) {
  fromEnc = fromEnc || 'cp1251';
  toEnc = toEnc || 'utf-8';
  var tran = new Iconv(fromEnc,toEnc)

  return tran.convert(body);
}

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



function $A(args){ 
  return Array.prototype.slice.call(args); 
} 


function getDOM(html){
  return cheerio.load(html, {
      normalizeWhitespace: false,
      xmlMode: false,
      decodeEntities: false 
  });
}

function transform(html) {
  var $ = getDOM(html);
  var styles = $('style').remove()
  var scripts = $('script').remove()
  return $.html();
}  

function stylize(html) {  

  var $ = getDOM(html);

  // $('ul li a').parents('ul').addClass('egmenu');
  $('head').append('<meta charset="utf-8">');
  $('head').append('<link href="/assets/styles/surfy.css" rel="stylesheet" type="text/css">');
  return $.html();
}


module.exports = {

  index: function (req, res) {

    var appURL = '/surfy/';

    var defaultUrl = 'm.lenta.ru';
    var url = req.url.replace(/^\/surfy\/?/,'')  || defaultUrl;
    console.log(' === baseHost('+url+'): ', baseHost(url))
    var currentHost = getHost(url) || defaultUrl;
    var currentPath = getPath(url);

    // console.log(' location: ',  location);

    console.log(' * req.url', req.url, ' * url:', url, 
      ' * currentHost: ', currentHost, ' * currentPath:', currentPath);

    function cleanup(sBody) {
      console.time('surfy:cleanup()');
      var rBody = sBody.replace(/\r?\n|\r\n?/mg, ' ')
        .replace(/\s|\t/g,' ')
        .replace(/>\s+</g,'><')
        .replace(/((?:charset|encoding)\s?=\s?['"]? *)([\w\-]+)/i,'$1utf-8')
        .replace(/<!--.*?-->/g,'')
        .replace(/<(script|style|noscript|iframe|object|embed|param|input|button|option|select|textarea|form|fieldset)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>.*?<\/\1[^>]*>/mgi,'')
        // .replace(/<(script|style|noscript|iframe|object|embed|param|input|button|option|select|textarea|form|fieldset)[^>]*?>.*?<\/\1>/gi,'')
        .replace(/<(meta|link|input|button|option)[^>]*?>/gi,'')        

        // custom attributes
        .replace(/((?:x|data|ng)-[\w-]+)\s?=\s?(["']+)([^\2]*?)(\2)/gi, '')
            // function(m0, m1, m2, m3, m4, m5){
            //   var ret;
            //   if (['src','href','alt','title','charset','name','content','value','id'].indexOf(m1) == -1)
            //     ret = ''
            //   else 
            //     ret = m0;

            //   // console.log(' =m= ', m0, ' => ', ret, '\n - ', m4, m5);
            //   return ret;
            // })

        .replace(/(style|class|color|bgcolor|background)\s?=\s?(["']+)([^\2]*?)(\2)/gi, '')
        .replace(/(style|class|color|bgcolor|background)\s?=\s?["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/gi, '')

        // whitespace collapsing
        .replace(/\s+>/g,'>')
        .replace(/(<img[^]*?src\s?=\s?["']?)((?:https?:)?\/\/|)(\S+)(["']?(?:[^>]*?|)>)/g, 
          function(match,head,protocol,location,tail){
            if (!location) return '';
            if (protocol){
              return (location && baseHost(currentHost) == baseHost(location))? match : ''
            }
            var ret = head + '//' + currentHost + 
              ('/'===location.charAt(0) ? location : '/' + currentPath + '/' + location) + tail;
            // console.log(' = ','M:'+match, 'P:'+protocol, 'L:'+location, ' * ret: ', ret);
            return ret;
          })

        // allow only IMG inside A
        // .replace(/<(a)([^>]*?)>(.*?)<\/\1>/g, function() {
        //     var a = $A(arguments)
        //       , b = a[3] && a[3].replace(/<(?!span|img|p)[^>]*?>/g,'') || ''
        //       , ret = '<' + a[1] + a[2] + '>' + b + '</' + a[1] + '>';
        //     // if (ret!==a[0]){console.log(' \r =========== \n = A:', a[0], ' * ret: ', ret);}
        //     return ret;
        // })

        .replace(/(<a[^]*?href\s?=\s?["']+)((?:https?:)?\/\/|)(\S+)(["']+(?:[^>]*?|)>)/g, 
          function(match,head,protocol,location,tail){
            var ret = head + appURL + 
              (protocol
                ? getHost(location) +  '\/' + getPath(location)
                : currentHost + location) + tail;
            // console.log(' = ','M:'+match, 'P:'+protocol, 'L:'+location, ' * ret: ', ret);
            return ret;
          })

      console.timeEnd('surfy:cleanup()');

      return rBody;
    }


    console.log(' * GET:', 'http://' + url);

    request({
        uri: 'http://' + url,
        encoding: null
      }, function(error, response, body) {
        // log.dump('response.headers: ', response.headers);
        if (error) {
          log.dump('request error:', error);
          return;
        }
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

        var tBody = transform(sBody)
        var rBody = cleanup(tBody);
        // console.log('\n ======================= \n'+rBody+'\n ======================= \n');
        rBody = stylize(rBody);
        res.end(rBody);

    });



  }  
};
