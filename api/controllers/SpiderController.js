var util = require('util'),
    request = require('request'),
    charset = require('charset'),
    Iconv = require('iconv').Iconv,
    cheerio = require('cheerio');

/**
 * SpiderController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */


var log = {
  depth: 2,
  dump: function(){
    var a, args = [].slice.call(arguments); 

    for (u = 0; u < args.length; u++){
      a = args[u];
      if (0 > ['number', 'string'].indexOf(typeof a)){
        // util.inspect(object, showHidden=false, depth=2, colorize=true)    
        args[u] = util.inspect(a, false, log.depth, true);
      }
    }

    console.log.apply(console, args);
  }
};

var appURL = '/surfy/';




module.exports = {

  
/**
 * Action blueprints:
 *    `/spider/index`
 *    `/spider`
 */


  cheerio: function(sBody){
      var $ = cheerio.load(sBody);
     
      $("a").each(function(item, index) {
        var link = $(this);
        var text = link.text();
        var href = link.attr("href");
     
        console.log(text + " -> " + href);
      });

      // var oDom = cheerio.parseHTML(sBody);

  },

  index: function (req, res) {

    function mainHost(url){
      var host = url.split('/').shift();
      var m = String(host).match(/\b[a-z0-9-]+\.[a-z0-9-]+$/);
      if (m && m.length) return m[0];
    }
    var defaultUrl = 'm.lenta.ru'; // 'm.interfax.ru';;
    var url = req.url.replace(/^\/surfy\/?/,'')  || defaultUrl;
    console.log(' === mainHost('+url+'): ', mainHost(url))
    var currentHost = mainHost(url) || defaultUrl;

    console.log(' * req.url', req.url, ' * url:', url, ' * currentHost: ', currentHost);

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
        .replace(/<img[^]*?src\s?=\s?["']?((?:https?:)?\/\/|)(\S+)["']?[^>]*?>/g, 
          function(match, p1, url){
            if (!url) return '';
            var ret = (url && mainHost(currentHost) == mainHost(url))? match : ''
            return ret;
          })
        .replace(/(<a[^]*?href\s?=\s?["']+)((?:https?:)?\/\/|)(\S+)(["']+(?:[^>]*?|)>)/g, 
          function(match,head,protocol,location,tail){
            var parts = location.split('/');
            var host = parts.shift();
            var ret = head + 
              appURL + 
              (protocol
                ? host +  '\/' + parts.join('/')
                : currentHost + location
              )
              + tail;
            console.log(' = ','M:'+match, 'P:'+protocol, 'L:'+location, ' * ret: ', ret);
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
        console.log(' charset: ', resEnc);
        if ('utf8' !== resEnc) {
          body = iconv(body, resEnc, 'utf-8');
        }
        var sBody = body.toString();
        if (!body || !sBody) {
          console.log('body is Empty:', body, '; typeof: ', typeof body);
          res.end('failed.')
        }

        var rBody = cleanup(sBody);
        console.log(' =======================');
        console.log(rBody);
        console.log(' =======================');




        res.end(rBody);

    });



  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to SpiderController)
   */
  _config: {}

  
};
