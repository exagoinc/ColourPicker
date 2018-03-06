/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/lrvolle/ColourPicker
 */

class ColourPicker {
	private options: ColourPickerOptions;

	private container: HTMLElement;
	private colourField: HTMLElement;
	private hueSlider: HTMLElement;
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
		
		this.colourField = this.CreateColourField();
		docFragment.appendChild(this.colourField);

		this.hueSlider = this.CreateHueSlider();
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
	CreateColourField(): HTMLElement {
		const colourField = document.createElement('div');
		colourField.classList.add('colour-field');
		
		const lightnessGradient = document.createElement('div');
		lightnessGradient.classList.add('colour-field__lightness');
		colourField.appendChild(lightnessGradient);

		const fieldMarker = document.createElement('div');
		fieldMarker.classList.add('colour-field__marker');
		colourField.appendChild(fieldMarker);

		return colourField;
	}

	CreateHueSlider(): HTMLElement {
		const hueSlider = document.createElement('div');
		hueSlider.classList.add('hue-slider');

		const hueSliderHandle = document.createElement('div');
		hueSliderHandle.classList.add('hue-slider__handle');
		hueSlider.appendChild(hueSliderHandle);

		return hueSlider;
	}

	CreateValueInputs(): HTMLElement {
		const valueInputContainer = document.createElement('div');
		valueInputContainer.classList.add('colour-inputs');

		const hexInputItem = this.CreateHexInput();
		valueInputContainer.appendChild(hexInputItem);

		const rInputItem = this.CreateIntegerInput(cpEnumRGBA.Red, this.options.redInputLabel);
		this.redInput = rInputItem.querySelector('input');
		valueInputContainer.appendChild(rInputItem);

		const gInputItem = this.CreateIntegerInput(cpEnumRGBA.Green, this.options.greenInputLabel);
		this.greenInput = gInputItem.querySelector('input');
		valueInputContainer.appendChild(gInputItem);

		const bInputItem = this.CreateIntegerInput(cpEnumRGBA.Blue, this.options.blueInputLabel);
		this.blueInput = bInputItem.querySelector('input');
		valueInputContainer.appendChild(bInputItem);

		if (this.options.showAlpha) {
			const aInputItem = this.CreateIntegerInput(cpEnumRGBA.Alpha, this.options.alphaInputLabel);
			this.alphaInput = aInputItem.querySelector('input');
			valueInputContainer.appendChild(aInputItem);
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


}

class ColourPickerOptions{
	public initialColour: Colour = new Colour();
	public showAlpha: boolean = false;

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

	public SetRGBA(rgba: cpRGBA) {
		this.R = rgba.R;
		this.G = rgba.G;
		this.B = rgba.B;
		this.A = rgba.A;
	}

	public SetHex(hex: string): void {
		if (hex.length === 0) {
			throw Error('Empty string passed to SetHex');
		}

		if (hex[0] === '#') {
			hex = hex.substring(1);
		}

		if(hex.length === 3 || hex.length === 4) {
			this.R = parseInt(hex[0], 8);
			this.G = parseInt(hex[1], 8);
			this.B = parseInt(hex[2], 8);
			this.A = hex.length === 4 ? parseInt(hex[4], 8) : 255;			
		} else if (hex.length === 6 || hex.length === 8) {
			this.R = parseInt(hex.substr(0, 2), 8);
			this.G = parseInt(hex.substr(2, 2), 8);
			this.B = parseInt(hex.substr(4, 2), 8);
			this.A = hex.length === 8 ? parseInt(hex.substr(6, 2)) : 255;	
		} else {
			throw Error(`ColourPicker: SetHex paramater's length is ${hex.length}`);
		}
	}

	public SetHSL(hsl: cpHSL): void {

	}

	public ToString(includeAlpha = false): string {
		let str = includeAlpha ? 'rgba(' : 'rgb(';
		str += this.R + ', ' + this.G + ', ' + this.B;
		str += includeAlpha ? ', ' + this.A + ')' : ')';
		return str;
	}

	public GetRGBA(): cpRGBA {
		return { R: this.R, G: this.G, B: this.B, A: this.A };
	}
	
	public GetHex(includeAlpha = false): string {
		let hex = '' + Colour.DecimalToHex(this.R) + Colour.DecimalToHex(this.G) + Colour.DecimalToHex(this.B);
		hex += includeAlpha ? Colour.DecimalToHex(this.A) : '';
		return hex;
	}

	public GetHSL(): cpHSL {
		let hsl = { H: 0, S: 1, L: 1 };

		return hsl;
	}

	private static DecimalToHex(decimal: number) {
		const hex = decimal.toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}
}

interface cpRGBA {
	R: number;
	G: number;
	B: number;
	A: number;
}

interface cpHSL {
	H: number;
	S: number;
	L: number;
}

enum cpEnumRGBA {
	Red = 'r',
	Green = 'g', 
	Blue = 'b', 
	Alpha = 'a',
}
