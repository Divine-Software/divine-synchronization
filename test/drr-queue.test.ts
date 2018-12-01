import { Expect, Test } from 'alsatian';
import { DRRData, DRRQueue } from '../src';
import { BackingQueue } from '../src/condition';

export class DRRQueueTest {
    @Test() normalDRRQueueOrder(q: BackingQueue<number, DRRData<number>> = new DRRQueue<number>()) {
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

        Expect(() => q.push({ id: 0 as any, data: 0, size: 0 })).toThrowError(TypeError, `Flow ID must be a string; got number`);
        Expect(() => q.push({ id: '', data: undefined as any, size: 0 })).toThrowError(TypeError, `Queue cannot contain 'undefined' elements`);
        Expect(() => q.push({ id: '', data: 0, size: "" as any })).toThrowError(TypeError, `The size must be a finite number`);
        Expect(() => q.push({ id: '', data: 0, size: Number.NEGATIVE_INFINITY })).toThrowError(TypeError, `The size must be a finite number`);
        Expect(() => q.push({ id: '', data: 0, size: Number.POSITIVE_INFINITY })).toThrowError(TypeError, `The size must be a finite number`);
        Expect(() => q.push({ id: '', data: 0, size: Number.NaN })).toThrowError(TypeError, `The size must be a finite number`);
    }

    @Test() fairDRRQueueOrder(q: BackingQueue<number, DRRData<number>> = new DRRQueue<number>()) {
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