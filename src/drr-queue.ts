import Deque from 'denque';

class Flow<T> {
    queue   = new Deque<{ data: T, size: number}>();
    deficit = 0;
}

export interface DRRData<T> {
    id:   string;
    data: T;
    size: number;
}

export class DRRQueue<T> {
    private _activeFlow:  Flow<T> | undefined;
    private _activeList:  Deque<Flow<T>>;
    private _quantumSize: number;
    private _length:      number;
    private _flows:       { [id: string]: Flow<T> };

    constructor(quantumSize?: number) {
        this._activeFlow  = undefined;
        this._activeList  = new Deque();
        this._quantumSize = typeof quantumSize === 'number' ? quantumSize : 1;
        this._length      = 0;
        this._flows       = {};
    }

    get length(): number {
        return this._length;
    }

    push(_data: DRRData<T>): number {
        const { id, data, size } = _data;

        if (typeof id !== 'string') {
            throw new TypeError(`Flow ID must be a string; got ${typeof id}`);
        }
        else if (data === undefined) {
            throw new TypeError(`Queue cannot contain 'undefined' elements`);
        }
        else if (typeof size !== 'number' || !isFinite(size)) {
            throw new TypeError(`The size must be a finite number`)
        }

        const flow  = this._flows[id] || (this._flows[id] = new Flow());
        const count = flow.queue.push({ data: data, size: size });

        // If the flow is transitioning from 'no data' to 'some data' then push the flow into the active list
        if (count === 1 && this._activeFlow !== flow) {
            this._activeList.push(flow);
        }

        return ++this._length;
    }

    shift(): T | undefined {
        let result = this._activeFlow && this._processActiveFlow();

        while (result === undefined && !this._activeList.isEmpty()) {
            this._activeFlow = this._activeList.shift()!;
            this._activeFlow.deficit += this._quantumSize;
            result = this._processActiveFlow();
        }

        return result;
    };

    private _processActiveFlow(): T | undefined {
        const activeFlow  = this._activeFlow!;
        const activeQueue = activeFlow.queue;

        if (!activeQueue.isEmpty()) {
            const next = activeQueue.peekFront()!;

            if (next.size <= activeFlow.deficit) {
                activeFlow.deficit -= next.size;
                activeQueue.shift();
                --this._length;
                return next.data;
            }
             else {
                this._activeList.push(activeFlow);
            }
        }

        return (this._activeFlow = undefined);
    };
}
