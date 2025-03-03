import { Application, Assets, AssetsManifest } from 'pixi.js';
import './style.css';
import { Reel } from './components/Reel';
import { get_symbol_sequence, get_balance, spin, win } from './api';
import { SpinButton } from './components/SpinButton';
import { BET_COST, MAX_SPIN_TIME } from './config';
import { Player } from './models/Player';

export class SlotGame extends Application {
	protected static instance = new SlotGame();
	protected data = {
		player: new Player(),
	};

	public static get width(): number {
		return SlotGame.instance.screen.width;
	}

	public static get height(): number {
		return SlotGame.instance.screen.height;
	}

	protected constructor() {
		super();
	}

	/**
	 * Initializes pixi, loads the assets and sets up the game
	 */
	public static async load(target: HTMLElement = document.body) {
		get_balance().then(balance => SlotGame.instance.data.player.balance = balance);

		// pixi setup
		await SlotGame.instance.init({ resizeTo: target });
		target.appendChild(SlotGame.instance.canvas);

		globalThis.__PIXI_APP__ = SlotGame.instance;

		// assets loading
		const manifest: AssetsManifest = await (await fetch(`${import.meta.env.BASE_URL}manifest.json`)).json();

		await Assets.init({ basePath: import.meta.env.BASE_URL, manifest });

		await Promise.all(manifest.bundles.map(async (bundle) => {
			if (Symbol.iterator in bundle.assets) {

				// little bug in Pixi, setting basePath when loading assets with manifest does not set it on individual assets
				for (const asset of bundle.assets) {
					asset.src = `${import.meta.env.BASE_URL}${asset.src}`;
				}

				return Assets.loadBundle(bundle.name);
			}

			return Promise.resolve();
		}));


		// game setup
		const balance_text: HTMLHeadElement = document.getElementById('balance')!;
		const win_text: HTMLHeadElement = document.getElementById('win')!;
		const player = SlotGame.instance.data.player;
		const update_balance = () => balance_text.textContent = `Balance: $${Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(player.balance)}`;
		const update_win = (win_amount: number) => win_text.textContent = `Win: $${Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(win_amount)}`;
		const outcome = (symbols: number[]) => {
			const counts = new Map<number, number>();

			for (const symbol of symbols) {
				counts.set(symbol, (counts.get(symbol) || 0) + 1);
			}

			let max_symbol = 0;
			let max_count = 0;

			for (const [symbol, count] of counts.entries()) {
				if (count > max_count) {
					max_symbol = symbol;
					max_count = count;
				}
			}

			// normally should be returned with bet result
			const win_amount = max_count > 1 ? BET_COST * max_count : 0;

			if (win_amount > 0) {
				player.balance += win_amount;
				win(win_amount);
				reel.highlight(max_symbol);
			}

			update_win(win_amount);
			update_balance();
		}

		update_balance();
		update_win(0);

		const reel = new Reel(await get_symbol_sequence());
		SlotGame.instance.stage.addChild(reel);

		const spin_button = new SpinButton();
		spin_button.on('click', () => {
			const request_stop = () => {
				if (reel.stop()) {
					spin_button.active = true;
				}
			}

			if (spin_button.active) {
				reel.hide_highlights();
				if (reel.spin(outcome)) {
					spin_button.active = false;
					setTimeout(request_stop, MAX_SPIN_TIME * 1000);
					player.balance -= BET_COST;
					update_balance();
					spin().then(balance => {
						// Some more advanced error handling should be implemented
						if (player.balance !== balance) {
							console.error(`Spin invalidated`);
							player.balance = balance;
							update_balance();
							request_stop();
						}
					});
				}
			} else {
				request_stop();
			}
		});
		SlotGame.instance.stage.addChild(spin_button);
	}
}
