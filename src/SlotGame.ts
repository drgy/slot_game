import { Application, Assets, AssetsManifest } from 'pixi.js';
import './style.css';
import { Reel } from './components/Reel';
import { get_symbol_sequence } from './api';

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
		const reel = new Reel();
		reel.sequence = await get_symbol_sequence();
		SlotGame.instance.stage.addChild(reel);
	}
}
