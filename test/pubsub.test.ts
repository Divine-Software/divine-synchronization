import { Expect, Test } from 'alsatian';
import { PubSub, FairPubSub } from '../src';

export class PubSubTest {
    @Test() async undefinedFails() {
        const ps = new PubSub<string>();
        ps.subscribe().next();

        Expect(() => ps.publish(undefined!)).toThrowError(TypeError, `Queue cannot contain 'undefined' elements`);
        Expect(() => ps.publishOrWait(undefined!)).toThrowErrorAsync(TypeError, `Queue cannot contain 'undefined' elements`);
    }

    @Test() async topicCleanup() {
        const ps = new PubSub<string>();
        const s1 = ps.subscribe(100);

        const start = Date.now();
        const i1 = await s1.next();
        Expect(i1.done).toBe(false);
        Expect(i1.value).toBe(undefined);
        Expect(Date.now() >= start + 100).toBe(true);

        Expect(ps.subscribers).toBe(1);

        const s2 = ps.subscribe(100);
        await(s2.next());

        Expect(ps.subscribers).toBe(2);

        await s2.return();

        Expect(ps.subscribers).toBe(1);

        await s1.return();

        const i2 = await s1.next();
        Expect(i2.done).toBe(true);
        Expect(i2.value).toBe(undefined);

        Expect(ps.subscribers).toBe(0);
    }

    @Test() async capacityWithoutSubscribers() {
        const ps = new PubSub<string>(2);

        Expect(ps.subscribers).toBe(0);

        Expect(ps.publish('first')).toBe(0);
        Expect(ps.publish('second')).toBe(0);
        Expect(ps.publish('third')).toBe(0);
        Expect(ps.subscribers).toBe(0);
    }

    @Test() async capacityWithSubscribers() {
        const ps = new PubSub<string>(2);
        const s1 = ps.subscribe(100);
        const i1 = s1.next();

        // s1 has not yet resolved here (sync code)
        Expect(ps.subscribers).toBe(1);

        Expect(ps.publish('first')).toBe(1);

        Expect(ps.publish('second')).toBe(1);

        Expect(ps.publish('third')).toBe(0);

        // s1 will resolve and publishOrWait() will work once ...
        Expect(await ps.publishOrWait('fourth', 100)).toBe(1);

        const v1 = await i1;
        Expect(v1.done).toBe(false);
        Expect(v1.value).toBe('first');

        // ... but not twice
        Expect(await ps.publishOrWait('fifth', 100)).toBe(0);

        Expect((await s1.next()).value).toBe('second');
        Expect((await s1.next()).value).toBe('fourth');
        Expect((await s1.next()).value).toBe(undefined);
    }

    @Test() async filters() {
        const ps = new PubSub<string>();
        const s1 = ps.subscribe();
        const s2 = ps.subscribe((s) => s.length > 3);
        const i1 = s1.next();
        const i2 = s2.next();

        Expect(ps.publish('one')).toBe(1);
        Expect(await ps.publishOrWait('two')).toBe(1);
        Expect(ps.publish('three')).toBe(2);
        Expect(await ps.publishOrWait('four')).toBe(2);

        Expect((await i1).value).toBe('one');
        Expect((await s1.next()).value).toBe('two');
        Expect((await s1.next()).value).toBe('three');
        Expect((await s1.next()).value).toBe('four');

        Expect((await i2).value).toBe('three');
        Expect((await s2.next()).value).toBe('four');
    }
}

export class FairPubSubTest {
    @Test() async order() {
        const ps = new FairPubSub<string>();
        const s1 = ps.subscribe();
        const a1 = s1.next();

        Expect(ps.publish({ id: '1', data: 'one',   size: 1 })).toBe(1);
        Expect(ps.publish({ id: '1', data: 'two',   size: 1 })).toBe(1);
        Expect(ps.publish({ id: '2', data: 'three', size: 1 })).toBe(1);

        Expect((await a1).value).toBe('one');
        Expect((await s1.next()).value).toBe('three');
        Expect((await s1.next()).value).toBe('two');
    }

    @Test() async filters() {
        const ps = new FairPubSub<string>();
        const s1 = ps.subscribe((s) => s.length > 3);
        const i1 = s1.next();

        Expect(ps.publish({ id: '1', data: 'one', size: 1 })).toBe(0);
        Expect(await ps.publishOrWait({ id: '1', data: 'two',   size: 1 })).toBe(0);
        Expect(ps.publish({ id: '1', data: 'three', size: 1 })).toBe(1);
        Expect(await ps.publishOrWait({ id: '1', data: 'four', size: 1 })).toBe(1);

        Expect((await i1).value).toBe('three');
        Expect((await s1.next()).value).toBe('four');
    }
}
