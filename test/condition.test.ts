import { Expect, Test } from 'alsatian';
import { FairSignal, Signal, FairCondition, Condition } from '../src';

export class SignalTest {
    @Test() async sendUndefined() {
        const signal = new Signal<string>();

        Expect(() => signal.notify(undefined as any)).toThrowError(TypeError, `Signal cannot send 'undefined'`);
    }

    @Test() async value() {
        const signal1 = new Signal<string>();

        Expect(signal1.value).not.toBeDefined();
        signal1.notify('one');
        Expect(signal1.value).toBe('one');

        const signal2 = new Signal<string>();

        Expect(signal2.value).not.toBeDefined();
        signal2.notifyAll('all');
        Expect(signal2.value).toBe('all');
    }

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
    @Test() async value() {
        const signal1 = new FairSignal<string>();

        Expect(signal1.value).not.toBeDefined();
        signal1.notify('one');
        Expect(signal1.value).toBe('one');

        const signal2 = new FairSignal<string>();

        Expect(signal2.value).not.toBeDefined();
        signal2.notifyAll('all');
        Expect(signal2.value).toBe('all');
    }

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

export class ConditionTest {
    @Test() async wakeAll() {
        const cond = new Condition();

        const waiters = Promise.all([cond.wait().then(() => 'A'), cond.wait().then(() => 'B'), cond.wait().then(() => 'C')]);
        cond.notifyAll();
        Expect(await waiters).toEqual(['A', 'B', 'C']);
    }
}

export class FairConditionTest {
    @Test() async wakeAll() {
        const cond = new FairCondition();
        let counter = 0;

        const waiters = Promise.all([cond.wait('1').then(() => ++counter), cond.wait('1').then(() => ++counter), cond.wait('2').then(() => ++counter)]);
        cond.notifyAll();
        Expect(await waiters).toEqual([1, 3, 2]);
    }

    @Test() async idTypeCheck() {
        Expect(() => new FairCondition().wait(1 as any, 100)).toThrowErrorAsync(TypeError, `Flow ID must be a string; got number`);
    }
}
