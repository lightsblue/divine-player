var DivinePlayer = function() {
    var HTML5Player = function() {
        function a() {
            var a = window.navigator.userAgent, b = a.indexOf("MSIE "), c = a.indexOf("Trident/");
            if (b > 0) return parseInt(a.substring(b + 5, a.indexOf(".", b)), 10);
            if (c > 0) {
                var d = a.indexOf("rv:");
                return parseInt(a.substring(d + 3, a.indexOf(".", d)), 10);
            }
            return !1;
        }
        function HTML5Player(a, c, d) {
            this.el = a, this.el.width = c.width || a.videoWidth, this.el.height = c.height || a.videoHeight, 
            this.el.muted = a.hasAttribute("muted"), b(this.el, navigator.userAgent), d && d(this);
        }
        function b(a, b) {
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
        return HTML5Player.name = HTML5Player.name || "HTML5Player", HTML5Player.canPlay = function(b) {
            if (a()) return !1;
            try {
                for (var c = b.getElementsByTagName("source"), d = 0, e = c.length; e > d; d++) {
                    var f = c[d].getAttribute("type"), g = b.canPlayType(f);
                    if (g) return !0;
                }
            } catch (h) {}
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
            a.dispatchEvent && a.dispatchEvent(b);
        }
        function d(a) {
            var b;
            return document.createEvent ? (b = document.createEvent("HTMLEvents"), b.initEvent(a, !0, !0)) : document.createEventObject && (b = document.createEventObject(), 
            b.eventType = a), b.eventName = a, b;
        }
        function FlashPlayer(g, h, i) {
            var j = g.id, o = "divinePlayer", p = [ o, j, "onReady" ].join("_"), q = [ o, j, "onError" ].join("_"), r = [ o, j, "onDuration" ].join("_"), s = [ o, j, "onTimeUpdate" ].join("_"), t = [ o, j, "onVolumeChange" ].join("_"), u = [ o, j, "onEnded" ].join("_"), v = [ o, j, "onPause" ].join("_"), w = [ o, j, "onPlay" ].join("_"), x = 0/0;
            h.width || (h.width = n), h.height || (h.height = n);
            var y = this;
            p && (a[p] = function() {
                i(y);
            }), a[q] = function(a, e) {
                var f = d("videoFailed");
                if (c(g, f), b) throw {
                    name: "ActionScript " + a,
                    message: e
                };
            }, a[s] = function(a) {
                var b = d("timeupdate");
                b.timeupdate = a, c(g, b);
            }, a[t] = function() {
                var a = d("volumechange");
                c(g, a);
            }, a[u] = function() {
                var a = d("ended");
                c(g, a);
            }, a[r] = function(a) {
                var b = d("durationchange");
                b.duration = a, c(g, b), x = a;
            }, a[v] = function() {
                var a = d("pause");
                c(g, a);
            }, a[w] = function() {
                var a = d("play");
                c(g, a);
            };
            var z = m(g.getAttribute("data-fallback-player"), h.swf);
            if (b && !z) throw "SWF url must be specified.";
            var A = {
                width: h.width,
                height: h.height,
                autoplay: l(g, "autoplay"),
                muted: l(g, "muted"),
                loop: l(g, "loop"),
                video: f(g),
                onReady: p,
                onError: q,
                onDuration: r,
                callbackId: j
            };
            l(g, "poster") && (A.poster = e(g.getAttribute("poster"))), this.swf = k(z, g, A), 
            this.duration = function() {
                return x;
            };
        }
        function e(a) {
            return 0 === (a || "").indexOf("//") ? document.location.protocol + a : a;
        }
        function f(a) {
            var b = a.getElementsByTagName("source");
            return b.length ? e(b[0].src) : void 0;
        }
        function g(a) {
            return j(a, function(a, b) {
                return a + '="' + b + '"';
            }, " ");
        }
        function h(a) {
            return j(a, function(a, b) {
                return "<param " + g({
                    name: a,
                    value: b
                }) + " />";
            }, "\n");
        }
        function i(a) {
            return j(a, function(a, b) {
                return a + "=" + encodeURIComponent(b);
            }, "&");
        }
        function j(a, b, c) {
            var d = [];
            for (var e in a) a.hasOwnProperty(e) && d.push(b(e, a[e]));
            return d.join(c);
        }
        function k(a, b, c) {
            var d = g({
                id: b.id,
                name: b.id,
                data: a,
                width: c.width,
                height: c.height,
                type: "application/x-shockwave-flash"
            }), e = h({
                movie: a,
                allowScriptAccess: "sameDomain",
                allowNetworking: "all",
                wmode: "opaque",
                quality: "high",
                bgcolor: "#000000",
                flashvars: i(c)
            });
            return b.outerHTML = "<object " + d + ">" + e + "</object>", document.getElementById(b.id);
        }
        function l(a, b) {
            return null != a.getAttribute(b);
        }
        function m(a, b) {
            return null == b ? a : b;
        }
        var n = 150;
        return FlashPlayer.name = FlashPlayer.name || "FlashPlayer", FlashPlayer.canPlay = function() {
            try {
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