/**
 * ColourPicker
 * A pure TypeScript colour picker
 * https://github.com/lrvolle/ColourPicker
 */

class ColourPicker {
	private container: HTMLElement;
	private onChange: (rgb: rgb) => void;

	constructor(container: HTMLElement, onChange: (rgb: rgb) => void) {
		this.container = container;
		this.onChange = onChange;
	}

}

interface rgb {
	r: number;
	g: number;
	b: number;
}
