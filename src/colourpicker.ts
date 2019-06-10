/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/lrvolle/ColourPicker
 */

class ColourPicker {
	private options: ColourPickerOptions;

	private container: HTMLElement;
	private fieldMarker: HTMLElement;
	private colourField: HTMLElement;
	private colourFieldMarker: HTMLElement;
	private hueSlider: HTMLElement;
	private hueSliderHandle: HTMLElement;
	private colourPreview?: HTMLElement;
	private hexInput: HTMLInputElement;
	private redInput: HTMLInputElement;
	private greenInput: HTMLInputElement;
	private blueInput: HTMLInputElement;
	private alphaInput: HTMLInputElement;

	private onChange: (colour: Colour) => void;

	constructor(container: HTMLElement,	
				onChange: (rgba: Colour) => void,
				options = new ColourPickerOptions()) {

		this.container = container;
		this.onChange = onChange;
		this.options = options;

		if (this.container == null)
			throw new Error('Colour Picker Error: specified container is null.');
		
		if (this.onChange == null)
			throw new Error('Colour Picker Error: specified onChange callback is null.');
		
		const docFragment = document.createDocumentFragment();
		
		this.CreateColourField();
		this.colourFieldMarker = <HTMLElement>this.colourField.querySelector('.colour-field__marker');
		docFragment.appendChild(this.colourField);

		this.CreateHueSlider();
		this.hueSliderHandle = <HTMLElement>this.hueSlider.querySelector('.hue-slider__handle');
		docFragment.appendChild(this.hueSlider);

		const valueInputContainer = this.CreateValueInputs();
		docFragment.appendChild(valueInputContainer);

		this.colourPreview = document.createElement('div');
		docFragment.appendChild(this.colourPreview);

		this.container.classList.add('colour-picker');
		this.container.appendChild(docFragment);

		this.container.addEventListener('mousedown', (evt) => { this.ColourFieldMouseDown(evt); });
		this.container.addEventListener('touchstart', (evt) => { this.ColourFieldMouseDown(evt); });

		const initialColour = this.options.initialColour;
		this.UpdateHexInput(initialColour.GetHex());
		this.UpdateRGBAInput(initialColour.GetRGBA());

		// Wait for first paint to update the colour field, because the marker's height/width is needed
		window.setTimeout(() => {
			this.UpdateColourField(initialColour.GetHSV(), initialColour.ToCssString());
		}, 0);
	}

	public GetColour(): Colour {
		return new Colour(this.GetRGBAFromInputs());
	}

	public SetColour(colour: Colour): void {
		this.UpdateHexInput(colour.GetHex());
		this.UpdateRGBAInput(colour.GetRGBA());

		// Wait for first paint to update the colour field, because the marker's height/width is needed
		window.setTimeout(() => {
			this.UpdateColourField(colour.GetHSV(), colour.ToCssString());
		}, 0);
	}

	/** 
	 * Creates and returns a rectangular Colour Field, with a movable marker
	 * and gradients representing lightness & saturation.
	 */
	private CreateColourField(): void {
		this.colourField = document.createElement('div');
		this.colourField.classList.add('colour-field');
		
		const lightnessGradient = document.createElement('div');
		lightnessGradient.classList.add('colour-field__lightness');
		this.colourField.appendChild(lightnessGradient);

		this.fieldMarker = document.createElement('div');
		this.fieldMarker.classList.add('colour-field__marker');
		this.colourField.appendChild(this.fieldMarker);
	}
	
	private ColourFieldMouseDown(evt: MouseEvent | TouchEvent): void {
		// Allow dragging to begin only from the color field or
		// the field marker.
		if (evt.target !== this.colourField && evt.target !== this.fieldMarker)
			return;
		
		this.colourField.style.cursor = 'none';

		const hsv = this.SetColourFieldHSV(evt);
		this.OnChange(hsv);

		const mouseMoveCallback = (event: MouseEvent | TouchEvent) => { 
			const newHSV = this.SetColourFieldHSV(event);
			this.OnChange(newHSV);

			event.preventDefault();
		};
		const mouseUpCallback = () => { 
			this.colourField.style.cursor = 'default';
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
	}

	private GetColourFieldHSV(x: number, y: number): cpHSV {
		const colourFieldBoundingBox = this.colourField.getBoundingClientRect();
		return { 
			H: this.hueSliderHandle.offsetLeft / this.hueSlider.clientWidth,
			S: x / colourFieldBoundingBox.width,
			V: 1 - y / colourFieldBoundingBox.height,
		};
	}

	private SetColourFieldHSV(evt: MouseEvent | TouchEvent): cpHSV {
		const colourFieldBoundingBox = this.colourField.getBoundingClientRect();
		let mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : evt.targetTouches.item(0).clientX, colourFieldBoundingBox.left); 
		mouseX = Math.min(mouseX, colourFieldBoundingBox.right);
		let mouseY = Math.max(evt instanceof MouseEvent ? evt.clientY : evt.targetTouches.item(0).clientY, colourFieldBoundingBox.top); 
		mouseY = Math.min(mouseY, colourFieldBoundingBox.bottom);

		const colourFieldX = mouseX - colourFieldBoundingBox.left;
		const colourFieldY = mouseY - colourFieldBoundingBox.top;
		return this.GetColourFieldHSV(colourFieldX, colourFieldY);
	}

	private CreateHueSlider(): void {
		this.hueSlider = document.createElement('div');
		this.hueSlider.classList.add('hue-slider');

		const hueSliderGradient = document.createElement('div');
		hueSliderGradient.classList.add('hue-slider__gradient');
		this.hueSlider.appendChild(hueSliderGradient);
		hueSliderGradient.addEventListener('mousedown', (evt) => { this.HueSliderMouseDown(evt); });
		hueSliderGradient.addEventListener('touchstart', (evt) => { this.HueSliderMouseDown(evt); });

		const hueSliderHandle = document.createElement('div');
		hueSliderHandle.classList.add('hue-slider__handle');
		this.hueSlider.appendChild(hueSliderHandle);
	}

	private HueSliderMouseDown (evt: MouseEvent | TouchEvent): void {
		this.UpdateHueSliderHandle(evt);

		const markerX = this.colourFieldMarker.offsetLeft + this.colourFieldMarker.offsetWidth / 2;
		const markerY = this.colourFieldMarker.offsetTop + this.colourFieldMarker.offsetHeight / 2;
		const hsv = this.GetColourFieldHSV(markerX, markerY);
		this.OnChange(hsv);

		window.getSelection().removeAllRanges();

		const mouseMoveCallback = (event: MouseEvent | TouchEvent) => { 
			this.UpdateHueSliderHandle(event);

			const newMarkerX = this.colourFieldMarker.offsetLeft + this.colourFieldMarker.offsetWidth / 2;
			const newMarkerY = this.colourFieldMarker.offsetTop + this.colourFieldMarker.offsetHeight / 2;
			const newHSV = this.GetColourFieldHSV(newMarkerX, newMarkerY);
			this.OnChange(newHSV);

			event.preventDefault();			
		};
		const mouseUpCallback = () => { 
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
	}

	private UpdateHueSliderHandle(evt: MouseEvent | TouchEvent) {
		const hueSliderBoundingBox = this.hueSlider.getBoundingClientRect();
		let mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : evt.targetTouches.item(0).clientX, hueSliderBoundingBox.left); 
		mouseX = Math.min(mouseX, hueSliderBoundingBox.right);

		this.hueSliderHandle.style.left = mouseX - hueSliderBoundingBox.left + 'px';
	}

	private CreateValueInputs(): HTMLElement {
		const valueInputContainer = document.createElement('div');
		valueInputContainer.classList.add('colour-inputs');

		const hexInputItem = this.CreateHexInput();
		valueInputContainer.appendChild(hexInputItem);
		this.hexInput.addEventListener('keypress', () => {
			requestAnimationFrame(() => {
				let strippedValue = this.hexInput.value.replace(/[^0-9ABCDEF]/gi, '');
				strippedValue = '#' + strippedValue.substr(0, 8); // Max length of 8 characters without #
				this.hexInput.value = strippedValue;
				this.OnChange(strippedValue);
			});
		});

		const rInputItem = this.CreateIntegerInput(cpEnumRGBA.Red, this.options.redInputLabel);
		this.redInput = rInputItem.querySelector('input');
		valueInputContainer.appendChild(rInputItem);
		this.redInput.addEventListener('keypress', () => {
			requestAnimationFrame(() => {
				this.redInput.value = this.redInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		const gInputItem = this.CreateIntegerInput(cpEnumRGBA.Green, this.options.greenInputLabel);
		this.greenInput = gInputItem.querySelector('input');
		valueInputContainer.appendChild(gInputItem);
		this.greenInput.addEventListener('keypress', () => {
			requestAnimationFrame(() => {
				this.greenInput.value = this.greenInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		const bInputItem = this.CreateIntegerInput(cpEnumRGBA.Blue, this.options.blueInputLabel);
		this.blueInput = bInputItem.querySelector('input');
		valueInputContainer.appendChild(bInputItem);
		this.blueInput.addEventListener('keypress', () => {
			requestAnimationFrame(() => {
				this.blueInput.value = this.blueInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		if (this.options.showAlphaControl) {
			const aInputItem = this.CreateIntegerInput(cpEnumRGBA.Alpha, this.options.alphaInputLabel);
			this.alphaInput = aInputItem.querySelector('input');
			valueInputContainer.appendChild(aInputItem);
			this.alphaInput.addEventListener('keypress', () => {
				requestAnimationFrame(() => {
					this.alphaInput.value = this.alphaInput.value.replace(/[^0-9]/g, '');
					this.OnChange(this.GetRGBAFromInputs());
				});
			});
		}

		return valueInputContainer;
	}

	private GetRGBAFromInputs(): cpRGBA {
		let r = Math.round(parseInt(this.redInput.value, 10));
		r = Math.max(Math.min(r, 255), 0);

		let g = Math.round(parseInt(this.greenInput.value, 10));
		g = Math.max(Math.min(g, 255), 0);

		let b = Math.round(parseInt(this.blueInput.value, 10));
		b = Math.max(Math.min(b, 255), 0);

		let a = Math.round(this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 100);
		a = Math.max(Math.min(a, 100), 0);
		
		if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a))
			return null;

		return { R: r, G: g, B: b, A: a };
	}
	
	private CreateHexInput(): HTMLElement {
		const hexInputContainer = document.createElement('div'); 
		hexInputContainer.classList.add('colour-input');

		this.hexInput = document.createElement('input'); 
		this.hexInput.classList.add('colour-input__hex');
		this.hexInput.setAttribute("spellcheck", "false");
		hexInputContainer.appendChild(this.hexInput);

		const hexInputLbl = document.createElement('span'); 
		hexInputLbl.classList.add('colour-input__lbl');
		hexInputLbl.innerText = this.options.hexInputLabel;
		hexInputContainer.appendChild(hexInputLbl);

		return hexInputContainer;
	}

	private CreateIntegerInput(inputType: cpEnumRGBA, label: string): HTMLElement {
		const intInputContainer = document.createElement('div'); 
		intInputContainer.classList.add('colour-input');

		const intInput = document.createElement('input'); 
		intInput.classList.add('colour-input__int--' + inputType);
		intInputContainer.appendChild(intInput);

		const intInputLbl = document.createElement('span'); 
		intInputLbl.classList.add('colour-input__lbl');
		intInputLbl.innerText = label;
		intInputLbl.style.cursor = 'ew-resize';
		intInputLbl.addEventListener('mousedown', (evt) => {
			const maxValue = inputType === cpEnumRGBA.Alpha ? 100 : 255;
			this.IntegerInputMouseDown(evt, intInput, maxValue);
		});
		intInputContainer.appendChild(intInputLbl);

		return intInputContainer;
	}

	private IntegerInputMouseDown(evt: MouseEvent, intInput: HTMLInputElement, maxValue: number): void {
		const baseInt = parseInt(intInput.value, 10);
		const baseX = evt.clientX;

		const mouseMoveCallback = (event: MouseEvent) => { 
			const intChange = Math.floor((event.clientX - baseX) / 2);
			const newValue = Math.max(Math.min(baseInt + intChange, maxValue), 0);
			intInput.value = newValue.toString();

			this.OnChange({
				R: parseInt(this.redInput.value, 10),
				G: parseInt(this.greenInput.value, 10),
				B: parseInt(this.blueInput.value, 10),
				A: this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 100,
			});
			
			event.preventDefault();
		};
		const mouseUpCallback = () => { 
			window.removeEventListener('mousemove', mouseMoveCallback);
			window.removeEventListener('mouseup', mouseUpCallback);
		};
		window.addEventListener('mousemove', mouseMoveCallback);
		window.addEventListener('mouseup', mouseUpCallback);

		evt.preventDefault();		
	}

	private OnChange(colour: string | cpRGBA | cpHSV): boolean {
		if (colour == null)
			return false;
		
		const newColour = new Colour();
		if (typeof colour === 'string') {
			if (!newColour.SetHex(colour))
				return false;

			if (this.options.showAlphaControl && newColour.GetRGBA().A === null)
				newColour.SetAlpha(parseInt(this.alphaInput.value, 10));

			this.UpdateHexInput(colour);
			this.UpdateRGBAInput(newColour.GetRGBA());
			this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
		} else if (colour.hasOwnProperty('R')) {
			newColour.SetRGBA(colour as cpRGBA);
			this.UpdateHexInput(newColour.GetHex());
			this.UpdateRGBAInput(colour as cpRGBA);
			this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
		} else if (colour.hasOwnProperty('H')) {
			newColour.SetHSV(colour as cpHSV);
			if (this.options.showAlphaControl)
				newColour.SetAlpha(parseInt(this.alphaInput.value, 10));

			this.UpdateHexInput(newColour.GetHex());
			this.UpdateRGBAInput(newColour.GetRGBA());
			this.UpdateColourField(colour as cpHSV, newColour.ToCssString());
		}

		this.onChange(newColour);
		return true;
	}

	private UpdateHexInput(hex: string): void {
		this.hexInput.value = hex;
	}

	private UpdateRGBAInput(rgba: cpRGBA): void {
		this.redInput.value = rgba.R.toString();
		this.greenInput.value = rgba.G.toString();
		this.blueInput.value = rgba.B.toString();

		if (this.alphaInput != null)
			this.alphaInput.value = rgba.A.toString();
	}

	private UpdateColourField(hsv: cpHSV, cssString: string): void {
		const markerBoundingBox = this.colourFieldMarker.getBoundingClientRect();
		this.colourFieldMarker.style.left = `calc(${(hsv.S * 100)}% - ${markerBoundingBox.width / 2}px)`;
		this.colourFieldMarker.style.bottom = `calc(${(hsv.V * 100)}% - ${markerBoundingBox.height / 2}px)`;
		this.colourFieldMarker.style.backgroundColor = cssString;
		
		this.hueSliderHandle.style.left = (hsv.H * 100) + '%';
		const hueHex = new Colour({ H: hsv.H, S: 1, V: 1 }).GetHex();
		this.colourField.style.background = `linear-gradient(to right, #FFF, ${hueHex})`;
	}
}

class ColourPickerOptions{
	public initialColour: Colour = new Colour({ R: 255, G: 0, B: 0, A: 100 });
	public showAlphaControl: boolean = false;

	/** Labels that appear underneath input boxes */
	public hexInputLabel: string = 'Hex';
	public redInputLabel: string = 'R';
	public greenInputLabel?: string = 'G';
	public blueInputLabel?: string = 'B';
	public alphaInputLabel?: string = 'A';
}

class Colour {
	private R: number = 255;
	private G: number = 255;
	private B: number = 255;
	private A: number = 100;

	constructor(colour?: string | cpRGBA | cpHSV) {
		if (colour != null) {
			if (colour instanceof String || typeof colour === 'string') 
				this.SetHex(colour as string);
			else if (colour.hasOwnProperty('R'))
				this.SetRGBA(colour as cpRGBA);
			else if (colour.hasOwnProperty('H'))
				this.SetHSV(colour as cpHSV);
		}
	}

	public SetRGBA(rgba: cpRGBA) {
		this.R = rgba.R;
		this.G = rgba.G;
		this.B = rgba.B;
		this.A = rgba.A;
	}

	public SetAlpha(alpha: number) {
		this.A = alpha;
	}

	public SetHex(hex: string): boolean {
		if (hex.length === 0)
			return false;

		if (hex[0] === '#')
			hex = hex.substring(1);

		if(hex.length === 3)
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		
		if (hex.length === 6 || hex.length === 8) {
			this.R = parseInt(hex.substr(0, 2), 16);
			this.G = parseInt(hex.substr(2, 2), 16);
			this.B = parseInt(hex.substr(4, 2), 16);
			// Set alpha to null if a 3 or 6 digit hex string, so that it can be grabbed from the 
			// alpha input or set to 100
			if (hex.length === 8) {
				const parsedInt = parseInt(hex.substr(6, 2), 16);
				this.A = Math.round(parsedInt / 2.55);	
			} else {
				this.A = null;
			}
		} else {
			return false;
		}
		
		return true;
	}

	public SetHSV(hsv: cpHSV): void {
		const hueSector = Math.floor(hsv.H * 6);
		const hueSectorOffset = hsv.H * 6 - hueSector;
		
		let p = hsv.V * (1 - hsv.S);
		p = Math.round(p * 255);

		let q = hsv.V;
		if (hueSector % 2 === 0) // hueSector is even
 			q *= (1 - (1 - hueSectorOffset) * hsv.S);
		else // hueSector is odd
			q *= 1 - hueSectorOffset * hsv.S;
		
		q = Math.round(q * 255);

		const v = Math.round(hsv.V * 255);
		
		switch (hueSector % 6) {
			case 0: this.R = v, this.G = q, this.B = p; break;
			case 1: this.R = q, this.G = v, this.B = p; break;
			case 2: this.R = p, this.G = v, this.B = q; break;
			case 3: this.R = p, this.G = q, this.B = v; break;
			case 4: this.R = q, this.G = p, this.B = v; break;
			case 5: this.R = v, this.G = p, this.B = q; break;
			default: 
				this.R = 0; this.G = 0; this.B = 0;
		}
	}

	public ToCssString(includeAlpha = false): string {
		let str = includeAlpha ? 'rgba(' : 'rgb(';
		str += this.R + ', ' + this.G + ', ' + this.B;
		str += includeAlpha ? ', ' + this.A + '%)' : ')';
		return str;
	}

	public GetRGBA(): cpRGBA {
		return { R: this.R, G: this.G, B: this.B, A: this.A };
	}
	
	public GetHex(includeAlpha = false): string {
		let hex = '#' + this.DecimalToHex(this.R) + this.DecimalToHex(this.G) + this.DecimalToHex(this.B);
		hex += includeAlpha ? this.DecimalToHex(this.A * 2.55) : '';
		return hex;
	}

	public GetHSV(): cpHSV {
		const r = this.R / 255;
		const g = this.G / 255;
		const b = this.B / 255;
		const hsv = { H: 0, S: 0, V: 0 };

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;
		
		hsv.V = max;
		hsv.S = max === 0 ? 0 : delta / max;
		
		if (r === max) {
			const deltaOffset = g < b ? 6 : 0;
			hsv.H = (delta + deltaOffset === 0) ? 0 : (g - b) / delta + deltaOffset;
		} else if (g === max) {
			hsv.H = (b - r) / delta + 2;
		} else if (b === max) {
			hsv.H = (r - g) / delta + 4;
		}
		hsv.H = hsv.H / 6;

		return hsv;
	}

	private DecimalToHex(decimal: number) {
		const hex = decimal.toString(16).toUpperCase();
		return hex.length === 1 ? '0' + hex : hex;
	}
}

interface cpRGBA {
	R: number;
	G: number;
	B: number;
	A: number;
}

interface cpHSV {
	H: number;
	S: number;
	V: number;
}

enum cpEnumRGBA {
	Red = 'r',
	Green = 'g', 
	Blue = 'b', 
	Alpha = 'a',
}
