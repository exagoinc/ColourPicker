export declare class ColourPicker {
    private options;
    private container;
    private fieldMarker;
    private colourField;
    private colourFieldMarker;
    private hueSlider;
    private hueSliderHandle;
    private hexInput;
    private redInput;
    private greenInput;
    private blueInput;
    private alphaInput;
    private resetColourButton;
    private colourPalette;
    private customColours;
    private onChange;
    constructor(container: HTMLElement, onChange: (rgba: Colour) => void, options?: ColourPickerOptions);
    GetColour(): Colour;
    SetColour(colour: Colour): void;
    SetColourPalette(colourPalette: Colour[]): void;
    SetCustomColours(customColours: Colour[]): void;
    private CreateColourField;
    private ColourFieldMouseDown;
    private GetColourFieldHSV;
    private SetColourFieldHSV;
    private CreateHueSlider;
    private HueSliderMouseDown;
    private UpdateHueSliderHandle;
    private CreateValueInputs;
    private GetRGBAFromInputs;
    private CreateHexInput;
    private CreateIntegerInput;
    private CreateResetColourButton;
    private CreateColourPalette;
    private CreateCustomColours;
    private CreateColourOption;
    private OnDeleteButtonClick;
    private IntegerInputMouseDown;
    private OnChange;
    private UpdateHexInput;
    private UpdateRGBAInput;
    private UpdateColourField;
}
export declare class ColourPickerOptions {
    initialColour: Colour;
    showAlphaControl: boolean;
    colourPalette: Colour[];
    showCustomColours: boolean;
    customColours: Colour[];
    onCustomColourAdd: ((addedColour: Colour) => void) | undefined;
    onCustomColourDelete: ((deletedColour: Colour) => void) | undefined;
    resetColour: Colour | undefined;
    hexInputLabel: string;
    redInputLabel: string;
    greenInputLabel: string;
    blueInputLabel: string;
    alphaInputLabel: string;
    resetColourLabel: string;
}
export declare class Colour {
    private R;
    private G;
    private B;
    private A;
    constructor(colour?: string | cpRGBA | cpHSV | cpHSL);
    SetRGBA(rgba: cpRGBA): void;
    SetAlpha(alpha: number): void;
    SetHex(hex: string): boolean;
    SetHSV(hsv: cpHSV): void;
    SetHSL(hsl: cpHSL): void;
    ToCssString(includeAlpha?: boolean): string;
    GetRGBA(): cpRGBA;
    GetHex(includeAlpha?: boolean): string;
    GetHSV(): cpHSV;
    GetHSL(): cpHSL;
    private HueFromRGB;
    private DecimalToHex;
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
interface cpHSL {
    H: number;
    S: number;
    L: number;
}
export {};
