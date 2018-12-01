import { Expect, Test, Timeout } from 'alsatian';
import { FairSemaphore, FairMutex, Mutex, Semaphore } from '../src';
new FairSemaphore(1); new Semaphore(1);

function randomDelay(maxTimeout: number): Promise<void> {
    const timeout = Math.round(Math.random() * maxTimeout);

    return !timeout ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, timeout));
}

type lockCB = (mutex: Mutex | FairMutex, timeout?: number) => Promise<boolean>;
type protCB = (mutex: Mutex | FairMutex, cb: () => Promise<void>) => Promise<void>;

async function basicFunctions(mutex: Mutex | FairMutex , lock: lockCB) {
    lock(mutex);
    Expect(mutex.tryLock()).toBe(false);
    Expect(await lock(mutex, 100)).toBe(false);
    mutex.unlock();
    Expect(mutex.tryLock()).toBe(true);
    Expect(mutex.tryLock()).toBe(false);
    Expect(await lock(mutex, 100)).toBe(false);
    mutex.unlock();
    Expect(() => mutex.unlock()).toThrowError(RangeError, `Calling unlock() without a previous lock() is not allowed`);
}

async function stressTest(mutex: Mutex | FairMutex , lock: lockCB, protect: protCB) {
    const fibers     = [];
    const iterations = 1000;
    let   counter    = -1;

    await protect(mutex, async () => { counter = 0 });
    Expect(counter).toBe(0);

    for (let i = 0; i < iterations; ++i) {
       await randomDelay(1);

        fibers.push(protect(mutex, async () => {
            const old = counter;
            await randomDelay(1);
            counter = old + 1;

        }));

        fibers.push((async () => {
            if (await lock(mutex, 10)) {
                mutex.unlock();
            }
        })());
    }

    await Promise.all(fibers);
    Expect(counter).toBe(iterations);
}

export class MutexTest {
    @Test() async basicFunctions() {
       await basicFunctions(new Mutex(), (mutex: any, timeout?: number) => (mutex as Mutex).lock(timeout));
    }

    @Test() @Timeout(1000) async stressTest() {
        await stressTest(new Mutex(),
                         (mutex: any, timeout?: number) => (mutex as Mutex).lock(timeout),
                         (mutex: any, cb: () => Promise<void>) => (mutex as Mutex).protect(cb));
     }
 }

export class FairMutexTest {
    @Test() async basicFunctions() {
        await basicFunctions(new FairMutex(), (mutex: any, timeout?: number) => (mutex as FairMutex).lock('id', timeout));
    }

    @Test() @Timeout(1000) async stressTest() {
        await stressTest(new FairMutex(),
                         (mutex: any, timeout?: number) => (mutex as FairMutex).lock('id', timeout),
                         (mutex: any, cb: () => Promise<void>) => (mutex as FairMutex).protect('id', cb));
     }
}

export class SemaphoreTest {
    @Test() async timeoutTest() {
        const sema = new Semaphore(2);

        await sema.wait();
        await sema.wait();
        Expect(await sema.wait(100)).toBe(false);

        const t1 = sema.wait(100);
        const w1 = sema.wait();
        Expect(await t1).toBe(false);
        sema.signal(); // Wake w1
        await w1;

        const w2a = sema.wait();
        const t2  = sema.wait(100);
        const w2b = sema.wait();
        Expect(await t2).toBe(false);
        sema.signal(); // Wake w2a
        sema.signal(); // Wake w2b
        await w2a;
        await w2b;
    }
}