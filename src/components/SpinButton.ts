import { Sprite, Texture } from "pixi.js";
import { SlotGame } from "../SlotGame";

export class SpinButton extends Sprite {
	protected texture_normal = Texture.from('play');
	protected texture_disabled = Texture.from('play_disabled');
	protected resize_observer = new ResizeObserver(() => this.update());

	public get active(): boolean {
		return this.texture == this.texture_normal;
	}

	public set active(active: boolean) {
		this.texture = active ? this.texture_normal : this.texture_disabled;
	}

	constructor() {
		super();

		this.texture = this.texture_normal;
		this.eventMode = 'static';
		this.anchor.set(1);

		this.resize_observer.observe(document.body);
	}

	public update() {
		this.x = SlotGame.width - 20;
		this.y = SlotGame.height - 20;
	}

	public destroy(options?: any): void {
		this.resize_observer.disconnect();
		super.destroy(options);
	}
}