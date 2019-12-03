/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/volleio/ColourPicker
 */

class ColourPicker {
	private options: ColourPickerOptions;

	private container: HTMLElement;
	private fieldMarker!: HTMLElement;
	private colourField: HTMLElement;
	private colourFieldMarker: HTMLElement;
	private hueSlider: HTMLElement;
	private hueSliderHandle: HTMLElement;
	private hexInput!: HTMLInputElement;
	private redInput!: HTMLInputElement;
	private greenInput!: HTMLInputElement;
	private blueInput!: HTMLInputElement;
	private alphaInput: HTMLInputElement | undefined;
	private resetColourButton: HTMLElement | undefined;
	private colourPalette: HTMLElement;
	private customColours: HTMLElement | undefined;

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
		
		this.colourField = this.CreateColourField();
		this.colourFieldMarker = <HTMLElement>this.colourField.querySelector('.colour-field__marker');
		docFragment.appendChild(this.colourField);

		this.hueSlider = this.CreateHueSlider();
		this.hueSliderHandle = <HTMLElement>this.hueSlider.querySelector('.hue-slider__handle');
		docFragment.appendChild(this.hueSlider);

		const valueInputContainer = this.CreateValueInputs();
		docFragment.appendChild(valueInputContainer);

		if (this.options.resetColour != null) {
			this.resetColourButton = this.CreateResetColourButton();
			docFragment.appendChild(this.resetColourButton);
		}

		this.colourPalette = this.CreateColourPalette();
		docFragment.appendChild(this.colourPalette);

		if (this.colourPalette.childElementCount > 0 && this.options.showCustomColours) {
			const colourPaletteSpacer = document.createElement('div');
			colourPaletteSpacer.classList.add('colour-palette-spacer');
			docFragment.appendChild(colourPaletteSpacer);
		}

		if (this.options.showCustomColours) {
			this.customColours = this.CreateCustomColours();
			docFragment.appendChild(this.customColours);
		}

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

	public SetColourPalette(colourPalette: Colour[]): void {
		this.options.colourPalette = colourPalette;
		if (this.colourPalette)
			this.colourPalette.remove();

		this.colourPalette = this.CreateColourPalette();
		this.hueSlider.insertAdjacentElement("afterend", this.colourPalette);
	}

	public SetCustomColours(customColours: Colour[]): void {
		this.options.customColours = customColours;
		if (this.customColours)
			this.customColours.remove();
		else if (this.colourPalette) {
			const colourPaletteSpacer = document.createElement('div');
			colourPaletteSpacer.classList.add('colour-palette-spacer');
			this.container.appendChild(colourPaletteSpacer);
		}

		this.customColours = this.CreateCustomColours();
		this.container.appendChild(this.customColours);
	}

	/** 
	 * Creates and returns a rectangular Colour Field, with a movable marker
	 * and gradients representing lightness & saturation.
	 */
	private CreateColourField(): HTMLElement {
		const colourField = document.createElement('div');
		colourField.classList.add('colour-field');
		
		const lightnessGradient = document.createElement('div');
		lightnessGradient.classList.add('colour-field__lightness');
		colourField.appendChild(lightnessGradient);

		this.fieldMarker = document.createElement('div');
		this.fieldMarker.classList.add('colour-field__marker');
		colourField.appendChild(this.fieldMarker);

		return colourField;
	}
	
	private ColourFieldMouseDown(evt: MouseEvent | TouchEvent): void {
		// Allow dragging to begin only from the colour field or
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
		let mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : (<Touch>evt.targetTouches.item(0)).clientX, colourFieldBoundingBox.left); 
		mouseX = Math.min(mouseX, colourFieldBoundingBox.right);
		let mouseY = Math.max(evt instanceof MouseEvent ? evt.clientY : (<Touch>evt.targetTouches.item(0)).clientY, colourFieldBoundingBox.top); 
		mouseY = Math.min(mouseY, colourFieldBoundingBox.bottom);

		const colourFieldX = mouseX - colourFieldBoundingBox.left;
		const colourFieldY = mouseY - colourFieldBoundingBox.top;
		return this.GetColourFieldHSV(colourFieldX, colourFieldY);
	}

	private CreateHueSlider(): HTMLElement {
		const hueSlider = document.createElement('div');
		hueSlider.classList.add('hue-slider');

		const hueSliderGradient = document.createElement('div');
		hueSliderGradient.classList.add('hue-slider__gradient');
		hueSlider.appendChild(hueSliderGradient);
		hueSliderGradient.addEventListener('mousedown', (evt) => { this.HueSliderMouseDown(evt); });
		hueSliderGradient.addEventListener('touchstart', (evt) => { this.HueSliderMouseDown(evt); });

		const hueSliderHandle = document.createElement('div');
		hueSliderHandle.classList.add('hue-slider__handle');
		hueSlider.appendChild(hueSliderHandle);

		return hueSlider;
	}

	private HueSliderMouseDown (evt: MouseEvent | TouchEvent): void {
		this.UpdateHueSliderHandle(evt);

		const markerX = this.colourFieldMarker.offsetLeft + this.colourFieldMarker.offsetWidth / 2;
		const markerY = this.colourFieldMarker.offsetTop + this.colourFieldMarker.offsetHeight / 2;
		const hsv = this.GetColourFieldHSV(markerX, markerY);
		this.OnChange(hsv);

		window.getSelection()?.removeAllRanges();

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
		let mouseX = Math.max(evt instanceof MouseEvent ? evt.clientX : (<Touch>evt.targetTouches.item(0))?.clientX, hueSliderBoundingBox.left); 
		mouseX = Math.min(mouseX, hueSliderBoundingBox.right);

		this.hueSliderHandle.style.left = mouseX - hueSliderBoundingBox.left + 'px';
	}

	private CreateValueInputs(): HTMLElement {
		const valueInputContainer = document.createElement('div');
		valueInputContainer.classList.add('colour-inputs');

		const hexInputItem = this.CreateHexInput();
		valueInputContainer.appendChild(hexInputItem);
		this.hexInput.addEventListener('keydown', () => {
			requestAnimationFrame(() => {
				let strippedValue = this.hexInput.value.replace(/[^0-9ABCDEF]/gi, '');
				strippedValue = '#' + strippedValue.substr(0, 8); // Max length of 8 characters without #
				this.hexInput.value = strippedValue;
				this.OnChange(strippedValue);
			});
		});

		const rInputItem = this.CreateIntegerInput(cpEnumRGBA.Red, this.options.redInputLabel);
		this.redInput = rInputItem.querySelector('input') as HTMLInputElement;
		valueInputContainer.appendChild(rInputItem);
		this.redInput.addEventListener('keydown', () => {
			requestAnimationFrame(() => {
				this.redInput.value = this.redInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		const gInputItem = this.CreateIntegerInput(cpEnumRGBA.Green, this.options.greenInputLabel);
		this.greenInput = gInputItem.querySelector('input') as HTMLInputElement;
		valueInputContainer.appendChild(gInputItem);
		this.greenInput.addEventListener('keydown', () => {
			requestAnimationFrame(() => {
				this.greenInput.value = this.greenInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		const bInputItem = this.CreateIntegerInput(cpEnumRGBA.Blue, this.options.blueInputLabel);
		this.blueInput = bInputItem.querySelector('input') as HTMLInputElement;
		valueInputContainer.appendChild(bInputItem);
		this.blueInput.addEventListener('keydown', () => {
			requestAnimationFrame(() => {
				this.blueInput.value = this.blueInput.value.replace(/[^0-9]/g, '');
				this.OnChange(this.GetRGBAFromInputs());
			});
		});

		if (this.options.showAlphaControl) {
			const aInputItem = this.CreateIntegerInput(cpEnumRGBA.Alpha, this.options.alphaInputLabel);
			this.alphaInput = aInputItem.querySelector('input') as HTMLInputElement;
			valueInputContainer.appendChild(aInputItem);
			this.alphaInput.addEventListener('keydown', () => {
				requestAnimationFrame(() => {
					(<HTMLInputElement>this.alphaInput).value = this.alphaInput?.value.replace(/[^0-9]/g, '') as string;
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

		return { R: r, G: g, B: b, A: a };
	}
	
	private CreateHexInput(): HTMLElement {
		const hexInputContainer = document.createElement('div'); 
		hexInputContainer.classList.add('colour-input');

		this.hexInput = document.createElement('input'); 
		this.hexInput.classList.add('colour-input__hex');
		this.hexInput.setAttribute('spellcheck', 'false');
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

	private CreateResetColourButton(): HTMLElement {
		const resetColourButton = document.createElement('div');
		resetColourButton.classList.add('reset-colour-button');

		const resetColourButtonIcon = document.createElement('div');
		resetColourButtonIcon.classList.add('reset-colour-button__icon');
		resetColourButton.appendChild(resetColourButtonIcon);

		const resetColourButtonLabel = document.createElement('span');
		resetColourButtonLabel.classList.add('reset-colour-button__span');
		resetColourButtonLabel.innerHTML = this.options.resetColourLabel;
		resetColourButton.appendChild(resetColourButtonLabel);
		
		resetColourButton.addEventListener('click', () => {
			this.SetColour(this.options.resetColour as Colour);
			this.onChange(this.options.resetColour as Colour);
		});

		return resetColourButton;
	}

	private CreateColourPalette(): HTMLElement {
		const colourPalette = document.createElement('div');
		colourPalette.classList.add('default-colours');
		colourPalette.classList.add('colour-option-grid');
		this.options.colourPalette.forEach((colour) => {
			const colourOption = this.CreateColourOption(colour, false);
			colourPalette.appendChild(colourOption);
		});
		
		return colourPalette;
	}

	private CreateCustomColours(): HTMLElement {
		const customColours = document.createElement('div');
		customColours.classList.add('custom-colours');
		customColours.classList.add('colour-option-grid');

		this.options.customColours.forEach((colour) => {
			const colourOption = this.CreateColourOption(colour, true);
			customColours.appendChild(colourOption);
		});

		const customColourAddButton = document.createElement('div');
		customColourAddButton.classList.add('colour-option-add');
		customColourAddButton.classList.add('colour-option');
		customColourAddButton.addEventListener('click', () => {
			const currentColour = this.GetColour();
			const newCustomColourOption = this.CreateColourOption(currentColour, true);
			customColourAddButton.insertAdjacentElement('beforebegin', newCustomColourOption);
			if (this.options.onCustomColourAdd)
				this.options.onCustomColourAdd(currentColour);
		});
		customColours.appendChild(customColourAddButton);

		return customColours;
	}

	private CreateColourOption(colour: Colour, allowDeletion: boolean): HTMLElement {
		const colourOption = document.createElement('div');
		colourOption.classList.add('colour-option');
		colourOption.style.backgroundColor = colour.ToCssString(true);
		if (colour.GetHSL().L > 0.9)
			colourOption.style.border = '1px solid rgba(200, 200, 200, 0.5)';

		colourOption.addEventListener('click', () => {
			this.SetColour(colour);
			this.onChange(colour);
		});

		if (allowDeletion) {
			const colourOptionDeleteButton = document.createElement('div');
			colourOptionDeleteButton.classList.add('colour-option-delete');
			colourOptionDeleteButton.addEventListener('click', (evt) => {
				this.OnDeleteButtonClick(evt, colour, colourOption);
			});
			colourOption.appendChild(colourOptionDeleteButton);
		}

		return colourOption;
	}

	private OnDeleteButtonClick(evt: MouseEvent, colour: Colour, colourOption: HTMLElement): void {
		colourOption.remove();
		evt.stopPropagation(); // Prevent updating of colour
		if (this.options.onCustomColourDelete)
			this.options.onCustomColourDelete(colour);
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
				newColour.SetAlpha(parseInt(this.alphaInput?.value as string, 10));

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
				newColour.SetAlpha(parseInt(this.alphaInput?.value as string, 10));

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
	public initialColour: Colour = new Colour({ R: 255, G: 255, B: 255, A: 100 });
	public showAlphaControl: boolean = false;
	public colourPalette: Colour[] = [];
	public showCustomColours: boolean = false;
	public customColours: Colour[] = [];
	public onCustomColourAdd: ((addedColour: Colour) => void) | undefined;
	public onCustomColourDelete: ((deletedColour: Colour) => void) | undefined;
	public resetColour: Colour | undefined;

	/** Labels that appear underneath input boxes */
	public hexInputLabel: string = 'Hex';
	public redInputLabel: string = 'R';
	public greenInputLabel: string = 'G';
	public blueInputLabel: string = 'B';
	public alphaInputLabel: string = 'A';
	public resetColourLabel: string = 'Reset';
}

class Colour {
	private R: number = 255;
	private G: number = 255;
	private B: number = 255;
	private A: number = 100;

	constructor(colour?: string | cpRGBA | cpHSV | cpHSL) {
		if (colour != null) {
			if (colour instanceof String || typeof colour === 'string') 
				this.SetHex(colour as string);
			else if (colour.hasOwnProperty('R'))
				this.SetRGBA(colour as cpRGBA);
			else if (colour.hasOwnProperty('V'))
				this.SetHSV(colour as cpHSV);
			else if (colour.hasOwnProperty('L'))
				this.SetHSL(colour as cpHSL);
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
				this.A = 100;
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

	public SetHSL(hsl: cpHSL): void	{
		const huePrime = hsl.H * 6;
		const c = (1 - Math.abs(2 * hsl.L - 1)) * hsl.S;
		const x = c * (1 - Math.abs(huePrime % 2 - 1));
		
		const hueSector = Math.floor(huePrime);
		let r, g, b;
		switch (hueSector % 6) {
			case 0: r = c, g = x, b = 0; break;
			case 1: r = x, g = c, b = 0; break;
			case 2: r = 0, g = c, b = x; break;
			case 3: r = 0, g = x, b = c; break;
			case 4: r = x, g = 0, b = c; break;
			case 5: r = c, g = 0, b = x; break;
			default: 
				r = 0; g = 0; b = 0;
		}

		const m = hsl.L - c / 2;
		this.R = (r + m) * 255;
		this.G = (g + m) * 255;
		this.B = (b + m) * 255;
	}

	public ToCssString(includeAlpha = false): string {
		let str = includeAlpha ? 'rgba(' : 'rgb(';
		str += this.R + ', ' + this.G + ', ' + this.B;
		str += includeAlpha ? ', ' + this.A / 100 + ')' : ')';
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
		hsv.H = this.HueFromRGB(r, g, b, max, delta);
		
		return hsv;
	}

	public GetHSL(): cpHSL {
		const r = this.R / 255;
		const g = this.G / 255;
		const b = this.B / 255;
		const hsl = { H: 0, S: 0, L: 0 };

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const delta = max - min;

		hsl.L = (max + min) / 2;

		if (delta === 0)
			return hsl;
		
		if (hsl.L > 0.5)
			hsl.S = delta / (2 - max - min);
		else
			hsl.S = delta / (max + min);
		
		hsl.H = this.HueFromRGB(r, g, b, max, delta);

		return hsl;
	}

	private HueFromRGB(r: number, g: number, b: number, max: number, delta: number): number {
		let h;
		if (r === max) {
			const deltaOffset = g < b ? 6 : 0;
			h = (delta + deltaOffset === 0) ? 0 : (g - b) / delta + deltaOffset;
		} else if (g === max) {
			h = (b - r) / delta + 2;
		} else { // if (b === max)
			h = (r - g) / delta + 4;
		}

		return h / 6;
	}

	private DecimalToHex(decimal: number): string {
		const hex = decimal.toString(16).toUpperCase();
		return hex.length === 1 ? '0' + hex : hex;
	}
}

interface cpRGBA {
	/** Red, between 0 and 255 */
	R: number;
	/** Green, between 0 and 255 */
	G: number;
	/** Blue, between 0 and 255 */
	B: number;
	/** Alpha (opacity), between 0 and 100 */
	A: number;
}

interface cpHSV {
	/** Hue, between 0 and 1 */
	H: number;
	/** Saturation, between 0 and 1 */
	S: number;
	/** Value, between 0 and 1 */
	V: number;
}

interface cpHSL {
	/** Hue, between 0 and 1 */
	H: number;
	/** Saturation, between 0 and 1 */
	S: number;
	/** Lightness, between 0 and 1 */
	L: number;
}

enum cpEnumRGBA {
	Red = 'r',
	Green = 'g', 
	Blue = 'b', 
	Alpha = 'a',
}
