import Deque from 'denque';
import { DRRData, DRRQueue} from './drr-queue';
import { BackingQueue, Condition } from './condition';

export { DRRData } from './drr-queue';

const MAX_SAFE_INTEGER = 9007199254740991;

export abstract class BlockingQueue<T, W> {
    private   _queue: BackingQueue<T, W>;
    protected _capacity: number;
    private   _readCondition  = new Condition();
    private   _writeCondition = new Condition();

    constructor(queue: BackingQueue<T, W>, capacity?: number) {
        this._queue    = queue;
        this._capacity = typeof capacity === 'number' ? capacity : MAX_SAFE_INTEGER;
    }

    get length(): number {
        return this._queue.length;
    }

    isEmpty(): boolean {
        return this.length === 0;
    }

    isFull(): boolean {
        return this.length >= this._capacity;
    }

    push(data: W): number {
        if (this.length >= this._capacity) {
            throw new RangeError(`Maximum queue capacity (${this._capacity}) reached`);
        }
        else if (data === undefined) {
            throw new TypeError(`Queue cannot contain 'undefined' elements`);
        }

        if (this.length === 0) {
            this._readCondition.notify();
        }

        return this._queue.push(data);
    }

    async pushOrWait(data: W): Promise<number>;
    async pushOrWait(data: W, timeout: number): Promise<number | undefined>;
    async pushOrWait(data: W, timeout?: number): Promise<number | undefined> {
        const expires = timeout !== undefined ? Date.now() + timeout : undefined;

        // Wait until there is space for more, or timeout
        while (this.isFull() && await this._writeCondition.wait(expires && expires - Date.now()));

        return this.isFull() ? undefined /* Timeout */ : this.push(data);
    }

    shift(): T | undefined {
        if (this.length === this._capacity) {
            this._writeCondition.notify();
        }

        return this._queue.shift();
    }

    async shiftOrWait(): Promise<T>;
    async shiftOrWait(timeout: number): Promise<T | undefined>;
    async shiftOrWait(timeout?: number): Promise<T | undefined> {
        const expires = timeout !== undefined ? Date.now() + timeout : undefined;

        // Wait until there is something to read, or timeout
        while (this.isEmpty() && await this._readCondition.wait(expires && expires - Date.now()));

        return this.isEmpty() ? undefined /* Timeout */ : this.shift();
    }
}

export class Queue<T> extends BlockingQueue<T, T> {
    constructor(capacity?: number) {
        super(new Deque(), capacity);
    }
}

export class FairQueue<T> extends BlockingQueue<T, DRRData<T>> {
    constructor(capacity?: number) {
        super(new DRRQueue<T>(), capacity);
    }
}
