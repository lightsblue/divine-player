var DivinePlayer = function() {
    var HTML5Player = function() {
        function HTML5Player(b, c, d) {
            this.el = b, this.el.width = c.width || b.videoWidth, this.el.height = c.height || b.videoHeight, 
            this.el.muted = b.hasAttribute("muted"), a(this.el, navigator.userAgent), d && d(this);
        }
        function a(a, b) {
            var c = /ipad/i.test(b), d = /ipad/i.test(b), e = /android/i.test(b), f = /chrome/i.test(b), g = c || d || e;
            if (a.hasAttribute("poster") && f && !g) {
                {
                    a.getAttribute("poster");
                }
                a.removeAttribute("poster");
            }
            a.hasAttribute("controls") || !c && !e || (a.controls = !0, a.addEventListener("play", function() {
                a.controls = !1;
            }, !1)), e && (a.loop = !1, a.addEventListener("ended", function() {
                a.play();
            }, !1)), a.hasAttribute("autoplay") && a.play();
            for (var h = a.getElementsByTagName("source"), i = 0, j = h.length; j > i; i++) h[i].addEventListener("error", function() {
                var b = new Event("videoFailed");
                b.target = a, a.dispatchEvent(b);
            });
        }
        return HTML5Player.name = HTML5Player.name || "HTML5Player", HTML5Player.canPlay = function(a) {
            try {
                for (var b = a.getElementsByTagName("source"), c = 0, d = b.length; d > c; c++) {
                    var e = b[c].getAttribute("type"), f = a.canPlayType(e);
                    if (f) return !0;
                }
            } catch (g) {}
            return !1;
        }, HTML5Player.fn = HTML5Player.prototype, HTML5Player.fn.play = function() {
            this.el.play();
        }, HTML5Player.fn.currentTime = function(a) {
            return "undefined" != typeof a && (this.el.currentTime = a), this.el.currentTime;
        }, HTML5Player.fn.duration = function() {
            return this.el.duration;
        }, HTML5Player.fn.pause = function() {
            this.el.pause();
        }, HTML5Player.fn.paused = function() {
            return this.el.paused;
        }, HTML5Player.fn.mute = function() {
            this.el.muted = !0;
        }, HTML5Player.fn.unmute = function() {
            this.el.muted = !1;
        }, HTML5Player.fn.muted = function() {
            return this.el.muted;
        }, HTML5Player;
    }(window.DEBUG || !1), FlashPlayer = function(a, b) {
        function c(a, b) {
            var c;
            document.createEvent ? (c = document.createEvent("HTMLEvents"), c.initEvent(b, !0, !0)) : document.createEventObject && (c = document.createEventObject(), 
            c.eventType = b), c.eventName = b, a.dispatchEvent && a.dispatchEvent(c);
        }
        function FlashPlayer(f, g, h) {
            var i = f.id, n = "divinePlayer", o = [ n, i, "onReady" ].join("_"), p = [ n, i, "onError" ].join("_"), q = [ n, i, "onDuration" ].join("_"), r = 0/0;
            g.width || (g.width = m), g.height || (g.height = m);
            var s = this;
            o && (a[o] = function() {
                h(s);
            }), a[p] = function(a, d) {
                if (c(f, "videoFailed"), b) throw {
                    name: "ActionScript " + a,
                    message: d
                };
            }, a[q] = function(a) {
                r = a, c(f, "durationchange");
            };
            var t = l(f.getAttribute("data-fallback-player"), g.swf);
            if (b && !t) throw "SWF url must be specified.";
            this.swf = j(t, f, {
                width: g.width,
                height: g.height,
                autoplay: k(f, "autoplay"),
                muted: k(f, "muted"),
                loop: k(f, "loop"),
                poster: k(f, "poster") ? d(f.getAttribute("poster")) : void 0,
                video: e(f),
                onReady: o,
                onError: p,
                onDuration: q,
                callbackId: i
            }), this.duration = function() {
                return r;
            };
        }
        function d(a) {
            return 0 === (a || "").indexOf("//") ? document.location.protocol + a : a;
        }
        function e(a) {
            var b = a.getElementsByTagName("source");
            return b.length ? d(b[0].src) : void 0;
        }
        function f(a) {
            return i(a, function(a, b) {
                return a + '="' + b + '"';
            }, " ");
        }
        function g(a) {
            return i(a, function(a, b) {
                return "<param " + f({
                    name: a,
                    value: b
                }) + " />";
            }, "\n");
        }
        function h(a) {
            return i(a, function(a, b) {
                return a + "=" + encodeURIComponent(b);
            }, "&");
        }
        function i(a, b, c) {
            var d = [];
            for (var e in a) a.hasOwnProperty(e) && d.push(b(e, a[e]));
            return d.join(c);
        }
        function j(a, b, c) {
            var d = f({
                id: b.id,
                name: b.id,
                data: a,
                width: c.width,
                height: c.height,
                type: "application/x-shockwave-flash"
            }), e = g({
                movie: a,
                allowScriptAccess: "sameDomain",
                allowNetworking: "all",
                wmode: "opaque",
                quality: "high",
                bgcolor: "#000000",
                flashvars: h(c)
            });
            return b.outerHTML = "<object " + d + ">" + e + "</object>", document.getElementById(b.id);
        }
        function k(a, b) {
            return null != a.getAttribute(b);
        }
        function l(a, b) {
            return null == b ? a : b;
        }
        var m = 150;
        return FlashPlayer.name = FlashPlayer.name || "FlashPlayer", FlashPlayer.canPlay = function() {
            try {
                if (/MSIE 10/i.test(navigator.userAgent)) return !1;
                var a = window.ActiveXObject ? new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version") : navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin.description, b = /(\d+)[,.]\d+/.exec(a), c = parseInt(b[1], 10);
                return c >= 9;
            } catch (d) {}
            return !1;
        }, FlashPlayer.fn = FlashPlayer.prototype, FlashPlayer.fn.play = function() {
            this.swf.divinePlay();
        }, FlashPlayer.fn.currentTime = function(a) {
            return "undefined" == typeof a ? this.swf.divineGetCurrentTime() : void this.swf.divineCurrentTime(a);
        }, FlashPlayer.fn.pause = function() {
            this.swf.divinePause();
        }, FlashPlayer.fn.paused = function() {
            return this.swf.divinePaused();
        }, FlashPlayer.fn.mute = function() {
            this.swf.divineMute();
        }, FlashPlayer.fn.unmute = function() {
            this.swf.divineUnmute();
        }, FlashPlayer.fn.muted = function() {
            return this.swf.divineMuted();
        }, FlashPlayer;
    }(this, window.DEBUG || !1), ImagePlayer = function() {
        function ImagePlayer(c, d, e) {
            this._playing = b(c, "autoplay"), this._muted = b(c, "muted"), a(c, d, c.getAttribute("poster")), 
            e && e(this);
        }
        function a(a, b, c) {
            a.outerHTML = '<img id="' + a.id + '" src="' + c + '" width="' + b.width + '" height="' + b.height + '">';
        }
        function b(a, b) {
            return null != a.getAttribute(b);
        }
        return ImagePlayer.name = ImagePlayer.name || "ImagePlayer", ImagePlayer.canPlay = function(a) {
            return b(a, "poster");
        }, ImagePlayer.fn = ImagePlayer.prototype, ImagePlayer.fn.play = function() {
            this._playing = !0;
        }, ImagePlayer.fn.pause = function() {
            this._playing = !1;
        }, ImagePlayer.fn.paused = function() {
            return !this._playing;
        }, ImagePlayer.fn.mute = function() {
            this._muted = !0;
        }, ImagePlayer.fn.unmute = function() {
            this._muted = !1;
        }, ImagePlayer.fn.muted = function() {
            return this._muted;
        }, ImagePlayer;
    }(window.DEBUG || !1), DivinePlayer = function(a) {
        function DivinePlayer(f, h, i) {
            a && b(f, "Element must be defined.");
            var h = h || {};
            if (h.allowHashMessage) for (var j = window.location.hash.replace("#", "").split(","), k = 0, l = j.length; l > k; k++) g.indexOf(j[k]) >= 0 && (h[j[k]] = !0);
            for (var k = 0, l = g.length; l > k; k++) {
                var m = g[k], n = h[g[k]];
                null != n && c(f, m, n);
            }
            var o = DivinePlayer.getSupportedPlayer(f);
            a && b(o, "No supported player found.");
            var p = new o(f, h, i);
            return h.allowHashMessage && d("hashchange", function() {
                e(window.location.hash.replace("#", ""), p);
            }), h.allowPostMessage && d("message", function(a) {
                e(a.data, p);
            }), p;
        }
        function b(a, b) {
            if (!a) throw b || "Requirement isn't fullfilled";
            return a;
        }
        function c(a, b, c) {
            if (c) try {
                a.setAttribute(b, b);
            } catch (d) {} else a.removeAttribute(b);
        }
        function d(a, b) {
            window.addEventListener ? window.addEventListener(a, b, !1) : window.attachEvent("on" + a, b);
        }
        function e(a, b) {
            switch (a) {
              case "play":
                b.play();
                break;

              case "pause":
                b.pause();
                break;

              case "mute":
                b.mute();
                break;

              case "unmute":
                b.unmute();
            }
        }
        var f = [ HTML5Player, FlashPlayer, ImagePlayer ], g = [ "autoplay", "controls", "loop", "muted" ];
        return a && (DivinePlayer.players = f, DivinePlayer.options = g), DivinePlayer.getSupportedPlayer = function(a) {
            for (var b = 0, c = f.length; c > b; b++) if (f[b].canPlay(a)) return f[b];
        }, DivinePlayer;
    }(window.DEBUG || !1);
    return DivinePlayer;
}();