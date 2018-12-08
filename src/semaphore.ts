import { Condition, FairCondition } from './condition';

export class Semaphore {
    private _cond = new Condition();

    constructor(private _value: number) {
    }

    async protect<T>(func: () => Promise<T> | T): Promise<T> {
        try {
            await this.wait();
            return await func();
        }
        finally {
            this.signal();
        }
    }

    take(): boolean {
        if (this._value > 0) {
            --this._value;
            return true;
        }
        else {
            return false;
        }
    }

    wait(): Promise<true>;
    wait(timeout?: number): Promise<boolean>;
    async wait(timeout?: number): Promise<boolean> {
        if (--this._value < 0) {
            if (!await this._cond.wait(timeout)) {
                ++this._value; // Undo
                return false;
            }
        }

        return true;
    }

    signal(): void {
        if (++this._value <= 0) {
            this._cond.notify();
        }
    }
}

export class Mutex {
    private _semaphore = new Semaphore(1);

    protect<T>(func: () => Promise<T> | T): Promise<T> {
        return this._semaphore.protect(func);
    }

    tryLock(): boolean {
        return this._semaphore.take();
    }

    lock(): Promise<true>;
    lock(timeout?: number): Promise<boolean>;
    lock(timeout?: number): Promise<boolean> {
        return this._semaphore.wait(timeout);
    }

    unlock() {
        if ((this._semaphore as any)._value > 0) {
            throw new RangeError(`Calling unlock() without a previous lock() is not allowed`);
        }

        return this._semaphore.signal();
    }
}

export class FairSemaphore {
    private _cond = new FairCondition();

    constructor(private _value: number) {
    }

    async protect<T>(id: string, func: () => Promise<T> | T): Promise<T> {
        try {
            await this.wait(id);
            return await func();
        }
        finally {
            this.signal();
        }
    }

    take(): boolean {
        if (this._value > 0) {
            --this._value;
            return true;
        }
        else {
            return false;
        }
    }

    wait(id: string): Promise<true>;
    wait(id: string, timeout?: number): Promise<boolean>;
    async wait(id: string, timeout?: number): Promise<boolean> {
        if (--this._value < 0) {
            if (!await this._cond.wait(id, timeout)) {
                ++this._value; // Undo
                return false;
            }
        }

        return true;
    }

    signal(): void {
        if (++this._value <= 0) {
            this._cond.notify();
        }
    }
}

export class FairMutex {
    private _semaphore = new FairSemaphore(1);

    protect<T>(id: string, func: () => Promise<T> | T): Promise<T> {
        return this._semaphore.protect(id, func);
    }

    tryLock(): boolean {
        return this._semaphore.take();
    }

    lock(id: string): Promise<true>;
    lock(id: string, timeout?: number): Promise<boolean>;
    lock(id: string, timeout?: number): Promise<boolean> {
        return this._semaphore.wait(id, timeout);
    }

    unlock() {
        if ((this._semaphore as any)._value > 0) {
            throw new RangeError(`Calling unlock() without a previous lock() is not allowed`);
        }

        return this._semaphore.signal();
    }
}
