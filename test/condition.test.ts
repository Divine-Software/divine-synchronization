import { Test, Expect } from 'alsatian';
import { Signal, FairSignal } from '../src/condition';

export class SignalTest {
    @Test() async wakeOne() {
        const signal = new Signal<string>();

        signal.notify('none');
        setTimeout(() => signal.notify('one'), 0);

        Expect(await signal.wait()).toBe('one');
    }

    @Test() async timeout() {
        const signal = new Signal<string>();

        signal.notify('none');
        Expect(await signal.wait(100)).toBe(undefined);
    }

    @Test() async wakeOneOfMany() {
        const signal = new Signal<string>();

        setTimeout(() => signal.notify('one'), 0);
        Expect(await Promise.all([signal.wait(), signal.wait(100)])).toEqual(['one', undefined]);
    }

    @Test() async wakeAll() {
        const signal = new Signal<string>();

        setTimeout(() => signal.notifyAll('all'), 0);
        Expect(await Promise.all([signal.wait(), signal.wait(100)])).toEqual(['all', 'all']);
    }
}

export class FairSignalTest {
    @Test() async wakeOne() {
        const signal = new FairSignal<string>();

        signal.notify('none');
        setTimeout(() => signal.notify('one'), 0);

        Expect(await signal.wait('1')).toBe('one');
    }

    @Test() async timeout() {
        const signal = new FairSignal<string>();

        signal.notify('none');
        Expect(await signal.wait('1', 100)).toBe(undefined);
    }

    @Test() async wakeOneOfMany() {
        const signal = new FairSignal<string>();

        setTimeout(() => signal.notify('one'), 0);
        Expect(await Promise.all([signal.wait('1'), signal.wait('2', 100)])).toEqual(['one', undefined]);
    }

    @Test() async wakeAll() {
        const signal = new FairSignal<string>();

        setTimeout(() => signal.notifyAll('all'), 0);
        Expect(await Promise.all([signal.wait('1'), signal.wait('1', 100)])).toEqual(['all', 'all']);
    }

    @Test() async fairWakeOrder() {
        const signal = new FairSignal<string>();

        setTimeout(() => signal.notify('one'), 0);
        setTimeout(() => signal.notify('two'), 0);
        setTimeout(() => signal.notify('three'), 0);

        Expect(await Promise.all([signal.wait('1'), signal.wait('1'), signal.wait('2')])).toEqual(['one', 'three', 'two']);
    }
}
