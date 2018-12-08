import { Expect, Test } from 'alsatian';
import { Barrier, Lightswitch, ReadWriteLock, Semaphore } from '../src';

function sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

export class BarrierTest {
    @Test() async testBarrier() {
        const barrier = new Barrier(10);
        const fibers = [];
        let counter = 0;

        for (let i = 0; i < 9; ++i) {
            fibers.push((async () => {
                counter += 1;
                await barrier.wait();
                counter += 10;
            })());
        }

        await Promise.race([sleep(100)].concat(fibers));
        Expect(counter).toBe(9);
        await barrier.wait(); // Release barrier
        await Promise.all(fibers);
        Expect(counter).toBe(99);
    }
}

export class LightswitchTest {
    @Test() async testLightwitch() {
        const semaphore   = new Semaphore(1);
        const lightswitch = new Lightswitch(semaphore);

        Expect(await semaphore.wait(100)).toBe(true);
        semaphore.signal();

        await lightswitch.lock();
        Expect(await semaphore.wait(100)).toBe(false);

        await lightswitch.lock();
        Expect(await semaphore.wait(100)).toBe(false);

        lightswitch.unlock();
        Expect(await semaphore.wait(100)).toBe(false);

        lightswitch.unlock();
        Expect(await semaphore.wait(100)).toBe(true);
    }
}

export class ReadWriteLockTest {
    @Test() async testReadWriteLock() {
        const rw = new ReadWriteLock();
        const fibers = [];
        const result = [] as string[];

        fibers.push(rw.protectReader(async () => {
            result.push('enter-r1');
            await sleep(100);
            result.push('exit-r1');
        }));

        fibers.push(rw.protectReader(async () => {
            result.push('enter-r2');
            await sleep(50);
            result.push('exit-r2');
        }));

        fibers.push(rw.protectWriter(async () => {
            result.push('enter-w1');
            await sleep(100);
            result.push('exit-w1');
        }));

        fibers.push(rw.protectWriter(async () => {
            result.push('enter-w2');
            await sleep(50);
            result.push('exit-w2');
        }));

        fibers.push(rw.protectReader(async () => {
            result.push('enter-r3');
            await sleep(50);
            result.push('exit-r3');
        }));

        await Promise.all(fibers);
        Expect(result).toEqual([
            'enter-r1',
            'enter-r2',
            'exit-r2',
            'exit-r1',
            'enter-w1',
            'exit-w1',
            'enter-w2',
            'exit-w2',
            'enter-r3',
            'exit-r3',
        ]);
    }
}