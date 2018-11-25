import { DRRQueue, DRRData } from '../src/drr-queue';
import { Test, Expect } from 'alsatian';
import { BackingQueue } from '../src/condition';

export class DRRQueueTest {
    @Test() normalOrder(q: BackingQueue<number, DRRData<number>> = new DRRQueue<number>()) {
        Expect(q.push({ id: '1', data: 10, size: 1 })).toBe(1);
        Expect(q.length).toBe(1);
        Expect(q.push({ id: '1', data: 20, size: 1 })).toBe(2);
        Expect(q.length).toBe(2);
        Expect(q.push({ id: '1', data: 30, size: 1 })).toBe(3);
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

    @Test() fairOrder(q: BackingQueue<number, DRRData<number>> = new DRRQueue<number>()) {
        Expect(q.push({ id: '2', data: 11, size: 1 })).toBe(1);
        Expect(q.length).toBe(1);
        Expect(q.push({ id: '2', data: 21, size: 1 })).toBe(2);
        Expect(q.length).toBe(2);
        Expect(q.push({ id: '1', data: 31, size: 1 })).toBe(3);
        Expect(q.length).toBe(3);

        Expect(q.shift()).toBe(11);
        Expect(q.length).toBe(2);
        Expect(q.shift()).toBe(31);
        Expect(q.length).toBe(1);
        Expect(q.shift()).toBe(21);
        Expect(q.length).toBe(0);

        Expect(q.shift()).toBe(undefined);
        Expect(q.length).toBe(0);
    }
}