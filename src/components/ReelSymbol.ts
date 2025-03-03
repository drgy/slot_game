import { BlurFilter, Sprite, Texture } from "pixi.js";
import { SYMBOLS_TOTAL } from "../config";

export class ReelSymbol extends Sprite {
	protected static ctr = 0;
	protected idx;
	protected static textures: Texture[] = [];
	protected blur_filter = new BlurFilter();

	public set symbol_idx(symbol_idx: number) {
		this.texture = ReelSymbol.textures[symbol_idx];
	}

	public get blur(): number {
		return this.blur_filter.strengthY;
	}

	public set blur(strength: number) {
		this.blur_filter.strengthY = strength;
	}

	constructor(symbol_idx = 0) {
		if (!ReelSymbol.textures.length) {
			for (let i = 0; i < SYMBOLS_TOTAL; i++) {
				ReelSymbol.textures.push(Texture.from(`sym${i}`));
			}
		}

		super();
		this.anchor.set(0.5, 1);
		this.symbol_idx = symbol_idx;
		this.idx = ReelSymbol.ctr++;
		this.blur_filter.strength = 0;
		this.filters = [this.blur_filter];
	}
}