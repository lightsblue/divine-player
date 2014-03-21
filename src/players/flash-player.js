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
      onDuration: onDuration,
      callbackId: callbackId
    });

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
