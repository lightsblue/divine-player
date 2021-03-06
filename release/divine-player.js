var DivinePlayer = (function() {

/******************************************************************************
 * src/players/html5-player.js
 ******************************************************************************/

var HTML5Player = (function(DEBUG) {
  /**
   * Returns IE version, or false if not IE.
   * From http://stackoverflow.com/a/21712356
   */
  function detectIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');

    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    if (trident > 0) {
        // IE 11 (or newer) => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser
    return false;
  }

  function HTML5Player(el, options, onReady) {
    this.el = el;
    this.el.width = options.width || el.videoWidth;
    this.el.height = options.height || el.videoHeight;
    this.el.muted = el.hasAttribute('muted');
    workarounds(this.el, navigator.userAgent);
    if (onReady) onReady(this);
  }

  HTML5Player.name = HTML5Player.name || 'HTML5Player';

  HTML5Player.canPlay = function(el) {
    if (detectIE()) {
      return false;
    }
    
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
}(window['DEBUG'] || false));


/******************************************************************************
 * src/players/flash-player.js
 ******************************************************************************/

/**
 * Flash Player
 *
 * This player reads the properties from the video element, and replaces it with
 * an embedded SWF which handles the video playback.
 *
 */

var FlashPlayer = (function(global, DEBUG) {

  var DEFAULT_SIZE = 150;

  function dispatchCustomEvent (el, event) {
    if(el.dispatchEvent){
      el.dispatchEvent(event);
    }
  }

  function getEvent(eventName) {
    var event;
    if(document.createEvent){
      event = document.createEvent('HTMLEvents');
      event.initEvent(eventName,true,true);
    }else if(document.createEventObject){// IE < 9
      event = document.createEventObject();
      event.eventType = eventName;
    }
    event.eventName = eventName;
    return event;
  }

  // TODO: Select the mp4 instead of just the first source
  function FlashPlayer(el, options, onReady) {
    var callbackId = el.id;
    var namespace = 'divinePlayer';
    var callback = [namespace, callbackId, 'onReady'].join('_');
    var onError = [namespace, callbackId, 'onError'].join('_');
    var onDuration = [namespace, callbackId, 'onDuration'].join('_');
    var onTimeUpdate = [namespace, callbackId, 'onTimeUpdate'].join('_');
    var onVolumeChange = [namespace, callbackId, 'onVolumeChange'].join('_');
    var onEnded = [namespace, callbackId, 'onEnded'].join('_');
    var onPause = [namespace, callbackId, 'onPause'].join('_');
    var onPlay = [namespace, callbackId, 'onPlay'].join('_');
    var latestDuration = NaN;
    if (!options.width) options.width = DEFAULT_SIZE;
    if (!options.height) options.height = DEFAULT_SIZE;

    var self = this;
    if (callback) {
      global[callback] = function() { onReady(self); };
    }

    global[onError] = function(code, description) {
      var event = getEvent('videoFailed');
      dispatchCustomEvent(el, event);
      if (DEBUG) throw {'name': 'ActionScript ' + code, 'message': description};
    };

    global[onTimeUpdate] = function(time) {
      var event = getEvent('timeupdate');
      event.timeupdate = time;
      dispatchCustomEvent(el, event);
    };

    global[onVolumeChange] = function() {
      var event = getEvent('volumechange');
      dispatchCustomEvent(el, event);
    };

    global[onEnded] = function() {
      var event = getEvent('ended');
      dispatchCustomEvent(el, event);
    };

    global[onDuration] = function(seconds) {
      var event = getEvent('durationchange');
      event.duration = seconds;
      dispatchCustomEvent(el, event);
      latestDuration = seconds;
    };

    global[onPause] = function() {
      var event = getEvent('pause');
      dispatchCustomEvent(el, event);
    };

    global[onPlay] = function() {
      var event = getEvent('play');
      dispatchCustomEvent(el, event);
    };

    var swf = override(el.getAttribute('data-fallback-player'), options.swf);

    if (DEBUG) {
      if (!swf) throw 'SWF url must be specified.';
    }
    var swfOptions = {
      width: options.width,
      height: options.height,
      autoplay: hasAttribute(el, 'autoplay'),
      muted: hasAttribute(el, 'muted'),
      loop: hasAttribute(el, 'loop'),
      video: getVideoUrl(el),
      onReady: callback,
      onError: onError,
      onDuration: onDuration,
      callbackId: callbackId
    };
    if (hasAttribute(el, 'poster')) {
      swfOptions.poster = absolute(el.getAttribute('poster'));
    }
    this.swf = embed(swf, el, swfOptions);

    this.duration = function() {
      return latestDuration;
    }
  }

  FlashPlayer.name = FlashPlayer.name || 'FlashPlayer';

  FlashPlayer.canPlay = function() {
    try {
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
      name: el.id,
      data: swf,
      width: options.width,
      height: options.height,
      type: 'application/x-shockwave-flash'
    });

    var parameters = params({
      movie: swf,
      allowScriptAccess: 'sameDomain',
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

}(this, window['DEBUG'] || false));


/******************************************************************************
 * src/players/image-player.js
 ******************************************************************************/

/**
 * This player uses the poster image providing a clean static fallback if
 * other players such as the HTML5 or Flash players aren't supported.
 *
 * It would be awesome if this player showed a GIF rather than the poster. It
 * would provide the best possible end-user experience.
 */
var ImagePlayer = (function(DEBUG) {

  function ImagePlayer(el, options, onReady) {
    this._playing = hasAttribute(el, 'autoplay');
    this._muted = hasAttribute(el, 'muted');

    embed(el, options, el.getAttribute('poster'));

    if (onReady) onReady(this);
  }

  ImagePlayer.name = ImagePlayer.name || 'ImagePlayer';

  ImagePlayer.canPlay = function(el) {
    return hasAttribute(el, 'poster');
  };

  ImagePlayer.fn = ImagePlayer.prototype;

  ImagePlayer.fn.play = function() {
    this._playing = true;
  };

  ImagePlayer.fn.pause = function() {
    this._playing = false;
  };

  ImagePlayer.fn.paused = function() {
    return !this._playing;
  };

  ImagePlayer.fn.mute = function() {
    this._muted = true;
  };

  ImagePlayer.fn.unmute = function() {
    this._muted = false;
  };

  ImagePlayer.fn.muted = function() {
    return this._muted;
  };

  return ImagePlayer;

  function embed(el, options, poster) {
    el.outerHTML = '<img id="' + el.id + '" src="' + poster + '" width="' + options.width + '" height="' + options.height + '">';
  }

  // IE7 and below doesn't support hasAttribute
  function hasAttribute(el, attribute) {
    return el.getAttribute(attribute) != null;
  }
}(window['DEBUG'] || false));


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

var DivinePlayer = (function(DEBUG) {
  var PLAYERS = [HTML5Player, FlashPlayer, ImagePlayer];
  var OPTIONS = ['autoplay', 'controls', 'loop', 'muted'];

  function DivinePlayer(el, options, onReady) {
    if (DEBUG) {
      require(el, 'Element must be defined.');
    }

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

    var Player = DivinePlayer.getSupportedPlayer(el);

    if (DEBUG) {
      require(Player, 'No supported player found.');
    }

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

  if (DEBUG) {
    DivinePlayer.players = PLAYERS;
    DivinePlayer.options = OPTIONS;
  }

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
}(window['DEBUG'] || false));

return DivinePlayer;}());