// Generated by CoffeeScript 1.7.1
require(function(geom, Tiles, Action, Events) {
  var StageView;
  return StageView = (function() {
    StageView.include(Events);

    StageView.prototype.tw = 48;

    StageView.prototype.th = 48;

    StageView.prototype.vw = 19;

    StageView.prototype.vh = 15;

    function StageView(el, game) {
      var canvas, cont, h, mouseCanvas, targetingCanvas, w;
      this.el = el;
      this.game = game;
      this.vw2 = this.vw / 2 | 0;
      this.vh2 = this.vh / 2 | 0;
      this.v2 = pt(this.vw2, this.vh2);
      this.tiles = new Tiles({
        path: 'res/tiles',
        tw: this.tw,
        th: this.th
      });
      this.tile = {};
      this.redMask = {};
      this.loadTiles();
      w = this.tw * this.vw;
      h = this.th * this.vh;
      this.cont = cont = $("<div class=\"stageViewContainer\"></div>").css({
        width: w,
        height: h
      }).appendTo(this.el);
      canvas = $("<canvas class=\"stage\" width=" + w + " height=" + h + "></canvas>").appendTo(cont);
      this.ctx = getCanvasContext(canvas);
      this.ctx.tiles = this.tiles;
      targetingCanvas = $("<canvas class=\"targeting\" width=" + w + " height=" + h + "></canvas>").appendTo(cont);
      this.targetingCtx = getCanvasContext(targetingCanvas);
      mouseCanvas = $("<canvas class=\"mouse\" width=" + w + " height=" + h + "></canvas>").appendTo(cont);
      this.mouseCtx = getCanvasContext(mouseCanvas);
      this.actionsBuf = [];
      this.ready = true;
      this.readyCallbacks = [];
    }

    StageView.prototype.loadTiles = function() {
      var tile, _i, _len, _ref;
      _ref = ['floor', 'wall', 'door', 'player', 'mob', 'item', 'blood', 'arrow'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tile = _ref[_i];
        this.tile[tile] = this.tiles.load("" + tile + ".png");
      }
      this.tile.arrowLeft = this.tiles.flipX(this.tile.arrow);
      this.redMask[this.tile.player] = this.tiles.colorMask(this.tile.player, 'red');
      this.redMask[this.tile.mob] = this.tiles.colorMask(this.tile.mob, 'red');
    };

    StageView.prototype.update = function() {
      var g;
      g = this.game;
      this.ready = false;
      return this.tiles.onload((function(_this) {
        return function() {
          var act, actions, acts, curInfo, f, from, getCenter, getCurInfo, getLastInfo, getLastVisibility, getMobPos, getNewVisibility, mobActions, mobAnim, mobId, n, particleAnim, playerMoves, s, stage, start, targetId, tile, to, viewArea, _i, _j, _len, _len1;
          actions = _this.actionsBuf;
          _this.actionsBuf = [];
          stage = g.p.stage();
          if ((_this.lastStage == null) || stage !== _this.lastStage) {
            _this.lastStage = stage;
            _this.lastInfo = [];
          }
          if (_this.lastVisibleMobIds == null) {
            _this.lastVisibleMobIds = {};
          }
          mobAnim = {};
          mobActions = {};
          curInfo = [];
          particleAnim = [];
          getMobPos = function(moves, t) {
            return geom.interpolatePointWeighted(t, moves);
          };
          getCenter = function(t) {
            return getMobPos(playerMoves, t);
          };
          getLastInfo = function(p) {
            var key, _base;
            key = p.y * stage.w + p.x;
            return (_base = _this.lastInfo)[key] != null ? _base[key] : _base[key] = {};
          };
          getCurInfo = function(p) {
            var key;
            key = p.y * stage.w + p.x;
            return curInfo[key] != null ? curInfo[key] : curInfo[key] = {};
          };
          getLastVisibility = function(p) {
            var _ref;
            return (_ref = getLastInfo(p).vis) != null ? _ref : 0;
          };
          getNewVisibility = function(c) {
            if (c == null) {
              return 0;
            }
            switch (false) {
              case !c.isVisible():
                return 1;
              case !c.wasVisible():
                return 0.5;
              default:
                return 0;
            }
          };
          for (_i = 0, _len = actions.length; _i < _len; _i++) {
            act = actions[_i];
            mobId = act.mob.id;
            if ((mobId in mobActions) || (mobId in _this.lastVisibleMobIds) || act.to.cell().isVisible()) {
              (mobActions[mobId] != null ? mobActions[mobId] : mobActions[mobId] = []).push(act);
            }
          }
          for (mobId in mobActions) {
            acts = mobActions[mobId];
            mobAnim[mobId] = {
              mob: acts[0].mob,
              moves: [
                {
                  t: 0,
                  p: acts[0].from
                }
              ],
              colors: []
            };
          }
          _this.lastVisibleMobIds = {};
          _this.center = g.p.loc;
          viewArea = _this.center.adjacentArea(_this.vw2 + 1, _this.vh2 + 1);
          viewArea.iter(function(loc) {
            var cell, mob;
            cell = loc.cell();
            getCurInfo(loc).vis = getNewVisibility(cell);
            if (cell.isVisible() && (cell.mob != null)) {
              mob = cell.mob;
              _this.lastVisibleMobIds[mob.id] = true;
              if (!(mob.id in mobAnim)) {
                return mobAnim[mob.id] = {
                  mob: mob,
                  moves: [
                    {
                      t: 0,
                      p: mob.loc
                    }
                  ],
                  colors: []
                };
              }
            }
          });
          n = 1;
          for (mobId in mobActions) {
            acts = mobActions[mobId];
            start = 0;
            for (_j = 0, _len1 = acts.length; _j < _len1; _j++) {
              act = acts[_j];
              if (act.id === Action.MOVE) {
                mobAnim[mobId].moves.push({
                  t: start + 1,
                  p: act.to
                });
              } else if (act.id === Action.MELEE) {
                mobAnim[mobId].moves.push({
                  t: start + 0.7,
                  p: act.from.plus(act.to.minus(act.from).mult(0.5, 0.5))
                });
                mobAnim[mobId].moves.push({
                  t: start + 1,
                  p: act.from
                });
                targetId = act.target.id;
                if (!(targetId in mobAnim)) {
                  mobAnim[targetId] = {
                    mob: act.target,
                    moves: [
                      {
                        t: 0,
                        p: act.to
                      }
                    ],
                    colors: []
                  };
                }
                mobAnim[targetId].colors.push([start, start + 0.7, start + 1]);
              } else if (act.id === Action.SHOOT) {
                from = act.from;
                to = act.target.loc;
                s = start;
                f = s + 1;
                if (from.distance(to) > 2) {
                  start += 1;
                  f = s + 2;
                }
                if (to.x >= from.x) {
                  tile = _this.tile.arrow;
                } else {
                  tile = _this.tile.arrowLeft;
                }
                particleAnim.push({
                  tile: tile,
                  start: s,
                  finish: f,
                  moves: [
                    {
                      t: s,
                      p: from
                    }, {
                      t: f,
                      p: to
                    }
                  ]
                });
                targetId = act.target.id;
                if (!(targetId in mobAnim)) {
                  mobAnim[targetId] = {
                    mob: act.target,
                    moves: [
                      {
                        t: 0,
                        p: to
                      }
                    ],
                    colors: []
                  };
                }
                mobAnim[targetId].colors.push([start, start + 0.7, start + 1]);
              }
              start += 1;
            }
            if (n < start) {
              n = start;
            }
          }
          if (g.p.alive) {
            playerMoves = mobAnim[g.p.id].moves;
          } else {
            playerMoves = [
              {
                t: 0,
                p: g.p.loc
              }
            ];
          }
          animate(ANIM_DURATION * n, function(t) {
            var cell, colors, coords, drawOpacity, fin, finish, lastVis, mid, mob, moves, newVis, opc, p, st, tt, vis, visS, x, x0, x1, xy, y, y0, y1, _k, _l, _len2, _len3, _len4, _m, _n, _o, _ref, _ref1, _ref2, _ref3;
            tt = t * n;
            _this.center = getCenter(tt);
            x0 = Math.floor(_this.center.x - _this.vw2);
            y0 = Math.floor(_this.center.y - _this.vh2);
            x1 = Math.ceil(_this.center.x + _this.vw2);
            y1 = Math.ceil(_this.center.y + _this.vh2);
            drawOpacity = {};
            for (y = _k = y0; y0 <= y1 ? _k <= y1 : _k >= y1; y = y0 <= y1 ? ++_k : --_k) {
              for (x = _l = x0; x0 <= x1 ? _l <= x1 : _l >= x1; x = x0 <= x1 ? ++_l : --_l) {
                p = pt(x, y);
                xy = _this.pointToView(p);
                lastVis = getLastVisibility(p);
                newVis = (_ref = getCurInfo(p).vis) != null ? _ref : 0;
                vis = interpolate(t, [lastVis, newVis]);
                if (vis > 0) {
                  cell = stage.at(p);
                  _this.drawCellBackground(cell, xy, lastVis === 1 || newVis === 1);
                }
                if (vis < 1) {
                  if (drawOpacity[vis] == null) {
                    drawOpacity[vis] = [];
                  }
                  drawOpacity[vis].push(xy);
                }
              }
            }
            for (mobId in mobAnim) {
              _ref1 = mobAnim[mobId], mob = _ref1.mob, moves = _ref1.moves, colors = _ref1.colors;
              if (t >= 1 && !mob.alive) {
                continue;
              }
              xy = _this.pointToView(getMobPos(moves, tt));
              _this.drawMob(mob, xy);
              if (t < 1) {
                for (_m = 0, _len2 = colors.length; _m < _len2; _m++) {
                  _ref2 = colors[_m], st = _ref2[0], mid = _ref2[1], fin = _ref2[2];
                  if ((st <= tt && tt < fin)) {
                    if (tt <= mid) {
                      opc = (tt - st) / (mid - st);
                    } else {
                      opc = 1;
                    }
                    _this.ctx.globalAlpha = opc;
                    _this.ctx.drawTile(_this.redMask[_this.getMobTile(mob)], xy.x, xy.y);
                    _this.ctx.globalAlpha = 1;
                  }
                }
              }
            }
            if (t < 1) {
              for (_n = 0, _len3 = particleAnim.length; _n < _len3; _n++) {
                _ref3 = particleAnim[_n], tile = _ref3.tile, start = _ref3.start, finish = _ref3.finish, moves = _ref3.moves;
                if ((start <= tt && tt < finish)) {
                  p = geom.interpolatePointWeighted(tt, moves);
                  xy = _this.pointToView(p);
                  _this.ctx.drawTile(tile, xy.x, xy.y);
                }
              }
            }
            for (visS in drawOpacity) {
              coords = drawOpacity[visS];
              vis = Number(visS);
              _this.ctx.fillStyle = "rgba(0, 0, 0, " + (1 - vis) + ")";
              for (_o = 0, _len4 = coords.length; _o < _len4; _o++) {
                xy = coords[_o];
                _this.ctx.fillRect(xy.x, xy.y, _this.tw, _this.th);
              }
            }
            return _this.drawHover();
          }, function() {
            _this.lastInfo = curInfo;
            _this.initMouseControls();
            _this.updateHover();
            return _this.triggerReady();
          });
        };
      })(this));
    };

    StageView.prototype.pointToView = function(p) {
      return p.minus(this.center).plus(this.v2).mult(this.tw, this.th);
    };

    StageView.prototype.pointFromView = function(p) {
      var thInv, twInv;
      twInv = 1 / this.tw;
      thInv = 1 / this.th;
      return p.mult(twInv, thInv).minus(this.v2).plus(this.center).floor();
    };

    StageView.prototype.drawCellBackground = function(cell, xy, isVisible) {
      var feat, item, terrain;
      terrain = this.getTerrainTile(cell.terrain);
      this.ctx.drawTile(terrain, xy.x, xy.y);
      if (isVisible) {
        if (cell.feature != null) {
          feat = this.getFeatureTile(cell.feature);
          this.ctx.drawTile(feat, xy.x, xy.y);
        }
        if (cell.item != null) {
          item = this.getItemTile(cell.item);
          return this.ctx.drawTile(item, xy.x, xy.y);
        }
      }
    };

    StageView.prototype.drawMob = function(mob, xy) {
      var mobTile;
      mobTile = this.getMobTile(mob);
      return this.ctx.drawTile(mobTile, xy.x, xy.y);
    };

    StageView.prototype.onReady = function(cb) {
      if (this.ready) {
        return cb();
      } else {
        return this.once('ready', cb);
      }
    };

    StageView.prototype.triggerReady = function() {
      this.ready = true;
      this.trigger('ready');
    };

    StageView.prototype.getTerrainTile = function(terr) {
      switch (terr) {
        case Terrain.WALL:
          return this.tile.wall;
        case Terrain.DOOR:
          return this.tile.door;
        default:
          return this.tile.floor;
      }
    };

    StageView.prototype.getItemTile = function() {
      return this.tile.item;
    };

    StageView.prototype.getMobTile = function(mob) {
      switch (mob.glyph) {
        case '@':
          return this.tile.player;
        default:
          return this.tile.mob;
      }
    };

    StageView.prototype.getFeatureTile = function() {
      return this.tile.blood;
    };

    StageView.prototype.registerAction = function(action) {
      return this.actionsBuf.push(action);
    };

    StageView.prototype.setTarget = function(p) {
      var xy;
      xy = this.pointToView(p).plus(pt(this.tw / 2, this.th / 2));
      this.targetingCtx.clear();
      this.targetingCtx.save();
      this.targetingCtx.strokeStyle = '#00ff00';
      this.targetingCtx.lineWidth = 2;
      this.targetingCtx.beginPath();
      this.targetingCtx.arc(xy.x, xy.y, this.tw / 2, 0, 2 * Math.PI);
      this.targetingCtx.stroke();
      return this.targetingCtx.restore();
    };

    StageView.prototype.clearTarget = function() {
      return this.targetingCtx.clear();
    };

    StageView.prototype.drawHover = function() {
      var xy;
      if (this.hoverLoc != null) {
        xy = this.pointToView(this.hoverLoc);
        this.mouseCtx.clear();
        this.mouseCtx.strokeRect(xy.x + 2, xy.y + 2, this.tw - 3, this.th - 3);
      }
    };

    StageView.prototype.updateHover = function(x, y) {
      var coords, loc, p;
      if (x == null) {
        if (this.lastMouseCoords == null) {
          return;
        }
        coords = this.lastMouseCoords;
      } else {
        coords = pt(x, y);
        this.lastMouseCoords = coords;
      }
      p = this.pointFromView(coords);
      if ((this.lastMouseMove == null) || !p.eq(this.lastMouseMove)) {
        this.lastMouseMove = p;
        loc = this.game.p.stage().loc(p);
        if (loc != null) {
          this.hoverLoc = loc;
          this.drawHover();
          return this.trigger('mousemove', loc);
        } else {
          return this.mouseCtx.clear();
        }
      }
    };

    StageView.prototype.initMouseControls = function() {
      var lastMouseMove;
      if (!this.mouseInitialized) {
        this.mouseInitialized = true;
        lastMouseMove = null;
        this.mouseCtx.strokeStyle = '#00ff00';
        this.mouseCtx.lineWidth = 2;
        this.cont.on('contextmenu', function(e) {
          return e.preventDefault();
        });
        this.cont.mousemove((function(_this) {
          return function(e) {
            _this.updateHover(e.pageX, e.pageY);
          };
        })(this));
        this.cont.mousedown((function(_this) {
          return function(e) {
            var loc, p;
            p = _this.pointFromView(pt(e.pageX, e.pageY));
            loc = _this.game.p.stage().loc(p);
            if (loc != null) {
              switch (false) {
                case e.which !== 1:
                  _this.trigger('mouseleft', loc);
                  break;
                case e.which !== 3:
                  _this.trigger('mouseright', loc);
              }
            }
            e.preventDefault();
          };
        })(this));
        this.cont.mouseout((function(_this) {
          return function() {
            _this.hoverLoc = null;
            _this.lastMouseMove = null;
            _this.mouseCtx.clear();
            return _this.trigger('mouseout');
          };
        })(this));
      }
    };

    return StageView;

  })();
});
