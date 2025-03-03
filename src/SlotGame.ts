import { Application, Assets, AssetsManifest } from 'pixi.js';
import './style.css';
import { Reel } from './components/Reel';
import { get_symbol_sequence } from './api';
import { SpinButton } from './components/SpinButton';
import { MAX_SPIN_TIME } from './config';

export class SlotGame extends Application {
	protected static instance = new SlotGame();

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
				if (reel.spin()) {
					spin_button.active = false;
					setTimeout(request_stop, MAX_SPIN_TIME * 1000);
				}
			} else {
				request_stop();
			}
		});
		SlotGame.instance.stage.addChild(spin_button);
	}
}
