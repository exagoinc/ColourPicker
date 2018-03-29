/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/lrvolle/ColourPicker
 */

class ColourPicker {
	private options: ColourPickerOptions;

	private container: HTMLElement;
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

	constructor(container: HTMLElement,	onChange: (rgba: Colour) => void,
		options = new ColourPickerOptions()) {

		this.container = container;
		this.onChange = onChange;
		this.options = options;

		if (this.container == null) {
			throw new Error('Colour Picker Error: specified container is null.');
		}
		if (this.onChange == null) {
			throw new Error('Colour Picker Error: specified onChange callback is null.');
		}

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
	}

	/** 
	 * Creates and returns a rectangular Colour Field, with a movable marker
	 * and gradients representing lightness & saturation.
	 */
	CreateColourField(): void {
		this.colourField = document.createElement('div');
		this.colourField.classList.add('colour-field');
		
		const lightnessGradient = document.createElement('div');
		lightnessGradient.classList.add('colour-field__lightness');
		this.colourField.appendChild(lightnessGradient);
		lightnessGradient.addEventListener('mousedown', (evt) => { this.ColourFieldMouseDown(evt); });

		const fieldMarker = document.createElement('div');
		fieldMarker.classList.add('colour-field__marker');
		this.colourField.appendChild(fieldMarker);
	}
	
	ColourFieldMouseDown(evt: MouseEvent): void {
		this.colourField.style.cursor = 'none';

		const colourFieldBoundingBox = this.colourField.getBoundingClientRect();
		const mouseX = Math.min(evt.pageX, colourFieldBoundingBox.left);
		const mouseY = Math.min(evt.pageY, colourFieldBoundingBox.top);

		const newHSV = {
			H: this.hueSliderHandle.offsetLeft / this.hueSlider.clientWidth,
			S: (colourFieldBoundingBox.left - mouseX) / colourFieldBoundingBox.width,
			V: (colourFieldBoundingBox.top - mouseY) / colourFieldBoundingBox.height,
		};

		this.OnChange(newHSV);

		window.addEventListener('mousemove', (event: MouseEvent) => { this.ColourFieldMouseMove(<MouseEvent>event); });
		window.addEventListener('mouseup', () => { this.ColourFieldMouseUp(); });
	}
	
	ColourFieldMouseMove(evt: MouseEvent): void {
		const colourFieldBoundingBox = this.colourField.getBoundingClientRect();
		let mouseX = Math.max(evt.pageX, colourFieldBoundingBox.left); 
		mouseX = Math.min(mouseX, colourFieldBoundingBox.right);
		let mouseY = Math.max(evt.pageY, colourFieldBoundingBox.top); 
		mouseY = Math.min(mouseY, colourFieldBoundingBox.bottom);

		const newHSV = { 
			H: this.hueSliderHandle.offsetLeft / this.hueSlider.clientWidth,
			S: (mouseX - colourFieldBoundingBox.left) / colourFieldBoundingBox.width,
			V: (mouseY - colourFieldBoundingBox.top) / colourFieldBoundingBox.height,
		};

		this.OnChange(newHSV);
	}

	ColourFieldMouseUp(): void {
		this.colourField.style.cursor = 'default';

        // Remove the mousemove event listener and itself
		document.body.removeEventListener('mousemove', (evt) => { this.ColourFieldMouseMove(<MouseEvent>evt); });
		document.body.removeEventListener('mouseup', () => { this.ColourFieldMouseUp(); });
	}

	CreateHueSlider(): void {
		this.hueSlider = document.createElement('div');
		this.hueSlider.classList.add('hue-slider');

		const hueSliderGradient = document.createElement('div');
		hueSliderGradient.classList.add('hue-slider__gradient');
		this.hueSlider.appendChild(hueSliderGradient);

		const hueSliderHandle = document.createElement('div');
		hueSliderHandle.classList.add('hue-slider__handle');
		this.hueSlider.appendChild(hueSliderHandle);
	}

	CreateValueInputs(): HTMLElement {
		const valueInputContainer = document.createElement('div');
		valueInputContainer.classList.add('colour-inputs');

		const hexInputItem = this.CreateHexInput();
		valueInputContainer.appendChild(hexInputItem);
		this.hexInput.addEventListener('keypress', () => {
			this.OnChange(this.hexInput.value);
		});

		const rInputItem = this.CreateIntegerInput(cpEnumRGBA.Red, this.options.redInputLabel);
		this.redInput = rInputItem.querySelector('input');
		valueInputContainer.appendChild(rInputItem);
		this.redInput.addEventListener('keypress', () => {
			this.OnChange({ 
				R: parseInt(this.redInput.value, 10),
				G: parseInt(this.greenInput.value, 10),
				B: parseInt(this.blueInput.value, 10),
				A: this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 255,
			});
		});

		const gInputItem = this.CreateIntegerInput(cpEnumRGBA.Green, this.options.greenInputLabel);
		this.greenInput = gInputItem.querySelector('input');
		valueInputContainer.appendChild(gInputItem);
		this.greenInput.addEventListener('keypress', () => {
			this.OnChange({ 
				R: parseInt(this.redInput.value, 10),
				G: parseInt(this.greenInput.value, 10),
				B: parseInt(this.blueInput.value, 10),
				A: this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 255,
			});
		});

		const bInputItem = this.CreateIntegerInput(cpEnumRGBA.Blue, this.options.blueInputLabel);
		this.blueInput = bInputItem.querySelector('input');
		valueInputContainer.appendChild(bInputItem);
		this.blueInput.addEventListener('keypress', () => {
			this.OnChange({ 
				R: parseInt(this.redInput.value, 10),
				G: parseInt(this.greenInput.value, 10),
				B: parseInt(this.blueInput.value, 10),
				A: this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 255,
			});
		});

		if (this.options.showAlphaControl) {
			const aInputItem = this.CreateIntegerInput(cpEnumRGBA.Alpha, this.options.alphaInputLabel);
			this.alphaInput = aInputItem.querySelector('input');
			valueInputContainer.appendChild(aInputItem);
			this.alphaInput.addEventListener('keypress', () => {
				this.OnChange({ 
					R: parseInt(this.redInput.value, 10),
					G: parseInt(this.greenInput.value, 10),
					B: parseInt(this.blueInput.value, 10),
					A: this.alphaInput != null ? parseInt(this.alphaInput.value, 10) : 255,
				});
			});
		}

		return valueInputContainer;
	}
	
	CreateHexInput(): HTMLElement {
		const hexInputContainer = document.createElement('div'); 
		hexInputContainer.classList.add('colour-input');

		this.hexInput = document.createElement('input'); 
		this.hexInput.classList.add('colour-input__hex');
		hexInputContainer.appendChild(this.hexInput);

		const hexInputLbl = document.createElement('span'); 
		hexInputLbl.classList.add('colour-input__lbl');
		hexInputLbl.innerText = this.options.hexInputLabel;
		hexInputContainer.appendChild(hexInputLbl);

		return hexInputContainer;
	}

	CreateIntegerInput(inputType: cpEnumRGBA, label: string): HTMLElement {
		const intInputContainer = document.createElement('div'); 
		intInputContainer.classList.add('colour-input');

		const intInput = document.createElement('input'); 
		intInput.classList.add('colour-input__int--' + inputType);
		intInputContainer.appendChild(intInput);

		const intInputLbl = document.createElement('span'); 
		intInputLbl.classList.add('colour-input__lbl');
		intInputLbl.innerText = label;
		intInputContainer.appendChild(intInputLbl);

		return intInputContainer;
	}

	OnChange(colour: string | cpRGBA | cpHSV): boolean {
		const newColour = new Colour();
		if (typeof colour === 'string') {
			if (!newColour.SetHex(colour)) {
				return false;
			}

			this.UpdateHexInput(colour as string);
			this.UpdateRGBAInput(newColour.GetRGBA());
			this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
		} else if (colour.hasOwnProperty('R')) {
			newColour.SetRGBA(colour as cpRGBA);
			this.UpdateHexInput(newColour.GetHex());
			this.UpdateRGBAInput(colour as cpRGBA);
			this.UpdateColourField(newColour.GetHSV(), newColour.ToCssString());
		} else if (colour.hasOwnProperty('H')) {
			newColour.SetHSV(colour as cpHSV);
			this.UpdateHexInput(newColour.GetHex());
			this.UpdateRGBAInput(newColour.GetRGBA());
			this.UpdateColourField(colour as cpHSV, newColour.ToCssString());
		}

		this.onChange(newColour);
		return true;
	}

	UpdateHexInput(hex: string): void {
		this.hexInput.value = hex;
	}

	UpdateRGBAInput(rgba: cpRGBA): void {
		this.redInput.value = rgba.R.toString();
		this.greenInput.value = rgba.G.toString();
		this.blueInput.value = rgba.B.toString();

		if (this.alphaInput != null) {
			this.alphaInput.value = rgba.A.toString();
		}
	}

	UpdateColourField(hsv: cpHSV, cssString: string): void {
		this.hueSliderHandle.style.left = (hsv.H * 100) + '%';
		this.colourFieldMarker.style.left = 'calc(' + (hsv.S * 100) + '% - 4px)';
		this.colourFieldMarker.style.top = 'calc(' + (hsv.V * 100) + '% - 4px)';
		this.colourFieldMarker.style.backgroundColor = cssString;
	}
}

class ColourPickerOptions{
	public initialColour: Colour = new Colour();
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
	private A: number = 255;

	constructor(colour?: string | cpRGBA | cpHSV) {
		if (colour != null) {
			if (colour instanceof String) {
				this.SetHex(colour as string);
			} else if (colour.hasOwnProperty('R')) {
				this.SetRGBA(colour as cpRGBA);
			} else if (colour.hasOwnProperty('H')) {
				this.SetHSV(colour as cpHSV);
			}
		}
	}

	public SetRGBA(rgba: cpRGBA) {
		this.R = rgba.R;
		this.G = rgba.G;
		this.B = rgba.B;
		this.A = rgba.A;
	}

	public SetHex(hex: string): boolean {
		if (hex.length === 0) {
			return false;
		}

		if (hex[0] === '#') {
			hex = hex.substring(1);
		}

		if(hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		} else if (hex.length === 4) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];			
		}
		
		if (hex.length === 6 || hex.length === 8) {
			this.R = parseInt(hex.substr(0, 2), 16);
			this.G = parseInt(hex.substr(2, 2), 16);
			this.B = parseInt(hex.substr(4, 2), 16);
			this.A = hex.length === 8 ? parseInt(hex.substr(6, 2), 16) : 255;	
		} else {
			return false;
		}
		
		return true;
	}

	public SetHSV(hsv: cpHSV): void {
		const q = hsv.V < 1/2 ? hsv.V * (hsv.S + 1) : (hsv.V + hsv.S) - (hsv.V * hsv.S);
		const p = hsv.V * 2 - q;
		this.R = Math.round(this.HueToRGB(p, q, hsv.H + 1/3) * 255);
		this.G = Math.round(this.HueToRGB(p, q, hsv.H) * 255);
		this.B = Math.round(this.HueToRGB(p, q, hsv.H - 1/3) * 255);
	}

	public ToCssString(includeAlpha = false): string {
		let str = includeAlpha ? 'rgba(' : 'rgb(';
		str += this.R + ', ' + this.G + ', ' + this.B;
		str += includeAlpha ? ', ' + this.A + ')' : ')';
		return str;
	}

	public GetRGBA(): cpRGBA {
		return { R: this.R, G: this.G, B: this.B, A: this.A };
	}
	
	public GetHex(includeAlpha = false): string {
		let hex = '' + this.DecimalToHex(this.R) + this.DecimalToHex(this.G) + this.DecimalToHex(this.B);
		hex += includeAlpha ? this.DecimalToHex(this.A) : '';
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
		
		hsv.V = (max + min) / 2;
		hsv.S = hsv.V > 1/2 ? delta / (2 - delta) : delta / (max + min);
		
		if (r === max) {
			hsv.H = (g - b) / delta + (g < b ? 6 : 0);
		} else if (g === max) {
			hsv.H = (b - r) / delta + 2;
		} else if (b === max) {
			hsv.H = (b - r) / delta + 4;
		}
		hsv.H = hsv.H / 6;

		return hsv;
	}

	private DecimalToHex(decimal: number) {
		const hex = decimal.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}

	private HueToRGB(p: number, q: number, t: number) {
		if (t < 0) {
			t++;
		} else if (t > 1) {
			t--;
		}

		if (t < 1/6) {
			return p + (q - p) * 6 * t;
		}
		if (t < 1/2) {
			return q;
		}
		if (t < 2/3) {
			return p + (q - p) * 6 * (2/3 - t);
		}
		return p;
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
