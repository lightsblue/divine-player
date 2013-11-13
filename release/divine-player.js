var DivinePlayer = (function() {

/******************************************************************************
 * src/players/html5-player.js
 ******************************************************************************/

var HTML5Player = (function() {

  function HTML5Player(el, options, onReady) {
    this.el = el;
    this.el.width = typeof options.width !== 'undefined' ? options.width : options.size;
    this.el.height = typeof options.height !== 'undefined' ? options.height : options.size;
    this.el.muted = el.hasAttribute('muted');
    workarounds(this.el, navigator.userAgent);
    if (onReady) onReady(this);
  }

  HTML5Player.name = HTML5Player.name || 'HTML5Player';

  HTML5Player.canPlay = function(el) {
    try {
      var sources = el.getElementsByTagName('source');
      for (var i=0, l = sources.length; i<l; i++) {
        var type = sources[i].getAttribute('type');
        var canPlayType = el.canPlayType(type);
        if (canPlayType) return true;
      }
    } catch(e) {/* IGNORE */}
    return false;
  };

  HTML5Player.fn = HTML5Player.prototype;

  HTML5Player.fn.play = function() {
    this.el.play();
  };
  
  HTML5Player.fn.currentTime = function(offset) {
    if (typeof offset !== 'undefined') {
      this.el.currentTime = offset;
    }
    return this.el.currentTime;
  }
  
  HTML5Player.fn.duration = function() {
    return this.el.duration;
  }

  HTML5Player.fn.pause = function() {
    this.el.pause();
  };

  HTML5Player.fn.paused = function() {
    return this.el.paused;
  };

  HTML5Player.fn.mute = function() {
    this.el.muted = true;
  };

  HTML5Player.fn.unmute = function() {
    this.el.muted = false;
  };

  HTML5Player.fn.muted = function() {
    return this.el.muted;
  };

  return HTML5Player;

  function workarounds(el, userAgent) {
    var iPad = /ipad/i.test(userAgent);
    var iPhone = /ipad/i.test(userAgent);
    var android = /android/i.test(userAgent);
    var chrome = /chrome/i.test(userAgent);

    var mobile = iPad || iPhone || android;

    /**
     * https://github.com/cameronhunter/divine-player/issues/1
     */
    if(el.hasAttribute('poster') && chrome && !mobile) {
      var poster = el.getAttribute('poster');
      el.removeAttribute('poster');
    }

    /**
     * https://github.com/cameronhunter/divine-player/issues/2
     */
    if (!el.hasAttribute('controls') && (iPad || android)) {
      el.controls = true;
      el.addEventListener('play', function() {
        el.controls = false;
      }, false);
    }

    /**
     * https://github.com/cameronhunter/divine-player/issues/3
     */
    if (android) {
      el.loop = false;
      el.addEventListener('ended', function() {
        el.play();
      }, false);
    }

    /**
     * Firefox and Opera require explicit play calls for autoplay tests to pass.
     */
    if (el.hasAttribute('autoplay')) {
      el.play();
    }

    var sources = el.getElementsByTagName('source');
    for (var i=0, l = sources.length; i<l; i++) {
      sources[i].addEventListener("error", function(){
        var e = new Event('videoFailed');
        e.target = el;
        el.dispatchEvent(e);
      });
    }
  }
}());


/******************************************************************************
 * src/players/flash-player.js
 ******************************************************************************/

/**
 * Flash Player
 *
 * This player reads the properties from the video element, and replaces it with
 * an embedded SWF which handles the video playback.
 *
 * 1. FIXME: IE10 doesn't support dynamic object embeds. Not much of a big deal
 *           since it supports HTML5 video, but would be good to remove the
 *           workaround.
 *           Link: https://code.google.com/p/swfobject/issues/detail?id=667
 */

var FlashPlayer = (function(global) {

  var DEFAULT_SIZE = 150;

  // TODO: Select the mp4 instead of just the first source
  function FlashPlayer(el, options, onReady) {

    if (typeof options.width === 'undefined') {
      options.width = typeof options.size !== 'undefined' ? options.size : DEFAULT_SIZE;
    }
    if (typeof options.height === 'undefined') {
      options.height = typeof options.size !== 'undefined' ? options.size : DEFAULT_SIZE;
    }

    var namespace = 'divinePlayer';
    var unique = (new Date).getTime();
    var callback = [namespace, 'onReady', unique].join('_');
    var onError = [namespace, 'onError', unique].join('_');
    var onDuration = [namespace, 'onDuration', unique].join('_');
    var latestDuration = NaN;

    var self = this;
    if (callback) {
      global[callback] = function() { onReady(self); };
    }

    global[onError] = function(code, description) {
      var e = new Event('videoFailed');
      e.target = el;
      el.dispatchEvent(e);
      throw {'name': 'ActionScript ' + code, 'message': description};
    };

    global[onDuration] = function(seconds) {
      var e = new Event('durationchange');
      e.target = el;
      latestDuration = seconds;
      el.dispatchEvent(e);
    };

    var swf = override(el.getAttribute('data-fallback-player'), options.swf);

    if (!swf) throw 'SWF url must be specified.';

    this.swf = embed(swf, el, {
      width: options.width,
      height: options.height,
      autoplay: hasAttribute(el, 'autoplay'),
      muted: hasAttribute(el, 'muted'),
      loop: hasAttribute(el, 'loop'),
      poster: hasAttribute(el, 'poster') ? absolute(el.getAttribute('poster')) : undefined,
      video: getVideoUrl(el),
      onReady: callback,
      onError: onError,
      onDuration: onDuration
    });

    this.duration = function() {
      return latestDuration;
    }
  }

  FlashPlayer.name = FlashPlayer.name || 'FlashPlayer';

  FlashPlayer.canPlay = function() {
    try {
      // Issue #1
      if (/MSIE 10/i.test(navigator.userAgent)) return false;

      var flash = window.ActiveXObject ?
                    new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version') :
                    navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin.description;
      var match = /(\d+)[,.]\d+/.exec(flash);
      var majorVersion = parseInt(match[1], 10);
      return majorVersion >= 9;
    } catch (e) {/* Ignore */}
    return false;
  };

  FlashPlayer.fn = FlashPlayer.prototype;

  FlashPlayer.fn.play = function() {
    this.swf.divinePlay();
  };

  FlashPlayer.fn.currentTime = function(offset) {
    if (typeof offset !== 'undefined') {
      this.swf.divineCurrentTime(offset);
    } else {
      return this.swf.divineGetCurrentTime();
    }
  };

  FlashPlayer.fn.pause = function() {
    this.swf.divinePause();
  };

  FlashPlayer.fn.paused = function() {
    return this.swf.divinePaused();
  };

  FlashPlayer.fn.mute = function() {
    this.swf.divineMute();
  };

  FlashPlayer.fn.unmute = function() {
    this.swf.divineUnmute();
  };

  FlashPlayer.fn.muted = function() {
    return this.swf.divineMuted();
  };

  return FlashPlayer;

  function absolute(url) {
    return (url || '').indexOf('//') === 0 ? document.location.protocol + url : url;
  }

  function getVideoUrl(el) {
    var sources = el.getElementsByTagName('source');
    return sources.length ? absolute(sources[0].src) : undefined;
  }

  function attrs(options) {
    return transform(options, function(k, v) {
      return k + '="' + v + '"';
    }, ' ');
  }

  function params(options) {
    return transform(options, function(k, v) {
      return '<param ' + attrs({name: k, value: v}) + ' />';
    }, '\n');
  }

  function flashvars(options) {
    return transform(options, function(k, v) {
      return k + '=' + encodeURIComponent(v);
    }, '&');
  }

  function transform(options, fn, joinWith) {
    var ret = [];
    for (var key in options) if (options.hasOwnProperty(key)) {
      ret.push(fn(key, options[key]));
    }
    return ret.join(joinWith);
  }

 function embed(swf, el, options) {
    var attributes = attrs({
      id: el.id,
      data: swf,
      width: options.width,
      height: options.height,
      type: 'application/x-shockwave-flash'
    });

    var parameters = params({
      movie: swf,
      allowScriptAccess: 'always',
      allowNetworking: 'all',
      wmode: 'opaque',
      quality: 'high',
      bgcolor: '#000000',
      flashvars: flashvars(options)
    });

    el.outerHTML = '<object ' + attributes + '>' + parameters + '</object>';

    return document.getElementById(el.id);
  }

  // IE7 and below doesn't support hasAttribute
  function hasAttribute(el, attribute) {
    return el.getAttribute(attribute) != null;
  }

  function override(original, custom) {
    return custom == null ? original : custom;
  }
}(this));


/******************************************************************************
 * src/divine-player.js
 ******************************************************************************/

/**
 * Divine Player
 *
 * This component chooses a supported player from the PLAYERS array, it also
 * adds and removes attributes to the <video> element depending on the options
 * supplied by the user. An exception is thrown if no supported player is found,
 * developers should handle this appropriately and fallback as necessary.
 *
 * Issues
 *
 * 1. IE9 throws a "Error: Not implemented" exception when adding or removing
 *    'autoplay' and 'loop' properties. Perhaps because it doesn't make sense
 *    to add these properties after element initialisation?
 */

var DivinePlayer = (function() {

  var PLAYERS = [HTML5Player, FlashPlayer];
  var OPTIONS = ['autoplay', 'controls', 'loop', 'muted'];

  function DivinePlayer(el, options, onReady) {
    require(el, 'Element must be defined.');

    var options = options || {};

    if (options.allowHashMessage) {
      var hashOptions = window.location.hash.replace('#', '').split(',');
      for (var i=0, l=hashOptions.length; i<l; i++) if (OPTIONS.indexOf(hashOptions[i]) >= 0) {
        options[hashOptions[i]] = true;
      }
    }

    for (var i=0, l=OPTIONS.length; i<l; i++) {
      var property = OPTIONS[i];
      var state = options[OPTIONS[i]];
      if (state != null) attr(el, property, state);
    }

    var Player = require(DivinePlayer.getSupportedPlayer(el), 'No supported player found.');
    var player = new Player(el, options, onReady);

    if (options.allowHashMessage) {
      addEventListener('hashchange', function() {
        handleCommand(window.location.hash.replace('#', ''), player);
      });
    }

    if (options.allowPostMessage) {
      addEventListener('message', function(message) {
        handleCommand(message.data, player);
      });
    }

    return player;
  }

  // Exposed for testing purposes.
  DivinePlayer.players = PLAYERS;
  DivinePlayer.options = OPTIONS;
  DivinePlayer.getSupportedPlayer = function(video) {
    for (var i=0, l=PLAYERS.length; i<l; i++) if (PLAYERS[i].canPlay(video)) {
      return PLAYERS[i];
    }
  };

  return DivinePlayer;

  function require(condition, message) {
    if (!condition) throw (message || "Requirement isn't fullfilled");
    return condition;
  }

  function attr(el, property, active) {
    if (active) {
      // Issue #1
      try { el.setAttribute(property, property); } catch(e) {/* Ignore */}
    } else {
      el.removeAttribute(property);
    }
  }

  function addEventListener(event, fn) {
    if (window.addEventListener) {
      window.addEventListener(event, fn, false);
    } else {
      window.attachEvent('on' + event, fn);
    }
  }

  function handleCommand(command, player) {
    switch(command) {
      case 'play': player.play(); break;
      case 'pause': player.pause(); break;
      case 'mute': player.mute(); break;
      case 'unmute': player.unmute(); break;
    }
  }
}());

return DivinePlayer;}());