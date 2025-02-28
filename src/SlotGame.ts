import { Application, Assets, AssetsManifest, Sprite, Texture } from 'pixi.js';
import './style.css';

export class SlotGame extends Application {
	protected static instance = new SlotGame();

	protected constructor() {
		super();
	}

	public static async load(target: HTMLElement = document.body) {
		await SlotGame.instance.init({ resizeTo: target });
		target.appendChild(SlotGame.instance.canvas);

		const manifest: AssetsManifest = await (await fetch(`${import.meta.env.BASE_URL}manifest.json`)).json();

		await Assets.init({ basePath: import.meta.env.BASE_URL, manifest });

		await Promise.all(manifest.bundles.map(async (bundle) => {
			if (Symbol.iterator in bundle.assets) {
				for (const asset of bundle.assets) {
					asset.src = `${import.meta.env.BASE_URL}${asset.src}`;
				}

				return Assets.loadBundle(bundle.name);
			}

			return Promise.resolve();
		}));

		SlotGame.instance.stage.addChild(new Sprite({ texture: Texture.from('reel') }));
	}
}
