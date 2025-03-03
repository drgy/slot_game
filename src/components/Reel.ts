import { Container, NineSliceSprite, Sprite, Texture, Ticker } from "pixi.js";
import { SlotGame } from "../SlotGame";
import { ReelSymbol } from "./ReelSymbol";
import { SPIN_SPEED, SYMBOLS_VISIBLE } from "../config";

export class Reel extends Container {
	protected background: NineSliceSprite;
	protected aspect_ratio: number;
	protected resize_observer = new ResizeObserver(() => this.resize());
	protected symbols: ReelSymbol[] = [];
	protected symbols_container = new Container();
	protected sequence: number[] = [];
	protected highlight_container = new Container();

	protected spinning = false;
	protected animating = false;
	protected next_symbol = 0;

	public set symbol_sequence(sequence: number[]) {
		this.sequence = sequence;

		// create the symbols that will be displayed plus one extra to ensure recycling happens outside of the visible area
		for (let i = 0; i < SYMBOLS_VISIBLE + 1; i++) {
			this.symbols.push(new ReelSymbol(this.sequence[i % this.sequence.length]));
			this.symbols_container.addChild(this.symbols[i]);
			this.symbols[i].y = i * this.symbols[0].height;
		}

		this.next_symbol = (SYMBOLS_VISIBLE + 2) % this.sequence.length;
	}

	public get visible_symbols(): number[] {
		const result = [];
		let idx = this.next_symbol;

		for (let i = 0; i < SYMBOLS_VISIBLE; i++) {
			idx--;

			if (idx < 0) {
				idx += this.sequence.length;
			}

			result.push(this.sequence[idx]);
		}

		return result;
	}

	// TODO add some animations for the highlights
	public hide_highlights() {
		this.highlight_container.children.forEach(child => child.scale.set(0));
	}

	public highlight(symbol: number) {
		const symbols = this.visible_symbols;

		for (let i = 0; i < SYMBOLS_VISIBLE; i++) {
			if (symbols[i] === symbol) {
				this.highlight_container.children[i].scale.set(1);
			}
		}
	}

	// requests stop of the spin, returns true if the request was successful, false if the spin is already stopping
	public stop(): boolean {
		if (this.spinning) {
			this.spinning = false;
			return true;
		}

		return false;
	}

	// the whole spin logic, with start, stop, and symbol recycling, returns true if the spin was initiated, false if there is already a spin in progress
	public spin(callback: (result: number[]) => void): boolean {
		if (this.animating) {
			return false;
		}

		this.animating = true;
		const threshold = this.symbols[0].height * this.symbols.length;
		const speed = this.symbols[0].height * SPIN_SPEED / 1000;
		let progress = 0;
		let stop_target: number;

		const get_next = (): number => {
			this.next_symbol++;

			if (this.next_symbol >= this.sequence.length) {
				this.next_symbol -= this.sequence.length;
			}

			return this.sequence[this.next_symbol];
		}

		// interpolation functions
		const back_in = (progress: number, bounce = 1.1): number => progress * progress * progress * ((bounce + 1) * progress - bounce);
		const back_out = (progress: number): number => 1 - back_in(1 - progress);

		// moves the symbols by specified amount and increases/decreases the blur
		const move_symbols = (step: number, blur_modifier = 0) => {
			for (const symbol of this.symbols) {
				symbol.y += step;

				if (blur_modifier) {
					symbol.blur += step / 10 * blur_modifier;
					symbol.blur = Math.max(0, symbol.blur);
				}

				// once the symbol is outside of the visible area it can be recycled (moved back to top and set to the next symbol in the sequence)
				if (symbol.y >= threshold) {
					symbol.y -= threshold;
					symbol.symbol_idx = get_next();
				}
			}
		}

		// gradually slows the spin until complete stop at the stop_target
		const decelerate = (ticker: Ticker) => {
			const step = Math.max(50, ticker.deltaMS) / 10000;
			const delta = (back_out(progress + step) - back_out(progress)) * stop_target;
			progress += step;

			move_symbols(delta, -1);

			if (progress >= 1) {
				Ticker.shared.remove(decelerate);
				this.animating = false;
				callback(this.visible_symbols);
			}
		}

		// moves the symbols at a constant speed
		const animate = (ticker: Ticker) => {
			move_symbols(Math.max(50, ticker.deltaMS) * speed);

			if (!this.spinning) {
				Ticker.shared.remove(animate);

				// if the spin should be stopped, it will calculate distance required to recycle all the currently displayed symbols
				progress = 0;
				stop_target = (this.symbols[0].height * (SYMBOLS_VISIBLE + 1)) - this.symbols.reduce((lowest, symbol) => symbol.y < lowest ? symbol.y : lowest, Number.POSITIVE_INFINITY);

				Ticker.shared.add(decelerate);
			}
		}

		// gradually starts the spin
		const accelerate = (ticker: Ticker) => {
			progress += Math.max(50, ticker.deltaMS) / 3000;
			move_symbols(back_in(progress) * speed * Math.max(50, ticker.deltaMS), 1);

			if (progress >= 1) {
				Ticker.shared.remove(accelerate);
				Ticker.shared.add(animate);
				this.spinning = true;
			}
		}

		Ticker.shared.add(accelerate);
		return true;
	}

	constructor(sequence: number[]) {
		super();

		this.background = new NineSliceSprite({ texture: Texture.from('reel') });
		this.background.anchor.x = 0.5;
		this.addChild(this.background);

		for (let i = 0; i < SYMBOLS_VISIBLE; i++) {
			const highlight = new Sprite(Texture.from('win_bg'));
			highlight.anchor.set(0.5, 1);
			highlight.y = (i + 1) * highlight.height;
			highlight.scale.set(0);
			this.highlight_container.addChild(highlight);
		}

		this.addChild(this.highlight_container);

		this.addChild(this.symbols_container);

		this.aspect_ratio = this.background.width / this.background.height;
		this.resize_observer.observe(document.body);

		this.symbol_sequence = sequence;
	}

	protected resize(): void {
		this.background.height = SlotGame.height;
		this.background.width = this.background.height * this.aspect_ratio;

		if (this.symbols.length) {
			const scale = this.background.getBounds().height / (this.symbols[0].height * SYMBOLS_VISIBLE);
			this.highlight_container.scale.set(scale);
			this.symbols_container.scale.set(scale);
		}

		this.x = SlotGame.width / 2;
	}

	public destroy(options?: any): void {
		this.resize_observer.disconnect();
		super.destroy(options);
	}
}