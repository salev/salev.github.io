'use strict';

// canvasSelector - selector of canvas element presents in html document
function createSlvCropper(canvasSelector) {

  var ROI_BORDER_WIDTH = 2;
  var ROI_COLOR = "#FF0000";

  var image;
  var canvas;
  var context;

  // interface functions:
  // 1) open 2) save 3) onImageFileSelection - used with file input element
  // 4) crop 5) box

  // open function can process 3 different objects as an input parameter
  // 1. image as an object Image
  // 2. input element of file type
  // 3. image as a URL
  // So, open function can be called immediately od document ready on in run-time
  function open(imgOrInput) {

    // 1. image object
    if (imgOrInput instanceof HTMLImageElement) {
      if (imgOrInput.complete) {
        _drawPicture(imgOrInput);
      } else {
        imgOrInput.onload = function () {
          _drawPicture(imgOrInput);
        }
      }
    }
    else {
      var $input = null;
      try {
        $input = $(imgOrInput);
      } catch (e) {}
      // 2. file input
      if ($input && $input.length !== 0) {
        $input.trigger('click');
      }
      // 3. image URL
      else {
        image.src = imgOrInput;
      }
    }

    RoiSelector.releaseRoi();
  }

  // callback of onchange of file input. Used in conjunction with open function.
  function onImageFileSelection(files) {
    if (!files.length) {
      alert('Select a Picture!');
      return;
    }

    var file = files[0];
    image.src = window.URL.createObjectURL(file);

  }

  function save(callback) {
    var imageURL = canvas.toDataURL();
    callback(imageURL);
  }

  function crop() {
    var selBox = RoiSelector.getRoiRect();
    var imgData = context.getImageData(selBox.x, selBox.y, selBox.w, selBox.h);
    canvas.width = selBox.w;
    canvas.height = selBox.h;
    context.putImageData(imgData, 0, 0);
    RoiSelector.releaseRoi();
  }

  function box() {
    var selBox = RoiSelector.getRoiRect();
    context.lineWidth = ROI_BORDER_WIDTH;
    context.strokeStyle = ROI_COLOR;
    context.strokeRect(selBox.x, selBox.y, selBox.w, selBox.h);
    RoiSelector.releaseRoi();
  }

  // private members ---
  function _init(canvasSelector) {
    image = document.createElement("img");

    image.onload = function () {
      if (this.src.indexOf('blob') === 0) {
        window.URL.revokeObjectURL(this.src);
      }
      _drawPicture(image);
    };

    var $canvas = $(canvasSelector);
    canvas = $canvas.get(0);
    if (!canvas) {
      throw new Error('The canvas was not found!');
    }
    context = canvas.getContext("2d");

    // 1) container
    $canvas.wrap('<div class="slv-canvas-container"></div>');
    // 2) ROI frame
    var $roi = $('<div class="image-roi">\
        <div class="handler h11"></div>\
        <div class="handler h12"></div>\
        <div class="handler h13"></div>\
        <div class="handler h21"></div>\
        <div class="handler h23"></div>\
        <div class="handler h31"></div>\
        <div class="handler h32"></div>\
        <div class="handler h33"></div>\
      </div>');

    var $canvasContainer = $canvas.parent();
    $canvasContainer.append($roi);

    RoiSelector.init($canvasContainer, $roi);
  }

  function _drawPicture(img) {
    if (img.width != canvas.width)
      canvas.width = img.width;
    if (img.height != canvas.height)
      canvas.height = img.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  // RoiSelector - auxiliary object
  var RoiSelector = {
    rect0: null,
    p0: null,
    isPressed: null,
    hasRoi: null,

    $canvasContainer: null,
    $roi: null,

    $downTarget: null,

    //*****************************************
    // interface functions:
    // 1. init()
    // 2. getRoi()
    // 3. releaseRoi
    //*****************************************
    init: function ($canvasContainer, $roi) {
      this._reset();

      $canvasContainer
          .mousedown(this.down.bind(this)).on('touchstart', this.down.bind(this))
          .mousemove(this.move.bind(this)).on('touchmove', this.move.bind(this))
          .mouseup(this.up.bind(this)).on('touchend', this.up.bind(this));

      this.$canvasContainer = $canvasContainer;
      this.$roi = $roi;
    },
    getRoiRect: function () {
      var x = parseInt(this.$roi.css('left'));
      var y = parseInt(this.$roi.css('top'));
      var w = parseInt(this.$roi.css('width'));
      var h = parseInt(this.$roi.css('height'));
      return {x: x, y: y, w: w, h: h};
    },
    releaseRoi: function () {
      this._reset();
      this.$roi.css({left: '', top: '', width: '', height: ''});
      this.$roi.removeClass('roi-visible');
      this.$roi.removeClass('roi-fitting');
    },


    // inner functions ---
    _reset: function () {
      this.rect0 = {x: null, y: null, w: null, h: null};
      this.p0 = {x: null, y: null};
      this.isPressed = false;
      this.hasRoi = false;
    },
    down: function (event) {
      var $t = (this.$downTarget = $(event.target));
      if ($t.is(this.$roi))
        this.downOnRoi(event);
      else
        this.downOnContainer(event);
    },
    downOnContainer: function (event) {
      var c = this.getEventCoords(event);
      this.rect0.x = c[0];
      this.rect0.y = c[1];
      this._downUtil(event);
    },
    downOnRoi: function (event) {
      this._downUtil(event);
    },
    _downUtil: function (event) {
      var c = this.getEventCoords(event);
      this.p0.x = c[0];
      this.p0.y = c[1];
      this.isPressed = true;
    },

    move: function (event) {
      if (!this.isPressed)
        return;
      if (this.hasRoi) {
        var $t = this.$downTarget;
        if ($t.is(this.$roi))
          this.moveRoi(event);
        else if ($t.is('.handler'))
          this.shapeRoi(event, $t);
      }
      else {
        this.drawRoi(event);
        this.$roi.addClass('roi-visible');
      }

    },

    up: function () {
      if (!this.isPressed)
        return;

      this.rect0 = this.getRoiRect();
      this.isPressed = false;
      if (!this.hasRoi) {
        this.hasRoi = true;
        this.$roi.addClass('roi-fitting')
      }

      this.$downTarget = null;
    },

    drawRoi: function (event) {
      var d = this.dif(event);
      this.changeRoiCSS(0, 0, d[0], d[1]);
    },

    shapeRoi: function (event, $target) {
      var d = this.dif(event);
      if ($target.is('.h11'))
        this.changeRoiCSS(d[0], d[1], -d[0], -d[1]);
      else if ($target.is('.h12'))
        this.changeRoiCSS(null, d[1], null, -d[1]);
      else if ($target.is('.h13'))
        this.changeRoiCSS(null, d[1], d[0], -d[1]);

      else if ($target.is('.h21'))
        this.changeRoiCSS(d[0], null, -d[0], null);
      else if ($target.is('.h23'))
        this.changeRoiCSS(null, null, d[0], null);

      else if ($target.is('.h31'))
        this.changeRoiCSS(d[0], null, -d[0], d[1]);
      else if ($target.is('.h32'))
        this.changeRoiCSS(null, null, null, d[1]);
      else if ($target.is('.h33'))
        this.changeRoiCSS(null, null, d[0], d[1]);

    },

    moveRoi: function (event) {
      var d = this.dif(event);
      this.changeRoiCSS(d[0], d[1]);
    },

    getEventCoords: function (event) {
      var x, y;

      if (event.originalEvent && event.originalEvent.touches) {
        x = event.originalEvent.touches[0].clientX;
        y = event.originalEvent.touches[0].clientY;
      }
      else {
        x = event.offsetX;
        y = event.offsetY;
      }

      // returns coords relative to canvas container
      // var offset = _findPos(event.target, this.$canvasContainer.get(0));
      var offset = this._findPos($(event.target), this.$canvasContainer);
      x += offset[0];
      y += offset[1];

      return [x, y];
    },

    dif: function (event) {
      var c = this.getEventCoords(event);
      return [c[0] - this.p0.x, c[1] - this.p0.y];
    },

    changeRoiCSS: function (dx, dy, dw, dh) {
      var x, y, w, h;
      var r = {};
      if (dx != null) {
        r.left = this.rect0.x + dx;
        r.left = Math.max(r.left, 0);
      }

      if (dy != null) {
        r.top = this.rect0.y + dy;
        r.top = Math.max(r.top, 0);
      }

      if (dw != null) {
        r.width = this.rect0.w + dw;
      }

      if (dh != null) {
        r.height = this.rect0.h + dh;
      }

      this.$roi.css(r);
    },

    // utility function
    _findPos: function ($obj, $tillObj) {
      var curLeft = 0;
      var curTop = 0;
      while ($obj.parent()) {
        var p = $obj.position();
        curLeft += p.left;
        curTop += p.top;
        $obj = $obj.parent();
        if ($obj.is($tillObj))
          break;
      }
      return [curLeft, curTop];
    }

  }; // END of RoiSelector


  // init the cropper
  _init(canvasSelector);

  // INTERFACE functions
  return {
    open: open,
    save: save,
    onImageFileSelection: onImageFileSelection,
    crop: crop,
    box: box
  }

}
