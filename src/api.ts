import { BET_COST } from "./config";

const SEQUENCE = [0, 4, 0, 2, 3, 2, 1, 3, 2, 5, 2, 0, 5, 0, 1, 0, 1, 1, 1, 0, 1, 0, 3, 0, 2, 5, 0, 2, 1, 4, 2, 0, 1, 1, 1, 0, 3, 0, 3, 0, 2, 1, 3, 3, 4, 1, 2, 0, 0, 0, 3, 4, 1, 1, 1, 0, 4, 5, 0, 2, 3, 1, 4, 1, 0, 4, 0, 1, 0, 0, 0, 3, 3, 2, 2, 4, 4, 3, 1, 4, 1, 0, 2, 1, 2, 0, 3, 2, 3, 1, 2, 3, 0, 0, 0, 1, 5, 2, 1, 2, 0, 4];
let balance = 100;

export async function get_symbol_sequence(): Promise<number[]> {
	return new Promise<number[]>((resolve) =>
		setTimeout(() => {
			resolve(SEQUENCE);
		}, Math.random() * 400 + 100)
	);
}

export async function get_balance(): Promise<number> {
	return balance;
}

// for actual application this should also return index of a symbol from the sequence on which the reel should stop
export async function spin(): Promise<number> {
	return new Promise<number>((resolve) =>
		setTimeout(() => {
			balance -= BET_COST;
			resolve(balance);
		}, Math.random() * 400 + 100)
	);
}

export async function win(amount: number) {
	balance += amount;
}