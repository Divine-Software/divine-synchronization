# The Divine Synchronization Library

[![Build Status](https://travis-ci.org/LeviticusMB/divine-synchronization.svg?branch=master)](https://travis-ci.org/LeviticusMB/divine-synchronization)
[![Coverage Status](https://coveralls.io/repos/github/LeviticusMB/divine-synchronization/badge.svg?branch=master)](https://coveralls.io/github/LeviticusMB/divine-synchronization?branch=master)

## Introduction

Many *JavaScript* or *TypeScript* developers don't think much about synchronization, even if they should. While it's true
that JavaScript in *Node.js* or on the web is single-threaded, anytime an asynchronous function call is invoked,
something else might be executed before control is handed back to your callback.

This library contains a classical set of high-quality synchronization primitives that can be used to protect critical
sections in such code.

It's written in *TypeScript* (which means it provides excellent IDE/editor support out of the box) and down-compiled to
ES5, so it works equally well in *Node.js* or in any web browser (a `Promise` polyfill might be required, though).

## About fairness

Most synchronization primitives in this library has a "fair" counterpart, that requires the waiter to provide an ID
token. The waiters are then woken up not in FIFO order but in such a way that each ID is processed before a waiter with
a duplicate ID.

## Provided primitives

This section lists the synchronization primitives provided by this library.

### `DDRQueue`

Although not really a classical primitive, it's a fair queue based on the paper [Efficient Fair Queuing Using Deficit
Round-Robin](http://www.ecs.umass.edu/ece/wolf/courses/ECE697J/papers/DRR.pdf). It's more or less just a *TypeScript*
rewrite of Matt Lavin's [drr-fair-queue](https://github.com/mdlavin/drr-fair-queue).

This queue is the foundation of all the "fair" variants of the synchronization primitives.

### `Queue` and `FairQueue`

A blocking queue (strict FIFO, or fair).

### `Condition` and `FairCondition`

A condition variable implementation with `notify()`, `notifyAll` and `wait()` methods.

### `Signal` and `FairSignal`

A trivial extension to the condition variable that allows a value to be passed to the waiter.

### `Semaphore` and `FairSemaphore`

A classical semaphore that can be signaled and waited for. There is also a non-blocking `take()` method available.

### `Mutex` and `FairMutex`

Just a semaphore initialized to 1 and with more appropriate method names.
