import { BlockingQueue, DRRData, FairQueue, Queue } from './queue';

class FilteredQueue<T, W> {
    constructor(private queue: BlockingQueue<T, W>, private filter: (data: W) => boolean) {
    }

    push(data: W) {
        return this.filter(data) ? this.queue.push(data) : null;
    }

    async pushOrWait(data: W, timeout?: number) {
        return this.filter(data) ? this.queue.pushOrWait(data, timeout) : null;
    }

    async shiftOrWait(timeout?: number) {
        return this.queue.shiftOrWait(timeout);
    }
}

abstract class PubSubBase<T, W> {
    private _topic = new Set<FilteredQueue<T, W>>();

    publish(data: W): number {
        let result = 0;

        for (const queue of this._topic) {
            try {
                if (queue.push(data) !== null) {
                    ++result;
                }
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

        return result.filter((res) => res !== undefined && res !== null).length;
    }

    subscribe(filter?: (data: T) => boolean): AsyncGenerator<T, void>;
    subscribe(filter?: (data: T) => boolean, timeout?: number): AsyncGenerator<T | undefined, void>;
    subscribe(timeout?: number): AsyncGenerator<T | undefined, void>;
    subscribe(filter?: ((data: T) => boolean) | number, timeout?: number): AsyncGenerator<T | undefined, void> {
        if (typeof filter === 'number') {
            timeout = filter;
            filter  = undefined;
        }

        if (filter === undefined) {
            filter = () => true;
        }

        const queue = this._createQueue(filter);

        // Splitting this function ensures the topic queue is present even before AsyncGenerator.next() is called
        this._topic.add(queue);
        return this._subscribe(queue, timeout)
    }

    private async* _subscribe(queue: FilteredQueue<T, W>, timeout: number | undefined) {
        try {
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

    protected abstract _createQueue(filter: (value: T) => boolean): FilteredQueue<T, W>;
}

export class PubSub<T> extends PubSubBase<T, T> {
    constructor(private _capacity?: number) {
        super();
    }

    protected _createQueue(filter: (value: T) => boolean) {
        return new FilteredQueue(new Queue<T>(this._capacity), filter);
    }
}

export class FairPubSub<T> extends PubSubBase<T, DRRData<T>> {
    constructor(private _capacity?: number) {
        super();
    }

    protected _createQueue(filter: (value: T) => boolean) {
        return new FilteredQueue(new FairQueue<T>(this._capacity), (data: DRRData<T>) => filter(data.data));
    }
}
