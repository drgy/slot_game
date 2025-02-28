import { Sprite, Texture } from "pixi.js";

export class ReelSymbol extends Sprite {
	constructor(symbol_idx: number) {
		super(Texture.from(`sym${symbol_idx}`));
		this.anchor.x = 0.5;
	}
}