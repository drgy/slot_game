import { Container, NineSliceSprite, Texture, Ticker } from "pixi.js";
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

	protected spinning = false;
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

	public stop() {
		this.spinning = false;
	}

	// the whole spin logic, with start, stop, and symbol recycling
	public spin() {
		const threshold = this.symbols[0].getBounds().height * this.symbols.length;
		const speed = this.symbols[0].getBounds().height * SPIN_SPEED / 1000;
		let progress = 0;
		let stop_target: number;

		const get_next = (): number => this.sequence[this.next_symbol++ % this.sequence.length];

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
	}

	constructor(sequence: number[]) {
		super();

		this.background = new NineSliceSprite({ texture: Texture.from('reel') });
		this.background.anchor.x = 0.5;
		this.addChild(this.background);

		this.addChild(this.symbols_container);

		this.aspect_ratio = this.background.width / this.background.height;
		this.resize_observer.observe(document.body);

		this.symbol_sequence = sequence;
	}

	protected resize(): void {
		this.background.height = SlotGame.height;
		this.background.width = this.background.height * this.aspect_ratio;

		if (this.symbols.length) {
			this.symbols_container.scale.set(this.background.getBounds().height / (this.symbols[0].height * SYMBOLS_VISIBLE));
		}

		this.x = SlotGame.width / 2;
	}

	public destroy(options?: any): void {
		this.resize_observer.disconnect();
		super.destroy(options);
	}
}