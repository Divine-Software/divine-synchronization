import { Semaphore } from './semaphore'

export class Barrier {
    private _counter = 0;
    private _turnslide1 = new Semaphore(0);
    private _turnslide2 = new Semaphore(0);

    constructor(private _parties: number) {
        // All done
    }

    async phase1(): Promise<void> {
        if (++this._counter === this._parties) {
            for (let i = 0; i < this._parties; ++i) {
                this._turnslide1.signal();
            }
        }

        await this._turnslide1.wait()
    }

    async phase2(): Promise<void> {
        if (--this._counter === 0) {
            for (let i = 0; i < this._parties; ++i) {
                this._turnslide2.signal();
            }
        }

        await this._turnslide2.wait();
    }

    async wait(): Promise<void> {
        await this.phase1();
        await this.phase2();
    }
}

export class Lightswitch {
    private _counter = 0;

    constructor(private _semaphore: Semaphore) {
        // All done
    }

    async lock(): Promise<void> {
        if (++this._counter === 1) {
            await this._semaphore.wait();
        }
    }

    unlock(): void {
        if (--this._counter === 0) {
            this._semaphore.signal();
        }
    }
}

export class ReadWriteLock {
    private _turnslide = new Semaphore(1);
    private _roomEmpty = new Semaphore(1);
    private _readSwitch: Lightswitch;

    constructor() {
        this._readSwitch = new Lightswitch(this._roomEmpty);
    }

    async protectWriter<T>(func: () => Promise<T> | T): Promise<T> {
        try {
            await this._turnslide.wait()
            await this._roomEmpty.wait();
            await this._turnslide.signal();
            return await func();
        }
        finally {
            this._roomEmpty.signal();
        }
    }

    async protectReader<T>(func: () => Promise<T> | T): Promise<T> {
        try {
            await this._turnslide.wait()
            await this._turnslide.signal();
            await this._readSwitch.lock();
            return await func();
        }
        finally {
            this._readSwitch.unlock();
        }
    }
}
