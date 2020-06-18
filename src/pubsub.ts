import { BlockingQueue, DRRData, FairQueue, Queue } from './queue';

abstract class PubSubBase<T, W> {
    private _topic = new Set<BlockingQueue<T, W>>();

    publish(data: W): number {
        let result = 0;

        for (const queue of this._topic) {
            try {
                queue.push(data);
                ++result;
            }
            catch (ex) {
                if (ex instanceof RangeError !== true) {
                    throw ex;
                }
            }
        }

        return result;
    }

    async publishOrWait(data: W, timeout?: number): Promise<number> {
        const result = await Promise.all([...this._topic].map((queue) => queue.pushOrWait(data, timeout)));

        return result.filter((res) => res !== undefined).length;
    }

    subscribe(): AsyncGenerator<T, void>;
    subscribe(timeout?: number): AsyncGenerator<T | undefined, void>;
    async *subscribe(timeout?: number): AsyncGenerator<T | undefined, void> {
        const queue = this._createQueue();

        try {
            this._topic.add(queue);

            while (true) {
                yield await queue.shiftOrWait(timeout);
            }
        }
        finally {
            this._topic.delete(queue);
        }
    }

    get subscribers(): number {
        return this._topic.size;
    }

    protected abstract _createQueue(): BlockingQueue<T, W>;
}

export class PubSub<T> extends PubSubBase<T, T> {
    constructor(private _capacity?: number) {
        super();
    }

    protected _createQueue() {
        return new Queue<T>(this._capacity);
    }
}

export class FairPubSub<T> extends PubSubBase<T, DRRData<T>> {
    constructor(private _capacity?: number) {
        super();
    }

    protected _createQueue() {
        return new FairQueue<T>(this._capacity);
    }
}
