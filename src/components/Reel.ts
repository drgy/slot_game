import { Container, NineSliceSprite, Texture } from "pixi.js";
import { SlotGame } from "../SlotGame";
import { ReelSymbol } from "./Symbol";
import { SYMBOLS_VISIBLE } from "../config";

export class Reel extends Container {
	protected background: NineSliceSprite;
	protected aspect_ratio: number;
	protected resize_observer = new ResizeObserver(() => this.resize());
	protected symbols: ReelSymbol[] = [];
	protected symbols_container = new Container();

	public set sequence(sequence: number[]) {
		for (const symbol of this.symbols) {
			symbol.destroy();
		}

		this.symbols = sequence.map((symbol_idx, idx) => {
			const symbol = new ReelSymbol(symbol_idx);
			symbol.position.y = idx * symbol.height;

			this.symbols_container.addChild(symbol);

			return symbol;
		});

		this.resize();
	}

	constructor() {
		super();

		this.background = new NineSliceSprite({ texture: Texture.from('reel') });
		this.background.anchor.x = 0.5;
		this.addChild(this.background);

		this.addChild(this.symbols_container);

		this.aspect_ratio = this.background.width / this.background.height;
		this.resize_observer.observe(document.body);
	}

	protected resize(): void {
		this.background.height = SlotGame.height;
		this.background.width = this.background.height * this.aspect_ratio;

		if (this.symbols.length) {
			this.symbols_container.scale.set(this.background.height / (this.symbols[0].height * SYMBOLS_VISIBLE));
		}

		this.x = SlotGame.width / 2;
	}

	public destroy(options?: any): void {
		this.resize_observer.disconnect();
		super.destroy(options);
	}
}