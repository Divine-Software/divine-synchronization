import { DRRQueueTest } from './drr-queue.test';
import { Queue, FairQueue } from '../src/queue';
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
