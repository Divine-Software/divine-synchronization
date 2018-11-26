import { DRRQueueTest } from './drr-queue.test';
import { Queue, FairQueue, BlockingQueue, DRRData } from '../src/queue';
import { Test, Expect } from 'alsatian';

export class QueueTest {
    @Test() normalOrder() {
        const q = new Queue<number>();

        Expect(q.push(10)).toBe(1);
        Expect(q.length).toBe(1);
        Expect(q.push(20)).toBe(2);
        Expect(q.length).toBe(2);
        Expect(q.push(30)).toBe(3);
        Expect(q.length).toBe(3);

        Expect(q.shift()).toBe(10);
        Expect(q.length).toBe(2);
        Expect(q.shift()).toBe(20);
        Expect(q.length).toBe(1);
        Expect(q.shift()).toBe(30);
        Expect(q.length).toBe(0);

        Expect(q.shift()).toBe(undefined);
        Expect(q.length).toBe(0);
    }
}

export class FairQueueTest {
    @Test() normalOrder() {
        new DRRQueueTest().normalOrder(new FairQueue());
    }

    @Test() fairOrder() {
        new DRRQueueTest().fairOrder(new FairQueue());
    }
}

abstract class BlockingQueueTestBase<W> {
    abstract newQueue(capacity: number): BlockingQueue<string, W>;
    abstract newValue(data: string): W;

    @Test() async blockingRead() {
        const q = this.newQueue(100);

        setTimeout(() => q.push(this.newValue('one')), 150);
        Expect(await q.shiftOrWait(100)).toBe(undefined);
        Expect(await Promise.all([q.shiftOrWait(100), q.shiftOrWait(100)])).toEqual(['one', undefined]);
    }

    @Test() aboveCapacityWrite() {
        const q = this.newQueue(2);

        Expect(q.push(this.newValue('one'))).toBe(1);
        Expect(q.push(this.newValue('two'))).toBe(2);
        Expect(() => q.push(this.newValue('three'))).toThrowError(RangeError, 'Maximum queue capacity (2) reached');

        Expect(q.shift()).toBe('one');
        Expect(q.length).toBe(1);
        Expect(q.push(this.newValue('four'))).toBe(2);
        Expect(() => q.push(this.newValue('five'))).toThrowError(RangeError, 'Maximum queue capacity (2) reached');
    }

    @Test() async aboveCapacityBlockingWrite() {
        const q = this.newQueue(2);

        Expect(await q.pushOrWait(this.newValue('one'))).toBe(1);
        Expect(await q.pushOrWait(this.newValue('two'))).toBe(2);
        Expect(await q.pushOrWait(this.newValue('three'), 100)).toBe(undefined);

        Expect(q.shift()).toBe('one');
        Expect(q.length).toBe(1);

        setTimeout(() => q.shift(), 150);
        Expect(await q.pushOrWait(this.newValue('four'), 100)).toBe(2);
        Expect(await q.pushOrWait(this.newValue('five'), 100)).toBe(undefined);
        Expect(await q.pushOrWait(this.newValue('six'),  100)).toBe(2);

        Expect(q.shift()).toBe('four');
        Expect(q.shift()).toBe('six');
        Expect(q.shift()).toBe(undefined);
    }
}

export class BlockingQueueTest extends BlockingQueueTestBase<string> {
    newQueue(capacity: number) {
        return new Queue<string>(capacity);
    }

    newValue(data: string) {
        return data;
    }
}

export class BlockingFairQueueTest extends BlockingQueueTestBase<DRRData<string>> {
    newQueue(capacity: number) {
        return new FairQueue<string>(capacity);
    }

    newValue(data: string) {
        return { id: 'id', data, size: 1 };
    }
}

export class MoreBlockingFairQueueTest {
    @Test() async blockingPriorityRead() {
        const q = new FairQueue<string>();

        setTimeout(() => q.push({ id: '1', data: 'one',   size: 1}), 150);
        setTimeout(() => q.push({ id: '1', data: 'two',   size: 1}), 150);
        setTimeout(() => q.push({ id: '2', data: 'three', size: 1}), 150);

        Expect(await q.shiftOrWait(100)).toBe(undefined);
        Expect(await Promise.all([q.shiftOrWait(100), q.shiftOrWait(100), q.shiftOrWait(100), q.shiftOrWait(100)])).toEqual(['one', 'three', 'two', undefined]);
    }

    @Test() async blockingPriorityWrite() {
        const q = new FairQueue<string>(1);

        // Fill up queue
        q.push({ id: '10', data: 'zero', size: 1});

        // Put some work in the wait queue
        q.pushOrWait({ id: '1', data: 'one',   size: 1});
        q.pushOrWait({ id: '1', data: 'two',   size: 1});
        q.pushOrWait({ id: '2', data: 'three', size: 1});

        Expect(q.length).toBe(1);
        await new Promise((resolve) => setTimeout(resolve, 100));
        Expect(q.length).toBe(1);

        Expect(q.shift()).toBe('zero');
        Expect(q.shift()).toBe(undefined); // The writer should not have been scheduled yet

        Expect(await q.shiftOrWait()).toBe('one');
        Expect(await q.shiftOrWait()).toBe('three');
        Expect(await q.shiftOrWait()).toBe('two');
        Expect(await q.shiftOrWait(100)).toBe(undefined);
    }
}
