/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/lrvolle/ColourPicker
 */

class ColourPicker {
	private options: cpOptions;

	private container: HTMLElement;
	private colourField: HTMLElement;
	private hueSlider: HTMLElement;
	private colourPreview?: HTMLElement;
	private hexInput: HTMLInputElement;
	private redInput: HTMLInputElement;
	private greenInput: HTMLInputElement;
	private blueInput: HTMLInputElement;
	private alphaInput: HTMLInputElement;

	private onChange: (rgba: cpRGBA) => void;

	constructor(container: HTMLElement,	onChange: (rgba: cpRGBA) => void, 
		options: cpOptions = {
			showAlpha: false,

			hexInputLabel: 'Hex',
			redInputLabel: 'R',
			greenInputLabel: 'G',
			blueInputLabel: 'B',
			alphaInputLabel: 'A',
		}) {
		this.container = container;
		this.onChange = onChange;
		this.options = options;

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
		const x = 1;
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

		const rInputItem = this.CreateIntegerInput(cpInputType.Red, this.options.redInputLabel);
		this.redInput = rInputItem.querySelector('input');
		valueInputContainer.appendChild(rInputItem);

		const gInputItem = this.CreateIntegerInput(cpInputType.Green, this.options.greenInputLabel);
		this.greenInput = gInputItem.querySelector('input');
		valueInputContainer.appendChild(gInputItem);

		const bInputItem = this.CreateIntegerInput(cpInputType.Blue, this.options.blueInputLabel);
		this.blueInput = bInputItem.querySelector('input');
		valueInputContainer.appendChild(bInputItem);

		if (this.options.showAlpha) {
			const aInputItem = this.CreateIntegerInput(cpInputType.Alpha, this.options.alphaInputLabel);
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

	CreateIntegerInput(inputType: cpInputType, label: string): HTMLElement {
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

interface cpOptions{
	showAlpha: boolean;

	/** Labels that appear underneath input boxes */
	hexInputLabel: string;
	redInputLabel: string;
	greenInputLabel: string;
	blueInputLabel: string;
	alphaInputLabel: string;
}

interface cpRGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}

enum cpInputType {
	Red = 'r',
	Green = 'g', 
	Blue = 'b', 
	Alpha = 'a',
}
