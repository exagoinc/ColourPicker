var ColourPicker = (function () {
    function ColourPicker(container, onChange, options) {
        if (options === void 0) { options = new ColourPickerOptions(); }
        var _this = this;
        this.container = container;
        this.onChange = onChange;
        this.options = options;
        if (this.container == null)
            throw new Error('Colour Picker Error: specified container is null.');
        if (this.onChange == null)
            throw new Error('Colour Picker Error: specified onChange callback is null.');
        var docFragment = document.createDocumentFragment();
        this.colourField = this.CreateColourField();
        this.colourFieldMarker = this.colourField.querySelector('.colour-field__marker');
        docFragment.appendChild(this.colourField);
        this.hueSlider = this.CreateHueSlider();
        this.hueSliderHandle = this.hueSlider.querySelector('.hue-slider__handle');
        docFragment.appendChild(this.hueSlider);
        var valueInputContainer = this.CreateValueInputs();
        docFragment.appendChild(valueInputContainer);
        this.defaultColoursPalette = this.CreateDefaultColoursPalette();
        docFragment.appendChild(this.defaultColoursPalette);
        this.container.classList.add('colour-picker');
        this.container.appendChild(docFragment);
        this.container.addEventListener('mousedown', function (evt) { _this.ColourFieldMouseDown(evt); });
        this.container.addEventListener('touchstart', function (evt) { _this.ColourFieldMouseDown(evt); });
        var initialColour = this.options.initialColour;
        this.UpdateHexInput(initialColour.GetHex());
        this.UpdateRGBAInput(initialColour.GetRGBA());
        window.setTimeout(function () {
            _this.UpdateColourField(initialColour.GetHSV(), initialColour.ToCssString());
        }, 0);
    }
    ColourPicker.prototype.GetColour = function () {
        return new Colour(this.GetRGBAFromInputs());
    };
    ColourPicker.prototype.SetColour = function (colour) {
        var _this = this;
        this.UpdateHexInput(colour.GetHex());
        this.UpdateRGBAInput(colour.GetRGBA());
        window.setTimeout(function () {
            _this.UpdateColourField(colour.GetHSV(), colour.ToCssString());
        }, 0);
    };
    ColourPicker.prototype.CreateColourField = function () {
        var colourField = document.createElement('div');
        colourField.classList.add('colour-field');
        var lightnessGradient = document.createElement('div');
        lightnessGradient.classList.add('colour-field__lightness');
        colourField.appendChild(lightnessGradient);
        this.fieldMarker = document.createElement('div');
        this.fieldMarker.classList.add('colour-field__marker');
        colourField.appendChild(this.fieldMarker);
        return colourField;
    };
    ColourPicker.prototype.ColourFieldMouseDown = function (evt) {
        var _this = this;
        if (evt.target !== this.colourField && evt.target !== this.fieldMarker)
            return;
        this.colourField.style.cursor = 'none';
        var hsv = this.SetColourFieldHSV(evt);
        this.OnChange(hsv);
        var mouseMoveCallback = function (event) {
            var newHSV = _this.SetColourFieldHSV(event);
            _this.OnChange(newHSV);
            event.preventDefault();
        };
        var mouseUpCallback = function () {
            _this.colourField.style.cursor = 'default';
            window.removeEventListener('mousemove', mouseMoveCallback);
            window.removeEventListener('touchmove', mouseMoveCallback);
            window.removeEventListener('mouseup', mouseUpCallback);
            window.removeEventListener('touchend', mouseUpCallback);
        };
        window.addEventListener('mousemove', mouseMoveCallback);
        window.addEventListener('touchmove', mouseMoveCallback);
        window.addEventListener('mouseup', mouseUpCallback);
        window.addEventListener('touchend', mouseUpCallback);
        evt.preventDefault();
    };
    ColourPicker.prototype.GetColourFieldHSV = function (x, y) {
        var colourFieldBoundingBox = this.colourField.getBoundingClientRect();
        return {
            H: this.hueSliderHandle.offsetLeft / this.hueSlider.clientWidth,
            S: x / colourFieldBoundingBox.width,
            V: 1 - y / colourFieldBoundingBox.height,
        };
    };
    ColourPicker.prototype.SetColourFieldHSV = function (evt) {
        var colourFieldBoundingBox = this.colourField.getBoundingClientRect();
        var mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : evt.targetTouches.item(0).clientX, colourFieldBoundingBox.left);
        mouseX = Math.min(mouseX, colourFieldBoundingBox.right);
        var mouseY = Math.max(evt instanceof MouseEvent ? evt.clientY : evt.targetTouches.item(0).clientY, colourFieldBoundingBox.top);
        mouseY = Math.min(mouseY, colourFieldBoundingBox.bottom);
        var colourFieldX = mouseX - colourFieldBoundingBox.left;
        var colourFieldY = mouseY - colourFieldBoundingBox.top;
        return this.GetColourFieldHSV(colourFieldX, colourFieldY);
    };
    ColourPicker.prototype.CreateHueSlider = function () {
        var _this = this;
        var hueSlider = document.createElement('div');
        hueSlider.classList.add('hue-slider');
        var hueSliderGradient = document.createElement('div');
        hueSliderGradient.classList.add('hue-slider__gradient');
        hueSlider.appendChild(hueSliderGradient);
        hueSliderGradient.addEventListener('mousedown', function (evt) { _this.HueSliderMouseDown(evt); });
        hueSliderGradient.addEventListener('touchstart', function (evt) { _this.HueSliderMouseDown(evt); });
        var hueSliderHandle = document.createElement('div');
        hueSliderHandle.classList.add('hue-slider__handle');
        hueSlider.appendChild(hueSliderHandle);
        return hueSlider;
    };
    ColourPicker.prototype.HueSliderMouseDown = function (evt) {
        var _this = this;
        this.UpdateHueSliderHandle(evt);
        var markerX = this.colourFieldMarker.offsetLeft + this.colourFieldMarker.offsetWidth / 2;
        var markerY = this.colourFieldMarker.offsetTop + this.colourFieldMarker.offsetHeight / 2;
        var hsv = this.GetColourFieldHSV(markerX, markerY);
        this.OnChange(hsv);
        window.getSelection().removeAllRanges();
        var mouseMoveCallback = function (event) {
            _this.UpdateHueSliderHandle(event);
            var newMarkerX = _this.colourFieldMarker.offsetLeft + _this.colourFieldMarker.offsetWidth / 2;
            var newMarkerY = _this.colourFieldMarker.offsetTop + _this.colourFieldMarker.offsetHeight / 2;
            var newHSV = _this.GetColourFieldHSV(newMarkerX, newMarkerY);
            _this.OnChange(newHSV);
            event.preventDefault();
        };
        var mouseUpCallback = function () {
            window.removeEventListener('mousemove', mouseMoveCallback);
            window.removeEventListener('touchmove', mouseMoveCallback);
            window.removeEventListener('mouseup', mouseUpCallback);
            window.removeEventListener('touchend', mouseUpCallback);
        };
        window.addEventListener('mousemove', mouseMoveCallback);
        window.addEventListener('touchmove', mouseMoveCallback);
        window.addEventListener('mouseup', mouseUpCallback);
        window.addEventListener('touchend', mouseUpCallback);
        evt.preventDefault();
    };
    ColourPicker.prototype.UpdateHueSliderHandle = function (evt) {
        var hueSliderBoundingBox = this.hueSlider.getBoundingClientRect();
        var mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : evt.targetTouches.item(0).clientX, hueSliderBoundingBox.left);
        mouseX = Math.min(mouseX, hueSliderBoundingBox.right);
        this.hueSliderHandle.style.left = mouseX - hueSliderBoundingBox.left + 'px';
    };
    ColourPicker.prototype.CreateValueInputs = function () {
        var _this = this;
        var valueInputContainer = document.createElement('div');
        valueInputContainer.classList.add('colour-inputs');
        var hexInputItem = this.CreateHexInput();
        valueInputContainer.appendChild(hexInputItem);
        this.hexInput.addEventListener('keypress', function () {
            requestAnimationFrame(function () {
                var strippedValue = _this.hexInput.value.replace(/[^0-9ABCDEF]/gi, '');
                strippedValue = '#' + strippedValue.substr(0, 8);
                _this.hexInput.value = strippedValue;
                _this.OnChange(strippedValue);
            });
        });
        var rInputItem = this.CreateIntegerInput(cpEnumRGBA.Red, this.options.redInputLabel);
        this.redInput = rInputItem.querySelector('input');
        valueInputContainer.appendChild(rInputItem);
        this.redInput.addEventListener('keypress', function () {
            requestAnimationFrame(function () {
                _this.redInput.value = _this.redInput.value.replace(/[^0-9]/g, '');
                _this.OnChange(_this.GetRGBAFromInputs());
            });
        });
        var gInputItem = this.CreateIntegerInput(cpEnumRGBA.Green, this.options.greenInputLabel);
        this.greenInput = gInputItem.querySelector('input');
        valueInputContainer.appendChild(gInputItem);
        this.greenInput.addEventListener('keypress', function () {
            requestAnimationFrame(function () {
                _this.greenInput.value = _this.greenInput.value.replace(/[^0-9]/g, '');
                _this.OnChange(_this.GetRGBAFromInputs());
            });
        });
        var bInputItem = this.CreateIntegerInput(cpEnumRGBA.Blue, this.options.blueInputLabel);
        this.blueInput = bInputItem.querySelector('input');
        valueInputContainer.appendChild(bInputItem);
        this.blueInput.addEventListener('keypress', function () {
            requestAnimationFrame(function () {
                _this.blueInput.value = _this.blueInput.value.replace(/[^0-9]/g, '');
                _this.OnChange(_this.GetRGBAFromInputs());
            });
        });
        if (this.options.showAlphaControl) {
            var aInputItem = this.CreateIntegerInput(cpEnumRGBA.Alpha, this.options.alphaInputLabel);
            this.alphaInput = aInputItem.querySelector('input');
            valueInputContainer.appendChild(aInputItem);
            this.alphaInput.addEventListener('keypress', function () {
                requestAnimationFrame(function () {
                    _this.alphaInput.value = _this.alphaInput.value.replace(/[^0-9]/g, '');
                    _this.OnChange(_this.GetRGBAFromInputs());
                });
            });
        }
        return valueInputContainer;
    };
    ColourPicker.prototype.GetRGBAFromInputs = function () {
        var r = Math.round(parseInt(this.redInput.value, 10));
        r = Math.max(Math.min(r, 255), 0);
        var g = Math.round(parseInt(this.greenInput.value, 10));
        g = Math.max(Math.min(g, 255), 0);
        var b = Math.round(parseInt(this.blueInput.value, 10));
        b = Math.max(Math.min(b, 255), 0);
        var a = Math.round(this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 100);
        a = Math.max(Math.min(a, 100), 0);
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a))
            return null;
        return { R: r, G: g, B: b, A: a };
    };
    ColourPicker.prototype.CreateHexInput = function () {
        var hexInputContainer = document.createElement('div');
        hexInputContainer.classList.add('colour-input');
        this.hexInput = document.createElement('input');
        this.hexInput.classList.add('colour-input__hex');
        this.hexInput.setAttribute('spellcheck', 'false');
        hexInputContainer.appendChild(this.hexInput);
        var hexInputLbl = document.createElement('span');
        hexInputLbl.classList.add('colour-input__lbl');
        hexInputLbl.innerText = this.options.hexInputLabel;
        hexInputContainer.appendChild(hexInputLbl);
        return hexInputContainer;
    };
    ColourPicker.prototype.CreateIntegerInput = function (inputType, label) {
        var _this = this;
        var intInputContainer = document.createElement('div');
        intInputContainer.classList.add('colour-input');
        var intInput = document.createElement('input');
        intInput.classList.add('colour-input__int--' + inputType);
        intInputContainer.appendChild(intInput);
        var intInputLbl = document.createElement('span');
        intInputLbl.classList.add('colour-input__lbl');
        intInputLbl.innerText = label;
        intInputLbl.style.cursor = 'ew-resize';
        intInputLbl.addEventListener('mousedown', function (evt) {
            var maxValue = inputType === cpEnumRGBA.Alpha ? 100 : 255;
            _this.IntegerInputMouseDown(evt, intInput, maxValue);
        });
        intInputContainer.appendChild(intInputLbl);
        return intInputContainer;
    };
    ColourPicker.prototype.CreateDefaultColoursPalette = function () {
        var _this = this;
        var defaultColoursPalette = document.createElement('div');
        defaultColoursPalette.classList.add('default-colours');
        defaultColoursPalette.classList.add('colour-palette');
        this.options.defaultColours.forEach(function (colourRow) {
            var colourPaletteRow = document.createElement('div');
            colourPaletteRow.classList.add('colour-palette__row');
            colourRow.forEach(function (colour) {
                var colourOption = document.createElement('div');
                colourOption.classList.add('colour-option');
                colourOption.style.backgroundColor = colour.ToCssString(true);
                if (colour.GetHSL().L > 0.9)
                    colourOption.style.border = '1px solid rgba(200, 200, 200, 0.5)';
                colourOption.addEventListener('click', function () {
                    _this.SetColour(colour);
                    _this.onChange(colour);
                });
                colourPaletteRow.appendChild(colourOption);
            });
            defaultColoursPalette.appendChild(colourPaletteRow);
        });
        return defaultColoursPalette;
    };
    ColourPicker.prototype.IntegerInputMouseDown = function (evt, intInput, maxValue) {
        var _this = this;
        var baseInt = parseInt(intInput.value, 10);
        var baseX = evt.clientX;
        var mouseMoveCallback = function (event) {
            var intChange = Math.floor((event.clientX - baseX) / 2);
            var newValue = Math.max(Math.min(baseInt + intChange, maxValue), 0);
            intInput.value = newValue.toString();
            _this.OnChange({
                R: parseInt(_this.redInput.value, 10),
                G: parseInt(_this.greenInput.value, 10),
                B: parseInt(_this.blueInput.value, 10),
                A: _this.alphaInput != null ? parseInt(_this.alphaInput.value, 10) : 100,
            });
            event.preventDefault();
        };
        var mouseUpCallback = function () {
            window.removeEventListener('mousemove', mouseMoveCallback);
            window.removeEventListener('mouseup', mouseUpCallback);
        };
        window.addEventListener('mousemove', mouseMoveCallback);
        window.addEventListener('mouseup', mouseUpCallback);
        evt.preventDefault();
    };
    ColourPicker.prototype.OnChange = function (colour) {
        if (colour == null)
            return false;
        var newColour = new Colour();
        if (typeof colour === 'string') {
            if (!newColour.SetHex(colour))
                return false;
            if (this.options.showAlphaControl && newColour.GetRGBA().A === null)
                newColour.SetAlpha(parseInt(this.alphaInput.value, 10));
            this.UpdateHexInput(colour);
            this.UpdateRGBAInput(newColour.GetRGBA());
            this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
        }
        else if (colour.hasOwnProperty('R')) {
            newColour.SetRGBA(colour);
            this.UpdateHexInput(newColour.GetHex());
            this.UpdateRGBAInput(colour);
            this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
        }
        else if (colour.hasOwnProperty('H')) {
            newColour.SetHSV(colour);
            if (this.options.showAlphaControl)
                newColour.SetAlpha(parseInt(this.alphaInput.value, 10));
            this.UpdateHexInput(newColour.GetHex());
            this.UpdateRGBAInput(newColour.GetRGBA());
            this.UpdateColourField(colour, newColour.ToCssString());
        }
        this.onChange(newColour);
        return true;
    };
    ColourPicker.prototype.UpdateHexInput = function (hex) {
        this.hexInput.value = hex;
    };
    ColourPicker.prototype.UpdateRGBAInput = function (rgba) {
        this.redInput.value = rgba.R.toString();
        this.greenInput.value = rgba.G.toString();
        this.blueInput.value = rgba.B.toString();
        if (this.alphaInput != null)
            this.alphaInput.value = rgba.A.toString();
    };
    ColourPicker.prototype.UpdateColourField = function (hsv, cssString) {
        var markerBoundingBox = this.colourFieldMarker.getBoundingClientRect();
        this.colourFieldMarker.style.left = "calc(" + (hsv.S * 100) + "% - " + markerBoundingBox.width / 2 + "px)";
        this.colourFieldMarker.style.bottom = "calc(" + (hsv.V * 100) + "% - " + markerBoundingBox.height / 2 + "px)";
        this.colourFieldMarker.style.backgroundColor = cssString;
        this.hueSliderHandle.style.left = (hsv.H * 100) + '%';
        var hueHex = new Colour({ H: hsv.H, S: 1, V: 1 }).GetHex();
        this.colourField.style.background = "linear-gradient(to right, #FFF, " + hueHex + ")";
    };
    return ColourPicker;
}());
export { ColourPicker };
var ColourPickerOptions = (function () {
    function ColourPickerOptions() {
        this.initialColour = new Colour({ R: 255, G: 0, B: 0, A: 100 });
        this.showAlphaControl = false;
        this.defaultColours = [[]];
        this.showRecentColours = false;
        this.hexInputLabel = 'Hex';
        this.redInputLabel = 'R';
        this.greenInputLabel = 'G';
        this.blueInputLabel = 'B';
        this.alphaInputLabel = 'A';
    }
    return ColourPickerOptions;
}());
export { ColourPickerOptions };
var Colour = (function () {
    function Colour(colour) {
        this.R = 255;
        this.G = 255;
        this.B = 255;
        this.A = 100;
        if (colour != null) {
            if (colour instanceof String || typeof colour === 'string')
                this.SetHex(colour);
            else if (colour.hasOwnProperty('R'))
                this.SetRGBA(colour);
            else if (colour.hasOwnProperty('V'))
                this.SetHSV(colour);
            else if (colour.hasOwnProperty('L'))
                this.SetHSL(colour);
        }
    }
    Colour.prototype.SetRGBA = function (rgba) {
        this.R = rgba.R;
        this.G = rgba.G;
        this.B = rgba.B;
        this.A = rgba.A;
    };
    Colour.prototype.SetAlpha = function (alpha) {
        this.A = alpha;
    };
    Colour.prototype.SetHex = function (hex) {
        if (hex.length === 0)
            return false;
        if (hex[0] === '#')
            hex = hex.substring(1);
        if (hex.length === 3)
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length === 6 || hex.length === 8) {
            this.R = parseInt(hex.substr(0, 2), 16);
            this.G = parseInt(hex.substr(2, 2), 16);
            this.B = parseInt(hex.substr(4, 2), 16);
            if (hex.length === 8) {
                var parsedInt = parseInt(hex.substr(6, 2), 16);
                this.A = Math.round(parsedInt / 2.55);
            }
            else {
                this.A = 100;
            }
        }
        else {
            return false;
        }
        return true;
    };
    Colour.prototype.SetHSV = function (hsv) {
        var hueSector = Math.floor(hsv.H * 6);
        var hueSectorOffset = hsv.H * 6 - hueSector;
        var p = hsv.V * (1 - hsv.S);
        p = Math.round(p * 255);
        var q = hsv.V;
        if (hueSector % 2 === 0)
            q *= (1 - (1 - hueSectorOffset) * hsv.S);
        else
            q *= 1 - hueSectorOffset * hsv.S;
        q = Math.round(q * 255);
        var v = Math.round(hsv.V * 255);
        switch (hueSector % 6) {
            case 0:
                this.R = v, this.G = q, this.B = p;
                break;
            case 1:
                this.R = q, this.G = v, this.B = p;
                break;
            case 2:
                this.R = p, this.G = v, this.B = q;
                break;
            case 3:
                this.R = p, this.G = q, this.B = v;
                break;
            case 4:
                this.R = q, this.G = p, this.B = v;
                break;
            case 5:
                this.R = v, this.G = p, this.B = q;
                break;
            default:
                this.R = 0;
                this.G = 0;
                this.B = 0;
        }
    };
    Colour.prototype.SetHSL = function (hsl) {
        var huePrime = hsl.H * 6;
        var c = (1 - Math.abs(2 * hsl.L - 1)) * hsl.S;
        var x = c * (1 - Math.abs(huePrime % 2 - 1));
        var hueSector = Math.floor(huePrime);
        var r, g, b;
        switch (hueSector % 6) {
            case 0:
                r = c, g = x, b = 0;
                break;
            case 1:
                r = x, g = c, b = 0;
                break;
            case 2:
                r = 0, g = c, b = x;
                break;
            case 3:
                r = 0, g = x, b = c;
                break;
            case 4:
                r = x, g = 0, b = c;
                break;
            case 5:
                r = c, g = 0, b = x;
                break;
            default:
                r = 0;
                g = 0;
                b = 0;
        }
        var m = hsl.L - c / 2;
        this.R = (r + m) * 255;
        this.G = (g + m) * 255;
        this.B = (b + m) * 255;
    };
    Colour.prototype.ToCssString = function (includeAlpha) {
        if (includeAlpha === void 0) { includeAlpha = false; }
        var str = includeAlpha ? 'rgba(' : 'rgb(';
        str += this.R + ', ' + this.G + ', ' + this.B;
        str += includeAlpha ? ', ' + this.A + '%)' : ')';
        return str;
    };
    Colour.prototype.GetRGBA = function () {
        return { R: this.R, G: this.G, B: this.B, A: this.A };
    };
    Colour.prototype.GetHex = function (includeAlpha) {
        if (includeAlpha === void 0) { includeAlpha = false; }
        var hex = '#' + this.DecimalToHex(this.R) + this.DecimalToHex(this.G) + this.DecimalToHex(this.B);
        hex += includeAlpha ? this.DecimalToHex(this.A * 2.55) : '';
        return hex;
    };
    Colour.prototype.GetHSV = function () {
        var r = this.R / 255;
        var g = this.G / 255;
        var b = this.B / 255;
        var hsv = { H: 0, S: 0, V: 0 };
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var delta = max - min;
        hsv.V = max;
        hsv.S = max === 0 ? 0 : delta / max;
        hsv.H = this.HueFromRGB(r, g, b, max, delta);
        return hsv;
    };
    Colour.prototype.GetHSL = function () {
        var r = this.R / 255;
        var g = this.G / 255;
        var b = this.B / 255;
        var hsl = { H: 0, S: 0, L: 0 };
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var delta = max - min;
        hsl.L = (max + min) / 2;
        if (delta === 0)
            return hsl;
        if (hsl.L > 0.5)
            hsl.S = delta / (2 - max - min);
        else
            hsl.S = delta / (max + min);
        hsl.H = this.HueFromRGB(r, g, b, max, delta);
        return hsl;
    };
    Colour.prototype.HueFromRGB = function (r, g, b, max, delta) {
        var h;
        if (r === max) {
            var deltaOffset = g < b ? 6 : 0;
            h = (delta + deltaOffset === 0) ? 0 : (g - b) / delta + deltaOffset;
        }
        else if (g === max) {
            h = (b - r) / delta + 2;
        }
        else if (b === max) {
            h = (r - g) / delta + 4;
        }
        return h / 6;
    };
    Colour.prototype.DecimalToHex = function (decimal) {
        var hex = decimal.toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    };
    return Colour;
}());
export { Colour };
var cpEnumRGBA;
(function (cpEnumRGBA) {
    cpEnumRGBA["Red"] = "r";
    cpEnumRGBA["Green"] = "g";
    cpEnumRGBA["Blue"] = "b";
    cpEnumRGBA["Alpha"] = "a";
})(cpEnumRGBA || (cpEnumRGBA = {}));
//# sourceMappingURL=colourpicker.js.map